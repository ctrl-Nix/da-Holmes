"""
app/core/http_client.py
=======================
Centralised, resilient async HTTP client for every outbound da Holmes request.

Why this exists
---------------
* One pooled ``httpx.AsyncClient`` per process instead of a new TCP/TLS
  handshake per call (the old implementation opened a client per request).
* Explicit connect / read / write / pool timeouts.
* Retry with exponential back-off + jitter, honouring ``Retry-After``.
  Retries are *method-aware*: a POST is never replayed after it may have
  reached the server (no duplicate side effects).
* DNS failures (NXDOMAIN) are NOT retried. In recon work, dead hosts are the
  norm and retrying them only burns time.
* A global concurrency cap so ``asyncio.gather`` over hundreds of targets
  (Phase 4 social search) cannot exhaust sockets or hammer a single provider.
* Only http/https URLs are accepted.

Public API
----------
``get_http_client()``           shared client, strict TLS verification
``get_insecure_http_client()``  shared client, TLS verification OFF. Only for
                                probing *target* hosts with broken certs.
                                Never send credentials through it.
``build_http_client(**kw)``     factory for a dedicated, unmanaged instance
                                (per-scan proxy, custom UA, ...). Caller closes it.
``startup_http_clients()`` / ``shutdown_http_clients()``  FastAPI lifespan hooks.
``http_client_dependency()``    ``Depends(...)`` provider.
``OSINTHTTPClient``             backward-compatible alias of the old class.
"""
from __future__ import annotations

import asyncio
import email.utils
import logging
import random
import socket
import time
from datetime import timezone
from typing import Any, Awaitable, Callable, Dict, Mapping, Optional, Union
from urllib.parse import urlsplit

import httpx

logger = logging.getLogger("holmes.http")

# --------------------------------------------------------------------------- #
# Defaults
# --------------------------------------------------------------------------- #
DEFAULT_USER_AGENT = "da-Holmes/2.0 (+passive-osint)"
DEFAULT_HEADERS: Dict[str, str] = {
    "User-Agent": DEFAULT_USER_AGENT,
    "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
}
DEFAULT_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=10.0, pool=10.0)
DEFAULT_LIMITS = httpx.Limits(
    max_connections=100,
    max_keepalive_connections=20,
    keepalive_expiry=30.0,
)

#: Statuses that mean "try again later".
RETRY_STATUS = frozenset({429, 502, 503, 504})
#: Statuses a server sends *instead of* processing the request, so even a
#: non-idempotent method (POST) can be replayed safely.
RETRY_STATUS_ANY_METHOD = frozenset({429, 503})
#: Methods where a replay cannot cause a duplicated side effect.
IDEMPOTENT_METHODS = frozenset({"GET", "HEAD", "OPTIONS", "PUT", "DELETE"})

#: Failures where the request provably never reached the server.
_NEVER_SENT = (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout)
#: Failures where the server may or may not have processed the request.
_MAYBE_SENT = (httpx.ReadTimeout, httpx.ReadError, httpx.RemoteProtocolError)

TimeoutLike = Union[float, httpx.Timeout]
SleepFn = Callable[[float], Awaitable[None]]


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _parse_retry_after(value: Optional[str]) -> Optional[float]:
    """Parse a Retry-After header (delta-seconds or HTTP-date) into seconds."""
    if not value:
        return None
    value = value.strip()
    if value.isdigit():
        return float(value)
    try:
        when = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if when is None:
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0.0, when.timestamp() - time.time())


def _is_permanent_dns_failure(exc: BaseException) -> bool:
    """True when the exception chain contains a *deterministic* DNS failure.

    ``EAI_AGAIN`` (temporary resolver failure) is deliberately excluded so it
    stays retryable.
    """
    seen = set()
    cur: Optional[BaseException] = exc
    while cur is not None and id(cur) not in seen:
        seen.add(id(cur))
        if isinstance(cur, socket.gaierror):
            return cur.errno != getattr(socket, "EAI_AGAIN", object())
        cur = cur.__cause__ or cur.__context__
    return False


def _validate_url(url: Union[str, httpx.URL]) -> None:
    parts = urlsplit(str(url))
    if parts.scheme.lower() not in ("http", "https") or not parts.hostname:
        raise httpx.UnsupportedProtocol(
            f"Only absolute http(s) URLs are allowed, got: {str(url)[:120]!r}"
        )


# --------------------------------------------------------------------------- #
# Client
# --------------------------------------------------------------------------- #
class HolmesHTTPClient:
    """Pooled, retrying wrapper around ``httpx.AsyncClient``.

    The underlying client is created lazily on first use and transparently
    re-created if the running event loop changes (scripts calling
    ``asyncio.run`` repeatedly, pytest, ...).
    """

    def __init__(
        self,
        *,
        name: str = "default",
        timeout: TimeoutLike = DEFAULT_TIMEOUT,
        limits: httpx.Limits = DEFAULT_LIMITS,
        max_retries: int = 2,
        backoff_base: float = 0.5,
        backoff_max: float = 10.0,
        backoff_jitter: float = 0.25,
        headers: Optional[Mapping[str, str]] = None,
        verify: bool = True,
        proxy: Optional[str] = None,
        follow_redirects: bool = True,
        max_concurrency: int = 50,
        transport: Optional[httpx.AsyncBaseTransport] = None,
        sleep: Optional[SleepFn] = None,
    ) -> None:
        self.name = name
        self._timeout = timeout if isinstance(timeout, httpx.Timeout) else httpx.Timeout(timeout)
        self._limits = limits
        self._max_retries = max(0, int(max_retries))
        self._backoff_base = backoff_base
        self._backoff_max = backoff_max
        self._backoff_jitter = backoff_jitter
        self._headers = {**DEFAULT_HEADERS, **(headers or {})}
        self._verify = verify
        self._proxy = proxy
        self._follow_redirects = follow_redirects
        self._max_concurrency = max(1, int(max_concurrency))
        self._transport = transport
        self._sleep: SleepFn = sleep or asyncio.sleep

        self._client: Optional[httpx.AsyncClient] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._stats = {"attempts": 0, "retries": 0, "failures": 0}

    # -- lifecycle ---------------------------------------------------------- #
    def _ensure_client(self) -> httpx.AsyncClient:
        loop = asyncio.get_running_loop()
        if self._client is None or self._client.is_closed or self._loop is not loop:
            if self._client is not None and self._loop is not loop:
                logger.debug("[%s] event loop changed, rebuilding HTTP client", self.name)
            kwargs: Dict[str, Any] = dict(
                timeout=self._timeout,
                limits=self._limits,
                headers=self._headers,
                follow_redirects=self._follow_redirects,
            )
            if self._transport is not None:
                kwargs["transport"] = self._transport
            else:
                kwargs["verify"] = self._verify
                if self._proxy:
                    kwargs["proxy"] = self._proxy
            self._client = httpx.AsyncClient(**kwargs)
            self._loop = loop
            self._semaphore = asyncio.Semaphore(self._max_concurrency)
        return self._client

    async def start(self) -> None:
        """Eagerly build the connection pool (call from app startup)."""
        self._ensure_client()

    async def aclose(self) -> None:
        client, self._client = self._client, None
        if client is not None and not client.is_closed and self._loop is asyncio.get_running_loop():
            await client.aclose()

    async def __aenter__(self) -> "HolmesHTTPClient":
        await self.start()
        return self

    async def __aexit__(self, *exc_info: Any) -> None:
        await self.aclose()

    @property
    def stats(self) -> Dict[str, int]:
        return dict(self._stats)

    # -- retry policy ------------------------------------------------------- #
    def _delay(self, attempt: int, retry_after: Optional[float]) -> float:
        if retry_after is not None:
            return min(retry_after, self._backoff_max)
        exp = min(self._backoff_max, self._backoff_base * (2 ** attempt))
        return min(self._backoff_max, exp + random.uniform(0, self._backoff_jitter))

    @staticmethod
    def _should_retry_status(method: str, status: int) -> bool:
        if status not in RETRY_STATUS:
            return False
        if method in IDEMPOTENT_METHODS:
            return True
        return status in RETRY_STATUS_ANY_METHOD

    @staticmethod
    def _should_retry_exception(method: str, exc: Exception) -> bool:
        if _is_permanent_dns_failure(exc):
            return False
        if isinstance(exc, _NEVER_SENT):
            return True
        if isinstance(exc, _MAYBE_SENT):
            return method in IDEMPOTENT_METHODS
        return False

    # -- core --------------------------------------------------------------- #
    async def request(
        self,
        method: str,
        url: Union[str, httpx.URL],
        *,
        headers: Optional[Mapping[str, str]] = None,
        timeout: Optional[TimeoutLike] = None,
        retries: Optional[int] = None,
        raise_for_status: bool = False,
        **kwargs: Any,
    ) -> httpx.Response:
        """Send a request with pooling, concurrency cap and retries.

        * After the retry budget is exhausted on a retryable *status*, the last
          real response is returned, so callers keep checking ``status_code``.
        * After the budget is exhausted on a transport error, the last
          ``httpx`` exception is re-raised.
        """
        method = method.upper()
        _validate_url(url)
        client = self._ensure_client()
        assert self._semaphore is not None
        budget = self._max_retries if retries is None else max(0, int(retries))

        send_kwargs = dict(kwargs)
        if headers:
            send_kwargs["headers"] = dict(headers)
        if timeout is not None:
            send_kwargs["timeout"] = timeout

        attempt = 0
        while True:
            self._stats["attempts"] += 1
            try:
                async with self._semaphore:
                    response = await client.request(method, url, **send_kwargs)
            except httpx.HTTPError as exc:
                if attempt < budget and self._should_retry_exception(method, exc):
                    delay = self._delay(attempt, None)
                    logger.warning(
                        "[%s] %s %s failed (%s: %s); retry %d/%d in %.2fs",
                        self.name, method, url, type(exc).__name__, exc,
                        attempt + 1, budget, delay,
                    )
                    self._stats["retries"] += 1
                    attempt += 1
                    await self._sleep(delay)
                    continue
                self._stats["failures"] += 1
                raise

            if attempt < budget and self._should_retry_status(method, response.status_code):
                delay = self._delay(attempt, _parse_retry_after(response.headers.get("Retry-After")))
                logger.warning(
                    "[%s] %s %s -> HTTP %d; retry %d/%d in %.2fs",
                    self.name, method, url, response.status_code,
                    attempt + 1, budget, delay,
                )
                await response.aclose()
                self._stats["retries"] += 1
                attempt += 1
                await self._sleep(delay)
                continue

            if raise_for_status:
                response.raise_for_status()
            return response

    # -- verbs -------------------------------------------------------------- #
    async def get(self, url: Union[str, httpx.URL], **kwargs: Any) -> httpx.Response:
        return await self.request("GET", url, **kwargs)

    async def head(self, url: Union[str, httpx.URL], **kwargs: Any) -> httpx.Response:
        return await self.request("HEAD", url, **kwargs)

    async def post(self, url: Union[str, httpx.URL], **kwargs: Any) -> httpx.Response:
        return await self.request("POST", url, **kwargs)

    async def put(self, url: Union[str, httpx.URL], **kwargs: Any) -> httpx.Response:
        return await self.request("PUT", url, **kwargs)

    async def delete(self, url: Union[str, httpx.URL], **kwargs: Any) -> httpx.Response:
        return await self.request("DELETE", url, **kwargs)

    async def get_json(self, url: Union[str, httpx.URL], **kwargs: Any) -> Any:
        """GET + ``raise_for_status`` + ``.json()`` in one call."""
        kwargs.setdefault("raise_for_status", True)
        return (await self.get(url, **kwargs)).json()


# --------------------------------------------------------------------------- #
# Factory + process-wide registry
# --------------------------------------------------------------------------- #
_registry: Dict[str, HolmesHTTPClient] = {}


def build_http_client(**overrides: Any) -> HolmesHTTPClient:
    """Create a dedicated, *unmanaged* client. The caller must ``aclose()`` it
    (``async with build_http_client(proxy=...) as c:`` does that for you)."""
    return HolmesHTTPClient(**overrides)


def get_http_client() -> HolmesHTTPClient:
    """Shared client with strict TLS verification (use this by default)."""
    client = _registry.get("default")
    if client is None:
        client = _registry["default"] = HolmesHTTPClient(name="default")
    return client


def get_insecure_http_client() -> HolmesHTTPClient:
    """Shared client with TLS verification DISABLED.

    Only for probing *target* hosts that may have expired/self-signed certs
    (takeover checks, header audits). Never send API keys through it.
    """
    client = _registry.get("insecure")
    if client is None:
        client = _registry["insecure"] = HolmesHTTPClient(name="insecure", verify=False)
    return client


def http_client_dependency() -> HolmesHTTPClient:
    """FastAPI provider: ``http: HolmesHTTPClient = Depends(http_client_dependency)``."""
    return get_http_client()


async def startup_http_clients() -> None:
    await get_http_client().start()
    logger.info("HTTP client pool ready")


async def shutdown_http_clients() -> None:
    clients = list(_registry.values())
    _registry.clear()
    for client in clients:
        await client.aclose()
    logger.info("HTTP client pool closed")


# --------------------------------------------------------------------------- #
# Backward compatibility
# --------------------------------------------------------------------------- #
class OSINTHTTPClient(HolmesHTTPClient):
    """Deprecated: use ``get_http_client()``.

    Keeps the old ``OSINTHTTPClient(timeout, max_retries)`` constructor and
    ``get``/``post``/``request(method, url, headers=None, **kw)`` signatures.
    """

    def __init__(self, timeout: float = 10.0, max_retries: int = 4) -> None:
        super().__init__(
            name="legacy",
            timeout=timeout,
            max_retries=max_retries,
            backoff_base=1.0,
            backoff_max=10.0,
            backoff_jitter=0.5,
            headers={"User-Agent": "Holmes-OSINT-Intelligence-Agent/3.0", "Accept": "application/json"},
        )
