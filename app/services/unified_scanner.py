import re
import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException

from app.modules.social_scanner import SocialScanner
from app.services.social_scraper import SocialScraper
from app.services.security_scanner import SecurityScanner
from app.services.network_intelligence import NetworkIntelligence
from app.services.wifi_intelligence import WifiIntelligence
from app.services.leak_monitor import LeakMonitor

logger = logging.getLogger(__name__)

class UnifiedScanner:
    """
    The 'One Bar' engine. Detects input type and orchestrates concurrent OSINT queries.
    """

    def __init__(self):
        self.social_scanner = SocialScanner()
        self.security_scanner = SecurityScanner()
        self.social_scraper = SocialScraper()
        self.network_intel = NetworkIntelligence()
        self.wifi_intel = WifiIntelligence()
        self.leak_monitor = LeakMonitor()

    def detect_type(self, query: str) -> str:
        query = query.strip()
        
        # BTC Wallet (Standard patterns: 1..., 3..., bc1...)
        if re.match(r'^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$', query):
            return "btc"
        
        # Email
        if re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', query):
            return "email"
        
        # CIDR / IP
        if re.match(r'^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$', query):
            return "network"
        
        # Domain
        if re.match(r'^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$', query, re.IGNORECASE):
            return "domain"
        
        # Phone (Basic E.164)
        if re.match(r'^\+?[1-9]\d{1,14}$', query):
            return "phone"
            
        # BSSID (MAC Address)
        if re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', query):
            return "bssid"
            
        # Default to username
        return "username"

    async def scan(self, query: str, raw_text: Optional[str] = None) -> Dict[str, Any]:
        target_type = self.detect_type(query)
        logger.info("Unified scan triggered for '%s' (Detected type: %s)", query, target_type)

        results = {
            "query": query,
            "type": target_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {}
        }

        if target_type == "username":
            # Run username analysis concurrently
            social_task = self.social_scanner.scan(query)
            deep_scrapes_task = self.social_scraper.scrape_all(query)
            leaks_task = self.leak_monitor.check_pastes(query)
            
            social_results, deep_scrapes, leaks = await asyncio.gather(
                social_task, deep_scrapes_task, leaks_task
            )
            
            results["data"] = {
                "social": social_results,
                "deep_scrapes": deep_scrapes,
                "leaks": leaks
            }
        
        elif target_type == "email":
            breach_data = await self.security_scanner.check_email_breaches(query)
            results["data"] = {
                "breaches": breach_data
            }
            
        elif target_type == "domain":
            # Here we would call domain specific scanners
            results["data"] = {
                "message": "Domain scan triggered. Check domain specific modules for details."
            }
            
        elif target_type == "network":
            network_data = await self.network_intel.get_ip_intel(query)
            results["data"] = {
                "network_intel": network_data
            }
            
        elif target_type == "bssid":
            wifi_data = await self.wifi_intel.search_bssid(query)
            results["data"] = {
                "wifi_intel": wifi_data
            }
            
        elif target_type == "btc":
            results["data"] = {
                "message": "Blockchain intelligence module pending integration.",
                "explorer_url": f"https://www.blockchain.com/explorer/addresses/btc/{query}",
                "summary": "High-value asset tracking triggered."
            }
            
        elif target_type == "phone":
            raise HTTPException(status_code=503, detail={"status": "unavailable", "reason": "API unreachable"})
            
        return results
