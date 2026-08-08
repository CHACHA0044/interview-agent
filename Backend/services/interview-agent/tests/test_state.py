"""
Purpose:
Verifies the domain model validation rules for AgentState.

Responsibilities:
- Asserts that valid state payloads serialize and deserialize cleanly.
- Asserts that Pydantic properly rejects malformed payloads (invalid version, out of bounds numeric values, injected fields).

Connected Files:
- app/schemas/state.py
"""

import time
import pytest
from pydantic import ValidationError

from app.schemas.state import AgentState
from app.schemas.domain import CandidateTier, Difficulty, InterviewStatus


def test_valid_agent_state_round_trip():
    """Verify that a valid JSON dictionary can successfully hydrate an AgentState."""
    payload = {
        "session_id": "session-123",
        "metadata": {
            "state_version": "1.0.0",
            "created_at_ts": time.time(),
            "updated_at_ts": time.time()
        },
        "candidate_context": {
            "member_id": "CAND-123",
            "name": "John Doe",
            "job_role": "Backend Engineer",
            "years_experience": 5,
            "tier": "strong",
            "strong_days": [1, 2],
            "weak_days": [3],
            "failed_days": [],
            "skipped_days": [4]
        },
        "curriculum": {
            "selected_modules": [1],
            "selected_days": [1, 2, 3]
        },
        "interview_plan": [
            {
                "day": 1,
                "module": 1,
                "topic": "Python basics",
                "difficulty": "medium",
                "concepts": ["lists", "dicts"],
                "type": "technical",
                "is_follow_up": False
            }
        ],
        "progress": {
            "current_slot": 0,
            "total_questions_asked": 0,
            "distinct_days_covered": 0
        },
        "history": [],
        "difficulty_state": {
            "current_difficulty": "medium",
            "starting_difficulty": "medium",
            "rolling_average_score": 0.0
        },
        "completion": {
            "status": "pending",
            "is_eligible_for_completion": False
        }
    }
    
    state = AgentState(**payload)
    assert state.session_id == "session-123"
    assert state.candidate_context.tier == CandidateTier.STRONG
    assert state.difficulty_state.current_difficulty == Difficulty.MEDIUM
    assert state.completion.status == InterviewStatus.PENDING


def test_invalid_state_version():
    """Verify that state_version strictly requires semantic versioning."""
    with pytest.raises(ValidationError) as exc_info:
        payload = {
            "session_id": "session-123",
            "metadata": {
                "state_version": "v1",  # Invalid format
                "created_at_ts": time.time(),
                "updated_at_ts": time.time()
            },
            "candidate_context": {
                "member_id": "CAND-123",
                "name": "John",
                "job_role": "Dev",
                "years_experience": 1,
                "tier": "novice"
            },
            "curriculum": {"selected_modules": [], "selected_days": []},
            "difficulty_state": {
                "current_difficulty": "easy",
                "starting_difficulty": "easy",
                "rolling_average_score": 0.0
            }
        }
        AgentState(**payload)
        
    assert "state_version" in str(exc_info.value)
    assert "String should match pattern" in str(exc_info.value)


def test_extra_fields_forbidden():
    """Verify that unknown fields injected by Redis/Gateway are strictly rejected."""
    with pytest.raises(ValidationError) as exc_info:
        payload = {
            "session_id": "session-123",
            "malicious_injected_field": "hacked",  # Unknown field
            "metadata": {
                "state_version": "1.0.0",
                "created_at_ts": time.time(),
                "updated_at_ts": time.time()
            },
            "candidate_context": {
                "member_id": "CAND-123",
                "name": "John",
                "job_role": "Dev",
                "years_experience": 1,
                "tier": "novice"
            },
            "curriculum": {"selected_modules": [], "selected_days": []},
            "difficulty_state": {
                "current_difficulty": "easy",
                "starting_difficulty": "easy",
                "rolling_average_score": 0.0
            }
        }
        AgentState(**payload)

    assert "Extra inputs are not permitted" in str(exc_info.value)
    assert "malicious_injected_field" in str(exc_info.value)


def test_boundary_validation():
    """Verify that years_experience and score boundaries are respected."""
    with pytest.raises(ValidationError) as exc_info:
        payload = {
            "session_id": "session-123",
            "metadata": {
                "state_version": "1.0.0",
                "created_at_ts": time.time(),
                "updated_at_ts": time.time()
            },
            "candidate_context": {
                "member_id": "CAND-123",
                "name": "John",
                "job_role": "Dev",
                "years_experience": -5,  # Invalid: less than 0
                "tier": "novice"
            },
            "curriculum": {"selected_modules": [], "selected_days": []},
            "difficulty_state": {
                "current_difficulty": "easy",
                "starting_difficulty": "easy",
                "rolling_average_score": 0.0
            }
        }
        AgentState(**payload)

    assert "years_experience" in str(exc_info.value)
    assert "greater than or equal to 0" in str(exc_info.value)
