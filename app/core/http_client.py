"""
Centralized Non-Blocking HTTP Client Factory for da Holmes v2.0
Provides connection pooling, custom timeouts, exponential backoff retries, and jitter.
"""

import asyncio
import logging
import random
from typing import Optional, Dict, Any, Union
import httpx

logger = logging.getLogger("holmes.http_client")

# ---------------------------------------------------------------------------
# Client Configuration & Defaults
# ---------------------------------------------------------------------------
DEFAULT_USER_AGENT = "Holmes-OSINT-Engine/2.0 (+https://github.com/ctrl-Nix/da-Holmes)"
DEFAULT_CONNECT_TIMEOUT = 5.0
DEFAULT_READ_TIMEOUT = 15.0
DEFAULT_WRITE_TIMEOUT = 5.0
DEFAULT_POOL_TIMEOUT = 5.0
DEFAULT_MAX_CONNECTIONS = 100
DEFAULT_MAX_KEEPALIVE_CONNECTIONS = 20
DEFAULT_KEEPALIVE_EXPIRY = 30.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_FACTOR = 0.5

# Singleton client instance
_global_async_client: Optional[httpx.AsyncClient] = None
_client_lock = asyncio.Lock()


def create_async_client(
    timeout: Optional[Union[float, httpx.Timeout]] = None,
    limits: Optional[httpx.Limits] = None,
    headers: Optional[Dict[str, str]] = None,
    verify: bool = True,
    follow_redirects: bool = True,
) -> httpx.AsyncClient:
    """
    Factory to construct a production-ready httpx.AsyncClient with
    connection pooling and standardized timeout limits.
    """
    if timeout is None:
        client_timeout = httpx.Timeout(
            connect=DEFAULT_CONNECT_TIMEOUT,
            read=DEFAULT_READ_TIMEOUT,
            write=DEFAULT_WRITE_TIMEOUT,
            pool=DEFAULT_POOL_TIMEOUT,
        )
    elif isinstance(timeout, (int, float)):
        client_timeout = httpx.Timeout(timeout)
    else:
        client_timeout = timeout

    client_limits = limits or httpx.Limits(
        max_connections=DEFAULT_MAX_CONNECTIONS,
        max_keepalive_connections=DEFAULT_MAX_KEEPALIVE_CONNECTIONS,
        keepalive_expiry=DEFAULT_KEEPALIVE_EXPIRY,
    )

    client_headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate",
    }
    if headers:
        client_headers.update(headers)

    return httpx.AsyncClient(
        timeout=client_timeout,
        limits=client_limits,
        headers=client_headers,
        verify=verify,
        follow_redirects=follow_redirects,
    )


async def get_http_client() -> httpx.AsyncClient:
    """
    Returns the shared global httpx.AsyncClient instance.
    Initializes safely with concurrency lock if not yet created.
    """
    global _global_async_client
    if _global_async_client is not None and not _global_async_client.is_closed:
        return _global_async_client

    async with _client_lock:
        if _global_async_client is None or _global_async_client.is_closed:
            _global_async_client = create_async_client()
            logger.info("Initialized global centralized httpx.AsyncClient connection pool.")
        return _global_async_client


async def close_http_client() -> None:
    """
    Gracefully shuts down the shared global httpx.AsyncClient pool.
    """
    global _global_async_client
    async with _client_lock:
        if _global_async_client is not None:
            try:
                await _global_async_client.aclose()
                logger.info("Closed global centralized httpx.AsyncClient connection pool.")
            except Exception as e:
                logger.error(f"Error closing global httpx.AsyncClient: {e}")
            finally:
                _global_async_client = None


# ---------------------------------------------------------------------------
# High-Level OSINT HTTP Wrapper with Resilience & Rate-Limit Handling
# ---------------------------------------------------------------------------
class OSINTHTTPClient:
    """
    High-level asynchronous OSINT HTTP client supporting:
    - Shared persistent connection pooling
    - Exponential backoff with jitter on HTTP 429 and transient 5xx errors
    - Request tracing and normalized error handling
    """

    def __init__(
        self,
        timeout: float = DEFAULT_READ_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        headers: Optional[Dict[str, str]] = None,
        custom_client: Optional[httpx.AsyncClient] = None,
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.headers = {
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "application/json, text/plain, */*",
            **(headers or {}),
        }
        self._custom_client = custom_client

    async def _get_client(self) -> httpx.AsyncClient:
        if self._custom_client and not self._custom_client.is_closed:
            return self._custom_client
        return await get_http_client()

    async def request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Any] = None,
        json: Optional[Any] = None,
        timeout: Optional[float] = None,
        **kwargs,
    ) -> httpx.Response:
        """
        Executes outbound request with automatic retry on 429 Too Many Requests,
        network dropouts, and transient server errors.
        """
        merged_headers = {**self.headers, **(headers or {})}
        req_timeout = timeout or self.timeout
        client = await self._get_client()

        last_exception = None
        for attempt in range(1, self.max_retries + 2):
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=merged_headers,
                    params=params,
                    data=data,
                    json=json,
                    timeout=req_timeout,
                    **kwargs,
                )

                # Retry on 429 (Rate Limit) or 502/503/504 (Gateway temporary errors)
                if response.status_code in (429, 502, 503, 504) and attempt <= self.max_retries:
                    retry_after = response.headers.get("Retry-After")
                    if retry_after and retry_after.isdigit():
                        sleep_time = float(retry_after)
                    else:
                        sleep_time = (DEFAULT_BACKOFF_FACTOR * (2 ** (attempt - 1))) + random.uniform(0.1, 0.5)

                    logger.warning(
                        f"Transient HTTP {response.status_code} for {url} (attempt {attempt}/{self.max_retries}). "
                        f"Retrying in {sleep_time:.2f}s..."
                    )
                    await asyncio.sleep(sleep_time)
                    continue

                return response

            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout) as e:
                last_exception = e
                if attempt <= self.max_retries:
                    sleep_time = (DEFAULT_BACKOFF_FACTOR * (2 ** (attempt - 1))) + random.uniform(0.1, 0.5)
                    logger.warning(
                        f"Network error {type(e).__name__} connecting to {url} (attempt {attempt}/{self.max_retries}). "
                        f"Retrying in {sleep_time:.2f}s..."
                    )
                    await asyncio.sleep(sleep_time)
                else:
                    logger.error(f"Max retries exhausted for {url}: {e}")
                    raise e
            except httpx.HTTPError as e:
                logger.error(f"HTTP error during {method} {url}: {e}")
                raise e

        # If retries exhausted and synthetic response is required for 429
        return httpx.Response(
            status_code=429,
            content=b'{"error": "Too Many Requests", "detail": "Rate limit exceeded. Max retries exhausted."}',
            headers={"Content-Type": "application/json"},
        )

    async def get(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> httpx.Response:
        return await self.request("GET", url, headers=headers, **kwargs)

    async def post(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> httpx.Response:
        return await self.request("POST", url, headers=headers, **kwargs)

    async def put(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> httpx.Response:
        return await self.request("PUT", url, headers=headers, **kwargs)

    async def delete(self, url: str, headers: Optional[Dict[str, str]] = None, **kwargs) -> httpx.Response:
        return await self.request("DELETE", url, headers=headers, **kwargs)
