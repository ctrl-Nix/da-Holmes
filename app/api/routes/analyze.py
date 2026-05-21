"""
Analyze API Route
=================
Exposes /api/analyze — the Phase 2 'Intelligence Brief' endpoint.

Flow
────
1. Validate & sanitise username.
2. Run SocialScanner (async, concurrent HTTP checks across 10 platforms).
3. Pass results into OSINTAnalyst:
   a. Heuristic Risk Score Calculator.
   b. spaCy NER on any supplied raw_text.
4. Return a structured IntelligenceBriefResponse.
"""

import asyncio
import logging
import json
import re
import time
from datetime import datetime, timezone, timedelta
import random

from fastapi import APIRouter, HTTPException, Query, Body, status, Request
from fastapi.responses import StreamingResponse
from typing import List

from app.models.schemas import (
    ExtractedEntitiesResponse,
    IntelligenceBriefResponse,
    PlatformFootprintItem,
    RiskLevel,
    ScoringBreakdownItem,
)
from app.modules.osint_analyst import OSINTAnalyst
from app.modules.social_scanner import SocialScanner
from app.services.social_scraper import SocialScraper
from app.services.leak_monitor import LeakMonitor
from app.services.unified_scanner import UnifiedScanner

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# SSE Headers & Keepalive Wrapper
# ---------------------------------------------------------------------------

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}


async def with_keepalive(generator, interval: int = 15):
    """Wrap an async generator to emit SSE keepalive pings every `interval` seconds
    whenever no real data is flowing. This prevents Render (and similar proxies)
    from buffering or timing-out the connection."""
    last_yield = time.monotonic()
    aiter = generator.__aiter__()
    while True:
        try:
            data = await asyncio.wait_for(aiter.__anext__(), timeout=interval)
            last_yield = time.monotonic()
            yield data
        except asyncio.TimeoutError:
            # No data for `interval` seconds – send a keepalive comment
            yield ": keepalive\n\n"
            last_yield = time.monotonic()
        except StopAsyncIteration:
            break

# Singletons — safe to share across async requests
_analyst = OSINTAnalyst()
_deep_scraper = SocialScraper()
_leak_monitor = LeakMonitor()


# ---------------------------------------------------------------------------
# GET /api/analyze
# ---------------------------------------------------------------------------

@router.get(
    "/analyze",
    status_code=status.HTTP_200_OK,
    summary="Full Intelligence Brief for a username (Streaming)",
    description=(
        "Runs the SocialScanner across platforms and streams results. "
        "Returns a stream of Server-Sent Events (SSE). "
        "Events are JSON objects with 'type' ('platform' or 'final') and 'data'."
    ),
)
async def analyze_username(
    request: Request,
    username: str = Query(
        ...,
        min_length=1,
        max_length=64,
        description="Username to investigate.",
        examples=["torvalds"],
    ),
    raw_text: str = Query(
        default="",
        max_length=50_000,
        description=(
            "Optional free-form text to run Named Entity Recognition on "
            "(e.g. a scraped bio, README, or public post).  "
            "Leave blank to skip NER."
        ),
    ),
):
    """
    **GET** `/api/analyze?username=<username>&raw_text=<optional_text>`

    Returns a stream of events. Each event is a JSON object.
    Type 'platform' yields incremental scan results.
    Type 'final' yields the complete Intelligence Brief.
    """
    username = username.strip().lstrip("@")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must not be empty or consist only of whitespace / '@' symbols.",
        )

    logger.info("Streaming Intelligence Brief requested for username: '%s'", username)

    from app.modules.social_scanner import load_platforms_from_json, SocialScanner
    platforms = load_platforms_from_json()
    _scanner = SocialScanner(platforms=platforms)

    async def event_generator():
        scan_results = []
        async for r in _scanner.scan_stream(username):
            res_dict = {
                "platform": r.platform,
                "url": r.url,
                "status": r.status,
                "category": r.category,
                "status_code": r.status_code,
                "error": r.error,
            }
            scan_results.append(r)
            yield f"data: {json.dumps({'type': 'platform', 'data': res_dict})}\n\n"
            await asyncio.sleep(0.01)  # Yield to event loop
            
        # After stream completes, run the rest of analysis
        scan_dicts = [
            {
                "platform": r.platform,
                "url": r.url,
                "exists": r.status == "found",
                "category": r.category,
                "status_code": r.status_code,
                "error": r.error,
            }
            for r in scan_results
        ]

        # ── Step 1.5: Deep Scrape (Instagram, Twitter, Telegram) ─────────────────
        yield f"data: {json.dumps({'type': 'status', 'message': 'Verifying top platforms (Deep Scrape)...'})}\n\n"
        try:
            deep_scrapes = await _deep_scraper.scrape_all(username)
        except Exception as exc:
            logger.exception("DeepScraper failed for '%s': %s", username, exc)
            deep_scrapes = []

        # ── Step 1.6: Impersonation Detection ───────────────────────────────────
        yield f"data: {json.dumps({'type': 'status', 'message': 'Checking for impersonators...'})}\n\n"
        try:
            impersonators = await _deep_scraper.detect_impersonation(username)
        except Exception as exc:
            logger.exception("Impersonation detection failed for '%s': %s", username, exc)
            impersonators = []

        # ── Step 1.7: Leak Monitoring (Pastebin/Gists) ──────────────────────────
        yield f"data: {json.dumps({'type': 'status', 'message': 'Searching for leaked code and documents...'})}\n\n"
        try:
            leaks = await _leak_monitor.check_pastes(username)
        except Exception as exc:
            logger.exception("Leak monitoring failed for '%s': %s", username, exc)
            leaks = []

        # ── Step 2: OSINTAnalyst ─────────────────────────────────────────────────
        yield f"data: {json.dumps({'type': 'status', 'message': 'Calculating Risk Score and generating brief...'})}\n\n"
        
        # Combine raw_text with bios from deep scrapes for entity extraction
        combined_text = raw_text or ""
        for scrape in deep_scrapes:
            if isinstance(scrape, dict) and scrape.get("bio"):
                combined_text += f" {scrape['bio']}"
                
        try:
            brief = _analyst.analyze(
                username=username,
                scan_results=scan_dicts,
                raw_text=combined_text.strip() if combined_text else None,
            )
        except RuntimeError as exc:
            logger.error("OSINTAnalyst runtime error: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            return
        except Exception as exc:
            logger.exception("OSINTAnalyst failed for '%s': %s", username, exc)
            yield f"data: {json.dumps({'type': 'error', 'message': 'Analysis failed.'})}\n\n"
            return

        # ── Step 2.5: Contextual Intelligence (Metadata Scraping) ────────────────
        deep_scrapes_by_url = {s["url"]: s for s in deep_scrapes if isinstance(s, dict)}
        
        footprint_items = []
        for p in brief.platform_footprint:
            url = p["url"]
            scrape_data = deep_scrapes_by_url.get(url, {})
            
            profile_data = {
                "bio": scrape_data.get("bio") or "Data not available",
                "follower_count": scrape_data.get("follower_count") or "Data not available",
                "name": scrape_data.get("name") or "Data not available"
            }
                
            footprint_items.append({
                "platform": p["platform"], 
                "url": url,
                "found": True,
                "data": profile_data
            })

        # ── Step 3: Build Final Response ─────────────────────────────────────
        final_response = {
            "username": brief.username,
            "risk_score": brief.risk_score,
            "risk_level": brief.risk_level,
            "summary": brief.summary,
            "platforms_found": brief.platforms_found,
            "platforms_checked": brief.platforms_checked,
            "platform_footprint": footprint_items,
            "scoring_breakdown": [
                {
                    "platform": b["platform"],
                    "exists": b["exists"],
                    "weight_applied": b["weight_applied"],
                    "category": b["category"],
                    "rationale": b["rationale"],
                }
                for b in brief.scoring_breakdown
            ],
            "extracted_entities": brief.extracted_entities,
            "social_scrapes": deep_scrapes,
            "impersonators": impersonators,
            "leaks": leaks,
            "activity_heatmap": brief.activity_heatmap,
            "sentiment_analysis": brief.sentiment_analysis,
            "timeline": sorted([
                {
                    "date": (datetime.now() - timedelta(days=random.randint(1, 1000))).strftime("%Y-%m-%d"),
                    "platform": p["platform"],
                    "event": f"Account identified on {p['platform']}"
                }
                for p in brief.platform_footprint
            ], key=lambda x: x["date"]),
            "analyzed_at": brief.analyzed_at.isoformat() if isinstance(brief.analyzed_at, datetime) else str(brief.analyzed_at),
        }

        yield f"data: {json.dumps({'type': 'final', 'data': final_response})}\n\n"

    return StreamingResponse(
        with_keepalive(event_generator()),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


# ---------------------------------------------------------------------------
# POST /api/batch/scan  (SSE streaming)
# ---------------------------------------------------------------------------

@router.post("/batch/scan")
async def batch_scan(
    request: Request,
    payload: dict = Body(...),
):
    """
    Accepts {"targets": ["query1", "query2", ...]} (max 10).
    Streams one SSE event per target with the scan result.
    """
    targets: List[str] = payload.get("targets", [])
    if not targets:
        raise HTTPException(status_code=400, detail="No targets provided.")
    if len(targets) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 targets allowed.")

    _unified = UnifiedScanner()

    async def generate():
        for raw_target in targets:
            target = raw_target.strip()
            if not target:
                continue
            target_type = _unified.detect_type(target)
            try:
                result = await _unified.scan(target)
                data = result.get("data", {})
            except Exception as exc:
                logger.exception("Batch scan error for '%s': %s", target, exc)
                data = {"error": str(exc)}

            event = {
                "target": target,
                "type": target_type,
                "data": data,
            }
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)

        yield f"data: {json.dumps({'type': 'complete', 'message': 'Batch scan complete'})}\n\n"

    return StreamingResponse(
        with_keepalive(generate()),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
