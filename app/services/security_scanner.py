import asyncio
import logging
from typing import Any, Dict
import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class SecurityScanner:
    """
    Simulated Intelligence Layer & API integration for checking email breaches.
    """

    async def check_email_breaches(self, email: str) -> Dict[str, Any]:
        email_lower = email.lower()
        
        try:
            headers = {"User-Agent": "OSINT-Educational-Tool"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    f"https://api.xposedornot.com/v1/breach-analytics?email={email}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    exposed = data.get("ExposedBreaches", {})
                    if isinstance(exposed, dict) and "breaches_details" in exposed:
                        breaches_list = exposed.get("breaches_details", [])
                        details = []
                        for item in breaches_list:
                            details.append({
                                "name": item.get("breach") or "Unknown",
                                "description": item.get("details") or f"Exposed: {item.get('xposed_data', 'Unknown data')}",
                                "date": str(item.get("xposed_date") or "Unknown")
                            })
                        return {
                            "status": "compromised",
                            "breach_count": len(details),
                            "details": details
                        }
                    else:
                        return {"status": "safe", "breach_count": 0, "details": []}
                else:
                    logger.warning("Breach API returned %d.", response.status_code)
                    raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error("Error during security breach scan: %s", e)
            raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
