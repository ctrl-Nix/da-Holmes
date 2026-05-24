import json
import asyncio
import time
import logging
from fastapi import APIRouter, HTTPException, Query, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from app.services.unified_scanner import UnifiedScanner

logger = logging.getLogger(__name__)
router = APIRouter()
_unified_scanner = UnifiedScanner()

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
}

async def with_keepalive(generator, interval: int = 15):
    """Wrap an async generator to emit SSE keepalive pings every `interval` seconds"""
    last_yield = time.monotonic()
    aiter = generator.__aiter__()
    while True:
        try:
            data = await asyncio.wait_for(aiter.__anext__(), timeout=interval)
            last_yield = time.monotonic()
            yield data
        except asyncio.TimeoutError:
            yield ": keepalive\\n\\n"
            last_yield = time.monotonic()
        except StopAsyncIteration:
            break

class BatchScanRequest(BaseModel):
    targets: List[str]

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
        from app.core.correlations import CorrelationEngine
        engine = CorrelationEngine()
        results["correlations"] = engine.run_all(results.get("data", {}))
        return results
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unified scan failed: {str(e)}"
        )

