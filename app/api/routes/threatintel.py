from fastapi import APIRouter, HTTPException, Request
import httpx
import re

router = APIRouter()

@router.get("/feed")
@router.get("/")
async def get_threat_intel(request: Request, domain: str = None):
    """
    Queries AlienVault OTX (Open Threat Exchange) for domain reputation.
    If no domain is provided, returns a static threat feed status response.
    """
    if domain is not None:
        domain = domain.strip().lower()
        DOMAIN_PATTERN = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,5}$"
        if not domain or len(domain) > 253 or not re.match(DOMAIN_PATTERN, domain):
            raise HTTPException(
                status_code=400,
                detail="Invalid domain name format."
            )

    # If no domain is supplied (e.g. called as /feed health check), return stub feed
    if not domain:
        return {
            "status": "success",
            "feed": "AlienVault OTX",
            "message": "Threat intelligence feed is operational. Provide ?domain=<domain> for a specific query.",
            "malicious_flags": 0,
            "threat_score": 0,
        }

    try:
        url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            
        if response.status_code == 200:
            data = response.json()
            pulses = data.get("pulse_info", {}).get("count", 0)
            
            return {
                "status": "success",
                "domain": domain,
                "malicious_flags": pulses,
                "threat_score": min(pulses * 10, 100),  # Simple heuristic
                "details": f"Found in {pulses} threat intelligence reports."
            }
        else:
            raise HTTPException(
                status_code=503,
                detail={"status": "unavailable", "reason": "API unreachable"}
            )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "unavailable", "reason": "API unreachable"}
        )
