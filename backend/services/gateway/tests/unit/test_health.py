"""Unit tests for the health endpoint (backend.md §21.1)."""

import pytest

from app.sessions.redis_store import InMemorySessionStore


def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "interview-gateway"
    assert body["checks"]["redis"] == "ok"


async def test_health_reports_redis_down(app, client):
    class DownStore(InMemorySessionStore):
        async def ping(self) -> bool:
            return False

    app.state.session_store = DownStore()
    resp = client.get("/health")
    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "error"
    assert body["checks"]["redis"] == "down"
