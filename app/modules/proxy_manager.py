import os
import random
import httpx
from typing import Optional, List

class ProxyManager:
    def __init__(self):
        # In a real enterprise setup, this would be a BrightData or ScraperAPI URL
        # e.g., http://username:password@proxy.brightdata.com:22225
        self.proxy_pool_url = os.getenv("PROXY_POOL_URL", "")
        
        # Alternatively, a static list of proxies loaded from a file or DB
        self.static_proxies: List[str] = []
        self._load_static_proxies()

    def _load_static_proxies(self):
        try:
            if os.path.exists("proxies.txt"):
                with open("proxies.txt", "r") as f:
                    self.static_proxies = [line.strip() for line in f if line.strip()]
        except Exception:
            pass

    def get_random_proxy(self) -> Optional[str]:
        if self.proxy_pool_url:
            return self.proxy_pool_url
            
        if self.static_proxies:
            return random.choice(self.static_proxies)
            
        return None

    def get_client(self, timeout: float = 15.0, **kwargs) -> httpx.AsyncClient:
        """
        Returns an httpx.AsyncClient configured with a rotating proxy (if available),
        random User-Agents, and appropriate evasion headers.
        """
        proxy = self.get_random_proxy()
        
        # Evasion headers
        headers = {
            "User-Agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
            ]),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))

        if proxy:
            # Mount proxy for both http and https
            mounts = {
                "http://": httpx.AsyncHTTPTransport(proxy=proxy),
                "https://": httpx.AsyncHTTPTransport(proxy=proxy),
            }
            return httpx.AsyncClient(mounts=mounts, headers=headers, timeout=timeout, **kwargs)
        else:
            # Fallback to direct connection if no proxies are configured
            return httpx.AsyncClient(headers=headers, timeout=timeout, **kwargs)

proxy_manager = ProxyManager()
