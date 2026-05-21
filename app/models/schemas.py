"""
Pydantic Schemas for the OSINT API.
Defines request/response data models with full validation and documentation.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ScanStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    ERROR = "error"

class PlatformStatus(str, Enum):
    FOUND = "found"
    NOT_FOUND = "not_found"
    ERROR = "error"


# ---------------------------------------------------------------------------
# Platform Result
# ---------------------------------------------------------------------------

class PlatformResult(BaseModel):
    """Result for a single platform check."""

    platform: str = Field(..., description="Human-readable platform name.", examples=["GitHub"])
    url: str = Field(..., description="The public profile URL that was checked.", examples=["https://github.com/johndoe"])
    status: PlatformStatus = Field(..., description="Status of the scan for this platform.")
    status_code: Optional[int] = Field(
        default=None,
        description="HTTP status code returned by the platform.",
        examples=[200],
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if the request failed (e.g., timeout, connection error).",
    )


# ---------------------------------------------------------------------------
# Username Scan Request
# ---------------------------------------------------------------------------

class UsernameScanRequest(BaseModel):
    """Request body for a username scan (if using POST)."""

    username: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="The username to search across platforms.",
        examples=["johndoe"],
    )

    @field_validator("username")
    @classmethod
    def sanitize_username(cls, v: str) -> str:
        """Strip whitespace and validate basic format."""
        v = v.strip()
        if not v:
            raise ValueError("Username must not be empty or whitespace.")
        return v


# ---------------------------------------------------------------------------
# Username Scan Response
# ---------------------------------------------------------------------------

class UsernameScanResponse(BaseModel):
    """Full response for a username scan."""

    username: str = Field(..., description="The username that was scanned.")
    scan_status: ScanStatus = Field(..., description="Overall status of the scan.")
    total_platforms_checked: int = Field(..., description="Total number of platforms queried.")
    found_on: int = Field(..., description="Number of platforms where the username was found.")
    results: list[PlatformResult] = Field(..., description="Per-platform results.")
    scanned_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp of when the scan was performed.",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "username": "johndoe",
            "scan_status": "success",
            "total_platforms_checked": 10,
            "found_on": 4,
            "results": [
                {
                    "platform": "GitHub",
                    "url": "https://github.com/johndoe",
                    "exists": True,
                    "status_code": 200,
                    "error": None,
                },
            ],
            "scanned_at": "2025-01-01T12:00:00",
        }
    }}


# ---------------------------------------------------------------------------
# Phase 2 — Intelligence Brief Schemas
# ---------------------------------------------------------------------------

class RiskLevel(str, Enum):
    MINIMAL  = "MINIMAL"
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


class ScoringBreakdownItem(BaseModel):
    """Per-platform entry in the risk score audit trail."""
    platform: str      = Field(..., description="Platform name.")
    exists: bool       = Field(..., description="Whether username was found.")
    weight_applied: int= Field(..., description="Risk points awarded for this platform.")
    category: str      = Field(..., description="Platform category (e.g. Developer, Social).")
    rationale: str     = Field(..., description="Human-readable reason for the weight assigned.")


class ExtractedEntitiesResponse(BaseModel):
    """Named entities extracted from free-form text via spaCy NER."""
    locations: list[str]      = Field(default_factory=list, description="GPE / LOC entities.")
    organizations: list[str]  = Field(default_factory=list, description="ORG entities.")
    persons: list[str]        = Field(default_factory=list, description="PERSON entities.")
    misc: list[str]           = Field(default_factory=list, description="Other entity types (NORP, PRODUCT, etc.).")


class ProfileData(BaseModel):
    bio: str
    follower_count: str
    name: str

class PlatformFootprintItem(BaseModel):
    """Condensed record for a platform where the username was found."""
    platform: str = Field(..., description="Platform name.")
    url: str      = Field(..., description="Public profile URL.")
    found: bool   = Field(default=True, description="Always true if in footprint")
    data: Optional[ProfileData] = None


class DeepScrapeResult(BaseModel):
    """Deep scraping results for a specific platform."""
    platform: str
    url: str
    status: str = Field(..., description="found or not found")
    bio: Optional[str] = None
    follower_count: Optional[str] = None


class IntelligenceBriefResponse(BaseModel):
    """
    Structured Intelligence Brief returned by /api/analyze.
    Combines SocialScanner results with heuristic risk scoring and spaCy NER.
    """
    username: str                               = Field(..., description="Scanned username.")
    risk_score: int                             = Field(..., description="Total heuristic risk score (higher = broader/deeper footprint).")
    risk_level: RiskLevel                       = Field(..., description="Categorical risk level derived from the score.")
    summary: str                                = Field(..., description="Programmatic plain-English intelligence summary.")
    platforms_found: int                        = Field(..., description="Number of platforms where the username was confirmed.")
    platforms_checked: int                      = Field(..., description="Total platforms queried.")
    platform_footprint: list[PlatformFootprintItem]    = Field(..., description="Confirmed profile URLs.")
    scoring_breakdown: list[ScoringBreakdownItem]      = Field(..., description="Full audit trail of the risk score calculation.")
    extracted_entities: ExtractedEntitiesResponse      = Field(..., description="Named entities from any supplied raw text.")
    social_scrapes: list[DeepScrapeResult]             = Field(default_factory=list, description="Deep scrape results from platforms like Instagram, Twitter, and Telegram.")
    analyzed_at: datetime                       = Field(..., description="UTC timestamp of analysis.")

    model_config = {"json_schema_extra": {
        "example": {
            "username": "torvalds",
            "risk_score": 21,
            "risk_level": "HIGH",
            "summary": "Subject 'torvalds' has a broad and technically significant online presence...",
            "platforms_found": 6,
            "platforms_checked": 10,
            "platform_footprint": [{"platform": "GitHub", "url": "https://github.com/torvalds"}],
            "scoring_breakdown": [],
            "extracted_entities": {"locations": ["Helsinki"], "organizations": ["Linux Foundation"], "persons": [], "misc": []},
            "analyzed_at": "2025-01-01T12:00:00Z",
        }
    }}


# ---------------------------------------------------------------------------
# Phase 3 — Corporate / Domain Scan Schemas
# ---------------------------------------------------------------------------

class DomainScanResponse(BaseModel):
    """
    Structured response for /api/scan/domain.
    Contains DNS-resolved IP and subdomains enumerated from
    Certificate Transparency logs (crt.sh).
    """

    domain: str = Field(
        ...,
        description="The apex domain that was investigated.",
        examples=["example.com"],
    )
    ip_address: Optional[str] = Field(
        default=None,
        description="Primary IPv4 address resolved via DNS. Null if resolution failed.",
        examples=["93.184.216.34"],
    )
    subdomain_count: int = Field(
        ...,
        description="Total number of unique subdomains discovered.",
        examples=[42],
    )
    subdomains: list[str] = Field(
        ...,
        description="Deduplicated list of subdomains found in CT logs.",
        examples=[["www.example.com", "mail.example.com", "api.example.com"]],
    )
    crt_sh_error: Optional[str] = Field(
        default=None,
        description="Error message if the crt.sh query failed. Null on success.",
    )
    dns_error: Optional[str] = Field(
        default=None,
        description="Error message if DNS resolution failed. Null on success.",
    )
    scanned_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp of when the scan was performed.",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "domain": "example.com",
            "ip_address": "93.184.216.34",
            "subdomain_count": 3,
            "subdomains": ["example.com", "www.example.com", "mail.example.com"],
            "crt_sh_error": None,
            "dns_error": None,
            "scanned_at": "2025-01-01T12:00:00Z",
        }
    }}

