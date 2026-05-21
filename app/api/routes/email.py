from fastapi import APIRouter, HTTPException, Query, status, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.services.email_scanner import EmailScanner

router = APIRouter()
_email_scanner = EmailScanner()

class EmailScanResponse(BaseModel):
    email: str
    status: str
    platforms_found: List[str]
    message: Optional[str] = None

@router.get(
    "/scan",
    response_model=EmailScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Scan an email address across various platforms using Holehe"
)
async def scan_email(
    request: Request,
    email: EmailStr = Query(..., description="The email address to scan.", examples=["test@example.com"])
):
    """
    **GET** `/api/email/scan?email=<email>`
    
    Returns a list of platforms where the email is registered.
    """
    try:
        result = await _email_scanner.scan_email(email)
        return EmailScanResponse(
            email=email,
            status=result["status"],
            platforms_found=result["platforms_found"],
            message=result.get("message")
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email scan failed unexpectedly."
        ) from exc
