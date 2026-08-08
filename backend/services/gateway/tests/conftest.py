"""Shared fixtures for gateway tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.sessions.lifecycle import SessionLifecycle
from app.sessions.redis_store import InMemorySessionStore
from tests.fakes import FakeAgentClient


def make_candidate(**overrides) -> dict:
    candidate = {
        "member": {
            "id": "CAND-001",
            "name": "Sarah Johnson",
            "jobRole": "Senior Data Engineer",
            "yearsExperience": 9,
            "education": "MS Computer Science",
            "status": "COMPLETED",
        },
        "missions": [
            {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1}
        ],
        "signals": {"commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20},
    }
    candidate.update(overrides)
    return candidate


@pytest.fixture
def fake_agent() -> FakeAgentClient:
    return FakeAgentClient()


@pytest.fixture
def store() -> InMemorySessionStore:
    return InMemorySessionStore()


@pytest.fixture
def app(store, fake_agent):
    settings = Settings(
        redis_url="redis://nonexistent:6379/0",
        agent_service_url="http://agent.test",
        ai_service_url="http://ai.test",
    )
    application = create_app(settings)
    application.state.session_store = store
    application.state.agent_client = fake_agent
    application.state.lifecycle = SessionLifecycle(store, fake_agent)
    return application


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)
