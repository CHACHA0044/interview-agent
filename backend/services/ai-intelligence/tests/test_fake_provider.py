"""
Purpose:
Tests for the FakeLLMProvider safety net and its schema-complete JSON output.

These prove the last-resort fallback can never produce schema-invalid output:
- json_mode output validates against the contract implied by the prompt.
- The real curriculum day / difficulty / topic are carried through from the
  prompt payload instead of a placeholder ``{"fake": True}`` stub.
- The Groq failover chain's fake fallback (bad key path) returns JSON that
  validates against GeneratedQuestion.

Connected Files:
- app/llm/fake_provider.py
- app/llm/groq_provider.py
- app/llm/prompts/builders.py
- app/schemas/question.py
- app/schemas/ai_output.py
"""

import json

import openai
import pytest
from unittest.mock import patch

from app.llm.fake_provider import FakeLLMProvider
from app.llm.groq_provider import GroqProvider
from app.llm.prompts.builders import (
    build_question_prompt,
    build_followup_prompt,
    build_evaluation_prompt,
    build_feedback_prompt,
)
from app.llm.prompts.system_interviewer import SYSTEM_INTERVIEWER
from app.schemas.ai_output import EvaluationOutput, FeedbackOutput
from app.schemas.question import GeneratedQuestion


def _question_messages():
    return build_question_prompt(
        candidate_context={
            "candidateId": "CAND-001",
            "name": "Sarah Johnson",
            "role": "Senior Data Engineer",
            "tier": "expert",
        },
        curriculum_context={"modules": ["Module 3"], "content": "RAG content"},
        retrieved_context=[{"title": "Chunk", "content": "obj", "day": 12}],
        question_strategy={
            "day": 12,
            "module": 3,
            "topic": "Vector Databases",
            "difficulty": "hard",
            "concepts": ["cosine similarity", "embeddings"],
            "isFollowUp": False,
        },
        conversation_history=[],
    )


def test_fake_provider_question_output_valid_and_grounded():
    messages = _question_messages()
    raw = FakeLLMProvider().complete(messages, json_mode=True)
    parsed = json.loads(raw)

    assert "fake" not in parsed
    q = GeneratedQuestion.model_validate(parsed)
    assert q.day == 12
    assert q.topic == "Vector Databases"
    assert q.difficulty == "hard"
    assert q.question


def test_fake_provider_followup_output_valid_and_grounded():
    messages = build_followup_prompt(
        candidate_context={"candidateId": "c1", "name": "Alice", "role": "dev", "tier": "novice"},
        curriculum_context={"content": "content"},
        retrieved_context=[],
        followup_strategy={
            "day": 6,
            "difficulty": "hard",
            "previousAnswer": "I use vectors to search.",
            "weakConcepts": ["cosine similarity", "dimensions"],
            "questionStrategy": {
                "day": 6,
                "module": 2,
                "topic": "Vector Databases",
                "difficulty": "medium",
                "concepts": ["cosine similarity"],
                "isFollowUp": False,
            },
        },
        conversation_history=[],
    )
    raw = FakeLLMProvider().complete(messages, json_mode=True)
    q = GeneratedQuestion.model_validate(json.loads(raw))
    assert q.day == 6
    assert q.topic == "Vector Databases"
    assert q.difficulty == "hard"
    assert q.type == "follow-up"


def test_fake_provider_evaluation_output_valid():
    messages = build_evaluation_prompt(
        candidate_context={"candidateId": "c1", "name": "Alice", "role": "dev", "tier": "strong"},
        retrieved_context=[{"title": "Chunk", "content": "obj", "day": 1}],
        question={
            "question": "What is DI?",
            "type": "technical",
            "difficulty": "medium",
            "topic": "Architecture",
            "day": 1,
            "expectedConcepts": ["inversion of control", "decoupling"],
        },
        candidate_answer="Inversion of control means decoupling components.",
    )
    raw = FakeLLMProvider().complete(messages, json_mode=True)
    parsed = json.loads(raw)
    assert "fake" not in parsed
    eval_out = EvaluationOutput.model_validate(parsed)
    assert eval_out.score >= 0.0 and eval_out.score <= 10.0


def test_fake_provider_feedback_output_valid():
    messages = build_feedback_prompt(
        candidate={"member": {"name": "Sarah Johnson"}},
        candidate_context={"candidateId": "CAND-001", "name": "Sarah", "role": "SE", "tier": "strong"},
        evaluations=[{"score": 8.5, "strengths": ["Depth"], "gaps": ["Edge cases"]}],
        coverage={"12": 0.8},
        missed_concepts={"12": ["chunking"]},
        topic_scores=[{"module": 3, "score": 8.5}],
    )
    raw = FakeLLMProvider().complete(messages, json_mode=True)
    parsed = json.loads(raw)
    assert "fake" not in parsed
    feedback = FeedbackOutput.model_validate(parsed)
    assert "Sarah" in feedback.summary


def test_fake_provider_empty_messages_still_valid_question():
    raw = FakeLLMProvider().complete([{"role": "user", "content": ""}], json_mode=True)
    q = GeneratedQuestion.model_validate(json.loads(raw))
    assert q.day == 0
    assert q.topic


def test_groq_chain_fake_fallback_validates_against_question_schema():
    """The mid-flight fallback (bad key) returns schema-valid GeneratedQuestion JSON."""
    provider = GroqProvider(api_keys=["invalid_key_9999999999"])
    with patch.object(provider, "_call_groq", side_effect=openai.APIError(
        "mock", request=None, body=None
    )):
        raw = provider.complete(_question_messages(), json_mode=True)
    parsed = json.loads(raw)
    assert "fake" not in parsed
    q = GeneratedQuestion.model_validate(parsed)
    assert q.day == 12


def test_system_interviewer_instructs_day_field():
    assert '"day"' in SYSTEM_INTERVIEWER
    assert "day" in SYSTEM_INTERVIEWER
    assert "ALWAYS include" in SYSTEM_INTERVIEWER
