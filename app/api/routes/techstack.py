from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
import httpx
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter()

USER_AGENTS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"

@router.get("/detect")
async def detect_tech_stack(request: Request = None, domain: str = Query(...)):
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain query cannot be empty")

    DOMAIN_PATTERN = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,5}$"
    domain_to_check = domain.replace("https://", "").replace("http://", "").split("/")[0]
    if len(domain_to_check) > 253 or not re.match(DOMAIN_PATTERN, domain_to_check):
        raise HTTPException(status_code=400, detail="Invalid domain name format.")

    if not domain.startswith("http"):
        target_url = f"https://{domain}"
    else:
        target_url = domain

    technologies = []
    matched_headers = {}

    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=5.0) as client:
            headers = {"User-Agent": USER_AGENTS}
            resp = await client.get(target_url, headers=headers)
            
            for h in ["Server", "X-Powered-By", "X-Generator"]:
                val = resp.headers.get(h) or resp.headers.get(h.lower())
                if val:
                    matched_headers[h] = val

            html = resp.text
            
            if "wp-content" in html or any("wordpress" in str(v).lower() for v in matched_headers.values()):
                technologies.append({"type": "CMS", "name": "WordPress"})
                
            if "__next" in html or any("next.js" in str(v).lower() for v in matched_headers.values()):
                technologies.append({"type": "Framework", "name": "Next.js"})
                
            if "react.js" in html or "_next" in html or "react" in html.lower():
                if not any(t["name"] == "React" for t in technologies):
                    technologies.append({"type": "Library", "name": "React"})
                    
            if "cdn.shopify" in html:
                technologies.append({"type": "E-Commerce", "name": "Shopify"})
                
            if "gtag" in html or "google-analytics.com" in html:
                technologies.append({"type": "Analytics", "name": "Google Analytics"})

            server_header = matched_headers.get("Server")
            if server_header and not any(t["name"] == server_header for t in technologies):
                technologies.append({"type": "Server", "name": server_header})

    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.UnsupportedProtocol) as e:
        logger.error(f"Stack detection connection error for {target_url}: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not resolve host"
        )
    except Exception as e:
        logger.error(f"Stack detection failed for {target_url}: {e}")
        err_msg = str(e).lower()
        if any(msg in err_msg for msg in ["name resolution", "connecterror", "connection refused", "getaddrinfo", "not found", "dns"]):
            raise HTTPException(
                status_code=400,
                detail="Could not resolve host"
            )
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "reason": "API unreachable"}
        )

    return {
        "technologies": technologies,
        "headers": matched_headers
    }
