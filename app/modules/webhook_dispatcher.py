import httpx
import logging
from datetime import datetime

logger = logging.getLogger("holmes.webhook")

class WebhookDispatcher:
    def __init__(self):
        pass

    async def dispatch(self, webhook_type: str, webhook_url: str, title: str, details: str, risk_level: str = "INFO"):
        if not webhook_url:
            return False

        webhook_type = webhook_type.lower()
        try:
            if webhook_type == "discord":
                return await self._send_discord(webhook_url, title, details, risk_level)
            elif webhook_type == "slack":
                return await self._send_slack(webhook_url, title, details, risk_level)
            elif webhook_type == "jira":
                return await self._send_jira(webhook_url, title, details, risk_level)
            else:
                logger.warning(f"Unsupported webhook type: {webhook_type}")
                # Fallback to generic Discord payload format for backwards compatibility
                return await self._send_discord(webhook_url, title, details, risk_level)
        except Exception as e:
            logger.error(f"Failed to dispatch {webhook_type} webhook to {webhook_url}: {e}")
            return False

    def _get_color(self, risk_level: str) -> int:
        colors = {
            "CRITICAL": 15158332, # Red
            "HIGH": 15105570,     # Orange
            "MEDIUM": 15844367,   # Yellow
            "LOW": 3066993,       # Green
            "INFO": 3447003       # Blue
        }
        return colors.get(risk_level.upper(), 3447003)

    def _get_hex_color(self, risk_level: str) -> str:
        colors = {
            "CRITICAL": "#e74c3c",
            "HIGH": "#e67e22",
            "MEDIUM": "#f1c40f",
            "LOW": "#2ecc71",
            "INFO": "#3498db"
        }
        return colors.get(risk_level.upper(), "#3498db")

    async def _send_discord(self, url: str, title: str, details: str, risk_level: str) -> bool:
        payload = {
            "embeds": [{
                "title": f"🚨 Holmes OSINT Alert: {title}",
                "description": details,
                "color": self._get_color(risk_level),
                "timestamp": datetime.utcnow().isoformat(),
                "footer": {"text": "Holmes Enterprise OSINT"}
            }]
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code in [200, 204]

    async def _send_slack(self, url: str, title: str, details: str, risk_level: str) -> bool:
        payload = {
            "attachments": [
                {
                    "fallback": f"Holmes OSINT Alert: {title}",
                    "color": self._get_hex_color(risk_level),
                    "title": f"🚨 Holmes OSINT Alert: {title}",
                    "text": details,
                    "footer": "Holmes Enterprise OSINT",
                    "ts": int(datetime.utcnow().timestamp())
                }
            ]
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200

    async def _send_jira(self, url: str, title: str, details: str, risk_level: str) -> bool:
        # Assumes the Jira Automation Webhook format which accepts custom JSON
        payload = {
            "data": {
                "summary": f"[Holmes] {title}",
                "description": details,
                "priority": risk_level.upper()
            }
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            # Jira automation webhooks usually return 202 Accepted
            return resp.status_code in [200, 201, 202, 204]

webhook_dispatcher = WebhookDispatcher()
