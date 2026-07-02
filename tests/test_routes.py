import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

# Set test environment
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"  # Use in-memory DB for tests

from main import app

@pytest.fixture
def client():
    # Use TestClient with a 'with' block to trigger lifespan startup/shutdown
    with TestClient(app) as c:
        yield c

def test_app_lifespan(client):
    """Smoke test for application lifespan initialization."""
    response = client.get("/docs")
    assert response.status_code == 200

def test_security_check_validation(client):
    """Test query parameter validation on /api/security/check."""
    # Invalid email format should trigger a 422 Unprocessable Entity error
    response = client.get("/api/security/check?email=not-an-email")
    assert response.status_code == 422

    # Missing email should trigger 422
    response = client.get("/api/security/check")
    assert response.status_code == 422

@patch("app.services.security_scanner.SecurityScanner.check_email_breaches", new_callable=AsyncMock)
def test_security_check_success(mock_check, client):
    """Test successful security email check with mock scan results."""
    mock_check.return_value = {
        "status": "safe",
        "breach_count": 0,
        "details": []
    }
    response = client.get("/api/security/check?email=test@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "safe"

def test_vault_store_validation(client):
    """Test payload validation on /api/vault/store."""
    # Missing fields should fail with 422
    response = client.post("/api/vault/store", json={"service": "shodan"})
    assert response.status_code == 422

    # Empty strings should be caught by route handler and return 400
    response = client.post("/api/vault/store", json={"service": "", "api_key": ""})
    assert response.status_code == 400

@patch("app.core.database.db.save_secret")
def test_vault_store_success(mock_save, client):
    """Test successful vault store with mock DB persistence."""
    response = client.post("/api/vault/store", json={"service": "shodan", "api_key": "test_key"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_unified_scan_validation(client):
    """Test input validation on /api/unified/scan."""
    # Empty query should return 400
    response = client.get("/api/unified/scan?query=")
    assert response.status_code == 400

    # Shell characters should return 400
    response = client.get("/api/unified/scan?query=example.com;rm")
    assert response.status_code == 400

    # Exceedingly long query (> 253 chars) should return 400
    long_query = "a" * 254
    response = client.get(f"/api/unified/scan?query={long_query}")
    assert response.status_code == 400

@patch("app.services.unified_scanner.UnifiedScanner.scan", new_callable=AsyncMock)
def test_unified_scan_success(mock_scan, client):
    """Test successful unified scan with mock scanner execution."""
    mock_scan.return_value = {"target_type": "domain", "data": {}}
    response = client.get("/api/unified/scan?query=example.com")
    assert response.status_code == 200
    assert response.json()["target_type"] == "domain"

def test_metadata_extract_validation(client):
    """Test input validation on /api/metadata/extract."""
    # Missing file upload should fail with 422
    response = client.post("/api/metadata/extract")
    assert response.status_code == 422

    # Unsupported file type should fail with 400
    files = {"file": ("test.txt", b"dummy content", "text/plain")}
    response = client.post("/api/metadata/extract", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
