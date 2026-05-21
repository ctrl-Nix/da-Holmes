from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime

from app.models import models, schemas

# ---------------------------------------------------------------------------
# Investigation CRUD
# ---------------------------------------------------------------------------

async def create_investigation(db: AsyncSession, investigation: schemas.InvestigationCreate) -> models.Investigation:
    """
    Creates a new investigation record in the database.
    """
    db_investigation = models.Investigation(
        query_type=investigation.query_type,
        query_value=investigation.query_value,
        timestamp=datetime.utcnow()
    )
    db.add(db_investigation)
    await db.commit()
    await db.refresh(db_investigation)
    return db_investigation

async def get_investigation(db: AsyncSession, investigation_id: int) -> Optional[models.Investigation]:
    """
    Retrieves a single investigation record by ID, including its results and notes.
    """
    result = await db.execute(
        select(models.Investigation).filter(models.Investigation.id == investigation_id)
    )
    return result.scalars().first()

async def get_investigations(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[models.Investigation]:
    """
    Retrieves a list of investigations, ordered by latest timestamp.
    """
    result = await db.execute(
        select(models.Investigation)
        .order_by(models.Investigation.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())

async def delete_investigation(db: AsyncSession, investigation_id: int) -> bool:
    """
    Deletes an investigation by ID (cascades to results and notes).
    """
    db_investigation = await get_investigation(db, investigation_id)
    if not db_investigation:
        return False
    await db.delete(db_investigation)
    await db.commit()
    return True


# ---------------------------------------------------------------------------
# TargetResult CRUD
# ---------------------------------------------------------------------------

async def create_target_result(db: AsyncSession, result_in: schemas.TargetResultCreate) -> models.TargetResult:
    """
    Creates a new target result associated with an investigation.
    """
    db_result = models.TargetResult(
        investigation_id=result_in.investigation_id,
        module_name=result_in.module_name,
        raw_json=result_in.raw_json,
        status=result_in.status
    )
    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)
    return db_result

async def get_target_results_by_investigation(db: AsyncSession, investigation_id: int) -> List[models.TargetResult]:
    """
    Retrieves all target results for a specific investigation.
    """
    result = await db.execute(
        select(models.TargetResult).filter(models.TargetResult.investigation_id == investigation_id)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# AnalystNote CRUD
# ---------------------------------------------------------------------------

async def create_analyst_note(db: AsyncSession, note_in: schemas.AnalystNoteCreate) -> models.AnalystNote:
    """
    Creates a new analyst note associated with an investigation.
    """
    db_note = models.AnalystNote(
        investigation_id=note_in.investigation_id,
        tag_color=note_in.tag_color,
        note_text=note_in.note_text,
        timestamp=datetime.utcnow()
    )
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note

async def update_analyst_note(
    db: AsyncSession, note_id: int, note_update: schemas.AnalystNoteUpdate
) -> Optional[models.AnalystNote]:
    """
    Updates an existing analyst note (tag color, note text).
    """
    result = await db.execute(
        select(models.AnalystNote).filter(models.AnalystNote.id == note_id)
    )
    db_note = result.scalars().first()
    if not db_note:
        return None
    
    # Update fields if provided in update payload
    if note_update.tag_color is not None:
        db_note.tag_color = note_update.tag_color
    if note_update.note_text is not None:
        db_note.note_text = note_update.note_text
        
    await db.commit()
    await db.refresh(db_note)
    return db_note

async def delete_analyst_note(db: AsyncSession, note_id: int) -> bool:
    """
    Deletes an analyst note by ID.
    """
    result = await db.execute(
        select(models.AnalystNote).filter(models.AnalystNote.id == note_id)
    )
    db_note = result.scalars().first()
    if not db_note:
        return False
    await db.delete(db_note)
    await db.commit()
    return True
