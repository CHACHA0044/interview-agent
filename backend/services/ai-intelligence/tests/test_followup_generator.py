"""
Purpose:
Unit tests for the adaptive follow-up generation pipeline.

Responsibilities:
- Verify that previous answers are correctly tracked in the strategy.
- Ensure retrieval filters and queries use the weak concepts.
- Verify fallback behavior handles LLM network failures safely.
- Test empty answers don't break the pipeline.

Connected Files:
- app/services/followup_generator.py
- app/schemas/question.py

Important implementation notes:
- Uses heavily mocked `retrieve` and `generate_structured_output`.
- FollowUpStrategy follows the ai_api contract (day, difficulty, previousAnswer, weakConcepts).
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.question import FollowUpStrategy, GeneratedQuestion, QuestionStrategy
from app.schemas.contract import CandidateContext
from app.services.followup_generator import generate_followup_question
from app.schemas.retrieval import RetrievalResult, RetrievedChunk


@pytest.fixture
def sample_followup_strategy():
    return FollowUpStrategy(
        day=6,
        difficulty="hard",
        previousAnswer="I use vectors to search.",
        weakConcepts=["cosine similarity", "dimensions"],
        questionStrategy=QuestionStrategy(
            day=6,
            module=2,
            topic="Vector Databases",
            difficulty="medium",
            concepts=["cosine similarity"],
            isFollowUp=False,
        ),
    )


@pytest.fixture
def sample_candidate():
    return CandidateContext(
        candidateId="c1",
        name="Alice",
        role="backend developer",
        tier="junior"
    )


@patch("app.services.followup_generator.retrieve")
@patch("app.services.followup_generator.generate_structured_output")
def test_generate_followup_success(mock_generate, mock_retrieve, sample_followup_strategy, sample_candidate):
    # Mock retrieval
    mock_retrieve.return_value = RetrievalResult(
        query="Vector Databases cosine similarity dimensions",
        total_found=1,
        chunks=[RetrievedChunk(day=6, title="Math", objectives=["Cosine similarity is used for..."], score=0.9)]
    )

    # Mock LLM Output
    expected = GeneratedQuestion(
        question="Can you elaborate on how cosine similarity works?",
        type="technical",
        difficulty="hard",
        topic="Vector Databases",
        day=6,
        expectedConcepts=["angle", "magnitude"]
    )
    mock_generate.return_value = expected

    mock_llm = MagicMock()
    mock_qdrant = MagicMock()

    result = generate_followup_question(
        strategy=sample_followup_strategy,
        candidate_context=sample_candidate,
        curriculum_context=None,
        conversation=[],
        llm_provider=mock_llm,
        qdrant_client=mock_qdrant
    )

    assert result.question == "Can you elaborate on how cosine similarity works?"
    assert result.type == "follow-up"

    # The strategy carries the previous answer; the pipeline embeds it via build_followup_prompt.
    assert mock_generate.call_count == 1
    assert mock_retrieve.call_count == 1
    assert mock_retrieve.call_args.kwargs["filters"] == {"day": 6}


@patch("app.services.followup_generator.retrieve")
@patch("app.services.followup_generator.generate_structured_output")
def test_generate_followup_empty_answer(mock_generate, mock_retrieve, sample_followup_strategy, sample_candidate):
    mock_retrieve.return_value = RetrievalResult(query="test", total_found=0, chunks=[])

    expected = GeneratedQuestion(
        question="You didn't answer, can you try?",
        type="technical",
        difficulty="easy",
        topic="Vector Databases",
        day=6,
        expectedConcepts=[]
    )
    mock_generate.return_value = expected

    strategy = sample_followup_strategy.model_copy(update={"previousAnswer": "   "})

    result = generate_followup_question(
        strategy=strategy,
        candidate_context=sample_candidate,
        curriculum_context=None,
        conversation=[],
        llm_provider=MagicMock(),
        qdrant_client=MagicMock()
    )

    assert result.question == "You didn't answer, can you try?"


@patch("app.services.followup_generator.retrieve")
@patch("app.services.followup_generator.generate_structured_output")
def test_generate_followup_llm_failure(mock_generate, mock_retrieve, sample_followup_strategy, sample_candidate):
    mock_retrieve.return_value = RetrievalResult(query="test", total_found=0, chunks=[])
    mock_generate.side_effect = Exception("LLM connection completely failed")

    result = generate_followup_question(
        strategy=sample_followup_strategy,
        candidate_context=sample_candidate,
        curriculum_context=None,
        conversation=[],
        llm_provider=MagicMock(),
        qdrant_client=MagicMock()
    )

    # Should fallback deterministically
    assert "explain your understanding" in result.question
    assert result.type == "follow-up"
