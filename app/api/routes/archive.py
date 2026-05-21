from fastapi import APIRouter, HTTPException, Request
import httpx
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/")
async def get_archive_data(request: Request, domain: str):
    """
    Check the Wayback Machine for historical snapshots of a domain.
    """
    history_url = f"https://web.archive.org/web/*/{domain}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }
    
    try:
        # Try Availability API first (Fastest)
        avail_url = f"https://archive.org/wayback/available?url={domain}"
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=10.0) as client:
            try:
                response = await client.get(avail_url)
                if response.status_code == 200:
                    data = response.json()
                    snapshots = data.get("archived_snapshots", {})
                    if "closest" in snapshots:
                        return {
                            "status": "success",
                            "domain": domain,
                            "available": True,
                            "closest_snapshot": snapshots["closest"]["url"],
                            "timestamp": snapshots["closest"]["timestamp"],
                            "history_url": history_url
                        }
            except Exception as e:
                logger.warning(f"Availability API failed: {e}")

        # Fallback 1: CDX API (More comprehensive)
        try:
            cdx_url = f"https://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=1"
            async with httpx.AsyncClient(headers=headers, timeout=10.0) as client:
                cdx_response = await client.get(cdx_url)
                if cdx_response.status_code == 200:
                    cdx_data = cdx_response.json()
                    if len(cdx_data) > 1:
                        latest = cdx_data[1]
                        # CDX format: [urlkey, timestamp, original, mimetype, statuscode, digest, length]
                        return {
                            "status": "success",
                            "domain": domain,
                            "available": True,
                            "closest_snapshot": f"https://web.archive.org/web/{latest[1]}/{latest[2]}",
                            "timestamp": latest[1],
                            "history_url": history_url
                        }
        except Exception as e:
            logger.warning(f"CDX API failed: {e}")

        # Fallback 2: Simple Check (Return manual link)
        return {
            "status": "success",
            "domain": domain,
            "available": False,
            "message": "Snapshot detection inconclusive. Please check the archive manually.",
            "history_url": history_url
        }

    except Exception as e:
        logger.error(f"Unexpected error in archive route: {e}")
        return {
            "status": "error",
            "message": f"Intelligence retrieval failed: {str(e)}",
            "history_url": history_url
        }
