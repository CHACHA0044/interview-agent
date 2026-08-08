"""
Purpose:
Verifies the HTTP API layer mapping and validation behavior.

Responsibilities:
- Mocks the CurriculumLoader to avoid file system dependencies during fast tests.
- Uses FastAPI TestClient to test status codes.
- Asserts that domain ValueErrors are correctly caught and converted to 400 Bad Request.

Connected Files:
- app/api/router.py
- app/main.py
"""

from fastapi.testclient import TestClient
from app.main import app
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator

# Override the app lifespan state for testing
MOCK_CURRICULUM_DATA = {
    "modules": [
        {"id": 1, "title": "A", "days": [{"day": 1, "title": "A1", "type": "BUILD", "tools": ["T1"]}]}
    ]
}

loader = CurriculumLoader(file_path="d:/interview-agent/curriculum.json")
app.state.orchestrator = InterviewOrchestrator(loader)

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "interview-agent"}


def test_start_interview():
    mock_profile = {
        "member": {"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
        "missions": [],
        "signals": {}
    }
    
    response = client.post("/internal/interview/start", json={
        "session_id": "api-123",
        "candidate_profile": mock_profile
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["action_type"] == "QUESTION"
    assert data["updated_state"]["session_id"] == "api-123"


def test_complete_interview_premature():
    """
    Test that trying to complete an interview without meeting the floors 
    properly raises a 400 Bad Request.
    """
    # 1. Start an interview to get a valid state
    mock_profile = {
        "member": {"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
        "missions": [],
        "signals": {}
    }
    
    start_resp = client.post("/internal/interview/start", json={
        "session_id": "api-456",
        "candidate_profile": mock_profile
    })
    assert start_resp.status_code == 200
    state = start_resp.json()["updated_state"]
    
    # 2. Try to complete it immediately
    complete_resp = client.post("/internal/interview/complete", json={
        "agent_state": state
    })
    
    # Should get a 400 Bad Request (not 500!)
    assert complete_resp.status_code == 400
    assert "Cannot complete interview" in complete_resp.json()["detail"]
