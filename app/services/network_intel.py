import asyncio
import logging
import socket
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)

class NetworkIntelligence:
    """
    Infrastructure fingerprinting module.
    """

    async def get_network_info(self, domain_or_ip: str) -> Dict[str, Any]:
        """
        Fetches geolocation and ISP data via ip-api.com.
        Performs a reverse DNS lookup to find the associated hostname.
        """
        result = {
            "target": domain_or_ip,
            "location": "Unknown",
            "isp": "Unknown",
            "org": "Unknown",
            "hostname": "Unknown",
            "coordinates": [0.0, 0.0],
            "status": "error"
        }

        # 1. Reverse DNS Lookup (run in threadpool to avoid blocking event loop)
        def _reverse_dns(ip_or_host: str) -> str:
            try:
                # gethostbyaddr can take an IP or hostname
                hostname, _, _ = socket.gethostbyaddr(ip_or_host)
                return hostname
            except Exception:
                return "Unknown"

        hostname_task = asyncio.to_thread(_reverse_dns, domain_or_ip)

        # 2. IP-API lookup
        async def _fetch_ip_data() -> dict:
            try:
                # 5-second timeout to prevent UI hangs
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(f"http://ip-api.com/json/{domain_or_ip}")
                    if response.status_code == 200:
                        return response.json()
            except Exception as e:
                logger.error(f"IP-API lookup failed for {domain_or_ip}: {e}")
            return {}

        # Run concurrently
        hostname, ip_data = await asyncio.gather(hostname_task, _fetch_ip_data())

        result["hostname"] = hostname

        if ip_data and ip_data.get("status") == "success":
            city = ip_data.get("city", "Unknown City")
            country = ip_data.get("country", "Unknown Country")
            result["location"] = f"{city}, {country}"
            result["isp"] = ip_data.get("isp", "Unknown")
            result["org"] = ip_data.get("org", "Unknown")
            result["coordinates"] = [ip_data.get("lat", 0.0), ip_data.get("lon", 0.0)]
            result["status"] = "success"

        return result
