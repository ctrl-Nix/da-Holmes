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
