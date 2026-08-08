"""Gateway compatibility: existing gateway Pydantic models must conform to
the shared JSON Schemas (backend.md §21.3, producer side).

These tests import the already-implemented gateway models and validate their
JSON dumps against shared/schemas. They must pass WITHOUT modifying gateway
business logic.
"""

import json
from datetime import datetime, timezone

import jsonschema
import pytest

from conftest import (
    REPO_ROOT,
    ensure_gateway_importable,
    load_schema,
    validator_for,
)

ensure_gateway_importable()

from app.schemas.api import Candidate, Feedback, HealthResponse  # noqa: E402
from app.schemas.internal import (  # noqa: E402
    AgentCompleteRequest,
    AgentNextRequest,
    AgentStartRequest,
    AgentTurnResponse,
    ConversationItem,
    Question,
    SessionDoc,
    SessionView,
)


def _candidate() -> Candidate:
    return Candidate.model_validate(
        {
            "member": {
                "id": "CAND-001",
                "name": "Sarah Johnson",
                "jobRole": "Senior Data Engineer",
                "yearsExperience": 9,
                "education": "MS Computer Science",
                "status": "COMPLETED",
            },
            "missions": [
                {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
                {"day": 29, "title": "Monitoring", "skipped": True},
            ],
            "signals": {"commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20},
        }
    )


def _question() -> Question:
    return Question(
        questionId="q-1",
        type="technical",
        difficulty="medium",
        topic="LLM Core, Prompting & Fine-Tuning",
        day=12,
        followUpOf=None,
        expectedConcepts=["zero-shot", "few-shot"],
    )


def _feedback() -> Feedback:
    return Feedback(
        summary="summary",
        strengths=["a"],
        gaps=["b"],
        next=["c"],
    )


def _session_doc(**overrides) -> SessionDoc:
    base = {
        "sessionId": "abc-123",
        "status": "active",
        "createdAt": datetime(2026, 8, 8, 10, 0, tzinfo=timezone.utc),
        "updatedAt": datetime(2026, 8, 8, 10, 0, tzinfo=timezone.utc),
        "candidate": _candidate(),
        "agentState": {"version": 1, "planIndex": 0, "followUpBudget": 4},
        "currentQuestion": _question(),
        "questionCount": 1,
        "daysAsked": [12],
        "conversation": [ConversationItem(role="agent", content="Welcome.")],
        "scores": [],
        "topicScores": [],
        "finalFeedback": None,
    }
    base.update(overrides)
    return SessionDoc(**base)


def _turn_response(done: bool = False, feedback: Feedback | None = None) -> AgentTurnResponse:
    return AgentTurnResponse(
        agentState={"version": 1, "planIndex": 1},
        sessionView=SessionView(
            questionCount=1,
            daysAsked=[12],
            scores=[],
            status="completed" if done else "active",
        ),
        reply="Reply",
        done=done,
        feedback=feedback,
        question=_question(),
    )


def test_gateway_session_doc_conforms_to_session_schema(session_schema):
    doc = _session_doc()
    payload = json.loads(doc.model_dump_json())
    jsonschema.Draft202012Validator(session_schema).validate(payload)


def test_gateway_completed_session_doc_conforms(session_schema):
    doc = _session_doc(
        status="completed",
        questionCount=8,
        daysAsked=[7, 12, 22, 27],
        scores=[8.0, 7.5],
        finalFeedback=_feedback(),
    )
    payload = json.loads(doc.model_dump_json())
    jsonschema.Draft202012Validator(session_schema).validate(payload)


def test_gateway_agent_start_request_conforms(agent_schema):
    req = AgentStartRequest(sessionId="abc-123", candidate=_candidate())
    payload = json.loads(req.model_dump_json())
    validator_for(agent_schema, "agentStartRequest").validate(payload)


def test_gateway_agent_next_request_conforms(agent_schema):
    req = AgentNextRequest(
        sessionId="abc-123",
        candidate=_candidate(),
        agentState={"version": 1, "planIndex": 1},
        conversation=[ConversationItem(role="agent", content="Q?")],
        currentQuestion=_question(),
        message="Vector embeddings...",
    )
    payload = json.loads(req.model_dump_json())
    validator_for(agent_schema, "agentNextRequest").validate(payload)


def test_gateway_agent_complete_request_conforms(agent_schema):
    req = AgentCompleteRequest(sessionId="abc-123", agentState={"version": 1, "status": "completed"})
    payload = json.loads(req.model_dump_json())
    validator_for(agent_schema, "agentCompleteRequest").validate(payload)


def test_gateway_agent_start_response_conforms(agent_schema):
    resp = _turn_response(done=False)
    payload = json.loads(resp.model_dump_json())
    validator_for(agent_schema, "agentStartResponse").validate(payload)


def test_gateway_agent_next_response_conforms(agent_schema):
    resp = _turn_response(done=False)
    payload = json.loads(resp.model_dump_json())
    validator_for(agent_schema, "agentNextResponse").validate(payload)


def test_gateway_agent_complete_response_conforms(agent_schema):
    resp = _turn_response(done=True, feedback=_feedback())
    payload = json.loads(resp.model_dump_json())
    validator_for(agent_schema, "agentCompleteResponse").validate(payload)


def test_gateway_feedback_conforms_to_ai_schema(ai_schema):
    payload = json.loads(_feedback().model_dump_json())
    validator_for(ai_schema, "generateFeedbackResponse").validate(payload)


def test_gateway_health_response_conforms(agent_schema):
    payload = json.loads(HealthResponse(status="ok").model_dump_json())
    validator_for(agent_schema, "healthResponse").validate(payload)


def test_real_candidates_file_conforms(agent_schema):
    with open(REPO_ROOT / "candidates.json", encoding="utf-8") as fh:
        data = json.load(fh)
    validator = validator_for(agent_schema, "candidate")
    for candidate in data["candidates"]:
        validator.validate(candidate)


def test_real_curriculum_days_conform(ai_schema):
    with open(REPO_ROOT / "curriculum.json", encoding="utf-8") as fh:
        data = json.load(fh)
    validator = validator_for(ai_schema, "dayInfo")
    for day in data["days"]:
        validator.validate(day)
