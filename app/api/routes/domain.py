from fastapi import APIRouter, Query, Request
from app.services.corporate_scanner import get_domain_info

router = APIRouter()

@router.get("/domain")
async def scan_domain(request: Request, domain: str = Query(..., description="The domain to scan")):
    """
    Returns the resolved IP and a list of subdomains for the given domain.
    """
    results = await get_domain_info(domain)
    return results
