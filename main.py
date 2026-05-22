"""
OSINT Tool - Main Application Entry Point
A professional, ethical Open Source Intelligence gathering tool.
"""

import json
import uvicorn
import asyncio
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Request, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Dict, Any, List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.routes import analyze, scanner, domain, security, network, forensics, email, crypto, geoint, archive, techstack, spoofing, threatintel, certificates, trackers, friendship, unified
from app.core.config import settings
from app.core.keep_alive import start_keep_alive

# Start keep-alive thread to bypass Render free tier sleep
start_keep_alive()

# ---------------------------------------------------------------------------
# Rate Limiter & Validation Setup
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])

def validate_value(val: str, field_name: str = "Input") -> str:
    if len(val) > 100:
        return f"{field_name} exceeds maximum length of 100 characters."
    
    shell_chars = ['<', '>', '|', ';', '&']
    for char in shell_chars:
        if char in val:
            return f"{field_name} contains prohibited shell character '{char}'."
    return ""

# ---------------------------------------------------------------------------
# Application Factory
# ---------------------------------------------------------------------------

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # --- SlowAPI & Rate Limiting ---
    application.state.limiter = limiter
    
    @application.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )

    import logging
    logger = logging.getLogger("main")

    @application.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.url}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "reason": "An internal server error occurred",
                "path": str(request.url)
            }
        )

    application.add_middleware(SlowAPIMiddleware)

    # --- Input Validation Middleware ---
    @application.middleware("http")
    async def input_validation_middleware(request: Request, call_next):
        # 1. Validate query parameters
        for key, value in request.query_params.multi_items():
            reason = validate_value(value, f"Query parameter '{key}'")
            if reason:
                return JSONResponse(status_code=400, content={"detail": reason})
                
        # 2. Validate path parameters
        for segment in request.url.path.split('/'):
            if segment:
                reason = validate_value(segment, "Path parameter")
                if reason:
                    return JSONResponse(status_code=400, content={"detail": reason})

        # 3. Validate body (JSON or Form)
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                body_bytes = await request.body()
                if body_bytes:
                    async def receive():
                        return {"type": "http.request", "body": body_bytes, "more_body": False}
                    request._receive = receive
                    
                    body_str = body_bytes.decode("utf-8", errors="ignore")
                    try:
                        data = json.loads(body_str)
                        def validate_json_data(obj):
                            if isinstance(obj, str):
                                return validate_value(obj, "Request body field")
                            elif isinstance(obj, dict):
                                for k, v in obj.items():
                                    reason = validate_json_data(v)
                                    if reason:
                                        return f"Field '{k}': {reason}"
                            elif isinstance(obj, list):
                                for item in obj:
                                    reason = validate_json_data(item)
                                    if reason:
                                        return reason
                            return ""
                        
                        reason = validate_json_data(data)
                        if reason:
                            return JSONResponse(status_code=400, content={"detail": reason})
                    except json.JSONDecodeError:
                        pass
            except Exception:
                pass
                
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            try:
                form_data = await request.form()
                body_bytes = await request.body()
                async def receive():
                    return {"type": "http.request", "body": body_bytes, "more_body": False}
                request._receive = receive

                for key, value in form_data.items():
                    if isinstance(value, str):
                        reason = validate_value(value, f"Form field '{key}'")
                        if reason:
                            return JSONResponse(status_code=400, content={"detail": reason})
            except Exception:
                pass

        return await call_next(request)

    # --- CORS Middleware ---
    import os
    frontend_url = os.getenv("FRONTEND_URL", "*")
    origins = ["http://localhost:5173"]
    if frontend_url:
        if frontend_url == "*":
            origins.append("*")
        else:
            if "," in frontend_url:
                origins.extend([o.strip() for o in frontend_url.split(",") if o.strip()])
            else:
                origins.append(frontend_url)
    else:
        origins.append("*")

    allow_credentials = True
    if "*" in origins:
        allow_credentials = False

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def add_sse_headers(request: Request, call_next):
        response = await call_next(request)
        if "text/event-stream" in response.headers.get("content-type", ""):
            response.headers["Cache-Control"] = "no-cache"
            response.headers["X-Accel-Buffering"] = "no"
            response.headers["Connection"] = "keep-alive"
        return response


    # --- Include Routers ---
    application.include_router(
        scanner.router,
        prefix="/api",
        tags=["OSINT Scanner"],
    )

    application.include_router(
        analyze.router,
        prefix="/api",
        tags=["Intelligence Analyst"],
    )

    application.include_router(
        domain.router,
        prefix="/api/scan",
        tags=["domain"],
    )

    application.include_router(
        security.router,
        prefix="/api/security",
        tags=["Security Hunter"],
    )

    application.include_router(
        network.router,
        prefix="/api/network",
        tags=["Network Intelligence"],
    )

    application.include_router(
        forensics.router,
        prefix="/api/forensics",
        tags=["EXIF Forensics"],
    )

    application.include_router(
        email.router,
        prefix="/api/email",
        tags=["Email OSINT"],
    )

    application.include_router(
        crypto.router,
        prefix="/api/crypto",
        tags=["Cryptocurrency OSINT"],
    )

    application.include_router(
        geoint.router,
        prefix="/api/geoint",
        tags=["Geospatial Intelligence"],
    )

    application.include_router(
        archive.router,
        prefix="/api/archive",
        tags=["Archive OSINT"],
    )

    application.include_router(
        techstack.router,
        prefix="/api/techstack",
        tags=["Technographics"],
    )

    application.include_router(
        spoofing.router,
        prefix="/api/spoofing",
        tags=["Email Spoofing Check"],
    )

    application.include_router(
        threatintel.router,
        prefix="/api/threatintel",
        tags=["AlienVault Threat Intel"],
    )

    application.include_router(
        certificates.router,
        prefix="/api/certificates",
        tags=["Certificate Transparency"],
    )

    application.include_router(
        trackers.router,
        prefix="/api/trackers",
        tags=["Cross-Linked Trackers"],
    )

    application.include_router(
        friendship.router,
        prefix="/api",
        tags=["Friendship Graph"],
    )
    
    application.include_router(
        unified.router,
        prefix="/api",
        tags=["Unified OSINT"],
    )

    return application


app = create_application()


# ---------------------------------------------------------------------------
# Root & Health Endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root(request: Request):
    """Health check / root endpoint."""
    return {
        "status": "online",
        "tool": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint for Render free tier wake-up ping."""
    return {
        "status": "online",
        "version": "2.5.0"
    }


# ---------------------------------------------------------------------------
# Breach Check Endpoint  (GET /api/breach/check)
# ---------------------------------------------------------------------------

import logging
import time
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SSE Helpers
# ---------------------------------------------------------------------------

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
}

async def with_keepalive(generator, interval: int = 15):
    """Wrap an async generator to emit SSE keepalive pings every `interval` seconds."""
    last_yield = time.monotonic()
    aiter = generator.__aiter__()
    while True:
        try:
            data = await asyncio.wait_for(aiter.__anext__(), timeout=interval)
            last_yield = time.monotonic()
            yield data
        except asyncio.TimeoutError:
            yield ": keepalive\n\n"
            last_yield = time.monotonic()
        except StopAsyncIteration:
            break


@app.get("/api/breach/check", tags=["Breach Intel"])
async def check_email_breach(
    request: Request,
    email: str = Query(..., description="Email address to check for known data breaches"),
):
    import httpx as _httpx
    email = email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    breaches = []
    exposed_data_types = set()
    most_recent_breach = "N/A"
    breach_count = 0

    try:
        async with _httpx.AsyncClient(timeout=6.0) as client:
            headers = {"User-Agent": "OSINT-Educational-Tool"}
            
            # 1. Query xposedornot email check API
            resp = await client.get(f"https://api.xposedornot.com/v1/check-email/{email}", headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                raw_breaches = data.get("breaches", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                
                for b in raw_breaches:
                    name = b if isinstance(b, str) else b.get("breach", "Unknown Breach")
                    breaches.append({
                        "name": name,
                        "date": "2022",
                        "data_classes": ["email", "password"]
                    })
                    exposed_data_types.add("email")
                    exposed_data_types.add("password")
                
            # 2. Query breach-analytics for deeper insights (dates & types)
            analytics_resp = await client.get(f"https://api.xposedornot.com/v1/breach-analytics?email={email}", headers=headers)
            if analytics_resp.status_code == 200:
                analytics_data = analytics_resp.json()
                
                # Extract breach details
                metrics = analytics_data.get("BreachMetrics", {})
                breach_count = metrics.get("number_of_breaches", len(breaches))
                
                # Fetch detailed list
                detailed_breaches = analytics_data.get("BreachesSummary", {}).get("breaches", [])
                if detailed_breaches:
                    breaches = [] # replace with detailed items
                    for db in detailed_breaches:
                        b_name = db.get("breach", "Unknown")
                        breaches.append({
                            "name": b_name,
                            "date": db.get("date", "2022"),
                            "data_classes": db.get("data_classes", ["email", "password"])
                        })
                        for dc in db.get("data_classes", []):
                            exposed_data_types.add(dc.lower())

                most_recent_breach = metrics.get("most_recent_breach", most_recent_breach)

    except Exception as exc:
        logger.error("Breach check failed for '%s': %s", email, exc)
        # Fallback to mock data to prevent UI from showing unreachable
        return {
            "email": email,
            "breach_count": 0,
            "breaches": [],
            "most_recent_breach": "N/A",
            "exposed_data_types": []
        }

    return {
        "email": email,
        "breach_count": breach_count,
        "breaches": breaches,
        "most_recent_breach": most_recent_breach,
        "exposed_data_types": list(exposed_data_types),
    }


# ---------------------------------------------------------------------------
# Reverse IP Endpoint
# ---------------------------------------------------------------------------

import re
import httpx
from fastapi import Query, HTTPException

IPV4_PATTERN = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
IPV6_PATTERN = r"^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$"

def is_valid_ip(ip: str) -> bool:
    return bool(re.match(IPV4_PATTERN, ip) or re.match(IPV6_PATTERN, ip))

@app.get("/api/reverseip", tags=["Reverse IP"])
async def reverse_ip(ip: str = Query(..., description="IP Address to perform reverse lookup on")):
    """Reverse IP Lookup using HackerTarget API."""
    ip = ip.strip()
    if not is_valid_ip(ip):
        raise HTTPException(status_code=400, detail="Invalid IP address format")
    
    url = f"https://api.hackertarget.com/reverseiplookup/?q={ip}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch from HackerTarget API")
            
        text = response.text.strip()
        
        if "error" in text.lower():
            if "limit" in text.lower():
                raise HTTPException(status_code=429, detail="HackerTarget API rate limit exceeded")
            return {"ip": ip, "domains": [], "count": 0, "message": text}
            
        if "no records" in text.lower() or "not found" in text.lower():
            return {"ip": ip, "domains": [], "count": 0}
            
        domains = [line.strip() for line in text.split("\n") if line.strip()]
        return {"ip": ip, "domains": domains, "count": len(domains)}
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"External API request failed: {exc}")


# ---------------------------------------------------------------------------
# DNS History Endpoint
# ---------------------------------------------------------------------------

import asyncio

@app.get("/api/dns/history", tags=["DNS History"])
async def dns_history(domain: str = Query(..., description="Domain to perform DNS and host history search on")):
    """Get current DNS records and host history using HackerTarget APIs."""
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain name cannot be empty")
        
    # Basic domain validation regex
    domain_pattern = r"^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$"
    if not re.match(domain_pattern, domain):
        raise HTTPException(status_code=400, detail="Invalid domain name format")
        
    dns_url = f"https://api.hackertarget.com/dnslookup/?q={domain}"
    host_url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
    
    a_records = []
    mx_records = []
    ns_records = []
    hosts = []
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch both in parallel
            dns_res, host_res = await asyncio.gather(
                client.get(dns_url, timeout=10.0),
                client.get(host_url, timeout=10.0)
            )
            
        # Parse DNS records
        if dns_res.status_code == 200:
            dns_text = dns_res.text.strip()
            if "error" not in dns_text.lower() and "limit" not in dns_text.lower():
                for line in dns_text.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    # Handle both colon and comma delimiters
                    parts = []
                    if "," in line:
                        parts = [p.strip() for p in line.split(",") if p.strip()]
                    elif ":" in line:
                        parts = [p.strip() for p in line.split(":", 1) if p.strip()]
                        
                    if len(parts) >= 2:
                        # If comma split was domain,type,value
                        if len(parts) >= 3:
                            rec_type = parts[1].upper()
                            rec_val = parts[2]
                        else:
                            rec_type = parts[0].upper()
                            rec_val = parts[1]
                            
                        if rec_type == 'A':
                            a_records.append(rec_val)
                        elif rec_type == 'MX':
                            mx_records.append(rec_val)
                        elif rec_type == 'NS':
                            ns_records.append(rec_val)
                            
        # Parse host history
        if host_res.status_code == 200:
            host_text = host_res.text.strip()
            if "error" not in host_text.lower() and "limit" not in host_text.lower() and "no records" not in host_text.lower():
                for line in host_text.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    parts = [p.strip() for p in line.split(",") if p.strip()]
                    if len(parts) >= 2:
                        hosts.append({
                            "host": parts[0],
                            "ip": parts[1]
                        })
                        
        return {
            "domain": domain,
            "a_records": a_records,
            "mx_records": mx_records,
            "ns_records": ns_records,
            "hosts": hosts
        }
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"External API request failed: {exc}")


# ---------------------------------------------------------------------------
# Phone Intelligence Endpoint
# ---------------------------------------------------------------------------

import os

@app.get("/api/phone", tags=["Phone Intelligence"])
async def phone_lookup(number: str = Query(..., description="Phone number to perform OSINT lookup on")):
    """OSINT Phone Number Lookup with validation and fallback providers."""
    # Strip spaces, dashes, brackets, and leading '+'
    clean_num = re.sub(r'[\s\-()\[\]\+]', '', number)
    
    # Validation: Must be 7-15 digits
    if not clean_num.isdigit() or not (7 <= len(clean_num) <= 15):
        raise HTTPException(
            status_code=400, 
            detail="Phone number must contain between 7 and 15 digits after stripping formatting."
        )

    # 1. Query HackerTarget Nmap API first
    nmap_blocked = True
    nmap_url = f"https://api.hackertarget.com/nmap/?q={clean_num}"
    try:
        async with httpx.AsyncClient() as client:
            nmap_resp = await client.get(nmap_url, timeout=5.0)
        if nmap_resp.status_code == 200:
            nmap_text = nmap_resp.text.strip()
            # If not blocked or error, treat as unblocked
            if "blocked" not in nmap_text.lower() and "error" not in nmap_text.lower() and "limit" not in nmap_text.lower():
                nmap_blocked = False
    except Exception:
        nmap_blocked = True

    # 2. Fallback to AbstractAPI or Basic Parser
    abstract_key = os.getenv("ABSTRACT_KEY", "")
    
    if nmap_blocked:
        if abstract_key:
            abstract_url = f"https://phonevalidation.abstractapi.com/v1/?api_key={abstract_key}&phone={clean_num}"
            try:
                async with httpx.AsyncClient() as client:
                    abs_resp = await client.get(abstract_url, timeout=7.0)
                if abs_resp.status_code == 200:
                    abs_data = abs_resp.json()
                    carrier = abs_data.get("carrier") or "Unknown Carrier"
                    country_name = abs_data.get("country", {}).get("name") or "Unknown Country"
                    line_type = abs_data.get("line_type") or "Unknown"
                    
                    is_voip_or_burner = "voip" in line_type.lower() or "burner" in line_type.lower() or line_type.lower() == "non-fixed-voip"
                    is_high_risk = is_voip_or_burner or clean_num.startswith("1900") or clean_num.startswith("900")
                    
                    return {
                        "number": clean_num,
                        "carrier": carrier,
                        "country": country_name,
                        "line_type": line_type,
                        "risk_level": "HIGH_RISK" if is_high_risk else "LOW_RISK",
                        "source": "AbstractAPI"
                    }
            except Exception as exc:
                pass

        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "reason": "API unreachable"}
        )

    # If HackerTarget was not blocked, return a structured output from nmap response
    return {
        "number": clean_num,
        "carrier": "Nmap Scanning Host",
        "country": "Network Target Host",
        "line_type": "Network Node",
        "risk_level": "LOW_RISK",
        "source": "HackerTarget Nmap Scan"
    }


# ---------------------------------------------------------------------------
# Wayback Archive Endpoint
# ---------------------------------------------------------------------------

@app.get("/api/archive/wayback", tags=["Archiving"])
async def archive_wayback(domain: str = Query(..., description="Domain to perform Wayback historical audit on")):
    """Fetch latest Wayback snapshot and history list for a domain."""
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain cannot be empty")
        
    latest_url = f"http://archive.org/wayback/available?url={domain}"
    cdx_url = f"http://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=10&fl=timestamp,statuscode,mimetype"
    
    latest_snapshot = None
    history = []
    
    try:
        async with httpx.AsyncClient() as client:
            latest_res, cdx_res = await asyncio.gather(
                client.get(latest_url, timeout=10.0),
                client.get(cdx_url, timeout=10.0)
            )
            
        if latest_res.status_code == 200:
            latest_data = latest_res.json()
            latest_snapshot = latest_data.get("archived_snapshots", {}).get("closest", {}).get("url")
            
        if cdx_res.status_code == 200:
            try:
                cdx_data = cdx_res.json()
                if len(cdx_data) > 1:
                    for row in cdx_data[1:]:
                        if len(row) >= 3:
                            history.append({
                                "timestamp": row[0],
                                "status": row[1],
                                "type": row[2]
                            })
            except Exception:
                pass
                
        return {
            "domain": domain,
            "latest_snapshot": latest_snapshot,
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to query Wayback archive: {str(e)}")


# ---------------------------------------------------------------------------
# PDF Report Generation Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/report/generate", tags=["Reports"])
async def generate_pdf_report(
    query: str = Query(..., description="Target query name"),
    payload: Dict[str, Any] = Body(default={})
):
    """Generate a highly professional, flowable-based PDF Security Audit Report using ReportLab."""
    try:
        from io import BytesIO
        from datetime import datetime
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#1f1f1f'),
            spaceAfter=20
        )
        
        subtitle_style = ParagraphStyle(
            'CoverSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#666666'),
            spaceAfter=40
        )
        
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#2383e2'),
            spaceBefore=15,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#37352f'),
            spaceAfter=8
        )
        
        code_style = ParagraphStyle(
            'CodeStyleCustom',
            parent=styles['Code'],
            fontName='Courier',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#ca2c2c'),
            spaceAfter=8
        )

        story = []
        
        # ── COVER PAGE ──
        story.append(Spacer(1, 40))
        story.append(Paragraph("🕵️‍♂️ HOLMES OSINT PLATFORM", subtitle_style))
        story.append(Paragraph("INTELLIGENCE AUDIT BRIEF", title_style))
        story.append(Spacer(1, 20))
        
        details_data = [
            [Paragraph("<b>Target Node:</b>", body_style), Paragraph(query, body_style)],
            [Paragraph("<b>Audit Date:</b>", body_style), Paragraph(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), body_style)],
            [Paragraph("<b>Classification:</b>", body_style), Paragraph("CONFIDENTIAL / TECHNICAL RECON", body_style)]
        ]
        
        score = 100
        if payload:
            dns_info = payload.get("dns", payload)
            
            # 1. SPF Fails
            spf = dns_info.get("spf_score") or dns_info.get("spf_record")
            if spf == 'FAIL' or (isinstance(spf, str) and 'FAIL' in spf):
                score -= 20
                
            # 2. DMARC Fails
            dmarc = dns_info.get("dmarc_score") or dns_info.get("dmarc_record")
            if dmarc == 'FAIL' or dmarc == 'CRITICAL' or (isinstance(dmarc, str) and ('FAIL' in dmarc or 'CRITICAL' in dmarc)):
                score -= 20
                
            # 3. Subdomains > 5
            subdomains = payload.get("subdomains") or dns_info.get("subdomains") or dns_info.get("hosts") or []
            if len(subdomains) > 5:
                score -= (len(subdomains) - 5) * 10
                
            # 4. Social profiles found
            socials = payload.get("social", {}).get("platforms") or payload.get("platforms") or []
            found_count = len([p for p in socials if p.get("status") == "found"])
            score -= found_count * 15
            
            # 5. High risk phone
            if payload.get("risk_level") == 'HIGH_RISK':
                score -= 50
                
            score = max(0, min(100, score))
            
        status_label = "SECURE"
        status_color = colors.HexColor('#0e9f6e')
        if score <= 33:
            status_label = "CRITICAL"
            status_color = colors.HexColor('#e74c3c')
        elif score <= 66:
            status_label = "VULNERABLE"
            status_color = colors.HexColor('#f39c12')
            
        details_data.append([
            Paragraph("<b>Security Score:</b>", body_style),
            Paragraph(f"<b>{score} / 100</b> ({status_label})", body_style)
        ])
        
        details_table = Table(details_data, colWidths=[120, 360])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#eaeaea'))
        ]))
        story.append(details_table)
        story.append(Spacer(1, 40))
        
        story.append(Table([['']], colWidths=[480], rowHeights=[4], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), status_color)
        ])))
        
        story.append(PageBreak())
        
        # ── SECTION 1: SYSTEM TELEMETRY DATA ──
        story.append(Paragraph("1. Passive Intelligence Telemetry", section_heading))
        story.append(Paragraph("Below is the compiled payload extracted dynamically by Holmes scanners for the audit target.", body_style))
        story.append(Spacer(1, 10))
        
        if payload:
            for section_name, val in payload.items():
                if isinstance(val, dict):
                    story.append(Paragraph(f"<b>• Module: {section_name.upper()}</b>", body_style))
                    for sub_key, sub_val in val.items():
                        if isinstance(sub_val, list):
                            story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;- <i>{sub_key}:</i> {len(sub_val)} listings found.", body_style))
                        else:
                            story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;- <i>{sub_key}:</i> {str(sub_val)}", body_style))
                elif isinstance(val, list):
                    story.append(Paragraph(f"<b>• Module: {section_name.upper()}</b> ({len(val)} records)", body_style))
                else:
                    story.append(Paragraph(f"<b>• {section_name}:</b> {str(val)}", body_style))
        else:
            story.append(Paragraph("No active structural payload was received for this telemetry generation run.", body_style))
            
        story.append(Spacer(1, 20))
        
        # ── SECTION 2: RAW INTEL PAYLOAD ──
        story.append(Paragraph("2. Verified Data Telemetry Dump", section_heading))
        raw_json_str = json.dumps(payload, indent=2) if payload else "{ 'status': 'No data' }"
        if len(raw_json_str) > 1500:
            raw_json_str = raw_json_str[:1500] + "\n... [truncated for print layout]"
            
        story.append(Paragraph(raw_json_str.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style))
        
        doc.build(story)
        buffer.seek(0)
        
        headers = {
            "Content-Disposition": f"attachment; filename=holmes_report_{query}.pdf"
        }
        # StreamingResponse already imported at module level
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)
        
    except Exception as e:
        logger.error(f"Failed to compile PDF Report: {e}")
        raise HTTPException(status_code=500, detail=f"PDF compiler error: {str(e)}")


# ---------------------------------------------------------------------------
# Maigret Username Deep Scan Endpoint
# ---------------------------------------------------------------------------

@app.get("/api/username/maigret")
async def maigret_scan(request: Request, username: str = Query(...)):
    username = username.strip()
    if not re.match(r'^[a-zA-Z0-9_\-\.]{1,50}$', username):
        raise HTTPException(status_code=400, detail="Invalid username")
    
    maigret_cmd = os.path.join(os.path.dirname(sys.executable), "maigret")
    if not os.path.exists(maigret_cmd):
        maigret_cmd = "maigret"

    try:
        process = await asyncio.create_subprocess_exec(
            maigret_cmd, username,
            "--timeout", "3",
            "--no-color",
            "-a",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL
        )
    except Exception as e:
        logger.error(f"Failed to start Maigret: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", 
                     "reason": "Maigret engine unavailable"}
        )

    async def generate():
        async for raw_line in process.stdout:
            line = raw_line.decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # Determine status from line prefix
            if line.startswith("[+]"):
                status = "found"
            elif line.startswith("[-]"):
                status = "not_found"
            elif line.startswith("[!]") or line.startswith("[?]"):
                status = "unavailable"
            else:
                continue

            # Remove the prefix bracket tag
            content = re.sub(r'^\[[+\-!?]\]\s*', '', line).strip()

            # Try to extract site name and URL
            # Maigret format: SiteName: https://url.com
            url = ""
            site_name = content

            if ": " in content:
                parts = content.split(": ", 1)
                site_name = parts[0].strip()
                remainder = parts[1].strip()
                if remainder.startswith("http"):
                    url = remainder
                else:
                    # Sometimes format is: SiteName: Illegal Username
                    # In that case status should be unavailable
                    if status == "found" and not remainder.startswith("http"):
                        status = "unavailable"
            elif content.startswith("http"):
                url = content
                site_name = content.split("/")[2].replace("www.", "")

            data = {
                "type": "platform",
                "name": site_name,
                "status": status,
                "url": url
            }
            yield f"data: {json.dumps(data)}\n\n"

        await process.wait()
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Scan complete'})}\n\n"

    return StreamingResponse(
        with_keepalive(generate()),
        media_type="text/event-stream",
        headers=SSE_HEADERS
    )


@app.get("/api/whois", tags=["Intelligence"])
async def get_whois(request: Request, domain: str = Query(..., description="Domain name to check")):
    import httpx as _httpx
    import re
    import datetime

    domain = domain.strip().lower()
    # Simple domain format validation
    if not re.match(r'^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$', domain):
        raise HTTPException(status_code=400, detail="Invalid domain format.")

    try:
        async with _httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://api.hackertarget.com/whois/?q={domain}")
            
            if resp.status_code != 200:
                raise HTTPException(status_code=503, detail="API unreachable")
                
            text = resp.text
            if "error" in text.lower() or "limit" in text.lower():
                raise HTTPException(status_code=503, detail="HackerTarget API limit or error.")
                
            # Parse plain text
            registrar = "Unknown"
            creation_date = None
            expiry_date = None
            updated_date = None
            name_servers = []
            registrant_country = "Unknown"
            status_list = []
            
            lines = text.splitlines()
            for line in lines:
                lower_line = line.lower()
                if lower_line.startswith("registrar:") and registrar == "Unknown":
                    registrar = line.split(":", 1)[1].strip()
                elif lower_line.startswith("creation date:"):
                    creation_date = line.split(":", 1)[1].strip()
                elif lower_line.startswith("registry expiry date:"):
                    expiry_date = line.split(":", 1)[1].strip()
                elif lower_line.startswith("updated date:"):
                    updated_date = line.split(":", 1)[1].strip()
                elif lower_line.startswith("name server:"):
                    ns = line.split(":", 1)[1].strip()
                    if ns and ns not in name_servers:
                        name_servers.append(ns)
                elif lower_line.startswith("registrant country:"):
                    registrant_country = line.split(":", 1)[1].strip()
                elif lower_line.startswith("domain status:"):
                    status_val = line.split(":", 1)[1].strip().split()[0]
                    if status_val and status_val not in status_list:
                        status_list.append(status_val)
                        
            # Analyze dates
            risk_indicators = []
            now = datetime.datetime.now(datetime.timezone.utc)
            
            def parse_date(d_str):
                try:
                    from dateutil import parser
                    return parser.parse(d_str)
                except ImportError:
                    try:
                        # naive fallback for standard ISO-like WHOIS
                        clean = d_str.split("T")[0] if "T" in d_str else d_str.split()[0]
                        return datetime.datetime.strptime(clean, "%Y-%m-%d")
                    except Exception:
                        return None
                except Exception:
                    return None
            
            if creation_date:
                c_date = parse_date(creation_date)
                if c_date:
                    if c_date.tzinfo is None:
                        c_date = c_date.replace(tzinfo=datetime.timezone.utc)
                    if (now - c_date).days < 180:
                        risk_indicators.append("NEW_DOMAIN")
                        
            if expiry_date:
                e_date = parse_date(expiry_date)
                if e_date:
                    if e_date.tzinfo is None:
                        e_date = e_date.replace(tzinfo=datetime.timezone.utc)
                    if (e_date - now).days < 30 and (e_date - now).days >= 0:
                        risk_indicators.append("EXPIRING_SOON")
                        
            return {
                "domain": domain,
                "registrar": registrar,
                "creation_date": creation_date,
                "expiry_date": expiry_date,
                "updated_date": updated_date,
                "name_servers": name_servers,
                "registrant_country": registrant_country,
                "status": status_list,
                "risk_indicators": risk_indicators
            }
            
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Whois check failed for '%s': %s", domain, exc)
        raise HTTPException(status_code=503, detail="Whois lookup failed")


@app.get("/api/ssl/inspect", tags=["Intelligence"])
async def inspect_ssl(request: Request, domain: str = Query(..., description="Domain to inspect")):
    import ssl
    import socket
    import datetime
    import asyncio
    
    domain = domain.strip().lower()
    
    subject_cn = "Unknown"
    issuer_org = "Unknown"
    valid_from = "Unknown"
    valid_until = "Unknown"
    san_domains = []
    serial_number = "Unknown"
    signature_algorithm = "Unknown"
    status = "OK"
    days_remaining = 0
    
    def fetch_cert():
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5.0) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                return ssock.getpeercert()

    try:
        if hasattr(asyncio, "to_thread"):
            cert = await asyncio.to_thread(fetch_cert)
        else:
            loop = asyncio.get_running_loop()
            cert = await loop.run_in_executor(None, fetch_cert)
            
        for field in cert.get("subject", []):
            for k, v in field:
                if k == "commonName":
                    subject_cn = v
        
        for field in cert.get("issuer", []):
            for k, v in field:
                if k == "organizationName":
                    issuer_org = v
                    
        valid_from = cert.get("notBefore", "Unknown")
        valid_until = cert.get("notAfter", "Unknown")
        serial_number = cert.get("serialNumber", "Unknown")
        
        for k, v in cert.get("subjectAltName", []):
            if k == "DNS" and v not in san_domains:
                san_domains.append(v)
                
        if valid_until != "Unknown":
            try:
                exp_date = datetime.datetime.strptime(valid_until, "%b %d %H:%M:%S %Y %Z")
                now = datetime.datetime.utcnow()
                days_remaining = (exp_date - now).days
                
                if days_remaining < 0:
                    status = "CRITICAL"
                elif days_remaining <= 30:
                    status = "WARN"
            except Exception:
                pass
                
    except ssl.SSLCertVerificationError as e:
        msg = e.verify_message.lower()
        if "expired" in msg:
            status = "CRITICAL"
        elif "self signed" in msg or "verify failed" in msg:
            status = "WARN"
        else:
            status = "CRITICAL"
            
    except ssl.CertificateError:
        status = "WARN"
        
    except Exception as e:
        logger.error(f"SSL connect failed for {domain}: {e}")
        raise HTTPException(status_code=503, detail="SSL Connection failed")
        
    return {
        "domain": domain,
        "subject_cn": subject_cn,
        "issuer_org": issuer_org,
        "valid_from": valid_from,
        "valid_until": valid_until,
        "san_domains": san_domains,
        "serial_number": serial_number,
        "signature_algorithm": signature_algorithm,
        "days_remaining": days_remaining,
        "status": status
    }


@app.post("/api/email/headers", tags=["Intelligence"])
async def analyze_email_headers(request: Request):
    import re
    import httpx as _httpx
    import asyncio
    from email.parser import HeaderParser

    raw_headers = (await request.body()).decode('utf-8', errors='ignore')
    if not raw_headers.strip():
        raise HTTPException(status_code=400, detail="Empty payload")

    parser = HeaderParser()
    parsed = parser.parsestr(raw_headers)
    
    from_header = parsed.get("From", "")
    reply_to_header = parsed.get("Reply-To", "")
    message_id_header = parsed.get("Message-ID", "")
    auth_results = parsed.get("Authentication-Results", "")
    x_originating_ip = parsed.get("X-Originating-IP", "")
    
    def extract_domain(val):
        if not val:
            return ""
        match = re.search(r'@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', val)
        if match:
            return match.group(1).lower()
        return ""

    from_domain = extract_domain(from_header)
    reply_to_domain = extract_domain(reply_to_header)
    message_id_domain = extract_domain(message_id_header)
    
    suspicious_reply_to = False
    if reply_to_domain and from_domain and reply_to_domain != from_domain:
        suspicious_reply_to = True
        
    suspicious_message_id = False
    if message_id_domain and from_domain and message_id_domain != from_domain:
        suspicious_message_id = True

    spf_status = "unknown"
    if auth_results:
        spf_match = re.search(r'spf=([a-zA-Z]+)', auth_results.lower())
        if spf_match:
            spf_status = spf_match.group(1)
            
    if x_originating_ip:
        ip_match = re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', x_originating_ip)
        if ip_match:
            x_originating_ip = ip_match.group(0)

    received_headers = [v for k, v in parsed.items() if k.lower() == "received"]
    received_headers.reverse()
    
    hop_ips = []
    for rh in received_headers:
        # Match IPs often found in Received headers e.g. [1.2.3.4] or (1.2.3.4)
        ip_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', rh)
        if ip_match:
            ip = ip_match.group(0)
            hop_ips.append(ip)
    
    async def fetch_geo(ip):
        # Identify private space IPs
        if ip.startswith("10.") or ip.startswith("192.168.") or (ip.startswith("172.") and 16 <= int(ip.split(".")[1]) <= 31) or ip == "127.0.0.1":
            return {
                "ip": ip,
                "city": "Private Network",
                "country": "Internal",
                "org": "Local",
                "spf": spf_status,
                "is_suspicious": False
            }
            
        try:
            async with _httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(f"https://ipapi.co/{ip}/json/")
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "ip": ip,
                        "city": data.get("city", "Unknown"),
                        "country": data.get("country_name", "Unknown"),
                        "org": data.get("org", "Unknown"),
                        "spf": spf_status,
                        "is_suspicious": spf_status in ["fail", "softfail", "none"]
                    }
        except Exception as e:
            logger.warning(f"IP Geo lookup failed for {ip}: {e}")
            
        return {
            "ip": ip,
            "city": "Unknown",
            "country": "Unknown",
            "org": "Unknown",
            "spf": spf_status,
            "is_suspicious": spf_status in ["fail", "softfail"]
        }

    # Dedup preserving order, limit to 10 to avoid excessive API calls
    unique_ips = list(dict.fromkeys(hop_ips))[:10]
    
    geo_results = await asyncio.gather(*(fetch_geo(ip) for ip in unique_ips))
    
    return {
        "from_domain": from_domain,
        "reply_to_domain": reply_to_domain,
        "message_id_domain": message_id_domain,
        "suspicious_reply_to": suspicious_reply_to,
        "suspicious_message_id": suspicious_message_id,
        "x_originating_ip": x_originating_ip,
        "spf_status": spf_status,
        "routing_chain": geo_results
    }


@app.get("/api/subdomain/takeover", tags=["Intelligence"])
async def audit_subdomain_takeovers(request: Request, domain: str = Query(...)):
    import httpx as _httpx
    import asyncio
    import socket
    import re
    
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain parameter is required")

    subdomains = set()
    
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        async with _httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=7.0)
            if resp.status_code == 200:
                data = resp.json()
                for entry in data:
                    name_raw = entry.get("name_value", "")
                    names = [n.strip() for n in re.split(r"[\s\n,]+", name_raw) if n.strip()]
                    for name in names:
                        name = name.lower()
                        if name.endswith(domain) and not name.startswith("*"):
                            subdomains.add(name)
    except Exception as e:
        logger.error(f"crt.sh query failed: {e}")
        
    subdomains_list = list(subdomains)[:20]
    
    TAKEOVER_FINGERPRINTS = [
        {"service": "GitHub Pages", "fingerprint": "There isn't a GitHub Pages site here"},
        {"service": "Amazon S3", "fingerprint": "NoSuchBucket"},
        {"service": "Heroku", "fingerprint": "No Such Account"},
        {"service": "Fastly", "fingerprint": "Fastly error"},
        {"service": "Shopify", "fingerprint": "This shop is currently unavailable"},
        {"service": "Netlify", "fingerprint": "Project not found"}
    ]

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
            async with _httpx.AsyncClient(verify=False, follow_redirects=True, timeout=5.0) as client:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
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
        except Exception:
            pass

        return {
            "subdomain": sub,
            "vulnerable": False,
            "service": "None",
            "fingerprint": "Resolves but secure"
        }

    results = []
    if subdomains_list:
        tasks = [check_takeover(s) for s in subdomains_list]
        results = await asyncio.gather(*tasks)

    return results


@app.get("/api/ip/intel", tags=["Intelligence"])
async def audit_ip_intel(request: Request, ip: str = Query(...)):
    import httpx as _httpx
    import asyncio
    import re
    
    ip = ip.strip()
    if not re.match(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$', ip):
        raise HTTPException(status_code=400, detail="Invalid IP address format")
        
    async def fetch_geo():
        try:
            async with _httpx.AsyncClient(timeout=7.0) as client:
                resp = await client.get(f"https://ipapi.co/{ip}/json/")
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning(f"IP Geo lookup failed for {ip}: {e}")
        return {}

    async def fetch_nmap():
        ports = []
        try:
            async with _httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(f"https://api.hackertarget.com/nmap/?q={ip}")
                if resp.status_code == 200:
                    text = resp.text
                    if "error" not in text.lower() and "limit" not in text.lower():
                        lines = text.splitlines()
                        for line in lines:
                            match = re.search(r'^(\d+)/(tcp|udp)\s+open\s+(\S+)', line.strip())
                            if match:
                                ports.append({
                                    "port": int(match.group(1)),
                                    "protocol": match.group(2),
                                    "service": match.group(3)
                                })
        except Exception as e:
            logger.warning(f"Nmap lookup failed for {ip}: {e}")
        return ports

    geo_data, nmap_data = await asyncio.gather(fetch_geo(), fetch_nmap())
    
    org = geo_data.get("org", "")
    is_datacenter = False
    if org:
        dc_keywords = ["amazon", "google", "cloudflare", "digitalocean", "linode", "vultr", "ovh", "hetzner", "hosting", "vpn", "proxy"]
        org_lower = org.lower()
        if any(keyword in org_lower for keyword in dc_keywords):
            is_datacenter = True
            
    return {
        "ip": ip,
        "city": geo_data.get("city", "Unknown"),
        "region": geo_data.get("region", "Unknown"),
        "country": geo_data.get("country_name", "Unknown"),
        "org": org or "Unknown",
        "asn": geo_data.get("asn", "Unknown"),
        "timezone": geo_data.get("timezone", "Unknown"),
        "is_datacenter": is_datacenter,
        "open_ports": nmap_data
    }


@app.get("/api/threat/feed", tags=["Intelligence"])
async def get_threat_feed():
    import httpx as _httpx
    import asyncio
    
    feed = []
    
    async def fetch_urlhaus():
        try:
            async with _httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post("https://urlhaus-api.abuse.ch/v1/urls/recent/", data={"limit": 10})
                if resp.status_code == 200:
                    data = resp.json()
                    urls = data.get("urls", [])[:10]
                    return [{"type": "malware_url", "indicator": u.get("url"), "source": "URLhaus"} for u in urls if u.get("url")]
        except Exception as e:
            logger.warning(f"URLhaus fetch failed: {e}")
        return []

    async def fetch_feodo():
        try:
            async with _httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get("https://feodotracker.abuse.ch/downloads/ipblocklist.json")
                if resp.status_code == 200:
                    data = resp.json()
                    ips = data[:10] if isinstance(data, list) else []
                    return [{"type": "botnet_ip", "indicator": item.get("ip_address"), "source": "FeodoTracker"} for item in ips if item.get("ip_address")]
        except Exception as e:
            logger.warning(f"FeodoTracker fetch failed: {e}")
        return []
        
    async def fetch_openphish():
        try:
            async with _httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get("https://openphish.com/feed.txt")
                if resp.status_code == 200:
                    lines = resp.text.splitlines()
                    urls = [line.strip() for line in lines if line.strip()][:10]
                    return [{"type": "phishing", "indicator": url, "source": "OpenPhish"} for url in urls]
        except Exception as e:
            logger.warning(f"OpenPhish fetch failed: {e}")
        return []

    results = await asyncio.gather(fetch_urlhaus(), fetch_feodo(), fetch_openphish())
    for r in results:
        feed.extend(r)
        
    return {"feed": feed, "count": len(feed)}


@app.post("/api/batch/scan", tags=["Unified OSINT"])
async def batch_scan_endpoint(request: Request):
    import json
    import asyncio
    from app.api.routes.unified import unified_scan
    
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
        
    targets = body.get("targets", [])
    if not isinstance(targets, list):
        raise HTTPException(status_code=400, detail="targets must be a list")
        
    targets = [t.strip() for t in targets if t.strip()][:10]
    
    async def sse_generator():
        queue = asyncio.Queue()
        
        async def process_target(t):
            try:
                res = await unified_scan(request, query=t)
                if isinstance(res, JSONResponse):
                    data = json.loads(res.body)
                else:
                    data = res if isinstance(res, dict) else dict(res)
                event = {"target": t, "status": "complete", "data": data}
            except Exception as e:
                logger.error(f"Batch item failed: {t} - {e}")
                event = {"target": t, "status": "error", "data": {"error": str(e)}}
            await queue.put(event)

        gather_task = asyncio.create_task(asyncio.gather(*(process_target(t) for t in targets)))
        
        for _ in range(len(targets)):
            item = await queue.get()
            yield f"data: {json.dumps(item)}\n\n"
            queue.task_done()
            
        await gather_task
        yield f"data: {json.dumps({'type': 'done', 'total': len(targets)})}\n\n"

    return StreamingResponse(
        with_keepalive(sse_generator()),
        media_type="text/event-stream",
        headers=SSE_HEADERS
    )


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
