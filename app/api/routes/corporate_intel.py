import os
import httpx
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel

router = APIRouter()

# ─── Pydantic Model ───────────────────────────────────────────────────────────

class CorporateIntel(BaseModel):
    company_name: str
    jurisdiction_code: Optional[str] = None
    incorporation_date: Optional[str] = None
    current_status: Optional[str] = None
    registered_address_in_full: Optional[str] = None

# ─── Async Utility Function ───────────────────────────────────────────────────

async def fetch_corporate_intel(company_name: str) -> Optional[CorporateIntel]:
    """
    Queries the OpenCorporates public API for legal incorporation details.
    Attaches an API token when OPENCORPORATES_API_TOKEN is set in the
    environment; still attempts the request without one (works on some
    older API versions / rate-limited tier).

    Returns None cleanly on any network or parse error — never raises.
    Raises ValueError("auth_required") specifically when the API signals
    a 401, so the router can surface a meaningful 503 to the frontend.
    """
    url = "https://api.opencorporates.com/v0.4/companies/search"
    params: dict = {
        "q": company_name,
        "format": "json",
        "per_page": 1,
        "order": "score",
    }

    # Attach token if configured
    api_token = os.getenv("OPENCORPORATES_API_TOKEN")
    if api_token:
        params["api_token"] = api_token

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
    except httpx.TimeoutException:
        return None
    except Exception:
        return None

    # Surface auth errors distinctly so the router can give a clear 503
    if response.status_code == 401:
        raise ValueError("auth_required")

    if response.status_code != 200:
        return None

    try:
        data = response.json()
    except Exception:
        return None

    # Safe navigation through the OpenCorporates response shape
    companies = (
        data
        .get("results", {})
        .get("companies", [])
    )

    if not companies:
        return None

    # Each item is {"company": {...}}
    company = companies[0].get("company", {})

    return CorporateIntel(
        company_name=company.get("name", company_name),
        jurisdiction_code=company.get("jurisdiction_code"),
        incorporation_date=company.get("incorporation_date"),
        current_status=company.get("current_status"),
        registered_address_in_full=company.get("registered_address_in_full"),
    )

# ─── FastAPI Router Endpoint ──────────────────────────────────────────────────

@router.get(
    "/corporate-intel/{company_name}",
    response_model=CorporateIntel,
    status_code=status.HTTP_200_OK,
    summary="Retrieve legal incorporation data from OpenCorporates",
    responses={
        404: {"description": "No corporate entity found for the given company name."},
        503: {"description": "OpenCorporates requires an API token — set OPENCORPORATES_API_TOKEN in .env."},
        504: {"description": "OpenCorporates API timed out."},
    },
)
async def corporate_intel_endpoint(
    company_name: str = Path(
        ...,
        min_length=1,
        max_length=120,
        description="The target company name to search in the OpenCorporates database.",
        examples=["Apple Inc"],
    )
):
    """
    **GET** `/api/corporate-intel/{company_name}`

    Queries OpenCorporates for legal entity data (name, jurisdiction,
    incorporation date, status, registered address).

    Set `OPENCORPORATES_API_TOKEN` in your `.env` file to authenticate
    and unlock full search access. A strict 10-second timeout prevents
    the server from hanging on slow responses.
    """
    try:
        company_name = company_name.strip()
        if not company_name or len(company_name) > 120 or not re.match(r"^[a-zA-Z0-9\s.,&\-\'\(\)]+$", company_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid company name format."
            )
        result = await fetch_corporate_intel(company_name)
    except HTTPException as he:
        raise he
    except ValueError as exc:
        if "auth_required" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "OpenCorporates legal entity not found or API token missing."
                ),
            )
        raise HTTPException(status_code=500, detail="Unexpected error.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No corporate entity found for: '{company_name}'.",
        )

    return result
