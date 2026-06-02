from fastapi import APIRouter, HTTPException, Query
import re
import urllib.parse
import httpx

router = APIRouter()

CANARY_PATTERNS = [
    r"canarytokens\.com",
    r"grabify\.link",
    r"iplogger\.org",
    r"blasze\.tk",
    r"whatstheirip\.com",
    r"2no\.co",
    r"yip\.su",
    r"ident\.me",
    r"xss\.ht",
    r"burpcollaborator\.net",
    r"oastify\.com",
    r"interact\.sh",
    r"ceye\.io",
    r"dnslog\.cn",
    r"ngrok\.io",
    r"localtunnel\.me"
]

@router.get("/detect", summary="Canary Token Detector", description="Check if a URL or text contains known honeypot/canary tokens.")
async def detect_canary(
    text: str = Query(..., description="The URL or text block to analyze")
):
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    decoded_text = urllib.parse.unquote(text)
    
    findings = []
    
    # 1. Regex Pattern Matching
    for pattern in CANARY_PATTERNS:
        if re.search(pattern, decoded_text, re.IGNORECASE):
            findings.append({
                "type": "Known Canary Domain",
                "pattern": pattern,
                "description": "This URL is heavily associated with IP loggers, canary tokens, or blind SSRF/XSS testing tools."
            })

    # 2. Heuristics for suspicious parameters
    if re.search(r"(\.jpg|\.png|\.gif)\?[a-zA-Z0-9_]{10,}", decoded_text):
        findings.append({
            "type": "Suspicious Image Query",
            "description": "Image requests with long random query parameters are often tracking pixels."
        })
        
    if re.search(r"http(s)?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", decoded_text):
         findings.append({
            "type": "Bare IP URL",
            "description": "The URL points directly to an IP address instead of a domain, which is often used in phishing or malware delivery."
        })

    risk_level = "HIGH" if findings else "LOW"
    
    return {
        "text_analyzed": text,
        "is_canary": len(findings) > 0,
        "risk_level": risk_level,
        "findings": findings
    }
