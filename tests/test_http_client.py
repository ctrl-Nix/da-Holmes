"""
Tests for app/core/http_client.py
"""
import pytest
import httpx
from app.core.http_client import (
    get_http_client,
    close_http_client,
    OSINTHTTPClient,
)


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
