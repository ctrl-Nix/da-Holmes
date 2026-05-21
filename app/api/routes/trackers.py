from fastapi import APIRouter, HTTPException, Request
import httpx
import re

router = APIRouter()

@router.get("/")
async def extract_trackers(request: Request, domain: str):
    """
    Extracts Google Analytics and AdSense IDs from a website's HTML.
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
        
        # Regex patterns for Google Analytics and Adsense
        ga_pattern = r"(UA-\d+-\d+|G-[A-Z0-9]+)"
        adsense_pattern = r"(pub-\d+)"
        
        analytics_ids = list(set(re.findall(ga_pattern, html)))
        adsense_ids = list(set(re.findall(adsense_pattern, html)))
        
        # Add a warning in the message if no trackers found
        message = "Use these IDs on reverse-analytics engines to find hidden company websites."
        if not analytics_ids and not adsense_ids:
            message = "No trackers found in raw HTML. Note: Trackers loaded via JavaScript cannot be detected by this scan."
        
        return {
            "status": "success",
            "domain": domain,
            "analytics_ids": analytics_ids,
            "adsense_ids": adsense_ids,
            "message": message
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
