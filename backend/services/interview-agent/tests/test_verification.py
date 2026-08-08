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

import os

import pytest
from pydantic import ValidationError

from app.schemas.orchestration import Candidate
from app.schemas.state import AgentState
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator
from tests.fakes import FakeAIClient

os.environ.setdefault("CURRICULUM_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "curriculum.json"))


async def test_json_serialization_of_agent_state():
    """Verify that the core AgentState translates perfectly to/from JSON."""
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient())

    candidate = Candidate(
        member={"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
        missions=[],
        signals={},
    )
    res = await orchestrator.start("verify-123", candidate)

    # Dump to JSON
    json_data = res.agentState

    # Reload from JSON
    reloaded_state = AgentState.model_validate(json_data)

    # Validate identity preservation
    assert reloaded_state.session_id == "verify-123"
    assert reloaded_state.progress.distinct_days_covered >= 1
    assert reloaded_state.candidate_payload["member"]["id"] == "1"
    assert reloaded_state.progress.current_question is not None


async def test_empty_candidate_profile():
    """Verify the system safely defaults missing candidate attributes."""
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient())

    empty_candidate = Candidate(
        member={"id": "", "name": "", "jobRole": "Intern", "yearsExperience": 0},
        missions=[],
        signals={},
    )
    res = await orchestrator.start("empty-123", empty_candidate)

    # Should safely assume NOVICE and start smoothly
    assert res.agentState["candidate_context"]["tier"] == "novice"


def test_unsupported_state_rejection():
    """Verify Pydantic immediately blocks corrupted payloads."""
    bad_state = {
        "session_id": "bad-123",
        "metadata": {"state_version": "1.0.0", "created_at_ts": 0, "updated_at_ts": 0},
        "illegal_field": "Hack attempt",
    }

    with pytest.raises(ValidationError):
        # extra='forbid' must trigger failure
        AgentState(**bad_state)
