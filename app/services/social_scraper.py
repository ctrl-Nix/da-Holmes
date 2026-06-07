import httpx
from bs4 import BeautifulSoup
import random
import asyncio
import urllib.parse
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)


def _get_instagram_headers() -> Optional[Dict[str, str]]:
    """
    Build Instagram auth headers from env config or vault.
    Returns None if no credentials configured (unauthenticated fallback).
    """
    try:
        from app.core.config import settings
        session_id = settings.INSTAGRAM_SESSION_ID
        ds_user_id = settings.INSTAGRAM_DS_USER_ID
        csrftoken   = settings.INSTAGRAM_CSRFTOKEN
    except Exception:
        session_id = ds_user_id = csrftoken = None

    # Also try to pull from Vault (runtime override — no restart needed)
    if not session_id:
        try:
            from app.core.database import db
            from app.core.vault import decrypt_secret
            session_id = decrypt_secret(db.get_secret("default_user", "instagram_sessionid") or "")
            ds_user_id = decrypt_secret(db.get_secret("default_user", "instagram_ds_user_id") or "")
            csrftoken  = decrypt_secret(db.get_secret("default_user", "instagram_csrftoken") or "")
        except Exception:
            pass

    if not session_id:
        return None  # No credentials → caller will do unauthenticated request

    cookie_parts = [f"sessionid={session_id}"]
    if ds_user_id:
        cookie_parts.append(f"ds_user_id={ds_user_id}")
    if csrftoken:
        cookie_parts.append(f"csrftoken={csrftoken}")

    return {
        "Cookie": "; ".join(cookie_parts),
        "X-IG-App-ID": "936619743392459",          # Instagram Web app ID (public)
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.instagram.com/",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
    }

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
        profile_url = f"https://www.instagram.com/{username}/"
        auth_headers = _get_instagram_headers()

        # ── Authenticated path: use Instagram Web API for JSON data ──────────
        if auth_headers:
            api_url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
            try:
                async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
                    resp = await client.get(api_url, headers=auth_headers)
                if resp.status_code == 200:
                    data = resp.json()
                    user = data.get("data", {}).get("user") or {}
                    if user:
                        followers = user.get("edge_followed_by", {}).get("count", 0)
                        bio = user.get("biography", "")
                        full_name = user.get("full_name", "")
                        is_private = user.get("is_private", False)
                        is_verified = user.get("is_verified", False)
                        post_count = user.get("edge_owner_to_timeline_media", {}).get("count", 0)
                        following = user.get("edge_follow", {}).get("count", 0)
                        profile_pic = user.get("profile_pic_url_hd", user.get("profile_pic_url", ""))
                        return {
                            "platform": "Instagram",
                            "url": profile_url,
                            "status": "found",
                            "bio": bio,
                            "full_name": full_name,
                            "follower_count": f"{followers:,} Followers",
                            "following_count": f"{following:,} Following",
                            "post_count": post_count,
                            "is_private": is_private,
                            "is_verified": is_verified,
                            "profile_pic": profile_pic,
                            "authenticated": True,
                        }
                elif resp.status_code == 404:
                    return {
                        "platform": "Instagram",
                        "url": profile_url,
                        "status": "not_found",
                        "bio": "",
                        "follower_count": None,
                        "authenticated": True,
                    }
                else:
                    logger.warning("[Instagram] Authenticated API returned %d for '%s'", resp.status_code, username)
                    # Fall through to unauthenticated
            except Exception as exc:
                logger.warning("[Instagram] Authenticated request failed for '%s': %s", username, exc)
                # Fall through to unauthenticated

        # ── Unauthenticated fallback: basic OG meta scrape ───────────────────
        html = await self.fetch_url(profile_url)
        if html is None:
            return {
                "platform": "Instagram",
                "url": profile_url,
                "status": "error",
                "bio": "",
                "follower_count": None,
                "authenticated": False,
            }

        bio = self._extract_meta_description(html)
        found = bool(bio) and "Sorry, this page isn't available" not in html
        if not found and html:
            found = await self._fallback_search(f"site:instagram.com/{username}")

        return {
            "platform": "Instagram",
            "url": profile_url,
            "status": "found" if found else "not_found",
            "bio": bio,
            "follower_count": bio.split(" Followers")[0].strip() if bio and "Followers" in bio else None,
            "authenticated": False,
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
        Fetch Instagram followers list using authenticated session cookie.
        Returns up to 50 follower usernames if session cookie is configured;
        otherwise returns an empty list (Instagram forbids unauthenticated access).
        """
        auth_headers = _get_instagram_headers()
        if not auth_headers:
            logger.info("[Instagram] No session cookie configured — skipping followers fetch for '%s'", username)
            return []

        # Step 1: Resolve user_id from username
        api_url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
                resp = await client.get(api_url, headers=auth_headers)
            if resp.status_code != 200:
                return []
            user_id = resp.json().get("data", {}).get("user", {}).get("id")
            if not user_id:
                return []

            # Step 2: Fetch followers page
            followers_url = f"https://www.instagram.com/api/v1/friendships/{user_id}/followers/?count=50"
            async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
                resp2 = await client.get(followers_url, headers=auth_headers)
            if resp2.status_code != 200:
                return []
            users = resp2.json().get("users", [])
            return [u["username"] for u in users if "username" in u]
        except Exception as exc:
            logger.warning("[Instagram] get_instagram_followers failed for '%s': %s", username, exc)
            return []


