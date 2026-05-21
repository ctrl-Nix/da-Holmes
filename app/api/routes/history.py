from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import schemas
from app import crud

router = APIRouter()

# ---------------------------------------------------------------------------
# Investigation Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/investigations",
    response_model=schemas.InvestigationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation"
)
async def create_investigation_endpoint(
    investigation: schemas.InvestigationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Initializes a new OSINT investigation session.
    """
    return await crud.create_investigation(db=db, investigation=investigation)


@router.get(
    "/investigations",
    response_model=List[schemas.InvestigationResponse],
    summary="Get all investigations"
)
async def read_investigations_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves list of past investigations, ordered by latest.
    """
    return await crud.get_investigations(db=db, skip=skip, limit=limit)


@router.get(
    "/investigations/{investigation_id}",
    response_model=schemas.InvestigationResponse,
    summary="Get investigation details"
)
async def read_investigation_endpoint(
    investigation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves full details for a specific investigation by ID, including telemetry results and notes.
    """
    db_investigation = await crud.get_investigation(db=db, investigation_id=investigation_id)
    if not db_investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID {investigation_id} not found."
        )
    return db_investigation


@router.delete(
    "/investigations/{investigation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an investigation"
)
async def delete_investigation_endpoint(
    investigation_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently deletes an investigation and all its associated findings/notes.
    """
    success = await crud.delete_investigation(db=db, investigation_id=investigation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID {investigation_id} not found."
        )
    return None


# ---------------------------------------------------------------------------
# TargetResult Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/investigations/{investigation_id}/results",
    response_model=schemas.TargetResultResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a scan result to an investigation"
)
async def create_target_result_endpoint(
    investigation_id: int,
    result: schemas.TargetResultBase,
    db: AsyncSession = Depends(get_db)
):
    """
    Logs raw scan results or module outcomes under a specific investigation.
    """
    # Verify the investigation exists first
    db_investigation = await crud.get_investigation(db=db, investigation_id=investigation_id)
    if not db_investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID {investigation_id} not found."
        )
    
    result_in = schemas.TargetResultCreate(
        investigation_id=investigation_id,
        module_name=result.module_name,
        raw_json=result.raw_json,
        status=result.status
    )
    return await crud.create_target_result(db=db, result_in=result_in)


# ---------------------------------------------------------------------------
# AnalystNote Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/investigations/{investigation_id}/notes",
    response_model=schemas.AnalystNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an analyst note for an investigation"
)
async def create_analyst_note_endpoint(
    investigation_id: int,
    note: schemas.AnalystNoteBase,
    db: AsyncSession = Depends(get_db)
):
    """
    Appends an analyst note (with optional color categorization) to an investigation.
    """
    # Verify the investigation exists first
    db_investigation = await crud.get_investigation(db=db, investigation_id=investigation_id)
    if not db_investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation with ID {investigation_id} not found."
        )
        
    note_in = schemas.AnalystNoteCreate(
        investigation_id=investigation_id,
        tag_color=note.tag_color,
        note_text=note.note_text
    )
    return await crud.create_analyst_note(db=db, note_in=note_in)


@router.put(
    "/investigations/notes/{note_id}",
    response_model=schemas.AnalystNoteResponse,
    summary="Update an analyst note"
)
async def update_analyst_note_endpoint(
    note_id: int,
    note_update: schemas.AnalystNoteUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Updates tag categorization or text of an analyst note.
    """
    updated_note = await crud.update_analyst_note(db=db, note_id=note_id, note_update=note_update)
    if not updated_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analyst note with ID {note_id} not found."
        )
    return updated_note


@router.delete(
    "/investigations/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an analyst note"
)
async def delete_analyst_note_endpoint(
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a specific analyst note.
    """
    success = await crud.delete_analyst_note(db=db, note_id=note_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analyst note with ID {note_id} not found."
        )
    return None
