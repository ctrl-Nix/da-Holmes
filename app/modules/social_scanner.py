"""
Social Scanner Module
=====================
Concurrently checks whether a given username exists on a curated list of
public platforms by making simple, unauthenticated HTTP HEAD/GET requests
to well-known public profile URL patterns.

Ethical Principles Applied
--------------------------
- No authentication bypass or credential stuffing.
- No CAPTCHA solving.
- No scraping of private/protected content.
- Respects standard HTTP response codes.
- Uses a descriptive User-Agent so platforms know who is knocking.
- Configurable timeouts to avoid hammering servers.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_ERROR_MESSAGES = {
    "Instagram": "Sorry, this page isn't available",
    "Twitter": "This account doesn't exist",
    "GitHub": "404 Not Found",
    "Reddit": "page not found",
    "Replit": "Not Found",
}

# ---------------------------------------------------------------------------
# Platform Registry
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Platform:
    """Metadata for a single platform to check."""
    name: str
    url_template: str          # Use {username} as placeholder
    category: str = "Unknown"
    found_status_codes: tuple[int, ...] = (200,)
    not_found_status_codes: tuple[int, ...] = (404,)
    redirect_means_not_found: bool = False

def load_platforms_from_json() -> list[Platform]:
    """Load platform definitions from the configuration JSON at runtime."""
    # Ensure absolute path based on __file__ to prevent working directory issues
    base_dir = Path(__file__).resolve().parent.parent.parent
    platforms_file = base_dir / "data" / "platforms.json"
    
    if not platforms_file.exists():
        logger.error(f"CRITICAL ERROR: {platforms_file} not found.")
        raise FileNotFoundError(f"{platforms_file} is required for SocialScanner to function.")
    
    try:
        with open(platforms_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if not data:
            logger.error("CRITICAL ERROR: platforms.json is empty.")
            raise ValueError("platforms.json is empty.")
            
        platforms = []
        for item in data:
            platforms.append(Platform(
                name=item["name"],
                url_template=item.get("url", item.get("url_template", "")),
                category=item.get("category", "Unknown"),
            ))
            
        # Prioritize top platforms
        priority_names = {'GitHub', 'Instagram', 'Twitter', 'Reddit', 'LinkedIn', 'Pinterest'}
        priority_platforms = [p for p in platforms if p.name in priority_names]
        other_platforms = [p for p in platforms if p.name not in priority_names]
        
        priority_platforms.sort(key=lambda p: p.name)
        sorted_platforms = priority_platforms + other_platforms
        
        print(f"DEBUG: Successfully loaded {len(platforms)} platforms from JSON (prioritized {len(priority_platforms)})")
        return sorted_platforms
    except Exception as e:
        logger.error(f"Error loading platforms from JSON: {e}")
        raise e

# ---------------------------------------------------------------------------
# Scan Result Data Class
# ---------------------------------------------------------------------------

@dataclass
class PlatformScanResult:
    platform: str
    url: str
    status: str  # 'found' | 'not_found' | 'error'
    category: str = "Unknown"
    status_code: Optional[int] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# HTTP Client Helper
# ---------------------------------------------------------------------------

_HEADERS = {
    "User-Agent": (
        "OSINT-Tool/1.0 (Educational/Ethical Research; "
        "https://github.com/your-org/osint-tool)"
    ),
    "Accept": "text/html,application/json,*/*",
}


async def _check_platform(
    client: httpx.AsyncClient,
    platform: Platform,
    username: str,
) -> PlatformScanResult:
    """
    Perform a single HTTP request to determine if 'username' exists
    on the given platform.
    """
    url = platform.url_template.replace("{username}", username)
    try:
        # Use GET with a short timeout; follow redirects so we land on the
        # actual profile page (or the 404 page).
        response = await client.get(url, follow_redirects=True)
        status = response.status_code

        # --- Content verification for false positives ---
        body_text = response.text
        if platform.name in _ERROR_MESSAGES and _ERROR_MESSAGES[platform.name] in body_text:
            logger.debug("[%s] False positive detected by content check.", platform.name)
            return PlatformScanResult(
                platform=platform.name,
                url=url,
                status="not_found",
                category=platform.category,
                status_code=status,
            )

        # --- Special handling: HackerNews returns 200 + null body if missing ---
        if platform.name == "HackerNews":
            body = response.text.strip()
            exists = body not in ("null", "", "null\n")
            return PlatformScanResult(
                platform=platform.name,
                url=url,
                status="found" if exists else "not_found",
                category=platform.category,
                status_code=status,
            )

        if status in platform.found_status_codes:
            p_status = "found"
        elif status in platform.not_found_status_codes:
            p_status = "not_found"
        else:
            p_status = "error"

        logger.debug("[%s] %s -> HTTP %d | status=%s", platform.name, url, status, p_status)
        return PlatformScanResult(
            platform=platform.name,
            url=url,
            status=p_status,
            category=platform.category,
            status_code=status,
        )

    except httpx.TimeoutException:
        logger.warning("[%s] Request timed out for username '%s'", platform.name, username)
        return PlatformScanResult(
            platform=platform.name,
            url=url,
            status="error",
            category=platform.category,
            error="Request timed out",
        )
    except httpx.RequestError as exc:
        logger.warning("[%s] Request error for username '%s': %s", platform.name, username, exc)
        return PlatformScanResult(
            platform=platform.name,
            url=url,
            status="error",
            category=platform.category,
            error=str(exc),
        )
    except Exception as exc:
        logger.warning("[%s] Unexpected error for username '%s': %s", platform.name, username, exc)
        return PlatformScanResult(
            platform=platform.name,
            url=url,
            status="error",
            category=platform.category,
            error=f"Unexpected error: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Social Scanner — Public API
# ---------------------------------------------------------------------------

class SocialScanner:
    """
    Concurrently scans multiple public platforms for a given username.

    Usage
    -----
    >>> scanner = SocialScanner()
    >>> results = await scanner.scan("johndoe")
    """

    def __init__(
        self,
        platforms: Optional[list[Platform]] = None,
        timeout: Optional[float] = None,
        max_concurrency: Optional[int] = None,
    ) -> None:
        # Load platforms from JSON at runtime if not provided
        if platforms is not None:
            self._platforms = platforms
        else:
            self._platforms = load_platforms_from_json()
            
        if not self._platforms:
            raise ValueError("SocialScanner cannot function without a valid list of platforms. Ensure platforms.json is correctly populated.")
            
        self._timeout = timeout or settings.REQUEST_TIMEOUT_SECONDS
        self._semaphore = asyncio.Semaphore(
            max_concurrency or settings.MAX_CONCURRENT_REQUESTS
        )

    async def scan(self, username: str) -> list[PlatformScanResult]:
        """
        Run concurrent checks across all registered platforms.

        Parameters
        ----------
        username : str
            The username to look up (plain string, no '@' prefix needed).

        Returns
        -------
        list[PlatformScanResult]
            One result per platform, in completion order.
        """
        username = username.strip().lstrip("@")  # Normalise input
        logger.info("Starting social scan for username: '%s'", username)

        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=httpx.Timeout(self._timeout),
        ) as client:
            tasks = [
                self._bounded_check(client, platform, username)
                for platform in self._platforms
            ]
            results = await asyncio.gather(*tasks, return_exceptions=False)

        found_count = sum(1 for r in results if r.status == "found")
        logger.info(
            "Scan complete for '%s': found on %d/%d platforms.",
            username, found_count, len(results),
        )
        return list(results)

    async def scan_stream(self, username: str):
        """
        Concurrently scans platforms and yields results as they complete.
        """
        username = username.strip().lstrip("@")
        logger.info("Starting streaming social scan for username: '%s'", username)

        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=httpx.Timeout(self._timeout),
        ) as client:
            tasks = [
                self._bounded_check(client, platform, username)
                for platform in self._platforms
            ]
            for task in asyncio.as_completed(tasks):
                try:
                    result = await task
                    yield result
                except Exception as exc:
                    logger.exception("Task failed in scan_stream")
                    yield PlatformScanResult(
                        platform="Unknown",
                        url="",
                        status="error",
                        error=str(exc)
                    )

    async def _bounded_check(
        self,
        client: httpx.AsyncClient,
        platform: Platform,
        username: str,
    ) -> PlatformScanResult:
        """Wraps _check_platform with a concurrency semaphore."""
        async with self._semaphore:
            return await _check_platform(client, platform, username)
