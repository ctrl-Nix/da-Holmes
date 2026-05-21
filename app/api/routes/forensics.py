from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional

from app.services.forensics import EXIFForensics

router = APIRouter()
_forensics = EXIFForensics()

class ExifMetadataResponse(BaseModel):
    status: str
    message: Optional[str] = None
    DateTimeOriginal: Optional[str] = None
    Make: Optional[str] = None
    Model: Optional[str] = None
    GPSInfo: Optional[str] = None

@router.post(
    "/exif",
    response_model=ExifMetadataResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract hidden EXIF metadata from an uploaded image"
)
async def extract_exif(
    request: Request,
    file: UploadFile = File(..., description="The image file to analyze for hidden metadata.")
):
    """
    **POST** `/api/forensics/exif`
    
    Receives an image, extracts DateTimeOriginal, Make, Model, and GPS coordinates 
    locally in memory, and returns the findings. The image is not saved.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image."
        )

    try:
        # Read file bytes into memory
        file_bytes = await file.read()
        
        # Extract metadata
        result = _forensics.extract_exif_metadata(file_bytes)
        
        return ExifMetadataResponse(**result)
    
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process image forensics."
        ) from exc


import dns.asyncresolver
import dns.resolver
import dns.exception
from fastapi import Query

class EmailForensicsResult(BaseModel):
    domain: str
    spf_record: Optional[str] = None
    dmarc_record: Optional[str] = None
    is_vulnerable_to_spoofing: bool

async def check_email_spoofing(domain: str) -> EmailForensicsResult:
    """
    Checks a domain for SPF and DMARC records via standard DNS TXT queries.
    Determines if domain is vulnerable to spoofing.
    """
    domain = domain.replace("https://", "").replace("http://", "").strip().split("/")[0]
    resolver = dns.asyncresolver.Resolver()
    resolver.timeout = 2.0
    resolver.lifetime = 5.0
    
    spf_record = None
    dmarc_record = None

    # Query SPF record
    try:
        answers = await resolver.resolve(domain, "TXT")
        for rdata in answers:
            txt_str = "".join([part.decode("utf-8") for part in rdata.strings])
            if txt_str.startswith("v=spf1"):
                spf_record = txt_str
                break
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        pass

    # Query DMARC record
    try:
        answers = await resolver.resolve(f"_dmarc.{domain}", "TXT")
        for rdata in answers:
            txt_str = "".join([part.decode("utf-8") for part in rdata.strings])
            if txt_str.startswith("v=DMARC1"):
                dmarc_record = txt_str
                break
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        pass

    # Evaluate vulnerability
    is_vulnerable = False
    if not spf_record or not dmarc_record:
        is_vulnerable = True
    else:
        # Check SPF misconfigurations
        spf_lower = spf_record.lower()
        if "+all" in spf_lower or not any(policy in spf_lower for policy in ["-all", "~all"]):
            is_vulnerable = True
            
        # Check DMARC misconfigurations
        dmarc_lower = dmarc_record.lower()
        if "p=none" in dmarc_lower or not any(policy in dmarc_lower for policy in ["p=reject", "p=quarantine"]):
            is_vulnerable = True

    return EmailForensicsResult(
        domain=domain,
        spf_record=spf_record,
        dmarc_record=dmarc_record,
        is_vulnerable_to_spoofing=is_vulnerable
    )

@router.get(
    "/email",
    response_model=EmailForensicsResult,
    status_code=status.HTTP_200_OK,
    summary="Analyze email spoofing security records for a domain"
)
async def analyze_email_spoofing_endpoint(
    domain: str = Query(..., description="The domain to analyze.", examples=["google.com"])
):
    """
    **GET** `/api/forensics/email?domain=<domain>`
    
    Performs standard DNS TXT resolution to verify SPF and DMARC settings and evaluate risk.
    """
    if not domain.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain query parameter cannot be empty."
        )
    return await check_email_spoofing(domain)
