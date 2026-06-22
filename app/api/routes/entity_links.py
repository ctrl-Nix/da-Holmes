from fastapi import APIRouter, HTTPException
from app.core.database import db
import logging

router = APIRouter()
logger = logging.getLogger("holmes.entity_links")

@router.get("/links", summary="Entity Link Analysis", description="Find cross-workspace overlaps between targets.")
async def analyze_entity_links():
    try:
        # We need to find values that appear across multiple different targets/scans
        # Example: Two different domains that share the same IP address or tracking code.
        
        c = db.conn.cursor()
        
        # This query finds findings with the same exact value that belong to different target scans.
        # It's a heavy query, so we'll limit it.
        c.execute("""
            SELECT f.key, f.value, GROUP_CONCAT(DISTINCT s.target) as targets, COUNT(DISTINCT s.target) as target_count
            FROM findings f
            JOIN scans s ON f.scan_id = s.id
            WHERE f.value != '' AND f.value IS NOT NULL
              AND f.key NOT IN ('timestamp', 'scan_id', 'status', 'error') 
              AND LENGTH(f.value) > 3
            GROUP BY f.key, f.value
            HAVING target_count > 1
            ORDER BY target_count DESC
            LIMIT 100
        """)
        
        rows = c.fetchall()
        
        links = []
        for r in rows:
            links.append({
                "attribute_type": r["key"],
                "shared_value": r["value"],
                "connected_targets": r["targets"].split(",") if r["targets"] else [],
                "connection_count": r["target_count"]
            })
            
        return {
            "status": "success",
            "cross_target_links": links
        }
    except Exception as e:
        logger.error(f"Entity Link Analysis failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze entity links.")
