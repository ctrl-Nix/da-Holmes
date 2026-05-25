import asyncio
import sys
import os
from unittest.mock import AsyncMock, patch

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, get_db
from app.models import models, schemas
from app import crud
from app.core.http_client import OSINTHTTPClient

async def test_api_keys_storage():
    print("=== Testing Secure API Keys Storage ===")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async for db in get_db():
        # Clear existing keys first
        await db.execute(models.ApiKeySetting.__table__.delete())
        await db.commit()
        
        # Test save keys
        test_payload = {
            "shodan": "SHODAN_SECRET_KEY_1234",
            "virustotal": "VT_SECRET_KEY_5678",
            "hunterio": "HUNTER_SECRET_KEY_abcd"
        }
        
        print("Saving credentials...")
        saved = await crud.save_api_keys(db, test_payload)
        print("Masked response:", saved)
        assert saved["shodan"] == "********"
        assert saved["virustotal"] == "********"
        assert saved["hunterio"] == "********"
        
        print("Retrieving and decrypting credentials...")
        shodan_key = await crud.get_api_key(db, "shodan")
        vt_key = await crud.get_api_key(db, "virustotal")
        hunter_key = await crud.get_api_key(db, "hunterio")
        
        print(f"Shodan decrypted: {shodan_key}")
        print(f"VirusTotal decrypted: {vt_key}")
        print(f"Hunter.io decrypted: {hunter_key}")
        
        assert shodan_key == "SHODAN_SECRET_KEY_1234"
        assert vt_key == "VT_SECRET_KEY_5678"
        assert hunter_key == "HUNTER_SECRET_KEY_abcd"
        
        # Test getting masked list
        masked_list = await crud.get_all_api_keys_masked(db)
        print("Masked List:", masked_list)
        assert masked_list["shodan"] == "********"
        
        break
    print("API Key Storage Tests Passed!")

async def test_http_retry_client():
    print("\n=== Testing OSINT HTTP Client Resilience & Retries ===")
    client = OSINTHTTPClient(timeout=2.0)
    
    # We will mock the client._request_with_retry method call or patch httpx.AsyncClient.request
    # to return a 429 response first, then a 200 response on retry
    call_count = 0
    
    async def mock_request(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        import httpx
        if call_count < 3:
            print(f"Mocking HTTP Response: 429 Too Many Requests (attempt {call_count})")
            return httpx.Response(status_code=429, content=b'{"error": "rate limited"}')
        else:
            print(f"Mocking HTTP Response: 200 OK (attempt {call_count})")
            return httpx.Response(status_code=200, content=b'{"status": "success", "data": "OSINT intelligence data"}')

    # We patch httpx.AsyncClient.request to call our mock_request
    with patch("httpx.AsyncClient.request", side_effect=mock_request):
        print("Executing GET request to mock target API...")
        response = await client.get("https://api.shodan.io/shodan/host/8.8.8.8")
        print(f"Final Response Status: {response.status_code}")
        print(f"Final Response Body: {response.text}")
        
        assert response.status_code == 200
        assert "OSINT intelligence data" in response.text
        # Should have taken 3 attempts (attempt 1 -> 429, attempt 2 -> 429, attempt 3 -> 200)
        assert call_count == 3
        print("OSINT HTTP Client Retry Mechanism Verified Successfully!")

async def main():
    await test_api_keys_storage()
    await test_http_retry_client()
    await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
