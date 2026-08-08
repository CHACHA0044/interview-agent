"""Tests for graceful session-store fallback when Redis is unavailable.

The single-container deployment (backend.md, Render) runs without Redis; the
gateway must fall back to the in-memory store instead of failing every call.
"""

import asyncio

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import _resolve_session_store, create_app
from app.sessions.redis_store import InMemorySessionStore


def test_redis_unreachable_falls_back_to_in_memory():
    settings = Settings(redis_url="redis://127.0.0.1:1/0")
    store = asyncio.run(_resolve_session_store(settings))
    assert isinstance(store, InMemorySessionStore)


def test_lifespan_health_ok_with_in_memory_fallback():
    settings = Settings(
        redis_url="redis://127.0.0.1:1/0",
        agent_service_url="http://agent.test",
    )
    application = create_app(settings)
    with TestClient(application) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        assert resp.json()["checks"]["store"] == "in-memory"
        assert resp.json()["checks"]["redis"] == "ok"
        assert isinstance(application.state.session_store, InMemorySessionStore)
