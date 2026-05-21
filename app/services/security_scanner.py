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
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "compromised",
                        "breach_count": len(data),
                        "details": [{"name": breach.get("Name"), "description": breach.get("Description", "No details"), "date": breach.get("BreachDate")} for breach in data]
                    }
                elif response.status_code == 404:
                    return {"status": "safe", "breach_count": 0, "details": []}
                else:
                    logger.warning("Breach API returned %d.", response.status_code)
                    raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error("Error during security breach scan: %s", e)
            raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
