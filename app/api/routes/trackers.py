from fastapi import APIRouter, HTTPException, Request
import httpx
import re

router = APIRouter()

async def lookup_tracker_domains(tracker_id: str) -> list:
    """
    Queries HackerTarget to find other domains sharing the same tracker ID.
    """
    try:
        url = f"https://api.hackertarget.com/analyticslookup/?q={tracker_id}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                text = resp.text.strip()
                if "error" in text.lower() or not text:
                    return []
                # Split by newlines and filter out empty lines or the query itself
                domains = [line.strip() for line in text.split("\n") if line.strip()]
                return domains
    except Exception:
        pass
    return []

@router.get("/")
async def extract_trackers(request: Request, domain: str):
    """
    Extracts Google Analytics and AdSense IDs from a website's HTML,
    and performs reverse lookup to identify other domains owned by the same admin.
    """
    if not domain.startswith("http"):
        domain = f"https://{domain}"

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
        }
        async with httpx.AsyncClient(verify=False, headers=headers) as client:
            response = await client.get(domain, timeout=15.0)
            
        html = response.text
        
        # Regex patterns for Google Analytics (UA and GA4) and Adsense
        ga_pattern = r"(UA-\d+-\d+|G-[A-Z0-9]+)"
        adsense_pattern = r"(pub-\d+)"
        
        analytics_ids = list(set(re.findall(ga_pattern, html)))
        adsense_ids = list(set(re.findall(adsense_pattern, html)))
        
        # Co-occurrence map: tracker_id -> list of domains
        co_occurrences = {}
        
        # Run reverse lookup on found trackers
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].lower()
        for tid in analytics_ids + adsense_ids:
            linked_domains = await lookup_tracker_domains(tid)
            # Remove the current scanning domain name to focus on *other* domains
            linked_domains = [d for d in linked_domains if d.lower() != clean_domain]
            co_occurrences[tid] = linked_domains
            
        message = "Use these IDs on reverse-analytics engines to find hidden company websites."
        if not analytics_ids and not adsense_ids:
            message = "No trackers found in raw HTML. Note: Trackers loaded via JavaScript cannot be detected by this scan."
        
        return {
            "status": "success",
            "domain": domain,
            "analytics_ids": analytics_ids,
            "adsense_ids": adsense_ids,
            "co_occurrences": co_occurrences,
            "message": message
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
