from fastapi import APIRouter, HTTPException, Query, status, Request
from typing import Optional
from app.services.unified_scanner import UnifiedScanner

router = APIRouter()
_unified_scanner = UnifiedScanner()

@router.get(
    "/unified/scan",
    status_code=status.HTTP_200_OK,
    summary="One Bar OSINT Search",
    description="Automatically detects input type (Email, BTC, Domain, CIDR, Username) and runs relevant OSINT modules."
)
async def unified_scan(
    request: Request,
    query: str = Query(..., min_length=1, description="The input to investigate."),
    raw_text: Optional[str] = Query(None, description="Optional raw text for NER analysis.")
):
    try:
        results = await _unified_scanner.scan(query, raw_text)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unified scan failed: {str(e)}"
        )
