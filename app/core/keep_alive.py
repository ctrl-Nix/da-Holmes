import time
import requests
import os
import threading
import logging

logger = logging.getLogger(__name__)

def ping_self():
    """
    Background thread to ping the app every 10 minutes to prevent Render from sleeping.
    """
    url = os.getenv("RENDER_EXTERNAL_URL")
    if not url:
        logger.warning("RENDER_EXTERNAL_URL not set. Keep-alive disabled.")
        return

    logger.info(f"Starting keep-alive heartbeat for {url}")
    while True:
        try:
            response = requests.get(url)
            logger.info(f"Keep-alive ping sent. Status: {response.status_code}")
        except Exception as e:
            logger.error(f"Keep-alive ping failed: {e}")
        
        # Sleep for 10 minutes (600 seconds)
        time.sleep(600)

def start_keep_alive():
    thread = threading.Thread(target=ping_self, daemon=True)
    thread.start()
