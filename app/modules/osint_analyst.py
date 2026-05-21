"""
OSINT Analyst Module
====================
Provides the OSINTAnalyst class, which transforms raw SocialScanner results
into a structured Intelligence Brief through two complementary engines:

  1. Heuristic Risk Score Calculator
     ─────────────────────────────────
     A transparent, rule-based scoring function that assigns weighted risk
     points to each platform where the target username was found.  No black
     boxes — every point awarded is logged and returned in the brief so the
     analyst can audit the reasoning.

     Scoring philosophy
     ──────────────────
     The score is NOT a "danger" indicator.  It represents the *digital
     footprint breadth & technical depth* of the subject, which is relevant
     context for an OSINT investigation.  Platforms that require higher
     technical skill (GitHub, npm) or that are hacker-adjacent (HackerNews)
     carry more weight because they signal advanced capability.

  2. Named Entity Recognition (spaCy)
     ───────────────────────────────────
     Runs spaCy's `en_core_web_sm` pipeline over any free-text input
     (e.g. a scraped bio or README) to extract Locations, Organisations,
     and Person names.

Ethical Note
────────────
This module only processes data that was already collected by the
SocialScanner via public, unauthenticated endpoints.  No additional
scraping is performed here.
"""

from __future__ import annotations

import logging
import textwrap
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# spaCy — lazy-load so startup is not blocked if model is absent
# ---------------------------------------------------------------------------

_NLP = None  # loaded on first use


def _get_nlp():
    """Return a cached spaCy nlp pipeline, loading it once on first call."""
    global _NLP
    if _NLP is None:
        try:
            import spacy  # noqa: PLC0415
            _NLP = spacy.load("en_core_web_sm")
            logger.info("spaCy model 'en_core_web_sm' loaded successfully.")
        except OSError:
            logger.error(
                "spaCy model 'en_core_web_sm' not found.  "
                "Run:  python -m spacy download en_core_web_sm"
            )
            raise RuntimeError(
                "spaCy model 'en_core_web_sm' is not installed.  "
                "Run `python -m spacy download en_core_web_sm` and restart the server."
            )
        except ImportError:
            logger.error("spaCy is not installed.  Run:  pip install spacy")
            raise RuntimeError(
                "spaCy is not installed.  Run `pip install spacy` and restart the server."
            )
    return _NLP


# ---------------------------------------------------------------------------
# Platform Risk Weight Registry
# ---------------------------------------------------------------------------
# Each entry maps a platform name (must match social_scanner.PLATFORM_REGISTRY)
# to a risk weight and a human-readable rationale.

@dataclass(frozen=True)
class PlatformRiskProfile:
    weight: int          # Points added if username EXISTS on this platform
    category: str        # e.g. "Developer", "Social", "Hacker-Adjacent"
    rationale: str       # Shown in the brief for full transparency


PLATFORM_RISK_PROFILES: dict[str, PlatformRiskProfile] = {
    "GitHub": PlatformRiskProfile(
        weight=3,
        category="Developer",
        rationale="Indicates technical coding capability; public repos may reveal projects and skills.",
    ),
    "GitLab": PlatformRiskProfile(
        weight=3,
        category="Developer",
        rationale="Alternative code host; often used for private/enterprise projects.",
    ),
    "HackerNews": PlatformRiskProfile(
        weight=5,
        category="Hacker-Adjacent",
        rationale="Primary forum for security researchers, hackers, and technologists.",
    ),
    "npm": PlatformRiskProfile(
        weight=4,
        category="Developer / Publisher",
        rationale="Publishing npm packages signals advanced JS/Node.js knowledge and code distribution.",
    ),
    "Keybase": PlatformRiskProfile(
        weight=4,
        category="Cryptographic Identity",
        rationale="Cryptographically verified identity hub; suggests privacy/security awareness.",
    ),
    "Dev.to": PlatformRiskProfile(
        weight=2,
        category="Tech Community",
        rationale="Technical blogging platform; indicates public knowledge sharing.",
    ),
    "Reddit": PlatformRiskProfile(
        weight=2,
        category="Social / Forum",
        rationale="Large public forum; comment history may reveal interests and opinions.",
    ),
    "Mastodon (mastodon.social)": PlatformRiskProfile(
        weight=2,
        category="Decentralised Social",
        rationale="Federated social network; often used by privacy-conscious individuals.",
    ),
    "Medium": PlatformRiskProfile(
        weight=1,
        category="Blogging",
        rationale="General blogging platform; low technical signal.",
    ),
    "Pinterest": PlatformRiskProfile(
        weight=1,
        category="Lifestyle Social",
        rationale="Visual bookmarking; low risk signal.",
    ),
}

# Default weight for any platform NOT in the registry above
_DEFAULT_RISK_WEIGHT = 2

# ---------------------------------------------------------------------------
# Risk Level Thresholds
# ---------------------------------------------------------------------------

_RISK_THRESHOLDS: list[tuple[int, str]] = [
    (0,  "MINIMAL"),
    (5,  "LOW"),
    (10, "MEDIUM"),
    (20, "HIGH"),
    (30, "CRITICAL"),
]


def _score_to_risk_level(score: int) -> str:
    level = "MINIMAL"
    for threshold, label in _RISK_THRESHOLDS:
        if score >= threshold:
            level = label
    return level


# ---------------------------------------------------------------------------
# Risk Score Calculator
# ---------------------------------------------------------------------------

@dataclass
class ScoringBreakdown:
    """Full audit trail of how the final score was reached."""
    platform: str
    exists: bool
    weight_applied: int
    category: str
    rationale: str
    url: str = ""


def calculate_risk_score(
    scan_results: list[dict],
    raw_text: str | None = None
) -> tuple[int, str, list[ScoringBreakdown]]:
    """
    Heuristic risk score calculator.

    Parameters
    ----------
    scan_results : list[dict]
        Each dict must have at least: ``platform`` (str) and ``exists`` (bool).

    Returns
    -------
    tuple[int, str, list[ScoringBreakdown]]
        (total_score, risk_level, breakdown_per_platform)

    Scoring Rules
    ─────────────
    • For each platform where ``exists=True``:
        - Look up the platform's weight in PLATFORM_RISK_PROFILES.
        - If not in the registry, apply the default weight (2 pts).
        - Award those points.
    • Platforms where ``exists=False`` or that returned an error: 0 points.
    • Bonus rules (applied after per-platform scoring):
        + 5  if found on ≥ 5 platforms (broad cross-platform presence)
        + 3  if found on both a developer platform (GitHub/GitLab/npm) AND
              a hacker-adjacent one (HackerNews/Keybase) simultaneously
    """
    total_score = 0
    breakdown: list[ScoringBreakdown] = []
    found_categories: set[str] = set()

    for result in scan_results:
        platform_name: str = result.get("platform", "Unknown")
        exists: bool = result.get("exists", False)

        profile = PLATFORM_RISK_PROFILES.get(platform_name)
        weight = profile.weight if (profile and exists) else (_DEFAULT_RISK_WEIGHT if exists else 0)
        category = profile.category if profile else result.get("category", "Unknown")
        rationale = profile.rationale if profile else "Platform not in risk registry; default weight applied."

        if exists:
            total_score += weight
            found_categories.add(category)

        breakdown.append(ScoringBreakdown(
            platform=platform_name,
            exists=exists,
            weight_applied=weight,
            category=category,
            rationale=rationale,
            url=result.get("url", ""),
        ))

    # --- Bonus: broad cross-platform presence ---
    found_count = sum(1 for r in scan_results if r.get("exists"))
    if found_count >= 5:
        total_score += 5
        logger.debug("Broad presence bonus applied (+5): found on %d platforms.", found_count)

    # --- Bonus: developer + hacker-adjacent overlap ---
    dev_categories = {"Developer", "Developer / Publisher"}
    hacker_categories = {"Hacker-Adjacent", "Cryptographic Identity"}
    if found_categories & dev_categories and found_categories & hacker_categories:
        total_score += 3
        logger.debug("Developer-hacker overlap bonus applied (+3).")

    # Bio Sentiment / Keyword Check
    if raw_text:
        suspicious_words = ["hacker", "dark web", "fraud", "crypto", "anonymous", "exploit"]
        found_words = [w for w in suspicious_words if w.lower() in raw_text.lower()]
        if found_words:
            total_score += 10
            breakdown.append(ScoringBreakdown(
                platform="Bio Analysis",
                exists=True,
                weight_applied=10,
                category="Behavioral",
                rationale=f"Suspicious keywords found in bio: {', '.join(found_words)}"
            ))

    risk_level = _score_to_risk_level(total_score)
    logger.info("Risk score for target: %d (%s)", total_score, risk_level)
    return total_score, risk_level, breakdown


# ---------------------------------------------------------------------------
# NER Engine
# ---------------------------------------------------------------------------

@dataclass
class ExtractedEntities:
    locations: list[str] = field(default_factory=list)
    organizations: list[str] = field(default_factory=list)
    persons: list[str] = field(default_factory=list)
    misc: list[str] = field(default_factory=list)       # NORP, PRODUCT, EVENT, etc.


def extract_entities(raw_text: str) -> ExtractedEntities:
    """
    Run spaCy NER over *raw_text* and extract named entities bucketed
    into Locations, Organisations, Persons, and Misc.

    spaCy label mapping used
    ──────────────────────────
    GPE / LOC   → locations
    ORG         → organizations
    PERSON      → persons
    Everything else (NORP, PRODUCT, EVENT, LAW …) → misc

    Parameters
    ----------
    raw_text : str
        Any free-form text, e.g. a scraped profile bio, README, or tweet.

    Returns
    -------
    ExtractedEntities
        Deduplicated, title-cased entity lists.
    """
    if not raw_text or not raw_text.strip():
        return ExtractedEntities()

    nlp = _get_nlp()
    doc = nlp(raw_text[:100_000])  # cap at 100 k chars to stay performant

    locations: set[str] = set()
    organizations: set[str] = set()
    persons: set[str] = set()
    misc: set[str] = set()

    for ent in doc.ents:
        text = ent.text.strip()
        if not text:
            continue
        label = ent.label_
        if label in ("GPE", "LOC"):
            locations.add(text)
        elif label == "ORG":
            organizations.add(text)
        elif label == "PERSON":
            persons.add(text)
        else:
            misc.add(f"{text} [{label}]")

    return ExtractedEntities(
        locations=sorted(locations),
        organizations=sorted(organizations),
        persons=sorted(persons),
        misc=sorted(misc),
    )


# ---------------------------------------------------------------------------
# Intelligence Brief Data Class
# ---------------------------------------------------------------------------

@dataclass
class IntelligenceBrief:
    username: str
    risk_score: int
    risk_level: str
    summary: str
    platform_footprint: list[dict]           # condensed per-platform results
    scoring_breakdown: list[dict]            # full audit trail
    extracted_entities: dict                 # NER output
    platforms_found: int
    platforms_checked: int
    activity_heatmap: List[Dict[str, Any]]
    sentiment_analysis: Dict[str, Any]
    analyzed_at: datetime


# ---------------------------------------------------------------------------
# Summary Generator
# ---------------------------------------------------------------------------

_SUMMARY_TEMPLATES: dict[str, str] = {
    "MINIMAL": (
        "Subject '{username}' has a minimal online presence with no detectable "
        "footprint across the scanned platforms.  This may indicate a very new "
        "account, use of pseudonyms, or deliberate low-profile behaviour."
    ),
    "LOW": (
        "Subject '{username}' maintains a limited online presence, appearing on "
        "{found}/{total} scanned platforms.  The digital footprint is narrow with "
        "low technical signal.  Standard background-check level of visibility."
    ),
    "MEDIUM": (
        "Subject '{username}' has a moderate cross-platform footprint, confirmed "
        "on {found}/{total} platforms.  Presence includes technically oriented or "
        "community-focused services, suggesting an engaged online identity.  "
        "Further investigation of individual profiles is recommended."
    ),
    "HIGH": (
        "Subject '{username}' exhibits a broad and technically significant online "
        "presence across {found}/{total} platforms, including developer and "
        "hacker-adjacent communities.  This level of footprint warrants a deeper "
        "investigation of public repositories, posts, and stated affiliations."
    ),
    "CRITICAL": (
        "Subject '{username}' has an extensive, multi-platform digital identity "
        "({found}/{total} platforms) with strong signals across high-weight "
        "technical and hacker-adjacent platforms.  This subject has a substantial, "
        "highly visible public presence that requires thorough OSINT investigation."
    ),
}


def _generate_summary(username: str, risk_level: str, found: int, total: int) -> str:
    template = _SUMMARY_TEMPLATES.get(risk_level, _SUMMARY_TEMPLATES["MEDIUM"])
    return template.format(username=username, found=found, total=total)


# ---------------------------------------------------------------------------
# OSINTAnalyst — Public API
# ---------------------------------------------------------------------------

class OSINTAnalyst:
    """
    Transforms raw SocialScanner output into a structured Intelligence Brief.

    Usage
    ─────
    >>> analyst = OSINTAnalyst()
    >>> brief = analyst.analyze(scan_results, raw_text="Software engineer at ACME Corp, based in Berlin.")
    """

    def analyze(
        self,
        username: str,
        scan_results: list[dict],
        raw_text: Optional[str] = None,
    ) -> IntelligenceBrief:
        """
        Run the full analysis pipeline.

        Parameters
        ----------
        username : str
            The scanned username (used in summary text).
        scan_results : list[dict]
            Output from SocialScanner — list of dicts with keys:
            ``platform``, ``url``, ``exists``, ``status_code``, ``error``.
        raw_text : str | None
            Optional free-form text to run NER over (bio, README, etc.).

        Returns
        -------
        IntelligenceBrief
        """
        logger.info("OSINTAnalyst: starting analysis for '%s'.", username)

        # 1. Risk Score
        score, level, breakdown = calculate_risk_score(scan_results, raw_text)

        # 2. NER
        entities = extract_entities(raw_text or "")

        # 3. Summary
        found_count = sum(1 for r in scan_results if r.get("exists"))
        total_count = len(scan_results)
        summary = _generate_summary(username, level, found_count, total_count)

        # 4. Condense platform footprint (found-only, with URL)
        footprint = [
            {"platform": r["platform"], "url": r["url"]}
            for r in scan_results
            if r.get("exists")
        ]

        # 5. Serialise scoring breakdown to plain dicts
        breakdown_dicts = [
            {
                "platform": b.platform,
                "exists": b.exists,
                "weight_applied": b.weight_applied,
                "category": b.category,
                "rationale": b.rationale,
                "url": b.url,
                "status": "found" if b.exists else "not_found",
            }
            for b in breakdown
        ]

        brief = IntelligenceBrief(
            username=username,
            risk_score=score,
            risk_level=level,
            summary=textwrap.fill(summary, width=120),
            platform_footprint=footprint,
            scoring_breakdown=breakdown_dicts,
            extracted_entities={
                "locations": entities.locations,
                "organizations": entities.organizations,
                "persons": entities.persons,
                "misc": entities.misc,
            },
            platforms_found=found_count,
            platforms_checked=total_count,
            activity_heatmap=self._generate_activity_heatmap(),
            sentiment_analysis=self._analyze_sentiment(raw_text),
            analyzed_at=datetime.now(timezone.utc),
        )

        logger.info(
            "OSINTAnalyst: analysis complete for '%s' — score=%d (%s).",
            username, score, level,
        )
        return brief

    def _generate_activity_heatmap(self) -> List[Dict[str, Any]]:
        """
        Simulate an activity heatmap (hourly activity across a week).
        In a real scenario, this would be derived from scraped post timestamps.
        """
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        heatmap = []
        for day in days:
            # Most users are active between 09:00 and 22:00
            for hour in range(24):
                if 9 <= hour <= 22:
                    intensity = random.randint(30, 100)
                else:
                    intensity = random.randint(0, 20)
                heatmap.append({"day": day, "hour": hour, "intensity": intensity})
        return heatmap

    def _analyze_sentiment(self, text: Optional[str]) -> Dict[str, Any]:
        """
        Basic keyword-based sentiment analysis for the subject's public text.
        """
        if not text:
            return {"score": 0.5, "label": "NEUTRAL", "keywords": []}
            
        positive = ["expert", "builder", "creative", "passionate", "community"]
        negative = ["hacker", "exploit", "anonymous", "dark", "leak"]
        
        text_lower = text.lower()
        pos_hits = [w for w in positive if w in text_lower]
        neg_hits = [w for w in negative if w in text_lower]
        
        score = 0.5 + (len(pos_hits) * 0.1) - (len(neg_hits) * 0.1)
        score = max(0.0, min(1.0, score))
        
        label = "POSITIVE" if score > 0.6 else ("NEGATIVE" if score < 0.4 else "NEUTRAL")
        
        return {
            "score": score,
            "label": label,
            "positive_hits": pos_hits,
            "negative_hits": neg_hits
        }
