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
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.api.dependencies import get_llm_provider, get_qdrant_client

def override_get_llm_provider():
    return MagicMock()

def override_get_qdrant_client():
    return MagicMock()

app.dependency_overrides[get_llm_provider] = override_get_llm_provider
app.dependency_overrides[get_qdrant_client] = override_get_qdrant_client

client = TestClient(app)


def test_health_check():
    # Since Qdrant might fail if not running, we patch it
    with patch("app.api.endpoints.QdrantClient"):
        response = client.get("/internal/ai/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


@patch("app.api.endpoints.generate_interview_question")
def test_generate_question_endpoint(mock_generate):
    mock_generate.return_value = {
        "question": "Test?",
        "type": "technical",
        "difficulty": "easy",
        "topic": "Python",
        "expectedConcepts": []
    }
    
    payload = {
        "strategy": {
            "day": 1,
            "module": 1,
            "topic": "Python",
            "difficulty": "easy",
            "concepts": []
        }
    }
    
    response = client.post("/internal/ai/generate-question", json=payload)
    assert response.status_code == 200
    assert response.json()["question"] == "Test?"
    mock_generate.assert_called_once()


def test_generate_question_validation_error():
    # Missing required strategy day
    payload = {
        "strategy": {
            "module": 1,
            "topic": "Python",
            "difficulty": "easy"
        }
    }
    
    response = client.post("/internal/ai/generate-question", json=payload)
    assert response.status_code == 422 # Unprocessable Entity


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
        "question_payload": {"topic": "test"},
        "candidate_answer": "My answer"
    }
    
    response = client.post("/internal/ai/evaluate-answer", json=payload)
    assert response.status_code == 200
    assert response.json()["score"] == 10.0


@patch("app.api.endpoints.generate_feedback")
def test_generate_feedback_endpoint_service_failure(mock_feedback):
    # Simulate an uncaught exception bubbling up from the service
    mock_feedback.side_effect = Exception("Catastrophic error")
    
    payload = {
        "candidate": {"name": "Alice"}
    }
    
    response = client.post("/internal/ai/generate-feedback", json=payload)
    # The router should catch the error and map it to 500 without leaking the stack trace
    assert response.status_code == 500
    assert "Internal server error" in response.json()["detail"]
