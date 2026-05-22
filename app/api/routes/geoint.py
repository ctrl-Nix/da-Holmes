from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import JSONResponse
import httpx
import re
import os
import base64
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

async def reverse_geocode_coords(lat: float, lon: float) -> str:
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {"User-Agent": "Holmes-OSINT-Workspace/2.5"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=5.0)
            if resp.status_code == 200:
                return resp.json().get("display_name", "Unknown street address")
    except Exception as e:
        logger.warning(f"OSM Nominatim failed: {e}")
    return "Address resolution inconclusive"

@router.get("/")
async def geoint_reverse(request: Request = None, lat: float = Query(...), lon: float = Query(...)):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {"User-Agent": "Holmes-OSINT-Workspace/2.5"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                address = data.get("display_name", "Unknown address")
                details = data.get("address", {})
                return {
                    "status": "success",
                    "coordinates": {"lat": lat, "lon": lon},
                    "address": address,
                    "details": {
                        "road": details.get("road") or details.get("suburb") or "Unknown road",
                        "city": details.get("city") or details.get("town") or details.get("village") or "Unknown city",
                        "state": details.get("state") or "Unknown state",
                        "postcode": details.get("postcode") or "Unknown postcode"
                    }
                }
    except Exception as e:
        logger.error(f"Reverse geocode failed: {e}")
        
    return JSONResponse(
        status_code=503,
        content={"status": "unavailable", "reason": "API unreachable"}
    )

@router.get("/bssid")
async def geoint_bssid(request: Request = None, mac: str = Query(...)):
    mac = mac.strip().lower()
    mac_clean = mac.replace("-", ":")
    if not re.match(r'^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$', mac_clean):
        raise HTTPException(status_code=400, detail="Invalid MAC address format (BSSID)")

    ssid = None
    lat = None
    lon = None
    address = None
    success = False

    wigle_auth = os.environ.get("WIGLE_AUTH")
    if wigle_auth:
        headers = {"User-Agent": "Holmes-OSINT-Workspace/2.5"}
        if ":" in wigle_auth:
            encoded = base64.b64encode(wigle_auth.encode("utf-8")).decode("utf-8")
            headers["Authorization"] = f"Basic {encoded}"
        else:
            if wigle_auth.lower().startswith("basic "):
                headers["Authorization"] = wigle_auth
            else:
                headers["Authorization"] = f"Basic {wigle_auth}"

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"https://api.wigle.net/api/v2/network/search?netid={mac_clean}",
                    headers=headers,
                    timeout=6.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results")
                    if results and len(results) > 0:
                        first = results[0]
                        lat = float(first.get("trilat"))
                        lon = float(first.get("trilong"))
                        ssid = first.get("ssid") or "Hidden SSID"
                        success = True
        except Exception as e:
            logger.error(f"Wigle API query failed for {mac_clean}: {e}")

    if success:
        address = await reverse_geocode_coords(lat, lon)
        return {
            "ssid": ssid,
            "lat": lat,
            "lon": lon,
            "address": address
        }
    else:
        logger.warning(f"Wigle API failed or credentials not present for {mac_clean}.")
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "reason": "Wigle API credentials not configured"}
        )
