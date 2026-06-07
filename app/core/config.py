"""
Application Configuration
Centralised settings loaded from environment variables / .env file.
"""

from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Project Metadata ---
    PROJECT_NAME: str = "OSINT Intelligence Tool"
    PROJECT_DESCRIPTION: str = (
        "A professional, ethical Open Source Intelligence (OSINT) tool "
        "for gathering publicly available information."
    )
    VERSION: str = "1.0.0"

    # --- CORS ---
    # NOTE: Wildcard "*" is incompatible with allow_credentials=True.
    # Always list origins explicitly.
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",  # Vite (alternate loopback)
        "https://da-holmes.vercel.app",  # Production Vercel frontend
    ]

    # --- HTTP Client Settings ---
    REQUEST_TIMEOUT_SECONDS: float = 10.0
    MAX_CONCURRENT_REQUESTS: int = 20

    # --- Social Media Auth (optional — improves accuracy & bypasses bot blocks) ---
    # Instagram: Get from browser DevTools → Application → Cookies → instagram.com
    INSTAGRAM_SESSION_ID: Optional[str] = None       # sessionid cookie value
    INSTAGRAM_DS_USER_ID: Optional[str] = None       # ds_user_id cookie value
    INSTAGRAM_CSRFTOKEN: Optional[str] = None        # csrftoken cookie value

    # Twitter/X: Create app at developer.twitter.com → Keys & Tokens
    TWITTER_BEARER_TOKEN: Optional[str] = None       # Bearer token for API v2

    # TikTok: Unofficial session (from browser cookies)
    TIKTOK_SESSION_ID: Optional[str] = None          # sessionid cookie value

    # LinkedIn: Session cookie (from browser DevTools)
    LINKEDIN_LI_AT: Optional[str] = None             # li_at cookie value

    # Other optional API keys
    GITHUB_TOKEN: Optional[str] = None
    HUNTER_API_KEY: Optional[str] = None
    SHODAN_API_KEY: Optional[str] = None
    HAVEIBEENPWNED_KEY: Optional[str] = None
    VIRUSTOTAL_KEY: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
