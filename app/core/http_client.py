import logging
import httpx
from tenacity import retry, wait_exponential_jitter, stop_after_attempt, retry_if_exception_type, before_sleep_log

logger = logging.getLogger("holmes-http")

class OSINTHTTPClient:
    """
    A secure, resilient HTTP client wrapper using httpx.AsyncClient.
    Features automatic retries with exponential backoff and randomized jitter for HTTP 429 errors.
    """
    def __init__(self, timeout: float = 10.0, max_retries: int = 4):
        self.timeout = timeout
        self.max_retries = max_retries
        self.headers = {
            "User-Agent": "Holmes-OSINT-Intelligence-Agent/3.0",
            "Accept": "application/json"
        }

    class TooManyRequestsException(Exception):
        pass

    @retry(
        retry=retry_if_exception_type(TooManyRequestsException),
        # Wait 1s, 2s, 4s... with a max wait of 10s, adding up to 500ms of randomized jitter.
        wait=wait_exponential_jitter(initial=1, max=10, jitter=0.5),
        stop=stop_after_attempt(5),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True
    )
    async def _request_with_retry(self, client: httpx.AsyncClient, method: str, url: str, **kwargs) -> httpx.Response:
        response = await client.request(method, url, timeout=self.timeout, **kwargs)
        if response.status_code == 429:
            logger.warning(f"HTTP 429 (Too Many Requests) hit on {url}. Retrying using exponential backoff + jitter...")
            raise self.TooManyRequestsException("Outbound OSINT request was rate limited.")
        return response

    async def request(self, method: str, url: str, headers: dict = None, **kwargs) -> httpx.Response:
        """
        Executes an outbound HTTP request using AsyncClient with error handling and rate limit retries.
        """
        request_headers = {**self.headers, **(headers or {})}
        
        async with httpx.AsyncClient(verify=True) as client:
            try:
                response = await self._request_with_retry(
                    client=client,
                    method=method,
                    url=url,
                    headers=request_headers,
                    **kwargs
                )
                return response
            except self.TooManyRequestsException:
                logger.error(f"Failed outbound request to {url} due to persistent rate limiting (429).")
                # Return a synthetic 429 response so upstream can degrade gracefully
                return httpx.Response(
                    status_code=429,
                    content=b'{"error": "Too Many Requests", "detail": "Rate limit exceeded. Max retries exhausted."}'
                )
            except httpx.HTTPError as e:
                logger.error(f"Outbound HTTP request error to {url}: {e}")
                raise e

    async def get(self, url: str, headers: dict = None, **kwargs) -> httpx.Response:
        return await self.request("GET", url, headers=headers, **kwargs)

    async def post(self, url: str, headers: dict = None, **kwargs) -> httpx.Response:
        return await self.request("POST", url, headers=headers, **kwargs)
