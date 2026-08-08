"""Contract tests for the Gateway → Interview Agent API (agent_api.json)."""

import jsonschema
import pytest

from conftest import validator_for
from fixtures import (
    AGENT_COMPLETE_REQUEST,
    AGENT_COMPLETE_RESPONSE,
    AGENT_FOLLOWUP_REQUEST,
    AGENT_FOLLOWUP_RESPONSE,
    AGENT_NEXT_REQUEST,
    AGENT_NEXT_RESPONSE,
    AGENT_START_REQUEST,
    AGENT_START_RESPONSE,
    HEALTH_RESPONSE,
)

ENDPOINT_DEFS = {
    "start": ("agentStartRequest", "agentStartResponse"),
    "next": ("agentNextRequest", "agentNextResponse"),
    "follow-up": ("agentFollowUpRequest", "agentFollowUpResponse"),
    "complete": ("agentCompleteRequest", "agentCompleteResponse"),
}


def test_start_request_and_response(agent_schema):
    request_v = validator_for(agent_schema, ENDPOINT_DEFS["start"][0])
    response_v = validator_for(agent_schema, ENDPOINT_DEFS["start"][1])
    request_v.validate(AGENT_START_REQUEST)
    response_v.validate(AGENT_START_RESPONSE)


def test_next_request_and_response(agent_schema):
    request_v = validator_for(agent_schema, ENDPOINT_DEFS["next"][0])
    response_v = validator_for(agent_schema, ENDPOINT_DEFS["next"][1])
    request_v.validate(AGENT_NEXT_REQUEST)
    response_v.validate(AGENT_NEXT_RESPONSE)


def test_followup_request_and_response(agent_schema):
    request_v = validator_for(agent_schema, ENDPOINT_DEFS["follow-up"][0])
    response_v = validator_for(agent_schema, ENDPOINT_DEFS["follow-up"][1])
    request_v.validate(AGENT_FOLLOWUP_REQUEST)
    response_v.validate(AGENT_FOLLOWUP_RESPONSE)


def test_complete_request_and_response(agent_schema):
    request_v = validator_for(agent_schema, ENDPOINT_DEFS["complete"][0])
    response_v = validator_for(agent_schema, ENDPOINT_DEFS["complete"][1])
    request_v.validate(AGENT_COMPLETE_REQUEST)
    response_v.validate(AGENT_COMPLETE_RESPONSE)


def test_health_response(agent_schema):
    validator_for(agent_schema, "healthResponse").validate(HEALTH_RESPONSE)


def test_start_response_requires_agent_state(agent_schema):
    doc = dict(AGENT_START_RESPONSE)
    del doc["agentState"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(agent_schema, "agentStartResponse").validate(doc)


def test_complete_response_done_must_be_true(agent_schema):
    doc = dict(AGENT_COMPLETE_RESPONSE)
    doc["done"] = False
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(agent_schema, "agentCompleteResponse").validate(doc)


def test_next_response_requires_reply(agent_schema):
    doc = dict(AGENT_NEXT_RESPONSE)
    del doc["reply"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(agent_schema, "agentNextResponse").validate(doc)


def test_next_request_requires_message(agent_schema):
    doc = dict(AGENT_NEXT_REQUEST)
    del doc["message"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(agent_schema, "agentNextRequest").validate(doc)


def test_invalid_difficulty_rejected(agent_schema):
    doc = dict(AGENT_START_RESPONSE)
    doc["question"] = dict(doc["question"])
    doc["question"]["difficulty"] = "impossible"
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(agent_schema, "agentStartResponse").validate(doc)
