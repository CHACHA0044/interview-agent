"""
Purpose:
Verifies the HTTP API layer mapping and validation behavior against the master
gateway contract (backend/shared/schemas/agent_api.json).

Responsibilities:
- Uses a fake AI client so tests are fast and deterministic.
- Verifies /start, /next, /complete, and /health behavior.
- Asserts that domain ValueErrors are caught and converted to 400 Bad Request.

Connected Files:
- app/api/router.py
- app/main.py
"""

import os
from contextlib import contextmanager

from fastapi.testclient import TestClient

from app.main import app
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator
from tests.fakes import FakeAIClient

os.environ.setdefault("CURRICULUM_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "curriculum.json"))

CANDIDATE = {
    "member": {"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
    "missions": [],
    "signals": {},
}


@contextmanager
def _client():
    with TestClient(app) as client:
        app.state.orchestrator = InterviewOrchestrator(CurriculumLoader(), FakeAIClient())
        yield client


def test_health():
    with _client() as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "service": "interview-agent"}


def test_start_interview():
    with _client() as client:
        response = client.post("/internal/interview/start", json={"sessionId": "api-123", "candidate": CANDIDATE})
        assert response.status_code == 200
        data = response.json()
        assert data["done"] is False
        assert data["question"] is not None
        assert data["question"]["questionId"]
        assert data["question"]["day"] >= 1
        assert data["sessionView"]["questionCount"] == 1
        assert data["agentState"]["session_id"] == "api-123"


def test_next_turn_round_trip():
    with _client() as client:
        start = client.post("/internal/interview/start", json={"sessionId": "api-124", "candidate": CANDIDATE})
        assert start.status_code == 200
        start_data = start.json()

        body = {
            "sessionId": "api-124",
            "candidate": CANDIDATE,
            "agentState": start_data["agentState"],
            "conversation": [
                {"role": "agent", "content": start_data["reply"]},
                {"role": "candidate", "content": "my answer"},
            ],
            "currentQuestion": start_data["question"],
            "message": "my answer",
        }
        response = client.post("/internal/interview/next", json=body)
        assert response.status_code == 200
        data = response.json()
        assert data["sessionView"]["scores"]  # at least one recorded score
        assert data["sessionView"]["questionCount"] >= 2


def test_complete_interview_premature():
    with _client() as client:
        start = client.post("/internal/interview/start", json={"sessionId": "api-456", "candidate": CANDIDATE})
        assert start.status_code == 200
        state = start.json()["agentState"]

        complete = client.post("/internal/interview/complete", json={"sessionId": "api-456", "agentState": state})
        assert complete.status_code == 400
        assert "Cannot complete interview" in complete.json()["detail"]
