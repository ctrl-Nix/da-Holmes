"""
app/api/v1/router.py
====================
Single place where every HTTP router of da Holmes is mounted.

* ``LEGACY_ROUTES`` — the 37 routers that used to be wired by hand inside
  ``main.py``. Prefixes and *registration order* are preserved 1:1, because
  FastAPI resolves overlapping paths first-registered-wins and the frontend
  already depends on these URLs.
* ``build_v1_router()`` — the new ``/api/v1`` surface. Phase 2-5 endpoint
  modules (forensics, network, social, stream) are picked up automatically as
  soon as the file exists, so nothing here needs editing per phase.

``main.py`` only has to call ``register_routers(application)``.
"""
from __future__ import annotations

import importlib
import logging
from dataclasses import dataclass
from types import ModuleType
from typing import Dict, List, Optional, Tuple

from fastapi import APIRouter, FastAPI

logger = logging.getLogger("holmes.router")

LEGACY_PACKAGE = "app.api.routes"
V1_PACKAGE = "app.api.v1.endpoints"
V1_PREFIX = "/api/v1"

#: Modules under ``app/api/v1/endpoints/`` mounted at ``/api/v1/<name>``.
V1_ENDPOINT_MODULES: Tuple[str, ...] = ("forensics", "network", "social", "stream")


@dataclass(frozen=True)
class RouteSpec:
    module: str
    prefix: str = ""
    tags: Tuple[str, ...] = ()


# Order matters. Do not sort alphabetically.
LEGACY_ROUTES: Tuple[RouteSpec, ...] = (
    RouteSpec("scanner", "/api", ("OSINT Scanner",)),
    RouteSpec("analyze", "/api", ("Intelligence Analyst",)),
    RouteSpec("domain", "/api/scan", ("domain",)),
    RouteSpec("security", "/api/security", ("Security Hunter",)),
    RouteSpec("network", "/api/network", ("Network Intelligence",)),
    RouteSpec("forensics", "/api/forensics", ("EXIF Forensics",)),
    RouteSpec("email", "/api/email", ("Email OSINT",)),
    RouteSpec("crypto", "/api/crypto", ("Cryptocurrency OSINT",)),
    RouteSpec("geoint", "/api/geoint", ("Geospatial Intelligence",)),
    RouteSpec("archive", "/api/archive", ("Archive OSINT",)),
    RouteSpec("techstack", "/api/techstack", ("Technographics",)),
    RouteSpec("spoofing", "/api/spoofing", ("Email Spoofing Check",)),
    RouteSpec("threatintel", "/api/threatintel", ("AlienVault Threat Intel",)),
    RouteSpec("certificates", "/api/certificates", ("Certificate Transparency",)),
    RouteSpec("trackers", "/api/trackers", ("Cross-Linked Trackers",)),
    RouteSpec("friendship", "/api", ("Friendship Graph",)),
    RouteSpec("advanced", "/api", ("Advanced OSINT",)),
    RouteSpec("ml_intel", "/api", ("Advanced OSINT",)),
    RouteSpec("unified", "/api", ("Unified OSINT",)),
    RouteSpec("history", "/api", ("Investigation History",)),
    RouteSpec("keys", "/api", ("API Key Settings",)),
    RouteSpec("vault"),
    RouteSpec("github", "/api/github", ("GitHub Organization Scan",)),
    RouteSpec("report", "/api", ("PDF Reports",)),
    RouteSpec("mobile_recon", "/api", ("Mobile App Recon",)),
    RouteSpec("phone", "/api", ("Phone Intelligence",)),
    RouteSpec("corporate_intel", "/api", ("Corporate Entity Intel",)),
    RouteSpec("iot", "/api/iot", ("IoT OSINT",)),
    RouteSpec("darkweb", "/api/darkweb", ("Dark Web Intelligence",)),
    RouteSpec("metadata", "/api/metadata", ("Document Forensics",)),
    RouteSpec("reddit", "/api/reddit", ("Social Media Intel",)),
    RouteSpec("image_osint", "/api/image", ("Image OSINT",)),
    RouteSpec("vehicle", "/api/vehicle", ("Vehicle OSINT",)),
    RouteSpec("aviation", "/api/aviation", ("Aviation OSINT",)),
    RouteSpec("hash", "/api/hash", ("Cryptography Intel",)),
    RouteSpec("mac", "/api/mac", ("Network Intel",)),
    RouteSpec("monitor", "", ("24/7 Monitoring",)),
)


# --------------------------------------------------------------------------- #
# Import helpers
# --------------------------------------------------------------------------- #
def _import_required(path: str) -> ModuleType:
    try:
        return importlib.import_module(path)
    except Exception as exc:  # surface *which* router broke app start-up
        raise RuntimeError(f"Failed to import router module '{path}': {exc}") from exc


def _import_optional(path: str) -> Optional[ModuleType]:
    """Import ``path``; return None only if that module itself does not exist.

    A missing *dependency* inside an existing module (e.g. ``exifread``) is a
    real error and is re-raised, never silently swallowed.
    """
    try:
        return importlib.import_module(path)
    except ModuleNotFoundError as exc:
        if exc.name and (path == exc.name or path.startswith(exc.name + ".")):
            return None
        raise


# --------------------------------------------------------------------------- #
# Builders
# --------------------------------------------------------------------------- #
def build_v1_router() -> Tuple[APIRouter, List[str]]:
    """Return ``(router, loaded_module_names)``."""
    router = APIRouter(prefix=V1_PREFIX)
    loaded: List[str] = []

    for name in V1_ENDPOINT_MODULES:
        module = _import_optional(f"{V1_PACKAGE}.{name}")
        if module is None:
            logger.debug("v1 endpoint module '%s' not present yet, skipping", name)
            continue
        sub = getattr(module, "router", None)
        if not isinstance(sub, APIRouter):
            raise RuntimeError(f"{V1_PACKAGE}.{name} must expose `router = APIRouter()`")
        router.include_router(sub, prefix=f"/{name}", tags=[f"v1:{name}"])
        loaded.append(name)

    @router.get("/health", tags=["v1"], summary="v1 API health & loaded modules")
    async def v1_health() -> Dict[str, object]:
        return {"status": "ok", "api": "v1", "modules": loaded}

    return router, loaded


def register_routers(app: FastAPI) -> Dict[str, object]:
    """Mount legacy + v1 routers on ``app``. Call exactly once."""
    for spec in LEGACY_ROUTES:
        module = _import_required(f"{LEGACY_PACKAGE}.{spec.module}")
        sub = getattr(module, "router", None)
        if not isinstance(sub, APIRouter):
            raise RuntimeError(f"{LEGACY_PACKAGE}.{spec.module} must expose `router = APIRouter()`")
        kwargs: Dict[str, object] = {}
        if spec.prefix:
            kwargs["prefix"] = spec.prefix
        if spec.tags:
            kwargs["tags"] = list(spec.tags)
        app.include_router(sub, **kwargs)

    v1, loaded = build_v1_router()
    app.include_router(v1)

    summary = {"legacy": len(LEGACY_ROUTES), "v1_modules": loaded}
    logger.info("Routers registered: %s", summary)
    return summary


# Module-level convenience instance
api_v1_router, _ = build_v1_router()

