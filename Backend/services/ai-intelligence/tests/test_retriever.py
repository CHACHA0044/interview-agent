"""
Purpose:
Unit tests for the RAG semantic retrieval service.

Responsibilities:
- Verify that retrieval successfully queries Qdrant and constructs `RetrievalResult`.
- Test handling of empty queries and empty search results.
- Test context assembly string formatting.
- Verify that Qdrant/Embedding failures are caught and returned as warnings.

Connected Files:
- app/rag/retriever.py
- app/schemas/retrieval.py

Important implementation notes:
- Uses mock Qdrant clients and mock LLM providers.
"""

import pytest
from unittest.mock import MagicMock
from qdrant_client.models import ScoredPoint

from app.rag.retriever import retrieve, assemble_context, build_metadata_filter
from app.schemas.retrieval import RetrievalResult, RetrievedChunk


def test_build_metadata_filter():
    """Verify Qdrant filter generation."""
    assert build_metadata_filter(None) is None
    assert build_metadata_filter({}) is None
    
    # Valid filter
    f = build_metadata_filter({"day": 5, "type": "BUILD"})
    assert f is not None
    assert len(f.must) == 2
    
    # Ignore unsupported keys
    f2 = build_metadata_filter({"day": 5, "unsupported_fake_key": True})
    assert len(f2.must) == 1


def test_retrieve_success():
    """Verify normal retrieval flow maps correctly to result models."""
    mock_llm = MagicMock()
    mock_llm.embed.return_value = [[0.1, 0.2]]
    
    mock_qdrant = MagicMock()
    mock_qdrant.search.return_value = [
        ScoredPoint(
            id="test-id-1", 
            version=1, 
            score=0.95,
            payload={"text": "Chunk 1", "day": 1, "title": "Setup"}
        )
    ]
    
    result = retrieve("how to setup", mock_llm, mock_qdrant)
    
    assert result.query == "how to setup"
    assert result.total_found == 1
    assert len(result.warnings) == 0
    assert result.chunks[0].content == "Chunk 1"
    assert result.chunks[0].metadata["day"] == 1
    assert result.chunks[0].score == 0.95


def test_retrieve_empty_query():
    """Verify empty query returns safely without calling external services."""
    mock_llm = MagicMock()
    mock_qdrant = MagicMock()
    
    result = retrieve("   ", mock_llm, mock_qdrant)
    
    assert result.total_found == 0
    assert "Empty query" in result.warnings[0]
    mock_llm.embed.assert_not_called()


def test_retrieve_provider_failure():
    """Verify LLM embedding failure returns safe warning."""
    mock_llm = MagicMock()
    mock_llm.embed.side_effect = Exception("API down")
    mock_qdrant = MagicMock()
    
    result = retrieve("test", mock_llm, mock_qdrant)
    
    assert result.total_found == 0
    assert "Embedding generation failed" in result.warnings[0]


def test_assemble_context():
    """Verify context assembly correctly formats strings with sources."""
    result = RetrievalResult(
        query="test",
        chunks=[
            RetrievedChunk(
                content="First chunk text.", 
                score=0.9, 
                metadata={"day": 12, "title": "RAG"}
            ),
            RetrievedChunk(
                content="Second chunk text.", 
                score=0.8, 
                metadata={"day": 15, "title": "Evaluation"}
            )
        ],
        total_found=2
    )
    
    context_str = assemble_context(result)
    
    assert "[Source 1: Day 12 - RAG]" in context_str
    assert "First chunk text." in context_str
    assert "[Source 2: Day 15 - Evaluation]" in context_str
    assert "Second chunk text." in context_str
    assert "\n\n---\n\n" in context_str


def test_assemble_context_empty():
    """Verify assembling empty results does not fabricate data."""
    empty_result = RetrievalResult(query="test")
    context_str = assemble_context(empty_result)
    
    assert context_str == "No relevant curriculum context found."
