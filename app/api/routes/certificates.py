from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
import httpx
import re
import socket
import asyncio
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()

USER_AGENTS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"

@router.get("")
@router.get("/")
async def get_domain_certificates(request: Request = None, domain: str = Query(...)):
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain query cannot be empty")

    DOMAIN_PATTERN = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,5}$"
    if not domain or len(domain) > 253 or not re.match(DOMAIN_PATTERN, domain):
        raise HTTPException(
            status_code=400,
            detail="Invalid domain name format."
        )

    results_map = {}
    errors = []

    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=7.0)
            if resp.status_code == 200:
                data = resp.json()
                for entry in data:
                    name_raw = entry.get("name_value", "")
                    names = [n.strip() for n in re.split(r"[\s\n,]+", name_raw) if n.strip()]
                    
                    first_seen = entry.get("entry_timestamp") or entry.get("not_before") or "N/A"
                    issuer = entry.get("issuer_name") or "Unknown Issuer"
                    
                    for name in names:
                        name = name.lower()
                        if name.endswith(domain) and not name.startswith("*"):
                            if name not in results_map:
                                results_map[name] = {
                                    "subdomain": name,
                                    "first_seen": first_seen,
                                    "issuer": issuer
                                }
                
                if results_map:
                    return {
                        "status": "success",
                        "source": "crt.sh",
                        "domain": domain,
                        "subdomains": list(results_map.values())
                    }
    except Exception as e:
        logger.error(f"crt.sh query failed: {e}")
        errors.append(f"crt.sh error: {str(e)}")

    # Fallback to HackerTarget
    try:
        url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            if resp.status_code == 200 and "error" not in resp.text.lower():
                for line in resp.text.splitlines():
                    if "," in line:
                        sub = line.split(",")[0].strip().lower()
                        if sub.endswith(domain) and not sub.startswith("*"):
                            if sub not in results_map:
                                results_map[sub] = {
                                    "subdomain": sub,
                                    "first_seen": "N/A (HackerTarget)",
                                    "issuer": "N/A (HackerTarget)"
                                }
                if results_map:
                    return {
                        "status": "success",
                        "source": "HackerTarget (Fallback)",
                        "domain": domain,
                        "subdomains": list(results_map.values())
                    }
    except Exception as e:
        logger.error(f"HackerTarget query failed: {e}")
        errors.append(f"HackerTarget error: {str(e)}")

    return {
        "status": "success",
        "source": "none",
        "domain": domain,
        "subdomains": []
    }

TAKEOVER_FINGERPRINTS = [
    {"service": "GitHub Pages", "fingerprint": "There isn't a GitHub Pages site here", "keyword": "github"},
    {"service": "Amazon S3", "fingerprint": "NoSuchBucket", "keyword": "s3"},
    {"service": "Heroku", "fingerprint": "No Such Account", "keyword": "heroku"},
    {"service": "Fastly", "fingerprint": "Fastly error", "keyword": "fastly"},
    {"service": "Shopify", "fingerprint": "This shop is currently unavailable", "keyword": "shopify"},
    {"service": "Netlify", "fingerprint": "Project not found", "keyword": "netlify"}
]

@router.get("/takeover")
async def audit_subdomain_takeovers(request: Request, domain: str = Query(...)):
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain parameter is required")

    cert_res = await get_domain_certificates(request=request, domain=domain)
    if isinstance(cert_res, JSONResponse):
        return cert_res
        
    subdomains_list = cert_res.get("subdomains", []) if isinstance(cert_res, dict) else []
    results = []

    async def check_takeover(sub: str):
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(None, socket.getaddrinfo, sub, 80)
            resolves = True
        except Exception:
            resolves = False

        if not resolves:
            return {
                "subdomain": sub,
                "vulnerable": False,
                "service": "None",
                "fingerprint": "Does not resolve"
            }

        try:
            async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=4.0) as client:
                headers = {"User-Agent": USER_AGENTS}
                resp = await client.get(f"http://{sub}", headers=headers)
                body_text = resp.text
                
                for fp in TAKEOVER_FINGERPRINTS:
                    if fp["fingerprint"] in body_text:
                        return {
                            "subdomain": sub,
                            "vulnerable": True,
                            "service": fp["service"],
                            "fingerprint": fp["fingerprint"]
                        }
        except Exception as e:
            pass

        return {
            "subdomain": sub,
            "vulnerable": False,
            "service": "None",
            "fingerprint": "Resolves but secure"
        }

    if subdomains_list:
        tasks = [check_takeover(s["subdomain"]) for s in subdomains_list]
        results = await asyncio.gather(*tasks)

    return results
