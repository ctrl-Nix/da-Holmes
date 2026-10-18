"""Unit tests for app/core/http_client.py (no real network: httpx.MockTransport)."""
import asyncio
import socket
from typing import List

import httpx
import pytest

from app.core import http_client as hc
from app.core.http_client import (
    HolmesHTTPClient,
    OSINTHTTPClient,
    build_http_client,
    get_http_client,
    get_insecure_http_client,
    shutdown_http_clients,
    _parse_retry_after,
)

URL = "https://target.example/api"


def make(handler, **kw) -> tuple[HolmesHTTPClient, List[float]]:
    sleeps: List[float] = []

    async def fake_sleep(d: float) -> None:
        sleeps.append(d)

    kw.setdefault("max_retries", 2)
    client = build_http_client(transport=httpx.MockTransport(handler), sleep=fake_sleep, **kw)
    return client, sleeps


@pytest.mark.asyncio
async def test_get_retries_503_then_succeeds():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        return httpx.Response(503 if calls["n"] < 3 else 200, json={"ok": True})

    client, sleeps = make(handler)
    r = await client.get(URL)
    assert r.status_code == 200 and calls["n"] == 3
    assert len(sleeps) == 2 and sleeps[1] >= sleeps[0]  # exponential growth
    assert client.stats["retries"] == 2


@pytest.mark.asyncio
async def test_exhausted_retryable_status_returns_last_response():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        return httpx.Response(429)

    client, _ = make(handler)
    r = await client.get(URL)
    assert r.status_code == 429 and calls["n"] == 3  # 1 + 2 retries


@pytest.mark.asyncio
async def test_retry_after_header_is_honoured_and_capped():
    def handler(request):
        return httpx.Response(429, headers={"Retry-After": "3"})

    client, sleeps = make(handler, max_retries=1)
    await client.get(URL)
    assert sleeps == [3.0]

    client, sleeps = make(handler, max_retries=1, backoff_max=2.0)
    await client.get(URL)
    assert sleeps == [2.0]  # capped


@pytest.mark.asyncio
async def test_post_not_replayed_on_502_but_replayed_on_429():
    seen = {"n": 0}

    def h502(request):
        seen["n"] += 1
        return httpx.Response(502)

    client, _ = make(h502)
    assert (await client.post(URL, json={})).status_code == 502
    assert seen["n"] == 1  # no duplicate side effects

    seen["n"] = 0

    def h429(request):
        seen["n"] += 1
        return httpx.Response(429 if seen["n"] == 1 else 200)

    client, _ = make(h429)
    assert (await client.post(URL, json={})).status_code == 200
    assert seen["n"] == 2


@pytest.mark.asyncio
async def test_connect_error_retried_then_raised():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        raise httpx.ConnectError("refused")

    client, _ = make(handler)
    with pytest.raises(httpx.ConnectError):
        await client.get(URL)
    assert calls["n"] == 3 and client.stats["failures"] == 1


@pytest.mark.asyncio
async def test_permanent_dns_failure_is_not_retried():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        try:
            raise socket.gaierror(socket.EAI_NONAME, "Name or service not known")
        except socket.gaierror as e:
            raise httpx.ConnectError("dns") from e

    client, sleeps = make(handler)
    with pytest.raises(httpx.ConnectError):
        await client.get(URL)
    assert calls["n"] == 1 and sleeps == []


@pytest.mark.asyncio
async def test_post_read_timeout_not_retried_get_read_timeout_is():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        raise httpx.ReadTimeout("slow")

    client, _ = make(handler)
    with pytest.raises(httpx.ReadTimeout):
        await client.post(URL)
    assert calls["n"] == 1
    calls["n"] = 0
    with pytest.raises(httpx.ReadTimeout):
        await client.get(URL)
    assert calls["n"] == 3


@pytest.mark.asyncio
@pytest.mark.parametrize("bad", ["file:///etc/passwd", "ftp://x.example/a", "gopher://x", "/relative", "http://"])
async def test_non_http_urls_rejected(bad):
    client, _ = make(lambda r: httpx.Response(200))
    with pytest.raises(httpx.UnsupportedProtocol):
        await client.get(bad)


@pytest.mark.asyncio
async def test_per_request_retries_override_and_raise_for_status():
    calls = {"n": 0}

    def handler(request):
        calls["n"] += 1
        return httpx.Response(503, request=request)

    client, _ = make(handler)
    with pytest.raises(httpx.HTTPStatusError):
        await client.get(URL, retries=0, raise_for_status=True)
    assert calls["n"] == 1


@pytest.mark.asyncio
async def test_concurrency_cap_is_enforced():
    active = {"now": 0, "peak": 0}

    async def handler(request):
        active["now"] += 1
        active["peak"] = max(active["peak"], active["now"])
        await asyncio.sleep(0.01)
        active["now"] -= 1
        return httpx.Response(200)

    client, _ = make(handler, max_concurrency=5)
    await asyncio.gather(*(client.get(URL) for _ in range(40)))
    assert active["peak"] <= 5


@pytest.mark.asyncio
async def test_default_headers_and_get_json():
    def handler(request):
        assert request.headers["user-agent"].startswith("da-Holmes/2.0")
        return httpx.Response(200, json={"a": 1}, request=request)

    client, _ = make(handler)
    assert await client.get_json(URL) == {"a": 1}


def test_parse_retry_after_variants():
    assert _parse_retry_after("5") == 5.0
    assert _parse_retry_after(None) is None
    assert _parse_retry_after("garbage") is None
    assert _parse_retry_after("Wed, 21 Oct 2015 07:28:00 GMT") == 0.0  # past date -> 0


def test_client_rebuilt_when_event_loop_changes():
    client, _ = make(lambda r: httpx.Response(200))

    async def one():
        return (await client.get(URL)).status_code

    assert asyncio.run(one()) == 200
    assert asyncio.run(one()) == 200  # second loop must not reuse the dead pool


@pytest.mark.asyncio
async def test_registry_singletons_and_shutdown():
    a, b = get_http_client(), get_http_client()
    insecure = get_insecure_http_client()
    assert a is b and a is not insecure
    await shutdown_http_clients()
    assert get_http_client() is not a  # fresh after shutdown
    await shutdown_http_clients()


@pytest.mark.asyncio
async def test_legacy_osint_client_contract(monkeypatch):
    """Mirrors scratch/test_resilience.py: patch AsyncClient.request, 429,429,200."""
    count = {"n": 0}

    async def fake_request(*args, **kwargs):
        count["n"] += 1
        return httpx.Response(429 if count["n"] < 3 else 200, content=b'{"status": "success"}')

    async def no_sleep(_):
        return None

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)
    legacy = OSINTHTTPClient(timeout=2.0)
    legacy._sleep = no_sleep
    r = await legacy.get("https://api.shodan.io/shodan/host/8.8.8.8", headers={"X": "1"})
    assert r.status_code == 200 and count["n"] == 3
