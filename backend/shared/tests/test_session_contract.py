"""Contract tests for the session document schema (session.json)."""

import jsonschema
import pytest

from conftest import validator_for
from fixtures import (
    SESSION_COMPLETED,
    SESSION_MID,
    SESSION_START,
)


def _validate(session_schema, doc: dict) -> None:
    validator = jsonschema.Draft202012Validator(session_schema)
    validator.validate(doc)


def test_start_session_valid(session_schema):
    _validate(session_schema, SESSION_START)


def test_mid_session_valid(session_schema):
    _validate(session_schema, SESSION_MID)


def test_completed_session_valid(session_schema):
    _validate(session_schema, SESSION_COMPLETED)


def test_agent_state_is_opaque(session_schema):
    doc = dict(SESSION_MID)
    doc["agentState"] = {"anything": {"at": "all"}, "nested": [1, 2, 3]}
    _validate(session_schema, doc)


def test_missing_required_field_rejected(session_schema):
    doc = dict(SESSION_START)
    del doc["finalFeedback"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        _validate(session_schema, doc)


def test_invalid_status_rejected(session_schema):
    doc = dict(SESSION_START)
    doc["status"] = "expired"
    with pytest.raises(jsonschema.exceptions.ValidationError):
        _validate(session_schema, doc)


def test_wrong_question_count_type_rejected(session_schema):
    doc = dict(SESSION_START)
    doc["questionCount"] = "three"
    with pytest.raises(jsonschema.exceptions.ValidationError):
        _validate(session_schema, doc)


def test_invalid_conversation_role_rejected(session_schema):
    doc = dict(SESSION_START)
    doc["conversation"] = [{"role": "robot", "content": "hi"}]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        _validate(session_schema, doc)


def test_candidate_shape_valid(session_schema):
    validator = validator_for(session_schema, "candidate")
    validator.validate(SESSION_START["candidate"])


def test_feedback_shape_valid(session_schema):
    validator = validator_for(session_schema, "feedback")
    validator.validate(SESSION_COMPLETED["finalFeedback"])


def test_candidate_missing_member_rejected(session_schema):
    validator = validator_for(session_schema, "candidate")
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator.validate({"missions": []})
