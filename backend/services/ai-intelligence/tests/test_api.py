"""
Purpose:
Unit tests for the FastAPI API layer.

Responsibilities:
- Verifies that HTTP payloads correctly map to Pydantic models.
- Verifies that endpoints call the underlying service layer correctly.
- Verifies 422 Validation errors when payloads are malformed.

Connected Files:
- app/api/endpoints.py
- app/main.py

Important implementation notes:
- Uses `fastapi.testclient.TestClient`.
- Mocks the core services to prevent hitting the LLM/DB during route testing.
- Payload shapes follow backend/shared/schemas/ai_api.json (camelCase).
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.dependencies import get_llm_provider, get_qdrant_client
from app.schemas.question import GeneratedQuestion

def override_get_llm_provider():
    return MagicMock()

def override_get_qdrant_client():
    return MagicMock()

app.dependency_overrides[get_llm_provider] = override_get_llm_provider
app.dependency_overrides[get_qdrant_client] = override_get_qdrant_client

client = TestClient(app)

CANDIDATE_CONTEXT = {
    "candidateId": "c1",
    "name": "Alice",
    "role": "backend developer",
    "tier": "strong",
    "strongDays": [],
    "weakDays": [],
    "failedDays": [],
    "skippedDays": [],
}


def test_health_check():
    # Since Qdrant might fail if not running, we patch it
    with patch("app.api.endpoints.QdrantClient"):
        response = client.get("/internal/ai/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_llm_status_endpoint():
    """Verify the failover snapshot exposes chain state without keys."""
    fake_provider = MagicMock()
    fake_provider.status.return_value = {
        "provider": "groq",
        "active_slot": "Groq key 1",
        "all_exhausted": False,
        "rotations": [],
        "last_rotation": None,
    }
    with patch("app.api.endpoints.get_provider_status", return_value=fake_provider.status.return_value):
        response = client.get("/internal/ai/llm/status")
        assert response.status_code == 200
        body = response.json()
        assert body["provider"] == "groq"
        assert body["active_slot"] == "Groq key 1"
        assert body["all_exhausted"] is False
        assert body["rotations"] == []


@patch("app.api.endpoints.generate_interview_question")
def test_generate_question_endpoint(mock_generate):
    mock_generate.return_value = GeneratedQuestion(
        question="Test?",
        type="technical",
        difficulty="easy",
        topic="Python",
        day=1,
        expectedConcepts=[],
        retrievedContext=[],
    )

    payload = {
        "candidateContext": CANDIDATE_CONTEXT,
        "curriculumContext": {"modules": [], "days": {}, "plannedDays": []},
        "conversation": [],
        "questionStrategy": {
            "day": 1,
            "module": 1,
            "topic": "Python",
            "difficulty": "easy",
            "concepts": [],
            "isFollowUp": False,
            "followUpOf": None,
        },
    }

    response = client.post("/internal/ai/generate-question", json=payload)
    assert response.status_code == 200
    assert response.json()["question"] == "Test?"
    mock_generate.assert_called_once()


def test_generate_question_validation_error():
    # Missing required questionStrategy day
    payload = {
        "candidateContext": CANDIDATE_CONTEXT,
        "questionStrategy": {
            "module": 1,
            "topic": "Python",
            "difficulty": "easy"
        },
    }

    response = client.post("/internal/ai/generate-question", json=payload)
    assert response.status_code == 422  # Unprocessable Entity


@patch("app.api.endpoints.evaluate_answer")
def test_evaluate_answer_endpoint(mock_evaluate):
    mock_evaluate.return_value = {
        "score": 10.0,
        "conceptCoverage": 1.0,
        "technicalAccuracy": 1.0,
        "depth": 1.0,
        "strengths": [],
        "gaps": [],
        "followUpRequired": False,
        "notes": ""
    }

    payload = {
        "question": {
            "question": "What is dependency injection?",
            "type": "technical",
            "difficulty": "medium",
            "topic": "Architecture",
            "day": 1,
            "expectedConcepts": ["inversion of control"],
            "retrievedContext": [],
        },
        "candidateContext": CANDIDATE_CONTEXT,
        "retrievedContext": [],
        "candidateAnswer": "My answer",
    }

    response = client.post("/internal/ai/evaluate-answer", json=payload)
    assert response.status_code == 200
    assert response.json()["score"] == 10.0


@patch("app.api.endpoints.generate_feedback")
def test_generate_feedback_endpoint_service_failure(mock_feedback):
    # Simulate an uncaught exception bubbling up from the service
    mock_feedback.side_effect = Exception("Catastrophic error")

    payload = {
        "candidate": {"name": "Alice"},
        "candidateContext": CANDIDATE_CONTEXT,
        "evaluations": [],
        "coverage": {},
        "missedConcepts": {},
        "topicScores": [],
    }

    response = client.post("/internal/ai/generate-feedback", json=payload)
    # The router should catch the error and map it to 500 without leaking the stack trace
    assert response.status_code == 500
    assert "Internal server error" in response.json()["detail"]
