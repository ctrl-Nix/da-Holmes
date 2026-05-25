import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, get_db
from app.models import models, schemas
from app import crud

async def test_db_setup():
    print("Initializing Database Engine...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async for db in get_db():
        # Clean up database first if there is any data
        await db.execute(models.Investigation.__table__.delete())
        await db.commit()

        print("Creating a test investigation...")
        inv_data = schemas.InvestigationCreate(query_type="ip", query_value="8.8.8.8")
        inv = await crud.create_investigation(db, inv_data)
        inv_id = inv.id  # Save ID before expiring
        
        print("Creating a test target result...")
        res_data = schemas.TargetResultCreate(
            investigation_id=inv_id,
            module_name="shodan",
            raw_json={"ports": [80, 443]},
            status="success"
        )
        res = await crud.create_target_result(db, res_data)
        
        print("Creating a test analyst note...")
        note_data = schemas.AnalystNoteCreate(
            investigation_id=inv_id,
            tag_color="#ff0000",
            note_text="This looks like a standard Google DNS server."
        )
        note = await crud.create_analyst_note(db, note_data)
        
        # Expire session so that subsequent select query fetches fresh data from DB
        db.expire_all()
        
        print("Retrieving the investigation back with details...")
        retrieved_inv = await crud.get_investigation(db, inv_id)
        print(f"Retrieved Investigation ID={retrieved_inv.id}")
        print(f"Results Count: {len(retrieved_inv.results)}")
        print(f"Notes Count: {len(retrieved_inv.notes)}")
        
        # Verify the contents
        assert len(retrieved_inv.results) == 1
        assert len(retrieved_inv.notes) == 1
        assert retrieved_inv.results[0].module_name == "shodan"
        assert retrieved_inv.notes[0].note_text == "This looks like a standard Google DNS server."
        
        print("Updating the analyst note...")
        update_data = schemas.AnalystNoteUpdate(
            note_text="This is indeed Google Public DNS. Safe IP."
        )
        updated_note = await crud.update_analyst_note(db, note.id, update_data)
        print(f"Updated Note ID={updated_note.id}, text={updated_note.note_text}")
        assert updated_note.note_text == "This is indeed Google Public DNS. Safe IP."
        
        print("Deleting the investigation (should cascade delete results and notes)...")
        deleted = await crud.delete_investigation(db, inv_id)
        print(f"Deleted investigation: {deleted}")
        assert deleted is True
        
        # Verify cascades
        print("Verifying cascade delete...")
        results = await crud.get_target_results_by_investigation(db, inv_id)
        print(f"Stray results found: {len(results)}")
        assert len(results) == 0
        
        break  # exit generator
        
    print("All tests passed successfully!")
    await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(test_db_setup())
