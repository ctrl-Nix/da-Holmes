"""Tests for app/api/v1/router.py (no heavy route-module imports needed)."""
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import APIRouter, FastAPI

from app.api.v1 import router as rr

ROOT = Path(__file__).resolve().parents[1]


def test_every_legacy_module_file_exists():
    missing = [s.module for s in rr.LEGACY_ROUTES if not (ROOT / "app/api/routes" / f"{s.module}.py").exists()]
    assert missing == []


def test_no_duplicate_modules_and_sane_prefixes():
    mods = [s.module for s in rr.LEGACY_ROUTES]
    assert len(mods) == len(set(mods))
    assert all(s.prefix == "" or s.prefix.startswith("/api") for s in rr.LEGACY_ROUTES)
    assert not any(s.prefix.startswith("/api/v1") for s in rr.LEGACY_ROUTES)


def _stub_importer(present_v1=()):
    def fake(path: str):
        if path.startswith(rr.V1_PACKAGE + "."):
            name = path.rsplit(".", 1)[1]
            if name in present_v1:
                r = APIRouter()

                @r.get("/ping")
                async def _ping():
                    return {"pong": name}

                return SimpleNamespace(router=r)
            raise ModuleNotFoundError(f"No module named '{path}'", name=path)
        r = APIRouter()

        @r.get(f"/__stub__/{path.rsplit('.', 1)[1]}")
        async def _stub():
            return {}

        return SimpleNamespace(router=r)

    return fake


def test_register_routers_mounts_everything(monkeypatch):
    monkeypatch.setattr(rr.importlib, "import_module", _stub_importer(present_v1=("forensics",)))
    app = FastAPI()
    summary = rr.register_routers(app)
    paths = {r.path for r in app.routes}
    assert summary == {"legacy": len(rr.LEGACY_ROUTES), "v1_modules": ["forensics"]}
    assert "/api/v1/health" in paths
    assert "/api/v1/forensics/ping" in paths
    assert "/api/v1/network/ping" not in paths  # absent module is skipped, not an error
    assert "/api/scan/__stub__/domain" in paths  # prefix applied
    assert "/__stub__/vault" in paths  # vault has no prefix


def test_missing_dependency_inside_existing_v1_module_is_not_swallowed(monkeypatch):
    def fake(path):
        if path.endswith(".forensics"):
            raise ModuleNotFoundError("No module named 'exifread'", name="exifread")
        raise ModuleNotFoundError(f"No module named '{path}'", name=path)

    monkeypatch.setattr(rr.importlib, "import_module", fake)
    with pytest.raises(ModuleNotFoundError):
        rr.build_v1_router()


def test_broken_legacy_router_names_the_module(monkeypatch):
    def fake(path):
        raise ImportError("boom")

    monkeypatch.setattr(rr.importlib, "import_module", fake)
    with pytest.raises(RuntimeError, match="app.api.routes.scanner"):
        rr.register_routers(FastAPI())


def test_v1_module_without_router_attr_fails_loudly(monkeypatch):
    monkeypatch.setattr(rr.importlib, "import_module", lambda p: SimpleNamespace())
    with pytest.raises(RuntimeError, match="must expose"):
        rr.build_v1_router()
