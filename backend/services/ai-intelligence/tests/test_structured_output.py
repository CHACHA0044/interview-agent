"""
Purpose:
Unit tests for structured LLM output generation.

Responsibilities:
- Verify that valid JSON is correctly parsed into Pydantic models.
- Ensure that malformed JSON or validation errors trigger retries.
- Ensure that complete failures result in a deterministic fallback.

Connected Files:
- app/llm/structured_output.py
- app/schemas/ai_output.py

Important implementation notes:
- Uses a mock `ChatProvider` to simulate different LLM behavior sequences.
"""

import json
import pytest
from unittest.mock import MagicMock

from app.llm.structured_output import generate_structured_output
from app.schemas.ai_output import EvaluationOutput, FeedbackOutput


def test_valid_json_returns_model():
    """Verify that a valid JSON string is parsed into the expected model immediately."""
    mock_provider = MagicMock()
    valid_eval = {
        "score": 8.5,
        "conceptCoverage": 0.9,
        "technicalAccuracy": 0.8,
        "depth": 0.8,
        "strengths": ["Good explanation"],
        "gaps": [],
        "followUpRequired": False,
        "notes": "Solid answer."
    }
    mock_provider.complete.return_value = json.dumps(valid_eval)

    result = generate_structured_output(mock_provider, [{"role": "user", "content": "hi"}], EvaluationOutput)
    
    assert isinstance(result, EvaluationOutput)
    assert result.score == 8.5
    assert result.followUpRequired is False
    assert mock_provider.complete.call_count == 1


def test_malformed_json_retries_then_succeeds():
    """Verify that a JSONDecodeError triggers a retry."""
    mock_provider = MagicMock()
    
    malformed_json = '{"score": 8.5, "conceptCoverage": 0.9' # Missing closing brace
    valid_json = '{"score": 8.5, "conceptCoverage": 0.9, "technicalAccuracy": 0.8, "depth": 0.8, "strengths": [], "gaps": [], "followUpRequired": false, "notes": "ok"}'
    
    mock_provider.complete.side_effect = [malformed_json, valid_json]

    result = generate_structured_output(mock_provider, [{"role": "user"}], EvaluationOutput)
    
    assert isinstance(result, EvaluationOutput)
    assert result.score == 8.5
    assert mock_provider.complete.call_count == 2


def test_validation_error_retries_then_succeeds():
    """Verify that missing fields trigger a Pydantic ValidationError and a retry."""
    mock_provider = MagicMock()
    
    invalid_json = '{"score": 8.5}' # Missing required fields
    valid_json = '{"score": 8.5, "conceptCoverage": 0.9, "technicalAccuracy": 0.8, "depth": 0.8, "strengths": [], "gaps": [], "followUpRequired": false, "notes": "ok"}'
    
    mock_provider.complete.side_effect = [invalid_json, valid_json]

    result = generate_structured_output(mock_provider, [{"role": "user"}], EvaluationOutput)
    
    assert isinstance(result, EvaluationOutput)
    assert result.score == 8.5
    assert mock_provider.complete.call_count == 2


def test_exhausted_retries_returns_fallback():
    """Verify that failing all retries returns the deterministic fallback."""
    mock_provider = MagicMock()
    
    # Always return broken JSON
    mock_provider.complete.return_value = '{"not": "valid"}'
    
    result = generate_structured_output(mock_provider, [{"role": "user"}], EvaluationOutput, max_retries=1)
    
    assert isinstance(result, EvaluationOutput)
    assert result.score == 0.0 # Fallback default
    assert result.followUpRequired is True
    assert len(result.gaps) > 0
    assert "Evaluation failed" in result.gaps[0]
    assert mock_provider.complete.call_count == 2 # 1 initial + 1 retry


def test_provider_exception_returns_fallback():
    """Verify that if the provider itself throws an exception, it falls back."""
    mock_provider = MagicMock()
    mock_provider.complete.side_effect = Exception("Network Error")

    result = generate_structured_output(mock_provider, [{"role": "user"}], FeedbackOutput, max_retries=0)
    
    assert isinstance(result, FeedbackOutput)
    assert "failure" in result.summary.lower()
    assert mock_provider.complete.call_count == 1
