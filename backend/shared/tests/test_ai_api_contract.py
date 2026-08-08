"""Contract tests for the Agent → AI Intelligence API (ai_api.json)."""

import jsonschema
import pytest

from conftest import validator_for
from fixtures import (
    EVALUATE_ANSWER_REQUEST,
    EVALUATION,
    GENERATE_FEEDBACK_REQUEST,
    GENERATE_FOLLOWUP_REQUEST,
    GENERATE_QUESTION_REQUEST,
    GENERATED_QUESTION,
    RETRIEVE_CONTEXT_REQUEST,
    RETRIEVE_CONTEXT_RESPONSE,
)


def test_generate_question_request_and_response(ai_schema):
    validator_for(ai_schema, "generateQuestionRequest").validate(
        GENERATE_QUESTION_REQUEST
    )
    validator_for(ai_schema, "generateQuestionResponse").validate(
        GENERATED_QUESTION
    )


def test_generate_followup_request_and_response(ai_schema):
    validator_for(ai_schema, "generateFollowupRequest").validate(
        GENERATE_FOLLOWUP_REQUEST
    )
    validator_for(ai_schema, "generateFollowupResponse").validate(
        GENERATED_QUESTION
    )


def test_evaluate_answer_request_and_response(ai_schema):
    validator_for(ai_schema, "evaluateAnswerRequest").validate(
        EVALUATE_ANSWER_REQUEST
    )
    validator_for(ai_schema, "evaluateAnswerResponse").validate(EVALUATION)


def test_generate_feedback_request(ai_schema):
    validator_for(ai_schema, "generateFeedbackRequest").validate(
        GENERATE_FEEDBACK_REQUEST
    )


def test_generate_feedback_response_shape(ai_schema):
    feedback = {
        "summary": "s",
        "strengths": ["a"],
        "gaps": ["b"],
        "next": ["c"],
    }
    validator_for(ai_schema, "generateFeedbackResponse").validate(feedback)


def test_retrieve_context_request_and_response(ai_schema):
    validator_for(ai_schema, "retrieveContextRequest").validate(
        RETRIEVE_CONTEXT_REQUEST
    )
    validator_for(ai_schema, "retrieveContextResponse").validate(
        RETRIEVE_CONTEXT_RESPONSE
    )


def test_health_response(ai_schema):
    validator_for(ai_schema, "healthResponse").validate(
        {"status": "ok", "service": "ai-intelligence"}
    )


def test_evaluation_score_above_max_rejected(ai_schema):
    doc = dict(EVALUATION)
    doc["score"] = 11.0
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(ai_schema, "evaluateAnswerResponse").validate(doc)


def test_evaluation_missing_followup_required_rejected(ai_schema):
    doc = dict(EVALUATION)
    del doc["followUpRequired"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(ai_schema, "evaluateAnswerResponse").validate(doc)


def test_retrieval_invalid_source_rejected(ai_schema):
    doc = dict(RETRIEVE_CONTEXT_RESPONSE)
    doc["source"] = "chroma"
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(ai_schema, "retrieveContextResponse").validate(doc)


def test_generate_question_request_requires_strategy(ai_schema):
    doc = dict(GENERATE_QUESTION_REQUEST)
    del doc["questionStrategy"]
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(ai_schema, "generateQuestionRequest").validate(doc)


def test_invalid_tier_rejected(ai_schema):
    doc = dict(GENERATE_QUESTION_REQUEST)
    doc["candidateContext"] = dict(doc["candidateContext"])
    doc["candidateContext"]["tier"] = "genius"
    with pytest.raises(jsonschema.exceptions.ValidationError):
        validator_for(ai_schema, "generateQuestionRequest").validate(doc)
