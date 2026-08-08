"""Guard the corrected interview contract (hackathon floors).

The Interview Agent owns interview completion logic: an interview must NOT
complete before at least 8 questions across at least 4 distinct curriculum
days. The Gateway only stores/transports state and forwards the Agent's
`done` flag; it must not implement completion rules.

These tests prove the shared contracts neither permit nor imply an early
completion (e.g. after 4 questions), and that they can represent 8+
questions across 4+ distinct days, follow-ups, and valid final feedback.
No LLM, RAG, or Qdrant calls are made.
"""

import jsonschema

from conftest import validator_for
from fixtures import (
    AGENT_COMPLETE_RESPONSE,
    AGENT_FOLLOWUP_RESPONSE,
    AGENT_NEXT_RESPONSE,
    AGENT_NEXT_RESPONSE_LATE,
    SESSION_COMPLETED,
    SESSION_DEEP_MID,
)


def _next_response(question_count: int, done: bool, days: list[int]) -> dict:
    return {
        "agentState": {"version": 1, "planIndex": 1},
        "sessionView": {
            "questionCount": question_count,
            "daysAsked": days,
            "scores": [],
            "status": "completed" if done else "active",
        },
        "reply": "Next question.",
        "done": done,
        "question": AGENT_NEXT_RESPONSE["question"],
        "feedback": None,
    }


def test_agent_response_can_represent_question_9_across_5_days(agent_schema):
    doc = AGENT_NEXT_RESPONSE_LATE
    assert doc["done"] is False
    assert doc["sessionView"]["questionCount"] >= 8
    assert len(set(doc["sessionView"]["daysAsked"])) >= 4
    validator_for(agent_schema, "agentNextResponse").validate(doc)
    validator_for(agent_schema, "agentFollowUpResponse").validate(doc)


def test_agent_contract_does_not_force_completion_at_4_questions(agent_schema):
    doc = _next_response(question_count=4, done=False, days=[7, 12, 22])
    validator_for(agent_schema, "agentNextResponse").validate(doc)


def test_agent_contract_allows_interview_open_beyond_floors(agent_schema):
    doc = _next_response(question_count=10, done=False, days=[7, 12, 22, 27, 29])
    validator_for(agent_schema, "agentNextResponse").validate(doc)


def test_only_complete_response_forces_done_true(agent_schema):
    for def_name in ("agentStartResponse", "agentNextResponse"):
        done = agent_schema["$defs"][def_name]["properties"]["done"]
        assert done["type"] == "boolean", def_name
        assert "const" not in done, f"{def_name} must leave done to the Agent"
    complete_done = agent_schema["$defs"]["agentCompleteResponse"]["properties"]["done"]
    assert complete_done.get("type") in (None, "boolean")
    assert complete_done.get("const") is True


def test_no_schema_caps_question_count_or_day_count(agent_schema, session_schema):
    sv_q = agent_schema["$defs"]["sessionView"]["properties"]["questionCount"]
    assert "maximum" not in sv_q
    sess_q = session_schema["properties"]["questionCount"]
    assert "maximum" not in sess_q
    assert "maxItems" not in session_schema["properties"]["daysAsked"]


def test_completion_response_carries_floors_and_valid_feedback(agent_schema):
    doc = dict(AGENT_COMPLETE_RESPONSE)
    assert doc["done"] is True
    assert doc["sessionView"]["questionCount"] >= 8
    assert len(set(doc["sessionView"]["daysAsked"])) >= 4
    for field in ("summary", "strengths", "gaps", "next"):
        assert field in doc["feedback"]
    validator_for(agent_schema, "agentCompleteResponse").validate(doc)


def test_followup_is_anchored_on_previous_answer(agent_schema):
    doc = AGENT_FOLLOWUP_RESPONSE
    validator_for(agent_schema, "agentFollowUpResponse").validate(doc)
    assert doc["question"]["followUpOf"] is not None


def test_session_doc_supports_question_9_across_5_days(session_schema):
    validator = jsonschema.Draft202012Validator(session_schema)
    validator.validate(SESSION_DEEP_MID)
    assert SESSION_DEEP_MID["questionCount"] >= 8
    assert len(set(SESSION_DEEP_MID["daysAsked"])) >= 4


def test_completed_session_fixture_meets_hackathon_floors(session_schema):
    assert SESSION_COMPLETED["questionCount"] >= 8
    assert len(set(SESSION_COMPLETED["daysAsked"])) >= 4
    fb = SESSION_COMPLETED["finalFeedback"]
    assert all(field in fb for field in ("summary", "strengths", "gaps", "next"))
