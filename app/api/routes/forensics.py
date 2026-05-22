from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request
from fastapi.responses import JSONResponse
from io import BytesIO
from PIL import Image
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def _gps_rational_to_decimal(rational_triplet) -> float:
    try:
        def convert_val(val):
            if hasattr(val, 'numerator') and hasattr(val, 'denominator'):
                return float(val.numerator) / float(val.denominator)
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, tuple) or isinstance(val, list):
                if len(val) == 2:
                    return float(val[0]) / float(val[1])
                elif len(val) == 1:
                    return float(val[0])
            return float(str(val))

        d = convert_val(rational_triplet[0])
        m = convert_val(rational_triplet[1])
        s = convert_val(rational_triplet[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception as e:
        logger.warning(f"Error parsing GPS coordinates rational: {e}")
        return 0.0

@router.post("/exif")
async def extract_exif(request: Request, file: UploadFile = File(...)):
    try:
        data = await file.read()
        from PIL.ExifTags import TAGS, GPSTAGS
        
        make = None
        model = None
        date_time = None
        software = None
        gps_data = None
        all_tags = {}

        with Image.open(BytesIO(data)) as img:
            exif = img._getexif()
            if exif:
                for tag_id, val in exif.items():
                    tag_name = TAGS.get(tag_id, str(tag_id))
                    
                    if isinstance(val, bytes):
                        try:
                            val = val.decode('utf-8', errors='ignore').strip('\x00')
                        except:
                            val = str(val)
                    
                    if tag_name == "GPSInfo" and isinstance(val, dict):
                        gps_tags = {}
                        for g_id, g_val in val.items():
                            g_name = GPSTAGS.get(g_id, str(g_id))
                            gps_tags[g_name] = str(g_val)
                        all_tags[tag_name] = gps_tags
                        
                        try:
                            lat_ref = val.get(1)  # GPSLatitudeRef
                            lon_ref = val.get(3)  # GPSLongitudeRef
                            lat_val = val.get(2)  # GPSLatitude
                            lon_val = val.get(4)  # GPSLongitude

                            if lat_val and lon_val and lat_ref and lon_ref:
                                if isinstance(lat_ref, bytes):
                                    lat_ref = lat_ref.decode('utf-8').strip('\x00')
                                if isinstance(lon_ref, bytes):
                                    lon_ref = lon_ref.decode('utf-8').strip('\x00')

                                lat_dec = _gps_rational_to_decimal(lat_val)
                                lon_dec = _gps_rational_to_decimal(lon_val)

                                if lat_ref != 'N':
                                    lat_dec = -lat_dec
                                if lon_ref != 'E':
                                    lon_dec = -lon_dec

                                gps_data = {
                                    "lat": lat_dec,
                                    "lon": lon_dec
                                }
                        except Exception as gpsex:
                            logger.warning(f"GPS parsing sub-error: {gpsex}")
                    else:
                        all_tags[tag_name] = str(val)

                    if tag_name == "Make":
                        make = str(val)
                    elif tag_name == "Model":
                        model = str(val)
                    elif tag_name in ["DateTime", "DateTimeOriginal"]:
                        date_time = str(val)
                    elif tag_name == "Software":
                        software = str(val)

        return {
            "make": make,
            "model": model,
            "datetime": date_time,
            "gps": gps_data,
            "software": software,
            "all_tags": all_tags
        }

    except Exception as e:
        logger.error(f"Pillow EXIF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to process image metadata: {str(e)}")
