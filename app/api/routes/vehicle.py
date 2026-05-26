from fastapi import APIRouter, HTTPException, Path, status
import httpx

router = APIRouter()

@router.get("/vin/{vin}", summary="Vehicle VIN Reconnaissance")
async def decode_vin(
    vin: str = Path(..., min_length=17, max_length=17, description="17-character Vehicle Identification Number")
):
    vin = vin.strip().upper()
    
    if len(vin) != 17:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VIN must be exactly 17 characters long."
        )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Using NHTSA's free public VIN decoder API
            url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
            response = await client.get(url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to retrieve data from NHTSA API."
                )

            data = response.json()
            results = data.get("Results", [])
            
            if not results:
                raise HTTPException(status_code=404, detail="No data returned for this VIN.")
                
            vehicle = results[0]
            
            # Check for error code in response
            error_code = vehicle.get("ErrorCode", "")
            if error_code and error_code != "0" and "0 -" not in error_code:
                # 0 means successful decode
                return {
                    "vin": vin,
                    "error": vehicle.get("ErrorText", "Invalid VIN or decoding failed.")
                }

            return {
                "vin": vin,
                "make": vehicle.get("Make"),
                "model": vehicle.get("Model"),
                "year": vehicle.get("ModelYear"),
                "body_class": vehicle.get("BodyClass"),
                "engine_cylinders": vehicle.get("EngineCylinders"),
                "engine_hp": vehicle.get("EngineHP"),
                "fuel_type": vehicle.get("FuelTypePrimary"),
                "drive_type": vehicle.get("DriveType"),
                "plant_country": vehicle.get("PlantCountry"),
                "plant_city": vehicle.get("PlantCity"),
                "manufacturer": vehicle.get("Manufacturer"),
                "vehicle_type": vehicle.get("VehicleType")
            }

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Network error while contacting NHTSA API: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the VIN."
        )
