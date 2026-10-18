"""
Unit tests for da Holmes v2.0 Phase 1: Architecture Cleanup & Core Setup
- HTTP Client connection pooling, timeouts, and retry logic
- API v1 router standardization
- Database models: Workspace, Target, Artifact, ScanResult
"""

import pytest
import httpx
from unittest.mock import patch, AsyncMock

from app.core.http_client import (
    get_http_client,
    close_http_client,
    create_async_client,
    OSINTHTTPClient,
)
from app.api.v1.router import api_v1_router
from app.models.models import Workspace, Target, Artifact, ScanResult, Investigation


@pytest.mark.asyncio
async def test_http_client_factory_and_singleton():
    """Verify get_http_client() creates singleton pooled client and close_http_client() cleans up."""
    await close_http_client()

    client1 = await get_http_client()
    assert isinstance(client1, httpx.AsyncClient)
    assert not client1.is_closed

    client2 = await get_http_client()
    assert client1 is client2, "get_http_client must return the singleton instance"

    await close_http_client()
    assert client1.is_closed, "close_http_client must close the pooled client"


@pytest.mark.asyncio
async def test_osint_http_client_methods():
    """Verify OSINTHTTPClient methods execute and respect custom configuration."""
    mock_transport = httpx.MockTransport(lambda req: httpx.Response(200, json={"status": "ok", "url": str(req.url)}))
    custom_client = httpx.AsyncClient(transport=mock_transport)

    wrapper = OSINTHTTPClient(custom_client=custom_client)
    res_get = await wrapper.get("https://api.example.com/target")
    assert res_get.status_code == 200
    assert res_get.json()["status"] == "ok"

    res_post = await wrapper.post("https://api.example.com/scan", json={"target": "example.com"})
    assert res_post.status_code == 200

    await custom_client.aclose()


@pytest.mark.asyncio
async def test_osint_http_client_429_retry():
    """Verify OSINTHTTPClient exponential backoff retry on HTTP 429."""
    call_count = 0

    def mock_handler(request):
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            return httpx.Response(429, headers={"Retry-After": "0"})
        return httpx.Response(200, json={"recovered": True})

    transport = httpx.MockTransport(mock_handler)
    client = httpx.AsyncClient(transport=transport)
    wrapper = OSINTHTTPClient(max_retries=3, custom_client=client)

    response = await wrapper.get("https://api.example.com/rate-limited")
    assert response.status_code == 200
    assert response.json()["recovered"] is True
    assert call_count == 3, "Client should retry on 429 until successful or retries exhausted"

    await client.aclose()


def test_api_v1_router_registration():
    """Verify all expected v1 endpoints are registered on api_v1_router."""
    routes = [r.path for r in api_v1_router.routes]

    # Verify key route prefixes exist
    assert any("/security" in r for r in routes), "Security routes must be mounted"
    assert any("/network" in r for r in routes), "Network routes must be mounted"
    assert any("/forensics" in r for r in routes), "Forensics routes must be mounted"
    assert any("/vault" in r for r in routes), "Vault routes must be mounted"
    assert any("/unified" in r for r in routes), "Unified routes must be mounted"


def test_database_models_structure():
    """Verify Workspace, Target, Artifact, and ScanResult models instantiate with expected fields."""
    ws = Workspace(name="RedTeam-Op-Alpha", description="Q4 External Assessment")
    assert ws.name == "RedTeam-Op-Alpha"

    tgt = Target(workspace=ws, target_type="domain", target_value="target-corp.com", status="pending")
    assert tgt.target_value == "target-corp.com"
    assert tgt.workspace is ws

    art = Artifact(
        workspace=ws,
        artifact_name="suspect_doc.pdf",
        artifact_type="pdf",
        file_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        extracted_metadata={"author": "attacker", "producer": "malicious-gen"}
    )
    assert art.artifact_name == "suspect_doc.pdf"
    assert art.extracted_metadata["author"] == "attacker"

    scan = ScanResult(
        target=tgt,
        module_name="file_forensics",
        status="success",
        data={"hashes": {"sha256": "abc123"}},
        execution_time_ms=45.2
    )
    assert scan.module_name == "file_forensics"
    assert scan.target is tgt
