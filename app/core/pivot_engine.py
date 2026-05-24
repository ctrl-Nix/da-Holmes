import asyncio
import httpx
import socket
from typing import Optional

PIVOT_MAP = {
    "ip_found": [
        "asn_lookup",
        "reverse_ip", 
        "ip_geo",
        "threat_check"
    ],
    "email_found": [
        "breach_check",
        "smtp_verify",
        "emailrep_check",
        "paste_check"
    ],
    "subdomain_found": [
        "ssl_check",
        "takeover_check",
        "ip_resolve"
    ],
    "domain_found": [
        "whois_lookup",
        "dns_lookup",
        "cert_transparency"
    ],
    "github_org_found": [
        "repo_scan",
        "secret_scan"
    ],
    "asn_found": [
        "bgp_peers",
        "ip_range_scan"
    ],
    "employee_name_found": [
        "email_format_guess",
        "username_check",
        "linkedin_pivot"
    ],
    "crypto_address_found": [
        "wallet_balance",
        "scam_check",
        "tx_history"
    ]
}

class PivotEngine:
    def __init__(self, output_queue: Optional[asyncio.Queue] = None):
        self.event_queue = asyncio.Queue()
        self.processed_events = set()  # prevent infinite loops
        self.results = {}
        self.output_queue = output_queue
    
    async def emit(self, event_type: str, value: str, source_module: str, data: dict = None):
        # Deduplicate: skip if already processed this value
        event_key = f"{event_type}:{value}"
        if event_key in self.processed_events:
            return
        self.processed_events.add(event_key)
        
        event_obj = {
            "event": event_type,
            "value": value,
            "source": source_module,
            "data": data or {}
        }
        
        await self.event_queue.put(event_obj)
        if self.output_queue:
            await self.output_queue.put(event_obj)
    
    async def process_event(self, event: dict) -> list[dict]:
        # Route to correct handler based on event type
        # Return list of new findings
        handlers = {
            "ip_found": self._handle_ip,
            "email_found": self._handle_email,
            "subdomain_found": self._handle_subdomain,
            "domain_found": self._handle_domain,
        }
        handler = handlers.get(event["event"])
        if handler:
            return await handler(event["value"])
        return []
    
    async def _handle_ip(self, ip: str) -> list:
        results = []
        # 1. BGP/ASN lookup
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(f"https://api.bgpview.io/ip/{ip}")
                if r.status_code == 200:
                    data = r.json().get("data", {})
                    asn = data.get("prefixes", [{}])[0].get("asn", {}).get("asn")
                    if asn:
                        results.append({
                            "event": "asn_found",
                            "value": f"AS{asn}",
                            "data": data
                        })
        except: pass
        return results
    
    async def _handle_email(self, email: str) -> list:
        results = []
        # Breach check
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(
                    f"https://api.xposedornot.com/v1/check-email/{email}",
                    headers={"User-Agent": "Holmes-OSINT"}
                )
                if r.status_code == 200:
                    data = r.json()
                    if data.get("breaches"):
                        results.append({
                            "event": "breach_found",
                            "value": email,
                            "data": data
                        })
        except: pass
        return results
    
    async def _handle_subdomain(self, subdomain: str) -> list:
        results = []
        # Resolve IP
        try:
            loop = asyncio.get_running_loop()
            ips = await loop.run_in_executor(
                None, socket.gethostbyname, subdomain
            )
            results.append({
                "event": "ip_found", 
                "value": ips,
                "data": {"subdomain": subdomain}
            })
        except: pass
        return results
    
    async def _handle_domain(self, domain: str) -> list:
        # Trigger DNS + cert transparency
        results = []
        # crt.sh for subdomains
        try:
            async with httpx.AsyncClient(timeout=7) as client:
                r = await client.get(
                    f"https://crt.sh/?q=%.{domain}&output=json"
                )
                if r.status_code == 200:
                    for entry in r.json()[:10]:
                        name = entry.get("name_value", "")
                        if name and not name.startswith("*"):
                            results.append({
                                "event": "subdomain_found",
                                "value": name.strip(),
                                "data": {}
                            })
        except: pass
        return results
    
    async def run(self, initial_target: str, target_type: str):
        # Seed initial event
        await self.emit(f"{target_type}_found", initial_target, "user_input")
        
        # Process queue until empty
        while not self.event_queue.empty():
            event = await self.event_queue.get()
            new_events = await self.process_event(event)
            
            # Save to results
            event_type = event["event"]
            if event_type not in self.results:
                self.results[event_type] = []
            self.results[event_type].append(event)
            
            # Emit new events discovered
            for ne in new_events:
                await self.emit(ne["event"], ne["value"], event["value"], ne.get("data"))
            
            self.event_queue.task_done()
        
        return self.results
