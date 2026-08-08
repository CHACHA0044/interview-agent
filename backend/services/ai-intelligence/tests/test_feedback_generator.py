"""
Purpose:
Unit tests for the AI-powered candidate feedback generation pipeline.

Responsibilities:
- Verify that empty evaluations fast-path safely to the fallback payload.
- Ensure aggregated inputs map properly to the LLM builder.
- Verify fallback behavior handles API failures securely.

Connected Files:
- app/services/feedback_generator.py
- app/schemas/ai_output.py

Important implementation notes:
- Uses heavily mocked `generate_structured_output`.
- candidate_context is a contract-shaped CandidateContext instance.
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.ai_output import FeedbackOutput
from app.schemas.contract import CandidateContext
from app.services.feedback_generator import generate_feedback


@pytest.fixture
def sample_payload():
    return {
        "candidate": {"name": "Alice"},
        "candidate_context": CandidateContext(
            candidateId="c1",
            name="Alice",
            role="backend developer",
            tier="junior"
        ),
        "evaluations": [{"score": 8.0, "notes": "Good."}],
        "coverage": {"1": 1.0},
        "missed_concepts": {},
        "topic_scores": [{"module": 1, "score": 8.0}]
    }


@patch("app.services.feedback_generator.generate_structured_output")
def test_generate_feedback_success(mock_generate, sample_payload):
    expected = FeedbackOutput(
        summary="Overall good performance.",
        strengths=["Solid fundamentals"],
        gaps=[],
        next=["Review advanced topics."]
    )
    mock_generate.return_value = expected

    mock_llm = MagicMock()

    result = generate_feedback(
        **sample_payload,
        llm_provider=mock_llm
    )

    assert result.summary == "Overall good performance."
    assert "Solid fundamentals" in result.strengths
    assert mock_generate.call_count == 1

    # Verify kwargs
    kwargs = mock_generate.call_args.kwargs
    assert kwargs["model_class"] == FeedbackOutput
    assert kwargs["provider"] == mock_llm
    assert len(kwargs["messages"]) == 2  # System + User


@patch("app.services.feedback_generator.generate_structured_output")
def test_generate_feedback_empty_evaluations(mock_generate, sample_payload):
    # Pass empty evaluations list
    sample_payload["evaluations"] = []

    mock_llm = MagicMock()

    result = generate_feedback(
        **sample_payload,
        llm_provider=mock_llm
    )

    # Should safely short-circuit
    assert result.summary == "No evaluation data was recorded to synthesize feedback."
    assert len(result.strengths) == 0
    mock_generate.assert_not_called()


@patch("app.services.feedback_generator.generate_structured_output")
def test_generate_feedback_llm_failure(mock_generate, sample_payload):
    mock_generate.side_effect = Exception("API connection dropped")

    mock_llm = MagicMock()

    result = generate_feedback(
        **sample_payload,
        llm_provider=mock_llm
    )

    # Should fallback deterministically
    assert "critical failure" in result.summary.lower()
    assert len(result.strengths) == 0
