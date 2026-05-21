from fastapi import APIRouter, HTTPException, Request
import httpx

router = APIRouter()

@router.get("/")
async def reverse_geocode(request: Request, lat: float, lon: float):
    """
    Convert GPS coordinates to a physical address using the free OpenStreetMap Nominatim API.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {
            "User-Agent": "DaHolmes-OSINT-Platform/1.0" # Nominatim requires a User-Agent
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success",
                "coordinates": {"lat": lat, "lon": lon},
                "address": data.get("display_name", "Address not found"),
                "details": data.get("address", {})
            }
        else:
            raise HTTPException(
                status_code=503,
                detail={"status": "unavailable", "reason": "API unreachable"}
            )
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "unavailable", "reason": "API unreachable"}
        )
