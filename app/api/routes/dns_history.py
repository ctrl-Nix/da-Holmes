from fastapi import APIRouter, HTTPException, Query, status
import httpx
import logging

router = APIRouter()
logger = logging.getLogger("holmes.dns_history")

@router.get("/history", summary="Passive DNS History", description="Fetch DNS history for a domain using free sources.")
async def get_dns_history(
    domain: str = Query(..., description="Target domain")
):
    domain = domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain cannot be empty.")

    results = {
        "domain": domain,
        "history": [],
        "source": "HackerTarget / crt.sh"
    }

    # Use HackerTarget Host Search as a proxy for DNS history / subdomains
    try:
        url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                text = resp.text.strip()
                if "error" not in text.lower() and text:
                    for line in text.split("\n"):
                        parts = line.split(",")
                        if len(parts) >= 2:
                            results["history"].append({
                                "record_type": "A",
                                "host": parts[0].strip(),
                                "ip": parts[1].strip()
                            })
    except Exception as e:
        logger.error(f"HackerTarget DNS history failed for {domain}: {e}")

    # Fallback/Enhancement with crt.sh
    try:
        crt_url = f"https://crt.sh/?q={domain}&output=json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            crt_resp = await client.get(crt_url)
            if crt_resp.status_code == 200:
                data = crt_resp.json()
                for entry in data[:20]: # Limit to 20 for brevity
                    results["history"].append({
                        "record_type": "CERT",
                        "host": entry.get("name_value", ""),
                        "issuer": entry.get("issuer_name", ""),
                        "date": entry.get("not_before", "")
                    })
    except Exception as e:
        logger.error(f"crt.sh DNS history failed for {domain}: {e}")

    return results
