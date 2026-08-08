"""
Purpose:
Unit tests for the AI-powered candidate answer evaluation pipeline.

Responsibilities:
- Verify that empty answers fast-path safely to 0.0 scores.
- Ensure perfect or partial answers route properly to the structured LLM output.
- Verify fallback behavior catches severe API failures without crashing.

Connected Files:
- app/services/evaluator.py
- app/schemas/ai_output.py

Important implementation notes:
- Uses heavily mocked `retrieve` and `generate_structured_output`.
- question_payload is a contract-shaped GeneratedQuestion (includes day).
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.ai_output import EvaluationOutput
from app.schemas.contract import CandidateContext
from app.schemas.question import GeneratedQuestion
from app.services.evaluator import evaluate_answer
from app.schemas.retrieval import RetrievalResult, RetrievedChunk


@pytest.fixture
def sample_question():
    return GeneratedQuestion(
        question="What is dependency injection?",
        type="technical",
        difficulty="medium",
        topic="Architecture",
        day=1,
        expectedConcepts=["inversion of control", "decoupling"]
    )


@pytest.fixture
def sample_candidate():
    return CandidateContext(
        candidateId="c1",
        name="Alice",
        role="backend developer",
        tier="strong"
    )


@patch("app.services.evaluator.retrieve")
@patch("app.services.evaluator.generate_structured_output")
def test_evaluate_perfect_answer(mock_generate, mock_retrieve, sample_question, sample_candidate):
    mock_retrieve.return_value = RetrievalResult(
        query="Architecture inversion of control decoupling",
        total_found=1,
        chunks=[RetrievedChunk(day=1, title="DI", objectives=["DI means decoupling..."], score=0.9)]
    )

    expected = EvaluationOutput(
        score=10.0,
        conceptCoverage=1.0,
        technicalAccuracy=1.0,
        depth=1.0,
        strengths=["Great accuracy"],
        gaps=[],
        followUpRequired=False,
        notes="Perfect."
    )
    mock_generate.return_value = expected

    result = evaluate_answer(
        question_payload=sample_question,
        candidate_answer="Dependency injection is inversion of control for decoupling.",
        candidate_context=sample_candidate,
        llm_provider=MagicMock(),
        qdrant_client=MagicMock()
    )

    assert result.score == 10.0
    assert result.followUpRequired is False
    assert mock_generate.call_count == 1
    assert mock_retrieve.call_count == 1


@patch("app.services.evaluator.retrieve")
@patch("app.services.evaluator.generate_structured_output")
def test_evaluate_empty_answer_fast_path(mock_generate, mock_retrieve, sample_question, sample_candidate):
    # Empty answers should not trigger the LLM or DB at all
    result = evaluate_answer(
        question_payload=sample_question,
        candidate_answer="   ",
        candidate_context=sample_candidate,
        llm_provider=MagicMock(),
        qdrant_client=MagicMock()
    )

    assert result.score == 0.0
    assert result.followUpRequired is True
    assert len(result.gaps) > 0

    mock_retrieve.assert_not_called()
    mock_generate.assert_not_called()


@patch("app.services.evaluator.retrieve")
@patch("app.services.evaluator.generate_structured_output")
def test_evaluate_llm_failure_fallback(mock_generate, mock_retrieve, sample_question, sample_candidate):
    mock_retrieve.return_value = RetrievalResult(query="test", total_found=0, chunks=[])

    mock_generate.side_effect = Exception("LLM connection completely failed")

    result = evaluate_answer(
        question_payload=sample_question,
        candidate_answer="I don't know.",
        candidate_context=sample_candidate,
        llm_provider=MagicMock(),
        qdrant_client=MagicMock()
    )

    # Should fallback deterministically
    assert result.score == 0.0
    assert result.followUpRequired is True
    assert "Evaluation failed" in result.gaps[0]
