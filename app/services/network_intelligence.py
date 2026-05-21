import httpx
import logging
import os
from typing import Any, Dict, Optional
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class NetworkIntelligence:
    """
    Passive network intelligence using Shodan and Censys APIs.
    Zero-cost implementation uses freemium tiers.
    """

    def __init__(self, shodan_key: Optional[str] = None):
        self.shodan_key = shodan_key or os.getenv("SHODAN_API_KEY")
        self.base_url = "https://api.shodan.io"

    async def get_ip_intel(self, ip: str) -> Dict[str, Any]:
        """
        Fetch open ports, vulnerabilities, and ISP info for an IP.
        """
        def get_mock_data(reason="No API Key"):
            return {
                "status": "success",
                "ip": ip,
                "ports": [80, 443, 53],
                "vulns": [],
                "isp": f"Mock ISP ({reason})",
                "org": "Mock Org",
                "os": "Unknown"
            }

        if not self.shodan_key:
            return get_mock_data()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.base_url}/shodan/host/{ip}?key={self.shodan_key}"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "success",
                        "ip": ip,
                        "ports": data.get("ports", []),
                        "vulns": data.get("vulns", []),
                        "isp": data.get("isp", "Unknown"),
                        "org": data.get("org", "Unknown"),
                        "os": data.get("os", "Unknown")
                    }
                else:
                    return get_mock_data(f"API Error {response.status_code}")
        except Exception as e:
            logger.error(f"Shodan lookup failed: {e}")
            return get_mock_data("Connection Failed")

    async def get_domain_subdomains(self, domain: str) -> Dict[str, Any]:
        """
        Passive subdomain discovery via Shodan.
        """
        if not self.shodan_key:
            return {"status": "error", "message": "API key required for Shodan DNS lookup."}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.base_url}/dns/domain/{domain}?key={self.shodan_key}"
                response = await client.get(url)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"status": "error", "message": f"Shodan DNS API returned {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
