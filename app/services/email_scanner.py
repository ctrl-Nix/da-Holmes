import asyncio
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class EmailScanner:
    """
    Checks if an email is registered on various platforms using holehe.
    """
    def __init__(self):
        self.executable_path = r"C:\Users\KIIT\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\holehe.exe"

    async def scan_email(self, email: str) -> Dict[str, Any]:
        """
        Runs holehe on the given email and returns the list of platforms found.
        """
        result = {
            "email": email,
            "status": "success",
            "platforms_found": [],
            "message": ""
        }

        try:
            # Run holehe via subprocess
            # Using --only-used to get only positive matches
            # Using --no-color for easier parsing
            cmd = [self.executable_path, email, "--only-used", "--no-color", "--no-clear"]
            
            # Run async subprocess
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error("Holehe failed with return code %d", process.returncode)
                logger.error("Stderr: %s", stderr.decode('utf-8'))
                result["status"] = "error"
                result["message"] = "Holehe scan failed."
                return result

            output = stdout.decode('utf-8')
            lines = output.splitlines()
            
            found_platforms = []
            for line in lines:
                # Holehe usually outputs "[+] platform.com" for found accounts
                if "[+]" in line:
                    parts = line.split("[+]")
                    if len(parts) > 1:
                        platform_name = parts[1].strip()
                        found_platforms.append(platform_name)
                        
            result["platforms_found"] = found_platforms
            return result

        except Exception as e:
            logger.exception("Error running email scan: %s", e)
            result["status"] = "error"
            result["message"] = str(e)
            return result
