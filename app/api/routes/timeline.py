from fastapi import APIRouter, HTTPException, Query
from app.core.database import db
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger("holmes.timeline")

@router.get("/events", summary="Timeline Engine", description="Reconstruct a chronological timeline of findings for a target.")
async def get_timeline(
    target: str = Query(..., description="The target domain or entity")
):
    try:
        c = db.conn.cursor()
        # Fetch all findings for this target across all scans, ordered by the time they were discovered
        c.execute("""
            SELECT f.module, f.key, f.value, f.timestamp, s.scan_type
            FROM findings f
            JOIN scans s ON f.scan_id = s.id
            WHERE s.target = ?
            ORDER BY f.timestamp ASC
        """, (target,))
        
        rows = c.fetchall()
        
        events = []
        for r in rows:
            # Try to format the timestamp, or just use it as is if it's already a string
            ts_str = r["timestamp"]
            
            events.append({
                "timestamp": ts_str,
                "event_type": r["module"],
                "context": r["scan_type"],
                "description": f"Discovered {r['key']}: {str(r['value'])[:100]}"
            })
            
        return {
            "target": target,
            "timeline": events
        }
    except Exception as e:
        logger.error(f"Timeline generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate timeline.")
