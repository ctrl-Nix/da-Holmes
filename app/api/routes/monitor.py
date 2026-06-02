from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import db

router = APIRouter(prefix="/api/monitor", tags=["Monitoring"])

class MonitorCreateRequest(BaseModel):
    target: str
    checks: List[str]
    webhook_url: Optional[str] = None
    webhook_type: Optional[str] = None

@router.post("/add")
async def add_monitor(req: MonitorCreateRequest):
    if not req.target or not req.checks:
        raise HTTPException(status_code=400, detail="Target and checks are required")
    
    # Store monitor
    monitor_id = db.add_monitor(
        target=req.target,
        checks=req.checks,
        webhook_url=req.webhook_url,
        webhook_type=req.webhook_type
    )
    
    return {"status": "success", "monitor_id": monitor_id, "message": "Monitor scheduled successfully"}

@router.get("/list")
async def list_monitors():
    monitors = db.list_monitors()
    
    # Enrich with latest scan/finding logic if needed
    for m in monitors:
        logs = db.get_monitor_logs(m["id"], limit=1)
        m["last_log"] = logs[0] if logs else None
        
        # Also grab latest findings count for this target
        last_scan = db.get_latest_scan_for_target(m["target"])
        if last_scan:
            findings = db.get_findings(last_scan["id"])
            m["findings_count"] = len(findings)
        else:
            m["findings_count"] = 0
            
    return {"monitors": monitors}

@router.delete("/{monitor_id}")
async def delete_monitor(monitor_id: str):
    monitor = db.get_monitor(monitor_id)
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
        
    db.delete_monitor(monitor_id)
    return {"status": "success", "message": "Monitor deleted"}

@router.get("/{monitor_id}/logs")
async def get_monitor_logs(monitor_id: str, limit: int = 20):
    monitor = db.get_monitor(monitor_id)
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
        
    logs = db.get_monitor_logs(monitor_id, limit=limit)
    return {"logs": logs}
