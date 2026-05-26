from fastapi import APIRouter, HTTPException, Query, status
import httpx
import re

router = APIRouter()

def is_valid_ipv4(ip: str) -> bool:
    pattern = re.compile(r"^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$")
    return bool(pattern.match(ip))

@router.get("/scan", summary="IoT InternetDB Scan")
async def scan_iot(
    ip: str = Query(..., description="IP Address to scan (IPv4)")
):
    ip = ip.strip()
    if not is_valid_ipv4(ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid IPv4 address format."
        )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Using Shodan's free, keyless InternetDB API
            url = f"https://internetdb.shodan.io/{ip}"
            response = await client.get(url)
            
            if response.status_code == 404:
                return {
                    "ip": ip,
                    "ports": [],
                    "cpes": [],
                    "hostnames": [],
                    "tags": [],
                    "vulns": [],
                    "message": "No data found for this IP in InternetDB."
                }
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to retrieve data from InternetDB."
                )

            data = response.json()
            return {
                "ip": data.get("ip", ip),
                "ports": data.get("ports", []),
                "cpes": data.get("cpes", []),
                "hostnames": data.get("hostnames", []),
                "tags": data.get("tags", []),
                "vulns": data.get("vulns", []),
                "message": "Successfully retrieved IoT intelligence."
            }
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error while contacting InternetDB: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the IoT scan."
        )
