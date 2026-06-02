from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
from datetime import datetime
from app.core.database import db

router = APIRouter(prefix="/api/export", tags=["Enterprise Export"])

def create_stix_bundle(target: str, findings: List[Dict]) -> Dict[str, Any]:
    # Base STIX 2.1 Bundle
    bundle_id = f"bundle--{uuid.uuid4()}"
    identity_id = f"identity--{uuid.uuid4()}"
    
    objects = []
    
    # Author Identity
    objects.append({
        "type": "identity",
        "spec_version": "2.1",
        "id": identity_id,
        "created": datetime.utcnow().isoformat() + "Z",
        "modified": datetime.utcnow().isoformat() + "Z",
        "name": "Holmes Enterprise OSINT",
        "identity_class": "system"
    })
    
    # Threat Actor or Target representation (generic)
    target_id = f"threat-actor--{uuid.uuid4()}"
    objects.append({
        "type": "threat-actor",
        "spec_version": "2.1",
        "id": target_id,
        "created": datetime.utcnow().isoformat() + "Z",
        "modified": datetime.utcnow().isoformat() + "Z",
        "name": target,
        "description": "Target resolved by Holmes OSINT",
        "threat_actor_types": ["unknown"],
        "roles": ["attacker"]
    })

    # Map findings to STIX Indicators
    for f in findings:
        indicator_id = f"indicator--{uuid.uuid4()}"
        key = f.get("key", "")
        value = str(f.get("value", ""))
        
        # Simple STIX pattern mapping heuristic
        pattern = f"[x-holmes:finding = '{value}']"
        if "ip" in key.lower():
            pattern = f"[ipv4-addr:value = '{value}']"
        elif "email" in key.lower():
            pattern = f"[email-addr:value = '{value}']"
        elif "domain" in key.lower():
            pattern = f"[domain-name:value = '{value}']"
        
        objects.append({
            "type": "indicator",
            "spec_version": "2.1",
            "id": indicator_id,
            "created": datetime.utcnow().isoformat() + "Z",
            "modified": datetime.utcnow().isoformat() + "Z",
            "name": f"Holmes Finding: {key}",
            "description": f"Detected {key} value {value}",
            "indicator_types": ["anomalous-activity"],
            "pattern": pattern,
            "pattern_type": "stix",
            "valid_from": datetime.utcnow().isoformat() + "Z"
        })
        
        # Relationship mapping
        objects.append({
            "type": "relationship",
            "spec_version": "2.1",
            "id": f"relationship--{uuid.uuid4()}",
            "created": datetime.utcnow().isoformat() + "Z",
            "modified": datetime.utcnow().isoformat() + "Z",
            "relationship_type": "indicates",
            "source_ref": indicator_id,
            "target_ref": target_id
        })

    return {
        "type": "bundle",
        "id": bundle_id,
        "objects": objects
    }

@router.get("/stix")
async def export_stix(scan_id: str = Query(..., description="ID of the scan to export")):
    # Fetch findings for the scan from database
    c = db.conn.cursor()
    c.execute("SELECT * FROM scans WHERE id=?", (scan_id,))
    scan = c.fetchone()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    c.execute("SELECT * FROM findings WHERE scan_id=?", (scan_id,))
    findings_rows = c.fetchall()
    
    findings = [dict(row) for row in findings_rows]
    
    bundle = create_stix_bundle(scan["target"], findings)
    
    return bundle
