import httpx
from bs4 import BeautifulSoup
import random
import asyncio
import urllib.parse
import logging

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
]

class SocialScraper:
    async def fetch_url(self, url: str) -> str | None:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
        }
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    return response.text
                if response.status_code == 404:
                    return ""
                return None
            except Exception:
                return None

    def _extract_meta_description(self, html: str) -> str:
        if not html:
            return ""
        soup = BeautifulSoup(html, "html.parser")
        meta = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
        return meta["content"] if meta and meta.has_attr("content") else ""

    async def _fallback_search(self, query: str) -> bool:
        """Fallback to DuckDuckGo HTML search."""
        encoded_query = urllib.parse.quote_plus(query)
        html = await self.fetch_url(f"https://html.duckduckgo.com/html/?q={encoded_query}")
        # DuckDuckGo HTML returns "No results" or simply doesn't contain results class
        return html is not None and html != "" and "No results" not in html

    async def scrape_instagram(self, username: str) -> dict:
        url = f"https://www.instagram.com/{username}/"
        html = await self.fetch_url(url)
        
        if html is None:
            return {
                "platform": "Instagram",
                "url": url,
                "status": "error",
                "bio": "",
                "follower_count": None
            }
            
        bio = self._extract_meta_description(html)
        
        found = bool(bio)
        if not found:
            found = await self._fallback_search(f"site:instagram.com/{username}")
            
        return {
            "platform": "Instagram",
            "url": url,
            "status": "found" if found else "not_found",
            "bio": bio,
            "follower_count": bio.split(" Followers")[0].strip() if bio and "Followers" in bio else None
        }

    async def scrape_twitter(self, username: str) -> dict:
        url = f"https://twitter.com/{username}"
        html = await self.fetch_url(url)
        
        if html is None:
            return {
                "platform": "Twitter",
                "url": url,
                "status": "error",
                "bio": "",
                "follower_count": None
            }
            
        bio = self._extract_meta_description(html)
        
        found = bool(bio)
        if not found:
            found = await self._fallback_search(f"site:twitter.com/{username}")
            
        return {
            "platform": "Twitter",
            "url": url,
            "status": "found" if found else "not_found",
            "bio": bio,
            "follower_count": bio.split(" Followers")[0].split("-")[-1].strip() if bio and "Followers" in bio else None
        }

    async def scrape_telegram(self, username: str) -> dict:
        url = f"https://t.me/{username}"
        html = await self.fetch_url(url)
        
        if html is None:
            return {
                "platform": "Telegram",
                "url": url,
                "status": "error",
                "bio": "",
                "follower_count": None
            }
            
        bio = self._extract_meta_description(html)
        
        # Telegram t.me page is usually 200, check if it's a valid profile
        found = bool(bio) and "tgme_page" in html
        if not found and html:
            found = "tgme_page_title" in html
            
        return {
            "platform": "Telegram",
            "url": url,
            "status": "found" if found else "not_found",
            "bio": bio,
            "follower_count": bio.split(" subscribers")[0].strip() if bio and "subscribers" in bio else None
        }

    async def scrape_all(self, username: str) -> list[dict]:
        from app.modules.social_scanner import load_platforms_from_json
        platforms = load_platforms_from_json()
        
        sem = asyncio.Semaphore(10)
        
        async def scrape_platform(platform):
            async with sem:
                try:
                    if platform.name.lower() == "instagram":
                        return await self.scrape_instagram(username)
                    elif platform.name.lower() == "twitter":
                        return await self.scrape_twitter(username)
                    elif platform.name.lower() == "telegram":
                        return await self.scrape_telegram(username)
                    else:
                        url = platform.url_template.replace("{username}", username)
                        data = await self.scrape_profile_data(url)
                        return {
                            "platform": platform.name,
                            "url": url,
                            "status": data.get("status", "not_found"),
                            "bio": data.get("bio", "Data not available"),
                            "follower_count": data.get("follower_count") if data.get("follower_count") != "Data not available" else None
                        }
                except Exception as exc:
                    logger.exception("Failed to scrape platform %s: %s", platform.name, exc)
                    return {
                        "platform": platform.name,
                        "url": platform.url_template.replace("{username}", username),
                        "status": "error",
                        "bio": "Data not available due to error",
                        "follower_count": None
                    }
                
        target_platforms = ["Instagram", "Twitter", "Telegram"]
        tasks = [scrape_platform(p) for p in platforms if p.name in target_platforms]
        return await asyncio.gather(*tasks)

    async def scrape_profile_data(self, url: str) -> dict:
        """Fetch a generic profile URL and attempt to extract context (OG tags)."""
        html = await self.fetch_url(url)
        if html is None:
            return {"bio": "Data not available", "follower_count": "Data not available", "name": "Data not available", "status": "error"}
        if not html:
            return {"bio": "Data not available", "follower_count": "Data not available", "name": "Data not available", "status": "not_found"}

        soup = BeautifulSoup(html, "html.parser")
        
        # og:description or meta name="description"
        meta_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "description"})
        bio = meta_desc["content"].strip() if meta_desc and meta_desc.has_attr("content") else "Data not available"
        
        # og:title or title
        meta_title = soup.find("meta", property="og:title")
        if meta_title and meta_title.has_attr("content"):
            name = meta_title["content"].strip()
        else:
            title_tag = soup.find("title")
            name = title_tag.text.strip() if title_tag else "Data not available"
            
        # follower count heuristics (very generic, hard to be accurate for all sites)
        follower_count = "Data not available"
        if bio != "Data not available":
            lower_bio = bio.lower()
            if "followers" in lower_bio:
                parts = bio.split("Followers")
                if len(parts) > 0:
                    follower_count = parts[0].split(",")[-1].strip() + " Followers"
            elif "subscribers" in lower_bio:
                parts = bio.split("subscribers")
                if len(parts) > 0:
                    follower_count = parts[0].split(",")[-1].strip() + " Subscribers"
        
        return {
            "bio": bio,
            "follower_count": follower_count,
            "name": name,
            "status": "found" if bio != "Data not available" or name != "Data not available" else "not_found"
        }

    async def detect_impersonation(self, username: str) -> list[dict]:
        """
        Check for common username variations on top platforms to detect impersonators.
        """
        variations = [
            f"{username}_",
            f"real_{username}",
            f"official_{username}",
            f"the_{username}"
        ]
        
        results = []
        platforms = [
            {"name": "Instagram", "url": "https://www.instagram.com/{}"},
            {"name": "Twitter", "url": "https://twitter.com/{}"}
        ]
        
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
        }
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=5.0) as client:
            for platform in platforms:
                for variant in variations:
                    url = platform["url"].format(variant)
                    try:
                        resp = await client.get(url, headers=headers)
                        if resp.status_code == 200:
                            results.append({
                                "platform": platform["name"],
                                "username": variant,
                                "url": url,
                                "status": "potential_impersonator"
                            })
                    except Exception:
                        continue
        return results

    async def get_github_followers(self, username: str) -> list[str]:
        """
        Fetch GitHub followers for a user.
        """
        url = f"https://api.github.com/users/{username}/followers"
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/vnd.github.v3+json",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return [u["login"] for u in data]
                return []
            except Exception as exc:
                logger.warning("Failed to fetch GitHub followers for %s: %s", username, exc)
                return []

    async def get_twitter_followers(self, username: str) -> list[str]:
        """
        Best-effort fetch for Twitter followers using public mirrors (Nitter).
        """
        # Try a few Nitter instances as they often get rate limited
        instances = ["https://nitter.net", "https://nitter.it", "https://nitter.cz"]
        random.shuffle(instances)
        
        for base in instances:
            url = f"{base}/{username}/followers"
            html = await self.fetch_url(url)
            if html and "follower-item" in html:
                soup = BeautifulSoup(html, "html.parser")
                followers = []
                for item in soup.find_all("div", class_="follower-item"):
                    username_tag = item.find("a", class_="username")
                    if username_tag:
                        followers.append(username_tag.text.strip().lstrip("@"))
                if followers:
                    return followers
        return []

    async def get_instagram_followers(self, username: str) -> list[str]:
        """
        Instagram is extremely restrictive. This is a placeholder or uses 
        very basic public data if available. Realistically needs an API or session.
        """
        # For demo purposes/OSINT, we might look for common mentions or public tags
        # but a direct 'followers' list is impossible without login.
        # We return an empty list for now to avoid crashes, or a small sample if we find a trick.
        return []


