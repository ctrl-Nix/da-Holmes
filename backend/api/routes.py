import asyncio
import socket
import logging
from io import BytesIO
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx
import dns.resolver
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from google_play_scraper import app as get_play_app
import re
from bs4 import BeautifulSoup
import dns.asyncresolver

from ..database import get_db
from ..models import InvestigationHistory, AnalystNotes, ApiVault
from ..report_gen import build_pdf_report

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Database Schemas
# ---------------------------------------------------------------------------
class NoteCreate(BaseModel):
    target: str
    text: str
    tags: str = ""

class NoteResponse(BaseModel):
    id: int
    target: str
    text: str
    tags: str
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    id: int
    target: str
    type: str
    date: datetime

    class Config:
        from_attributes = True

class VaultItem(BaseModel):
    service_name: str
    api_key: str

# ---------------------------------------------------------------------------
# Database API Endpoints
# ---------------------------------------------------------------------------

@router.get("/notes", response_model=List[NoteResponse])
def get_notes(target: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AnalystNotes)
    if target:
        query = query.filter(AnalystNotes.target == target)
    return query.order_by(AnalystNotes.created_at.desc()).all()

@router.post("/notes", response_model=NoteResponse)
def create_note(note: NoteCreate, db: Session = Depends(get_db)):
    db_note = AnalystNotes(
        target=note.target.strip(),
        text=note.text.strip(),
        tags=note.tags.strip()
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(AnalystNotes).filter(AnalystNotes.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"status": "success", "message": "Note deleted"}

@router.get("/history", response_model=List[HistoryResponse])
def get_history(db: Session = Depends(get_db)):
    return db.query(InvestigationHistory).order_by(InvestigationHistory.date.desc()).all()

@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(InvestigationHistory).delete()
    db.commit()
    return {"status": "success", "message": "History cleared"}

@router.post("/vault")
def update_vault(item: VaultItem, db: Session = Depends(get_db)):
    db_item = db.query(ApiVault).filter(ApiVault.service_name == item.service_name).first()
    if db_item:
        db_item.api_key = item.api_key.strip()
    else:
        db_item = ApiVault(service_name=item.service_name, api_key=item.api_key.strip())
        db.add(db_item)
    db.commit()
    return {"status": "success", "message": f"Vault updated for key '{item.service_name}'"}

@router.get("/vault/{service_name}")
def get_vault_key(service_name: str, db: Session = Depends(get_db)):
    db_item = db.query(ApiVault).filter(ApiVault.service_name == service_name).first()
    if not db_item:
        return {"service_name": service_name, "api_key": ""}
    return {"service_name": service_name, "api_key": db_item.api_key}

# ---------------------------------------------------------------------------
# Helper: Save to History
# ---------------------------------------------------------------------------
def log_investigation(target: str, type_str: str, results: Any, db: Session):
    try:
        import json
        serialized = json.dumps(results) if results else "{}"
        db_hist = InvestigationHistory(target=target, type=type_str, results=serialized)
        db.add(db_hist)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log investigation: {e}")

# ---------------------------------------------------------------------------
# Intelligence Endpoints
# ---------------------------------------------------------------------------

@router.get("/email")
async def email_forensics(domain: str, db: Session = Depends(get_db)):
    """DNS forensics checking for SPF & DMARC records via dnspython."""
    domain = domain.strip().lower()
    spf_record = None
    dmarc_record = None
    spf_status = "Not Found"
    dmarc_status = "Not Found"
    
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        for rdata in answers:
            txt_str = "".join([t.decode('utf-8') for t in rdata.strings])
            if "v=spf1" in txt_str:
                spf_record = txt_str
                spf_status = "Found"
                break
    except Exception:
        pass
        
    try:
        dmarc_answers = dns.resolver.resolve(f"_dmarc.{domain}", 'TXT')
        for rdata in dmarc_answers:
            txt_str = "".join([t.decode('utf-8') for t in rdata.strings])
            if "v=DMARC1" in txt_str:
                dmarc_record = txt_str
                dmarc_status = "Found"
                break
    except Exception:
        pass

    results = {
        "spf": {"status": spf_status, "record": spf_record},
        "dmarc": {"status": dmarc_status, "record": dmarc_record}
    }
    
    log_investigation(domain, "email", results, db)
    return results


@router.get("/techstack")
async def fingerprint_tech_stack(domain: str, db: Session = Depends(get_db)):
    """Fingerprints technographics stack with 25+ detection patterns."""
    clean_domain = domain.strip().replace("https://", "").replace("http://", "").split("/")[0]
    target_url = f"https://{clean_domain}"
    technologies = []
    error_msg = None

    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False, follow_redirects=True) as client:
            resp = await client.get(target_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})

        # --- Header-based detection ---
        headers = resp.headers
        server = headers.get("Server", "")
        if server:
            technologies.append({"type": "Server", "name": server, "confidence": 100})
        power = headers.get("X-Powered-By", "")
        if power:
            technologies.append({"type": "Runtime", "name": power, "confidence": 100})
        if "cf-ray" in headers or "cf-cache-status" in headers:
            technologies.append({"type": "CDN / Security", "name": "Cloudflare", "confidence": 99})
        if "x-vercel-id" in headers or "x-vercel-cache" in headers:
            technologies.append({"type": "Hosting", "name": "Vercel", "confidence": 99})
        if "x-amz-cf-id" in headers or "x-amz-request-id" in headers:
            technologies.append({"type": "Cloud", "name": "AWS", "confidence": 95})
        if "x-azure-ref" in headers or "x-ms-request-id" in headers:
            technologies.append({"type": "Cloud", "name": "Microsoft Azure", "confidence": 95})
        if "x-goog-request-id" in headers or "via" in headers and "google" in headers.get("via", "").lower():
            technologies.append({"type": "Cloud", "name": "Google Cloud", "confidence": 90})
        if headers.get("x-shopify-stage") or headers.get("x-shopify-request-id"):
            technologies.append({"type": "E-commerce", "name": "Shopify", "confidence": 100})
        if "x-wp-nonce" in headers or "link" in headers and "wp-json" in headers.get("link", ""):
            technologies.append({"type": "CMS", "name": "WordPress", "confidence": 100})
        if headers.get("x-drupal-cache") or headers.get("x-generator", "").lower().startswith("drupal"):
            technologies.append({"type": "CMS", "name": "Drupal", "confidence": 99})

        # --- Body-based detection ---
        body = resp.text
        body_lower = body.lower()

        cms_patterns = [
            ("wp-content", "CMS", "WordPress", 95),
            ("wp-json", "CMS", "WordPress", 90),
            ("joomla", "CMS", "Joomla", 90),
            ("drupal", "CMS", "Drupal", 85),
            ("ghost.io", "CMS", "Ghost", 90),
            ("squarespace", "CMS", "Squarespace", 95),
            ("wix.com", "CMS", "Wix", 95),
            ("webflow.io", "CMS", "Webflow", 95),
        ]
        framework_patterns = [
            ("__next", "Framework", "Next.js", 90),
            ("_nuxt/", "Framework", "Nuxt.js", 90),
            ("ng-version", "Framework", "Angular", 95),
            ("data-reactroot", "Framework", "React", 85),
            ("__vue__", "Framework", "Vue.js", 90),
            ("svelte", "Framework", "Svelte", 80),
            ("ember.js", "Framework", "Ember.js", 90),
            ("backbone.js", "Framework", "Backbone.js", 90),
        ]
        lib_patterns = [
            ("jquery", "Library", "jQuery", 80),
            ("bootstrap", "Library", "Bootstrap", 80),
            ("tailwindcss", "Library", "Tailwind CSS", 85),
            ("lodash", "Library", "Lodash", 75),
            ("axios", "Library", "Axios", 75),
            ("socket.io", "Library", "Socket.IO", 90),
        ]
        analytics_patterns = [
            ("google-analytics", "Analytics", "Google Analytics", 95),
            ("gtag(", "Analytics", "Google Tag Manager", 95),
            ("hotjar", "Analytics", "Hotjar", 95),
            ("segment.io", "Analytics", "Segment", 90),
            ("plausible", "Analytics", "Plausible", 90),
        ]
        ecomm_patterns = [
            ("cdn.shopify.com", "E-commerce", "Shopify", 99),
            ("woocommerce", "E-commerce", "WooCommerce", 95),
            ("magento", "E-commerce", "Magento", 90),
            ("prestashop", "E-commerce", "PrestaShop", 90),
        ]
        backend_patterns = [
            ("laravel", "Backend", "Laravel (PHP)", 85),
            ("django", "Backend", "Django (Python)", 85),
            ("rails", "Backend", "Ruby on Rails", 80),
            ("express", "Backend", "Express.js", 75),
            ("fastapi", "Backend", "FastAPI", 80),
        ]

        already_added = {t["name"] for t in technologies}
        for patterns in [cms_patterns, framework_patterns, lib_patterns, analytics_patterns, ecomm_patterns, backend_patterns]:
            for pattern, tech_type, name, confidence in patterns:
                if pattern in body_lower and name not in already_added:
                    technologies.append({"type": tech_type, "name": name, "confidence": confidence})
                    already_added.add(name)

    except Exception as e:
        logger.warning(f"Tech stack check error for {domain}: {e}")
        error_msg = str(e)

    log_investigation(domain, "techstack", technologies, db)
    return {
        "status": "success",
        "domain": domain,
        "technologies": technologies,
        "total": len(technologies),
        "error": error_msg
    }


# ---------------------------------------------------------------------------
# Security / Breach Endpoints
# ---------------------------------------------------------------------------

@router.get("/security/check")
async def security_check_email(email: str, db: Session = Depends(get_db)):
    """Checks email against HaveIBeenPwned breach database (free v2 API)."""
    email = email.strip().lower()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://haveibeenpwned.com/api/v2/breachedaccount/{email}",
                headers={"User-Agent": "Holmes-OSINT-Platform"}
            )
            if resp.status_code == 200:
                breaches = resp.json()
                details = [
                    {"name": b.get("Name", "Unknown"), "date": b.get("BreachDate", ""), "domain": b.get("Domain", "")}
                    for b in breaches
                ]
                result = {"email": email, "status": "compromised", "breach_count": len(details), "details": details}
            elif resp.status_code == 404:
                result = {"email": email, "status": "safe", "breach_count": 0, "details": []}
            else:
                result = {"email": email, "status": "unknown", "breach_count": 0, "details": [], "note": "Rate limited or service unavailable."}
    except Exception as e:
        result = {"email": email, "status": "error", "breach_count": 0, "details": [], "note": str(e)}

    log_investigation(email, "security_check", result, db)
    return result


@router.get("/security/headers")
async def security_headers_audit(domain: str, db: Session = Depends(get_db)):
    """Audits HTTP security headers and returns a letter grade scorecard."""
    clean_domain = domain.strip().replace("https://", "").replace("http://", "").split("/")[0]
    target_url = f"https://{clean_domain}"

    header_checks = [
        {"header": "strict-transport-security", "name": "HSTS", "weight": 20, "description": "Forces HTTPS connections."},
        {"header": "content-security-policy", "name": "Content-Security-Policy", "weight": 25, "description": "Prevents XSS and data injection attacks."},
        {"header": "x-frame-options", "name": "X-Frame-Options", "weight": 15, "description": "Prevents clickjacking attacks."},
        {"header": "x-content-type-options", "name": "X-Content-Type-Options", "weight": 10, "description": "Prevents MIME sniffing attacks."},
        {"header": "referrer-policy", "name": "Referrer-Policy", "weight": 10, "description": "Controls referrer information in requests."},
        {"header": "permissions-policy", "name": "Permissions-Policy", "weight": 10, "description": "Controls browser features like camera/mic."},
        {"header": "x-xss-protection", "name": "X-XSS-Protection", "weight": 5, "description": "Legacy XSS filter (still useful)."},
        {"header": "cache-control", "name": "Cache-Control", "weight": 5, "description": "Controls caching behavior."},
    ]

    results = []
    score = 0
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False, follow_redirects=True) as client:
            resp = await client.head(target_url, headers={"User-Agent": "Mozilla/5.0"})
            resp_headers_lower = {k.lower(): v for k, v in resp.headers.items()}

        for check in header_checks:
            present = check["header"] in resp_headers_lower
            value = resp_headers_lower.get(check["header"], None)
            if present:
                score += check["weight"]
            results.append({
                "name": check["name"],
                "present": present,
                "value": value,
                "weight": check["weight"],
                "description": check["description"]
            })

        # Grade
        if score >= 85:
            grade = "A"
        elif score >= 70:
            grade = "B"
        elif score >= 50:
            grade = "C"
        elif score >= 30:
            grade = "D"
        else:
            grade = "F"

        audit_result = {"domain": clean_domain, "score": score, "grade": grade, "headers": results, "status": "success"}
    except Exception as e:
        audit_result = {"domain": clean_domain, "score": 0, "grade": "F", "headers": [], "status": "error", "message": str(e)}

    log_investigation(domain, "security_headers", audit_result, db)
    return audit_result


@router.get("/subdomains")
async def query_subdomains(domain: str, db: Session = Depends(get_db)):
    """Discovers subdomains using free crt.sh query endpoint with fallback to HackerTarget."""
    domain = domain.strip().lower()
    subdomains = set()
    
    # 1. Try crt.sh
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                entries = resp.json()
                for entry in entries:
                    name_value = entry.get("name_value", "")
                    for name in name_value.split("\n"):
                        clean_name = name.strip().lower()
                        if clean_name.endswith(domain) and "*" not in clean_name:
                            subdomains.add(clean_name)
    except Exception as e:
        logger.warning(f"crt.sh error: {e}")

    # 2. Fallback to HackerTarget Host Search
    if not subdomains:
        try:
            url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and "error" not in resp.text:
                    lines = resp.text.strip().split("\n")
                    for line in lines:
                        if "," in line:
                            sub_domain = line.split(",")[0].strip().lower()
                            if sub_domain.endswith(domain):
                                subdomains.add(sub_domain)
        except Exception as e:
            logger.warning(f"HackerTarget subdomain fallback error: {e}")

    result_list = sorted(list(subdomains))
    log_investigation(domain, "subdomains", result_list, db)
    return {"domain": domain, "subdomains": result_list}


@router.get("/mobile")
def mobile_recon(package_id: str, db: Session = Depends(get_db)):
    """Fetches details on an Android bundle/package ID using play scraper."""
    try:
        app_data = get_play_app(package_id.strip())
        results = {
            "title": app_data.get("title"),
            "developer": app_data.get("developer"),
            "version": app_data.get("version"),
            "installs": app_data.get("installs"),
            "summary": app_data.get("summary"),
            "score": app_data.get("score"),
            "genre": app_data.get("genre"),
            "price": app_data.get("price"),
            "released": app_data.get("released"),
            "url": app_data.get("url")
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Package ID '{package_id}' not found in Play Store: {e}")
        
    log_investigation(package_id, "mobile", results, db)
    return results


@router.get("/corporate")
async def corporate_intel(company_name: str, db: Session = Depends(get_db)):
    """Searches corporate registration records using OpenCorporates free lookup."""
    url = f"https://api.opencorporates.com/v0.4/companies/search?q={company_name.strip()}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                companies = data.get("results", {}).get("companies", [])
                for item in companies[:10]: # Limit to top 10
                    comp = item.get("company", {})
                    results.append({
                        "name": comp.get("name"),
                        "company_number": comp.get("company_number"),
                        "jurisdiction_code": comp.get("jurisdiction_code"),
                        "incorporation_date": comp.get("incorporation_date"),
                        "registry_url": comp.get("registry_url"),
                        "current_status": comp.get("current_status"),
                    })
                log_investigation(company_name, "corporate", results, db)
                return {"query": company_name, "companies": results}
            else:
                raise HTTPException(status_code=resp.status_code, detail="OpenCorporates lookup failed")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Corporate scanner failed: {e}")


@router.get("/github")
async def github_intel(org_name: str, db: Session = Depends(get_db)):
    """Searches GitHub Organization internal public forks using local vault PAT."""
    # Retrieve key from vault
    vault_item = db.query(ApiVault).filter(ApiVault.service_name == "github_pat").first()
    pat = vault_item.api_key if vault_item else None
    
    headers = {}
    if pat:
        headers["Authorization"] = f"token {pat}"
        
    url = f"https://api.github.com/orgs/{org_name.strip()}/repos?type=all&per_page=100"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                repos = resp.json()
                results = []
                for repo in repos:
                    # Capture useful properties
                    results.append({
                        "name": repo.get("name"),
                        "fork": repo.get("fork"),
                        "stars": repo.get("stargazers_count"),
                        "forks_count": repo.get("forks_count"),
                        "url": repo.get("html_url"),
                        "description": repo.get("description"),
                        "updated_at": repo.get("updated_at")
                    })
                log_investigation(org_name, "github", results, db)
                return {"org": org_name, "repos": results}
            else:
                detail_msg = resp.json().get("message", "Failed to contact GitHub API")
                raise HTTPException(status_code=resp.status_code, detail=detail_msg)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub footprints scanner failed: {e}")


@router.get("/social")
async def social_footprinting(username: str, db: Session = Depends(get_db)):
    """Checks social usernames concurrently using async HTTP checks."""
    username = username.strip().replace("@", "")
    platforms = {
        "GitHub": f"https://github.com/{{username}}",
        "Twitter": f"https://twitter.com/{{username}}",
        "Reddit": f"https://www.reddit.com/user/{{username}}",
        "Instagram": f"https://www.instagram.com/{{username}}",
        "Pinterest": f"https://www.pinterest.com/{{username}}",
        "ProtonMail": f"https://proton.me/{{username}}",
        "Keybase": f"https://keybase.io/{{username}}",
        "Medium": f"https://medium.com/@{{username}}",
        "DockerHub": f"https://hub.docker.com/u/{{username}}",
        "Steam": f"https://steamcommunity.com/id/{{username}}",
    }
    
    results = []
    
    async def check_platform(name: str, url_tmpl: str, client: httpx.AsyncClient):
        url = url_tmpl.replace("{username}", username)
        try:
            resp = await client.get(url, follow_redirects=True)
            if resp.status_code == 200:
                # Content sanity check to eliminate false positives
                if name == "GitHub" and "404 Not Found" in resp.text:
                    status = "not_found"
                elif name == "Reddit" and "page not found" in resp.text:
                    status = "not_found"
                else:
                    status = "found"
            elif resp.status_code == 404:
                status = "not_found"
            else:
                status = "error"
            results.append({"platform": name, "url": url, "status": status})
        except Exception:
            results.append({"platform": name, "url": url, "status": "error"})

    async with httpx.AsyncClient(timeout=6.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
        tasks = [check_platform(name, tmpl, client) for name, tmpl in platforms.items()]
        await asyncio.gather(*tasks)
        
    log_investigation(username, "social", results, db)
    return {"username": username, "profiles": results}


@router.post("/exif")
async def extract_exif(file: UploadFile = File(...)):
    """In-memory image EXIF metadata scanner."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    try:
        img_bytes = await file.read()
        image = Image.open(BytesIO(img_bytes))
        exif_data = image._getexif()
        
        extracted = {
            "DateTimeOriginal": None,
            "Make": None,
            "Model": None,
            "GPSInfo": None
        }
        
        if exif_data:
            for tag, value in exif_data.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "DateTimeOriginal":
                    extracted["DateTimeOriginal"] = str(value)
                elif decoded == "Make":
                    extracted["Make"] = str(value)
                elif decoded == "Model":
                    extracted["Model"] = str(value)
                elif decoded == "GPSInfo":
                    gps_dict = {}
                    for g_tag in value:
                        g_decoded = GPSTAGS.get(g_tag, g_tag)
                        gps_dict[g_decoded] = value[g_tag]
                        
                    # Calculate lat/lon decimal coordinates
                    try:
                        lat = gps_dict.get("GPSLatitude")
                        lat_ref = gps_dict.get("GPSLatitudeRef")
                        lon = gps_dict.get("GPSLongitude")
                        lon_ref = gps_dict.get("GPSLongitudeRef")
                        
                        if lat and lon and lat_ref and lon_ref:
                            # Convert tuples to floats
                            lat_deg = float(lat[0]) + float(lat[1])/60.0 + float(lat[2])/3600.0
                            if lat_ref != "N":
                                lat_deg = -lat_deg
                                
                            lon_deg = float(lon[0]) + float(lon[1])/60.0 + float(lon[2])/3600.0
                            if lon_ref != "E":
                                lon_deg = -lon_deg
                                
                            extracted["GPSInfo"] = f"{lat_deg:.6f}, {lon_deg:.6f}"
                    except Exception as ge:
                        logger.warning(f"GPS parsing failed: {ge}")
                        extracted["GPSInfo"] = "Unreadable Coordinate"

        # Check if anything was parsed
        if not any(extracted.values()):
            return {"status": "error", "message": "No EXIF metadata tags found."}
            
        return {"status": "success", **extracted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EXIF parsing error: {e}")


@router.get("/threatintel")
async def threat_intel(domain: str, db: Session = Depends(get_db)):
    """Queries AlienVault OTX for malicious domain indicator signals."""
    domain = domain.strip().lower()
    
    # Optional API key lookup from vault
    vault_item = db.query(ApiVault).filter(ApiVault.service_name == "alienvault").first()
    api_key = vault_item.api_key if vault_item else ""
    
    headers = {}
    if api_key:
        headers["X-OTX-API-KEY"] = api_key
        
    url = f"https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                pulses = data.get("pulse_info", {}).get("count", 0)
                threat_score = min(pulses * 10, 100)
                results = {
                    "malicious_flags": pulses,
                    "threat_score": threat_score,
                    "details": f"Identified in {pulses} threat intelligence database reports."
                }
                log_investigation(domain, "threatintel", results, db)
                return results
            else:
                raise HTTPException(status_code=resp.status_code, detail="Threat intelligence lookups temporarily offline")
    except Exception as e:
        # Graceful representation if offline
        return {
            "malicious_flags": 0,
            "threat_score": 0,
            "details": "Threat intelligence lookups currently offline or timed out."
        }

# ---------------------------------------------------------------------------
# Dynamic PDF Generation & Export Route
# ---------------------------------------------------------------------------

@router.post("/download-report")
def download_pdf_report(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    POST /api/download-report
    Compiles all gathered telemetry JSON and associated SQLite Notes, and returns the PDF download stream.
    """
    target = payload.get("target")
    if not target:
        raise HTTPException(status_code=400, detail="Target name is required in report parameters.")
        
    # Query notes from local database for this specific target
    notes_list = db.query(AnalystNotes).filter(AnalystNotes.target == target).all()
    serialized_notes = [
        {"text": n.text, "tags": n.tags, "created_at": n.created_at} for n in notes_list
    ]
    
    try:
        pdf_bytes = build_pdf_report(target, payload, analyst_notes=serialized_notes)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=holmes_report_{target}.pdf"
            }
        )
    except Exception as e:
        logger.exception("PDF Compile Exception")
        raise HTTPException(status_code=500, detail=f"Failed to generate technical PDF brief: {e}")

# ---------------------------------------------------------------------------
# Advanced OSINT Feature Routes
# ---------------------------------------------------------------------------

@router.get("/scraper/live")
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
            
            # Extract Phones
            phones = list(set(re.findall(r'(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}', text)))
            
            # Extract Socials
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

@router.get("/subdomain/bruteforce")
async def bruteforce_subdomains(domain: str = Query(..., description="Domain to bruteforce")):
    domain = domain.strip().lower()
    
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
            
    tasks = [resolve_sub(sub) for sub in wordlist]
    await asyncio.gather(*tasks)
    
    return {
        "domain": domain,
        "found": len(results),
        "results": results
    }

@router.get("/github/scan")
async def github_secrets_scan(repo_url: str = Query(..., description="GitHub Repo URL")):
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

@router.get("/breach/crawler")
async def breach_crawler(target_email: str = Query(..., description="Email to look for in dumps"), 
                         dump_url: str = Query(..., description="URL of the raw text dump")):
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(dump_url)
            text = resp.text
            
            matches = []
            for line in text.splitlines():
                if target_email.lower() in line.lower():
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
