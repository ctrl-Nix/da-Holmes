from fastapi import APIRouter, HTTPException, Request
import httpx

router = APIRouter()

@router.get("/")
async def get_threat_intel(request: Request, domain: str):
    """
    Queries AlienVault OTX (Open Threat Exchange) for domain reputation.
    Extremely lightweight REST call, perfect for Render.
    """
    try:
        url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=15.0)
            
        if response.status_code == 200:
            data = response.json()
            pulses = data.get("pulse_info", {}).get("count", 0)
            
            return {
                "status": "success",
                "domain": domain,
                "malicious_flags": pulses,
                "threat_score": min(pulses * 10, 100), # Simple heuristic
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
