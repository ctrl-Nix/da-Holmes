import httpx
import warnings
import logging
from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel
from typing import Dict, List
from Wappalyzer import Wappalyzer, WebPage

# Suppress verbose dependency warning logs
warnings.filterwarnings("ignore")
logging.getLogger("Wappalyzer").setLevel(logging.ERROR)

router = APIRouter()

# Initialize Wappalyzer instance at load time for performance
try:
    wappalyzer = Wappalyzer.latest()
except Exception:
    wappalyzer = Wappalyzer()

class TechStackResponse(BaseModel):
    status: str
    domain: str
    categories: Dict[str, List[str]]

@router.get(
    "/",
    response_model=TechStackResponse,
    status_code=status.HTTP_200_OK,
    summary="Identify technologies used on a website using Wappalyzer"
)
async def analyze_tech_stack(
    request: Request,
    domain: str = Query(..., description="Target URL or domain to scan.", examples=["google.com"])
):
    """
    **GET** `/api/techstack?domain=<domain>`
    
    Uses python-Wappalyzer locally to discover web frameworks, servers, JavaScript libraries, and analytics tools.
    """
    target_domain = domain.strip()
    if not target_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain query parameter cannot be empty."
        )

    # Normalize url
    if not target_domain.startswith("http://") and not target_domain.startswith("https://"):
        url = f"https://{target_domain}"
    else:
        url = target_domain

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        # Fetch page with strict 10 second timeout
        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            html_content = response.text
            response_headers = {k.lower(): v for k, v in response.headers.items()}
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Target website timed out. Request exceeded the 10 second threshold."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach or retrieve content from target URL: {str(e)}"
        )

    try:
        # Run local Wappalyzer signature matching
        webpage = WebPage(url=url, html=html_content, headers=response_headers)
        analysis_result = wappalyzer.analyze_with_categories(webpage)
        
        # Categorize detected technologies
        categories_map: Dict[str, List[str]] = {}
        for tech_name, details in analysis_result.items():
            categories = details.get("categories", ["Other"])
            for cat in categories:
                if cat not in categories_map:
                    categories_map[cat] = []
                if tech_name not in categories_map[cat]:
                    categories_map[cat].append(tech_name)
                    
        return TechStackResponse(
            status="success",
            domain=target_domain,
            categories=categories_map
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing Wappalyzer analysis: {str(e)}"
        )
