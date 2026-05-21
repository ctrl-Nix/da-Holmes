"""
Application Configuration
Centralised settings loaded from environment variables / .env file.
"""

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
    ]

    # --- HTTP Client Settings ---
    REQUEST_TIMEOUT_SECONDS: float = 10.0
    MAX_CONCURRENT_REQUESTS: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
