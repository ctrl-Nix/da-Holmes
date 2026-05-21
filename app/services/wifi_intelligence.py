import httpx
import logging
import os
import base64
from typing import Any, Dict, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class WifiIntelligence:
    """
    Geospatial Wi-Fi mapping using Wigle.net API.
    """

    def __init__(self, api_name: Optional[str] = None, api_key: Optional[str] = None):
        self.api_name = api_name or os.getenv("WIGLE_API_NAME")
        self.api_key = api_key or os.getenv("WIGLE_API_KEY")
        self.base_url = "https://api.wigle.net/api/v2"

    async def search_bssid(self, bssid: str) -> Dict[str, Any]:
        """
        Search for a physical location based on BSSID (MAC address).
        """
        if not self.api_name or not self.api_key:
            raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})

        try:
            auth_str = f"{self.api_name}:{self.api_key}"
            encoded_auth = base64.b64encode(auth_str.encode()).decode()
            headers = {"Authorization": f"Basic {encoded_auth}"}

            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.base_url}/network/search?netid={bssid}"
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    if results:
                        net = results[0]
                        return {
                            "status": "success",
                            "bssid": bssid,
                            "ssid": net.get("ssid"),
                            "lat": net.get("trilat"),
                            "lon": net.get("trilon"),
                            "city": net.get("city"),
                            "road": net.get("road")
                        }
                    raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
                else:
                    raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Wigle lookup failed: {e}")
            raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
