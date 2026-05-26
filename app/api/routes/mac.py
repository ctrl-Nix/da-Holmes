from fastapi import APIRouter, HTTPException, Query, status
import httpx

router = APIRouter()

@router.get("/decode", summary="MAC Address OUI Decoder")
async def decode_mac(
    mac: str = Query(..., description="The MAC address to decode")
):
    mac = mac.strip()
    if not mac:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MAC address is required."
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Using maclookup.app public API
            url = f"https://api.maclookup.app/v2/macs/{mac}"
            response = await client.get(url)
            
            if response.status_code == 404:
                 raise HTTPException(status_code=404, detail="MAC address vendor not found.")
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to retrieve data from MAC lookup service."
                )

            data = response.json()
            if not data.get("success") or not data.get("found"):
                raise HTTPException(status_code=404, detail="MAC address vendor not found.")
                
            return {
                "mac_address": mac,
                "prefix": data.get("macPrefix"),
                "vendor": data.get("company"),
                "address": data.get("address"),
                "country": data.get("country"),
                "block_type": data.get("blockType")
            }

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error while contacting MAC Lookup API: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the MAC address."
        )
