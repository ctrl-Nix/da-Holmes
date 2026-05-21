"""
Scanner API Routes
==================
Exposes OSINT scanning endpoints under /api/scan/.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status, Request

from app.models.schemas import (
    PlatformResult,
    ScanStatus,
    UsernameScanResponse,
)
from app.modules.social_scanner import SocialScanner

logger = logging.getLogger(__name__)

router = APIRouter()

# Singleton scanner — reuses the same semaphore across all requests.
_scanner = SocialScanner()


# ---------------------------------------------------------------------------
# GET /api/scan/username
# ---------------------------------------------------------------------------

@router.get(
    "/scan/username",
    response_model=UsernameScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan username across public social platforms",
    description=(
        "Concurrently checks whether the provided username exists on a curated "
        "set of public platforms (GitHub, Reddit, Pinterest, Medium, Dev.to, "
        "GitLab, HackerNews, npm, Mastodon, Keybase). "
        "Only public, unauthenticated endpoints are used — no CAPTCHA bypassing, "
        "no credential stuffing."
    ),
    responses={
        200: {"description": "Scan completed (may be partial if some platforms errored)."},
        400: {"description": "Invalid username supplied."},
        500: {"description": "Unexpected server error."},
    },
)
async def scan_username(
    request: Request,
    username: str = Query(
        ...,
        min_length=1,
        max_length=64,
        description="Username to search for across public platforms.",
        examples=["johndoe"],
    ),
) -> UsernameScanResponse:
    """
    **GET** `/api/scan/username?username=<username>`

    Returns per-platform existence results gathered concurrently via
    public profile URLs.
    """
    username = username.strip().lstrip("@")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must not be empty or consist only of whitespace / '@' symbols.",
        )

    logger.info("Received scan request for username: '%s'", username)

    try:
        raw_results = await _scanner.scan(username)
    except Exception as exc:
        logger.exception("Unexpected error during scan for '%s': %s", username, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while running the scan.",
        ) from exc

    # --- Map internal dataclass → Pydantic response model ---
    platform_results = [
        PlatformResult(
            platform=r.platform,
            url=r.url,
            status=r.status,
            status_code=r.status_code,
            error=r.error,
        )
        for r in raw_results
    ]

    total = len(platform_results)
    found_on = sum(1 for r in platform_results if r.status == "found")
    errored = sum(1 for r in platform_results if r.status == "error")

    if errored == total:
        scan_status = ScanStatus.ERROR
    elif errored > 0:
        scan_status = ScanStatus.PARTIAL
    else:
        scan_status = ScanStatus.SUCCESS

    return UsernameScanResponse(
        username=username,
        scan_status=scan_status,
        total_platforms_checked=total,
        found_on=found_on,
        results=platform_results,
        scanned_at=datetime.now(timezone.utc),
    )
