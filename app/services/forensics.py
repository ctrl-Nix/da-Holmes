import logging
from io import BytesIO
from typing import Any, Dict

import piexif
from PIL import Image

logger = logging.getLogger(__name__)

class EXIFForensics:
    """
    Extracts hidden metadata from images efficiently using Pillow and piexif.
    """

    def extract_exif_metadata(self, file_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts essential EXIF tags: DateTimeOriginal, Make, Model, and GPSInfo.
        """
        result = {
            "status": "success",
            "DateTimeOriginal": None,
            "Make": None,
            "Model": None,
            "GPSInfo": None
        }

        try:
            # Open image using BytesIO to keep it lightweight (in-memory)
            with Image.open(BytesIO(file_bytes)) as img:
                if "exif" not in img.info:
                    return {"status": "error", "message": "No metadata found."}

                exif_dict = piexif.load(img.info["exif"])

                # Parse DateTimeOriginal (0x9003 in Exif IFD)
                if piexif.ExifIFD.DateTimeOriginal in exif_dict.get("Exif", {}):
                    raw_dt = exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal]
                    if isinstance(raw_dt, bytes):
                        result["DateTimeOriginal"] = raw_dt.decode("utf-8").strip('\x00')

                # Parse Make and Model (0x010f, 0x0110 in 0th IFD)
                if piexif.ImageIFD.Make in exif_dict.get("0th", {}):
                    raw_make = exif_dict["0th"][piexif.ImageIFD.Make]
                    if isinstance(raw_make, bytes):
                        result["Make"] = raw_make.decode("utf-8").strip('\x00')

                if piexif.ImageIFD.Model in exif_dict.get("0th", {}):
                    raw_model = exif_dict["0th"][piexif.ImageIFD.Model]
                    if isinstance(raw_model, bytes):
                        result["Model"] = raw_model.decode("utf-8").strip('\x00')

                # Parse GPSInfo
                gps_dict = exif_dict.get("GPS", {})
                if gps_dict and piexif.GPSIFD.GPSLatitude in gps_dict and piexif.GPSIFD.GPSLongitude in gps_dict:
                    result["GPSInfo"] = self._format_gps(gps_dict)

                # Check if any significant data was actually found
                if not any([result["DateTimeOriginal"], result["Make"], result["Model"], result["GPSInfo"]]):
                    return {"status": "error", "message": "No metadata found."}

                return result

        except Exception as e:
            logger.error("Error extracting EXIF: %s", e)
            return {"status": "error", "message": "No metadata found."}

    def _format_gps(self, gps_dict: dict) -> str:
        """
        Converts raw piexif GPS dictionary to a readable coordinate string.
        """
        try:
            def _convert_to_degrees(value):
                d = value[0][0] / value[0][1]
                m = value[1][0] / value[1][1]
                s = value[2][0] / value[2][1]
                return d + (m / 60.0) + (s / 3600.0)

            lat_ref = gps_dict.get(piexif.GPSIFD.GPSLatitudeRef, b'N').decode('utf-8')
            lat = gps_dict.get(piexif.GPSIFD.GPSLatitude)

            lon_ref = gps_dict.get(piexif.GPSIFD.GPSLongitudeRef, b'E').decode('utf-8')
            lon = gps_dict.get(piexif.GPSIFD.GPSLongitude)

            if lat and lon:
                lat_deg = _convert_to_degrees(lat)
                if lat_ref != 'N':
                    lat_deg = -lat_deg

                lon_deg = _convert_to_degrees(lon)
                if lon_ref != 'E':
                    lon_deg = -lon_deg

                return f"{lat_deg:.6f}, {lon_deg:.6f}"
        except Exception as e:
            logger.warning("Failed to parse GPS data: %s", e)

        return "Data unreadable"
