"""
Corporate Scanner Module
========================
Performs domain-level OSINT using only public, unauthenticated data sources.

Techniques Used
---------------
1. Certificate Transparency Logs (crt.sh)
   - Queries the public crt.sh JSON API to enumerate subdomains that have
     ever had a TLS/SSL certificate issued for the target domain.
   - No API key required. Data is publicly mandated by CA/Browser Forum rules.

2. DNS Resolution (socket)
   - Uses Python's built-in socket module to resolve the main domain to its
     primary IP address via the OS resolver.

Ethical Principles Applied
--------------------------
- Only public, unauthenticated endpoints are queried.
- No port scanning, banner grabbing, or active enumeration.
- Respects HTTP timeouts; does not hammer services.
- Uses a descriptive User-Agent.
"""

from __future__ import annotations

import asyncio
import logging
import re
import socket
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_CRT_SH_URL = "https://crt.sh/?q=%.{domain}&output=json"

_HEADERS = {
    "User-Agent": (
        "OSINT-Tool/1.0 (Educational/Ethical Research; "
        "https://github.com/your-org/osint-tool)"
    ),
    "Accept": "application/json",
}

_TIMEOUT = httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=5.0)

# Regex: valid subdomain characters only (prevents injection or junk entries)
_SUBDOMAIN_RE = re.compile(r"^[a-zA-Z0-9*._-]+$")


# ---------------------------------------------------------------------------
# Result Dataclass
# ---------------------------------------------------------------------------

@dataclass
class DomainScanResult:
    """Structured output of a CorporateScanner run."""

    domain: str
    ip_address: Optional[str]               # None if DNS resolution fails
    subdomains: list[str] = field(default_factory=list)
    subdomain_count: int = 0
    crt_sh_error: Optional[str] = None      # Set if CT log query failed
    dns_error: Optional[str] = None         # Set if DNS resolution failed


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_ip(domain: str) -> tuple[Optional[str], Optional[str]]:
    """
    Resolve domain → IP using the OS DNS resolver (synchronous).
    Returns (ip_address, error_message).
    """
    try:
        ip = socket.gethostbyname(domain)
        logger.debug("DNS resolved %s → %s", domain, ip)
        return ip, None
    except socket.gaierror as exc:
        logger.warning("DNS resolution failed for '%s': %s", domain, exc)
        return None, str(exc)


def _parse_subdomains(domain: str, entries: list[dict]) -> list[str]:
    """
    Extract unique, clean subdomain strings from a crt.sh JSON response.

    crt.sh returns entries with a 'name_value' field that may contain
    multiple newline-separated names, wildcard prefixes (*.example.com),
    and duplicate entries from multiple certificates.
    """
    seen: set[str] = set()
    result: list[str] = []

    target_apex = domain.lower().lstrip(".")

    for entry in entries:
        raw: str = entry.get("name_value", "")
        # Split multi-line name_value fields
        for name in raw.splitlines():
            name = name.strip().lower().rstrip(".")
            if not name:
                continue
            # Keep only names that belong to our target domain
            if not (name == target_apex or name.endswith(f".{target_apex}")):
                continue
            # Reject names with illegal characters
            if not _SUBDOMAIN_RE.match(name):
                continue
            if name not in seen:
                seen.add(name)
                result.append(name)

    # Stable sort: apex first, then alphabetical
    result.sort(key=lambda s: (s != target_apex, s))
    return result


# ---------------------------------------------------------------------------
# Corporate Scanner — Public API
# ---------------------------------------------------------------------------

class CorporateScanner:
    """
    Asynchronous domain intelligence scanner.

    Usage
    -----
    >>> scanner = CorporateScanner()
    >>> result = await scanner.scan("example.com")
    >>> print(result.ip_address, result.subdomains[:5])
    """

    def __init__(self, timeout: httpx.Timeout = _TIMEOUT) -> None:
        self._timeout = timeout

    async def scan(self, domain: str) -> DomainScanResult:
        """
        Run all domain OSINT checks concurrently.

        Parameters
        ----------
        domain : str
            Apex domain to investigate (e.g. 'example.com').
            Leading 'http(s)://' and trailing slashes are stripped.

        Returns
        -------
        DomainScanResult
            Contains the resolved IP, deduplicated subdomain list,
            and any per-source error messages.
        """
        domain = _normalise_domain(domain)
        logger.info("Starting corporate scan for domain: '%s'", domain)

        # Run DNS (sync, in thread pool) and CT log fetch concurrently
        ip_task = asyncio.get_event_loop().run_in_executor(None, _resolve_ip, domain)
        ct_task = self._fetch_ct_subdomains(domain)

        (ip_address, dns_error), (subdomains, crt_err) = await asyncio.gather(
            ip_task, ct_task
        )

        result = DomainScanResult(
            domain=domain,
            ip_address=ip_address,
            subdomains=subdomains,
            subdomain_count=len(subdomains),
            crt_sh_error=crt_err,
            dns_error=dns_error,
        )

        logger.info(
            "Corporate scan complete for '%s': IP=%s, subdomains=%d",
            domain, ip_address, len(subdomains),
        )
        return result

    async def _fetch_ct_subdomains(
        self, domain: str
    ) -> tuple[list[str], Optional[str]]:
        """
        Query crt.sh Certificate Transparency logs for the domain.
        Falls back to HackerTarget if crt.sh fails.

        Returns (subdomains_list, error_string_or_None).
        """
        url = _CRT_SH_URL.format(domain=domain)
        errors = []
        
        # 1. Try crt.sh
        try:
            async with httpx.AsyncClient(
                headers=_HEADERS,
                timeout=self._timeout,
                follow_redirects=True,
            ) as client:
                resp = await client.get(url)

            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    subdomains = _parse_subdomains(domain, data)
                    logger.debug("crt.sh returned %d entries → %d unique subdomains", len(data), len(subdomains))
                    return subdomains, None
                else:
                    errors.append("crt.sh response was not a JSON array")
            else:
                errors.append(f"crt.sh returned HTTP {resp.status_code}")

        except Exception as exc:
            errors.append(f"crt.sh error: {exc}")

        # 2. Fallback to HackerTarget
        logger.info("crt.sh failed, falling back to HackerTarget for domain: '%s'", domain)
        try:
            url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
            async with httpx.AsyncClient(headers=_HEADERS, timeout=self._timeout) as client:
                resp = await client.get(url)

            if resp.status_code == 200:
                subdomains = set()
                text = resp.text
                for line in text.splitlines():
                    if "," in line:
                        sub = line.split(",")[0].strip().lower()
                        if sub and not sub.startswith("*"):
                            if sub == domain or sub.endswith(f".{domain}"):
                                subdomains.add(sub)
                
                result = list(subdomains)
                result.sort(key=lambda s: (s != domain, s))
                logger.debug("HackerTarget returned %d unique subdomains", len(result))
                return result, None
            else:
                errors.append(f"HackerTarget returned HTTP {resp.status_code}")
        except Exception as exc:
            errors.append(f"HackerTarget error: {exc}")

        # If both failed
        msg = f"Failed to fetch subdomains: {'; '.join(errors)}"
        logger.warning(msg)
        return [], msg


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _normalise_domain(raw: str) -> str:
    """Strip protocol, path, and whitespace from a raw domain string."""
    raw = raw.strip().lower()
    # Remove protocol
    for prefix in ("https://", "http://"):
        if raw.startswith(prefix):
            raw = raw[len(prefix):]
    # Remove path/query/fragment
    raw = raw.split("/")[0].split("?")[0].split("#")[0]
    # Remove www. prefix (optional — keep if the user explicitly types it,
    # but scan the apex for broader CT log coverage)
    if raw.startswith("www."):
        raw = raw[4:]
    return raw
