from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter()

@router.get("/track", summary="Aviation OSINT Pivot Links")
async def track_aviation(
    tail_number: str = Query(..., description="Aircraft Tail Number (e.g., N12345)")
):
    tail_number = tail_number.strip().upper()
    if not tail_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tail number is required."
        )

    return {
        "tail_number": tail_number,
        "search_links": [
            {
                "platform": "FlightRadar24",
                "url": f"https://www.flightradar24.com/data/aircraft/{tail_number}",
                "description": "Comprehensive historical data and playback of flights."
            },
            {
                "platform": "ADS-B Exchange",
                "url": f"https://globe.adsbexchange.com/?req={tail_number}",
                "description": "Unfiltered, live ADS-B data with no blocked military/private planes."
            },
            {
                "platform": "FlightAware",
                "url": f"https://flightaware.com/live/flight/{tail_number}",
                "description": "Good for scheduled commercial tracking and general aviation details."
            },
            {
                "platform": "FAA Registry (US Only)",
                "url": f"https://registry.faa.gov/aircraftinquiry/Search/NNumberResult?nNumberTxt={tail_number.replace('N', '', 1)}",
                "description": "Check official registration, owner, and engine details (US 'N' numbers only)."
            }
        ]
    }
