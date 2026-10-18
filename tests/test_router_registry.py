"""
Tests for app/api/v1/router.py registry and route mounting
"""
import pytest
from fastapi import FastAPI
from app.api.v1.router import (
    build_v1_router,
    register_routers,
    LEGACY_ROUTES,
    api_v1_router,
)


def test_build_v1_router():
    """Verify build_v1_router returns an APIRouter with health route."""
    router, loaded = build_v1_router()
    routes = [r.path for r in router.routes]
    assert "/api/v1/health" in routes
    assert isinstance(loaded, list)


def test_register_routers():
    """Verify register_routers correctly mounts all 37 legacy routes and v1 router onto FastAPI."""
    app = FastAPI()
    summary = register_routers(app)
    app_routes = [r.path for r in app.routes]

    # Check summary count
    assert summary["legacy"] == len(LEGACY_ROUTES)
    assert summary["legacy"] == 37

    # Check key routes exist on application
    assert any("/api/security" in r for r in app_routes)
    assert any("/api/network" in r for r in app_routes)
    assert any("/api/forensics" in r for r in app_routes)
    assert any("/api/vault" in r for r in app_routes or "/vault" in r for r in app_routes)
    assert any("/api/unified" in r for r in app_routes)
    assert "/api/v1/health" in app_routes


def test_api_v1_router_convenience_instance():
    """Verify module-level api_v1_router has expected endpoints."""
    routes = [r.path for r in api_v1_router.routes]
    assert "/api/v1/health" in routes
