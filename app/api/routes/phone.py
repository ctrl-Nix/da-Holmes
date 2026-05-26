from fastapi import APIRouter, HTTPException, Query, status
import phonenumbers
from phonenumbers import geocoder, carrier, timezone

router = APIRouter()

@router.get("/phone", summary="Get Phone Number Intelligence")
async def get_phone_intel(
    number: str = Query(..., description="Phone number to lookup (preferably in E.164 format with +)")
):
    try:
        # If the number doesn't start with '+', we try to prepend it to assume international format
        if not number.startswith("+"):
            number = "+" + number

        parsed_number = phonenumbers.parse(number, None)

        if not phonenumbers.is_valid_number(parsed_number):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format."
            )

        # Extract information
        country = geocoder.description_for_number(parsed_number, "en")
        network = carrier.name_for_number(parsed_number, "en")
        time_zones = timezone.time_zones_for_number(parsed_number)

        # Determine line type
        number_type = phonenumbers.number_type(parsed_number)
        line_type_str = "Unknown"
        if number_type == phonenumbers.PhoneNumberType.MOBILE:
            line_type_str = "Mobile"
        elif number_type == phonenumbers.PhoneNumberType.FIXED_LINE:
            line_type_str = "Fixed-line"
        elif number_type == phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE:
            line_type_str = "Fixed-line or Mobile"
        elif number_type == phonenumbers.PhoneNumberType.VOIP:
            line_type_str = "VoIP / Virtual"
        elif number_type == phonenumbers.PhoneNumberType.PREMIUM_RATE:
            line_type_str = "Premium Rate"
        elif number_type == phonenumbers.PhoneNumberType.TOLL_FREE:
            line_type_str = "Toll Free"

        # Basic risk heuristics based on line type
        is_high_risk = "VoIP" in line_type_str or "Virtual" in line_type_str
        risk_level = "HIGH_RISK" if is_high_risk else "LOW_RISK"

        # Format output for the frontend
        return {
            "number": phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164).lstrip("+"),
            "carrier": network if network else "Unknown Network",
            "country": country if country else "Unknown Region",
            "line_type": line_type_str,
            "risk_level": risk_level,
            "source": "Local Parsing (phonenumbers)",
            "timezones": list(time_zones)
        }

    except phonenumbers.phonenumberutil.NumberParseException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse phone number: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the phone number."
        )
