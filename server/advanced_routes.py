import re
import asyncio
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

import dns.asyncresolver

router = APIRouter()

# 1. Live Web Scraper & Entity Extractor (NLP fallback to Regex/BS4)
@router.get("/api/scraper/live", tags=["Advanced OSINT"])
async def live_scraper(url: str = Query(..., description="Target URL to scrape")):
    if not url.startswith("http"):
        url = "https://" + url
        
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=15.0) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            resp = await client.get(url, headers=headers)
            html = resp.text
            
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(separator=" ")
            
            # Extract Emails
            emails = list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)))
            
            # Extract Phones (Basic Regex for demonstration)
            phones = list(set(re.findall(r'(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}', text)))
            
            # Extract Social Media profiles
            social_patterns = {
                "twitter": r'(?:https?://)?(?:www\.)?twitter\.com/([a-zA-Z0-9_]+)',
                "linkedin": r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)',
                "github": r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9_-]+)',
                "facebook": r'(?:https?://)?(?:www\.)?facebook\.com/([a-zA-Z0-9_.]+)'
            }
            socials = {}
            for platform, pattern in social_patterns.items():
                matches = re.findall(pattern, text)
                if matches:
                    socials[platform] = list(set(matches))
                    
            return {
                "target": url,
                "status": "success",
                "emails": emails,
                "phones": phones,
                "socials": socials,
                "title": soup.title.string if soup.title else "No Title"
            }
            
    except Exception as e:
        return {"status": "error", "message": str(e), "target": url}

# 3. Custom Subdomain Bruteforcer
@router.get("/api/subdomain/bruteforce", tags=["Advanced OSINT"])
async def bruteforce_subdomains(domain: str = Query(..., description="Domain to bruteforce")):
    domain = domain.strip().lower()
    
    # Structural domain validation
    if not domain or len(domain) > 253:
        raise HTTPException(
            status_code=400,
            detail="Invalid domain name format."
        )
    DOMAIN_PATTERN = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,5}$"
    if not re.match(DOMAIN_PATTERN, domain):
        raise HTTPException(
            status_code=400,
            detail="Invalid domain name format."
        )
    
    # Common dictionary of 100 subdomains (shortened from 1000 for performance/demo)
    wordlist = [
        "dev", "staging", "vpn", "mail", "test", "admin", "portal", "api", "app", 
        "web", "www", "blog", "secure", "login", "gateway", "remote", "support",
        "cdn", "shop", "store", "db", "server", "aws", "dashboard", "intranet",
        "wiki", "jira", "confluence", "auth", "sso", "demo", "beta", "metrics"
    ]
    
    resolver = dns.asyncresolver.Resolver()
    resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']
    results = []
    
    async def resolve_sub(sub):
        sub_domain = f"{sub}.{domain}"
        # 1. Try standard async DNS query
        try:
            res = await resolver.resolve(sub_domain, 'A')
            if res:
                results.append({"subdomain": sub_domain, "ips": [r.to_text() for r in res if r.to_text()]})
                return
        except Exception:
            pass
            
        # 2. Fallback to HTTPS DNS-over-HTTPS (DoH) in case UDP port 53 is blocked
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"https://dns.google/resolve?name={sub_domain}&type=A")
                if resp.status_code == 200:
                    data = resp.json()
                    ips = [ans['data'] for ans in data.get('Answer', []) if ans.get('type') == 1]
                    if ips:
                        results.append({"subdomain": sub_domain, "ips": ips})
        except Exception:
            pass
            
    # Concurrently resolve
    tasks = [resolve_sub(sub) for sub in wordlist]
    await asyncio.gather(*tasks)
    
    return {
        "domain": domain,
        "found": len(results),
        "results": results
    }

# 4. GitHub Secrets & Code Scanner
@router.get("/api/github/scan", tags=["Advanced OSINT"])
async def github_secrets_scan(repo_url: str = Query(..., description="GitHub Repo URL (e.g., owner/repo)")):
    # Clean the repo string
    repo = repo_url.replace("https://github.com/", "").strip()
    if repo.endswith("/"):
        repo = repo[:-1]
        
    api_url = f"https://api.github.com/repos/{repo}/contents"
    secrets_found = []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(api_url)
            if resp.status_code == 200:
                contents = resp.json()
                for item in contents:
                    name = item.get("name", "")
                    
                    # Regex for secret files
                    if re.search(r'(\.env|secret|config\.json|credentials|id_rsa|passwd|shadow)', name.lower()):
                        secrets_found.append({
                            "file": name,
                            "path": item.get("path"),
                            "type": "Suspicious File Match"
                        })
                        
                return {
                    "repo": repo,
                    "status": "success",
                    "secrets_found": secrets_found,
                    "message": f"Scanned root of {repo}"
                }
            else:
                return {"status": "error", "message": f"GitHub API error: {resp.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 6. Automated OSINT "Breach Crawler"
@router.get("/api/breach/crawler", tags=["Advanced OSINT"])
async def breach_crawler(target_email: str = Query(..., description="Email to look for in dumps"), 
                         dump_url: str = Query(..., description="URL of the raw text dump")):
    target_email = target_email.strip().lower()
    dump_url = dump_url.strip()
    
    EMAIL_PATTERN = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$"
    if not target_email or len(target_email) > 254 or not re.match(EMAIL_PATTERN, target_email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format."
        )
        
    if not dump_url or len(dump_url) > 2048 or not dump_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="Invalid URL format."
        )
        
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(dump_url)
            text = resp.text
            
            # Simple line-by-line grep
            matches = []
            for line in text.splitlines():
                if target_email.lower() in line.lower():
                    # Obfuscate the rest of the line (usually password)
                    parts = line.split(':')
                    if len(parts) > 1 and target_email.lower() in parts[0].lower():
                        matches.append(f"{parts[0]}:********")
                    else:
                        matches.append(line[:len(target_email)] + "********")
            
            return {
                "target": target_email,
                "dump_url": dump_url,
                "status": "success",
                "matches": matches,
                "count": len(matches)
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}
