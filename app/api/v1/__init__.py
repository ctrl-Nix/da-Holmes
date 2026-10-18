# app/api/v1 package
from app.api.v1.router import register_routers, build_v1_router, LEGACY_ROUTES

__all__ = ["register_routers", "build_v1_router", "LEGACY_ROUTES"]
