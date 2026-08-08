"""
Purpose:
Unit tests for the AI-powered interview question generation pipeline.

Responsibilities:
- Verify that the pipeline coordinates retrieval, prompting, and structured output correctly.
- Ensure that the fallback mechanism safely handles critical LLM failures.
- Verify behavior when RAG returns empty contexts.

Connected Files:
- app/services/question_generator.py
- app/schemas/question.py

Important implementation notes:
- Uses heavily mocked `retrieve` and `generate_structured_output` to isolate orchestration logic.
"""

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.question import QuestionStrategy, GeneratedQuestion
from app.services.question_generator import generate_interview_question
from app.schemas.retrieval import RetrievalResult, RetrievedChunk


@pytest.fixture
def sample_strategy():
    return QuestionStrategy(
        day=5,
        module=1,
        topic="FastAPI",
        difficulty="medium",
        concepts=["endpoints", "pydantic"],
        isFollowUp=False
    )


@patch("app.services.question_generator.retrieve")
@patch("app.services.question_generator.generate_structured_output")
def test_generate_interview_question_success(mock_generate, mock_retrieve, sample_strategy):
    # Mock RAG returning a valid chunk
    mock_retrieve.return_value = RetrievalResult(
        query="FastAPI endpoints pydantic",
        total_found=1,
        chunks=[RetrievedChunk(content="FastAPI uses Pydantic for validation.", score=0.9, metadata={"title": "FastAPI Basics"})]
    )
    
    # Mock Structured Output returning a valid question
    expected_question = GeneratedQuestion(
        question="How does FastAPI use Pydantic?",
        type="technical",
        difficulty="medium",
        topic="FastAPI",
        expectedConcepts=["pydantic", "validation"]
    )
    mock_generate.return_value = expected_question
    
    mock_llm = MagicMock()
    mock_qdrant = MagicMock()
    
    result = generate_interview_question(
        strategy=sample_strategy,
        candidate_context={"tier": "junior"},
        conversation_history=[],
        llm_provider=mock_llm,
        qdrant_client=mock_qdrant
    )
    
    assert result.question == "How does FastAPI use Pydantic?"
    assert mock_retrieve.call_count == 1
    # Check that retrieve was filtered by the correct day
    assert mock_retrieve.call_args.kwargs["filters"] == {"day": 5}
    assert mock_generate.call_count == 1


@patch("app.services.question_generator.retrieve")
@patch("app.services.question_generator.generate_structured_output")
def test_generate_question_empty_retrieval(mock_generate, mock_retrieve, sample_strategy):
    # Mock RAG returning NO chunks
    mock_retrieve.return_value = RetrievalResult(query="FastAPI", total_found=0, chunks=[])
    
    mock_generate.return_value = GeneratedQuestion(
        question="Fallback prompt based question?",
        type="technical",
        difficulty="medium",
        topic="FastAPI",
        expectedConcepts=[]
    )
    
    mock_llm = MagicMock()
    mock_qdrant = MagicMock()
    
    result = generate_interview_question(
        strategy=sample_strategy,
        candidate_context={"tier": "junior"},
        conversation_history=[],
        llm_provider=mock_llm,
        qdrant_client=mock_qdrant
    )
    
    # The generation should still succeed using the system prompt + strategy
    assert result.question == "Fallback prompt based question?"
    assert mock_generate.call_count == 1


@patch("app.services.question_generator.retrieve")
@patch("app.services.question_generator.generate_structured_output")
def test_generate_question_llm_failure_triggers_fallback(mock_generate, mock_retrieve, sample_strategy):
    # Mock RAG returning chunks
    mock_retrieve.return_value = RetrievalResult(
        query="FastAPI", total_found=1, chunks=[RetrievedChunk(content="data", score=0.9)]
    )
    
    # Mock Structured Output completely failing and raising an exception
    mock_generate.side_effect = Exception("LLM connection completely failed")
    
    mock_llm = MagicMock()
    mock_qdrant = MagicMock()
    
    result = generate_interview_question(
        strategy=sample_strategy,
        candidate_context={},
        conversation_history=[],
        llm_provider=mock_llm,
        qdrant_client=mock_qdrant
    )
    
    # It should catch the exception and use the safe deterministic fallback
    assert "Could you explain your understanding of FastAPI?" in result.question
    assert result.topic == "FastAPI"
    assert result.difficulty == "medium"
