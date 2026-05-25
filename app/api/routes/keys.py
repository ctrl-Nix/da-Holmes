from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from app.database import get_db
from app.models import schemas
from app import crud

router = APIRouter()

@router.post(
    "/keys",
    response_model=Dict[str, str],
    summary="Save API credentials securely"
)
async def save_keys_endpoint(
    payload: schemas.ApiKeySaveRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Encrypts and persists third-party API credentials.
    """
    try:
        return await crud.save_api_keys(db=db, keys=payload.keys)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt and store API credentials: {str(e)}"
        )


@router.get(
    "/keys",
    response_model=Dict[str, str],
    summary="Retrieve list of configured services"
)
async def get_keys_endpoint(
    db: AsyncSession = Depends(get_db)
):
    """
    Returns configured API services with their values masked for privacy.
    """
    try:
        return await crud.get_all_api_keys_masked(db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve configured services: {str(e)}"
        )
