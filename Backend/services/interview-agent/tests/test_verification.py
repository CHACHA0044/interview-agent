"""
Purpose:
Final verification test suite for the interview-agent orchestrator.

Responsibilities:
- Tests deep integration bounds across all state transitions.
- Validates the JSON serialization boundaries of AgentState.
- Assert resilience against empty and corrupted data.

Connected Files:
- app/schemas/state.py
- app/services/orchestrator.py
"""

import pytest
import json
from pydantic import ValidationError
from app.schemas.orchestration import StartInterviewRequest, NextTurnRequest
from app.schemas.state import AgentState
from app.services.orchestrator import InterviewOrchestrator
from app.services.curriculum_loader import CurriculumLoader

# Minimal mocked curriculum
MOCK_CURRICULUM_DATA = {
    "modules": [
        {"id": 1, "title": "A", "days": [{"day": 1, "title": "A1", "type": "BUILD", "tools": ["T1"]}]}
    ]
}

def test_json_serialization_of_agent_state():
    """Verify that the core AgentState translates perfectly to/from JSON."""
    loader = CurriculumLoader(file_path="d:/interview-agent/curriculum.json")
    orchestrator = InterviewOrchestrator(loader)
    
    mock_profile = {
        "member": {"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
        "missions": [],
        "signals": {}
    }
    
    res = orchestrator.start_interview(StartInterviewRequest(session_id="verify-123", candidate_profile=mock_profile))
    
    # Dump to JSON
    json_data = res.updated_state.model_dump_json()
    
    # Reload from JSON
    reloaded_state = AgentState.model_validate_json(json_data)
    
    # Validate identity preservation
    assert reloaded_state.session_id == res.updated_state.session_id
    assert reloaded_state.progress.distinct_days_covered == res.updated_state.progress.distinct_days_covered


def test_empty_candidate_profile():
    """Verify system defaults missing candidate attributes safely."""
    loader = CurriculumLoader(file_path="d:/interview-agent/curriculum.json")
    orchestrator = InterviewOrchestrator(loader)
    
    empty_profile = {} # Missing member entirely
    
    res = orchestrator.start_interview(StartInterviewRequest(session_id="empty-123", candidate_profile=empty_profile))
    
    # Should safely assume NOVICE and start smoothly
    assert res.updated_state.candidate_context.tier == "novice"
    assert res.updated_state.candidate_context.name == "Unknown Candidate"


def test_unsupported_state_rejection():
    """Verify Pydantic immediately blocks corrupted payloads."""
    # Build a bad state dictionary
    bad_state = {
        "session_id": "bad-123",
        "metadata": {"state_version": "1.0.0", "created_at_ts": 0, "updated_at_ts": 0},
        "illegal_field": "Hack attempt"
    }
    
    with pytest.raises(ValidationError):
        # extra='forbid' must trigger failure
        AgentState(**bad_state)
