from fastapi import APIRouter, HTTPException, Query, status, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.services.security_scanner import SecurityScanner

router = APIRouter()
_security_scanner = SecurityScanner()

class BreachDetail(BaseModel):
    name: str
    description: str
    date: str

class SecurityScanResponse(BaseModel):
    email: str
    status: str
    breach_count: int
    details: List[BreachDetail]

@router.get(
    "/check",
    response_model=SecurityScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Check an email address for known data breaches"
)
async def check_security(
    request: Request,
    email: EmailStr = Query(..., description="The email address to check against known public data leaks.", examples=["test@example.com"])
):
    """
    **GET** `/api/security/check?email=<email>`
    
    Returns a status detailing whether the email has been found in public leaks,
    including simulated intelligence for specific trigger keywords.
    """
    try:
        result = await _security_scanner.check_email_breaches(email)
        return SecurityScanResponse(
            email=email,
            status=result["status"],
            breach_count=result["breach_count"],
            details=[BreachDetail(**d) for d in result["details"]]
        )
    except HTTPException as he:
        raise he
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "unavailable", "reason": "API unreachable"}
        )
