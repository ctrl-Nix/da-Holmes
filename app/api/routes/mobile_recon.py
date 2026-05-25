import asyncio
import functools
from typing import Optional

from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel
from google_play_scraper import search

router = APIRouter()

# ─── Pydantic Model ───────────────────────────────────────────────────────────

class MobileAppIntel(BaseModel):
    title: str
    appId: str
    developer: str
    score: Optional[float] = None
    installs: Optional[str] = None

# ─── Async Utility Function ───────────────────────────────────────────────────

async def fetch_play_store_intel(company_name: str) -> Optional[MobileAppIntel]:
    """
    Searches the Google Play Store for the most relevant app matching the
    given company name. Returns None cleanly if nothing is found or any
    error occurs — does NOT raise exceptions to the caller.

    The underlying google-play-scraper library is synchronous, so we
    offload it to a thread-pool executor to keep the FastAPI event loop
    unblocked.
    """
    loop = asyncio.get_event_loop()

    def _blocking_search():
        # Perform the Play Store search synchronously inside the thread
        results = search(company_name, lang="en", country="us", n_hits=5)
        return results

    try:
        results = await loop.run_in_executor(None, functools.partial(_blocking_search))
    except Exception:
        return None

    if not results:
        return None

    # Pick the first (most relevant) result from the Play Store ranking
    first = results[0]

    return MobileAppIntel(
        title=first.get("title", "Unknown"),
        appId=first.get("appId", "unknown"),
        developer=first.get("developer", "Unknown"),
        score=first.get("score"),
        installs=first.get("installs"),
    )

# ─── FastAPI Router Endpoint ──────────────────────────────────────────────────

@router.get(
    "/mobile-recon/{company_name}",
    response_model=MobileAppIntel,
    status_code=status.HTTP_200_OK,
    summary="Search Google Play Store for a company's mobile app",
    responses={
        404: {"description": "No application found for the given company name."},
        500: {"description": "Unexpected error during Play Store search."},
    },
)
async def mobile_recon(
    company_name: str = Path(
        ...,
        min_length=1,
        max_length=100,
        description="The target company name to search for on the Google Play Store.",
        examples=["Zepto"],
    )
):
    """
    **GET** `/api/mobile-recon/{company_name}`

    Searches the Google Play Store for the most relevant public app
    associated with the given company name.

    Returns curated mobile app intelligence: `title`, `appId` (bundle ID),
    `developer`, `score`, and `installs`. Uses only the free, open-source
    `google-play-scraper` library — no paid APIs involved.
    """
    try:
        result = await fetch_play_store_intel(company_name.strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during Play Store reconnaissance.",
        ) from exc

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Play Store application found for company: '{company_name}'.",
        )

    return result
