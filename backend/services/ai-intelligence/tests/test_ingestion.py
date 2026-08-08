"""
Purpose:
Unit tests for the RAG curriculum ingestion pipeline.

Responsibilities:
- Verify curriculum validation and loading.
- Verify the deterministic ID generation (idempotency).
- Verify the chunk formatting logic.
- Verify error handling for missing/malformed files.

Connected Files:
- app/rag/ingestion.py
- app/schemas/curriculum.py

Important implementation notes:
- Uses a mock curriculum.json created dynamically in a temporary directory.
"""

import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

from app.rag.ingestion import (
    load_curriculum,
    format_day_chunk,
    generate_stable_id,
    ingest_curriculum
)
from app.schemas.curriculum import CurriculumDay


@pytest.fixture
def valid_curriculum_json(tmp_path):
    data = {
        "cohort": "Test Cohort",
        "modules": [{"n": 1, "title": "Mod 1", "days": [1]}],
        "days": [
            {
                "day": 1,
                "title": "Test Day",
                "type": "SETUP",
                "tools": ["Python"],
                "objectives": ["Learn Python"]
            }
        ]
    }
    file_path = tmp_path / "curriculum.json"
    file_path.write_text(json.dumps(data))
    return file_path


@pytest.fixture
def malformed_curriculum_json(tmp_path):
    file_path = tmp_path / "bad.json"
    file_path.write_text("{bad json")
    return file_path


def test_load_curriculum_success(valid_curriculum_json):
    curriculum = load_curriculum(valid_curriculum_json)
    assert curriculum.cohort == "Test Cohort"
    assert len(curriculum.days) == 1
    assert curriculum.days[0].day == 1


def test_load_curriculum_missing_file():
    with pytest.raises(FileNotFoundError):
        load_curriculum(Path("/does/not/exist.json"))


def test_load_curriculum_malformed(malformed_curriculum_json):
    with pytest.raises(ValueError, match="malformed"):
        load_curriculum(malformed_curriculum_json)


def test_format_day_chunk():
    day = CurriculumDay(
        day=2,
        title="AI Test",
        type="BUILD",
        tools=["Ollama"],
        objectives=["Install Ollama"]
    )
    chunk = format_day_chunk(day)
    assert "Title: AI Test" in chunk
    assert "Type: BUILD" in chunk
    assert "Tools: Ollama" in chunk
    assert "- Install Ollama" in chunk


def test_generate_stable_id():
    id1 = generate_stable_id(5)
    id2 = generate_stable_id(5)
    id3 = generate_stable_id(6)
    
    assert id1 == id2
    assert id1 != id3
    # Ensure it looks like a valid UUID
    assert len(id1) == 36


@patch("app.rag.ingestion.get_llm_provider")
@patch("app.rag.ingestion.get_qdrant_client")
def test_ingest_curriculum_success(mock_qdrant, mock_llm, valid_curriculum_json):
    mock_provider = MagicMock()
    mock_provider.embed.return_value = [[0.1, 0.2, 0.3]]
    
    mock_qdrant_client = MagicMock()
    
    ingest_curriculum(
        curriculum_path=valid_curriculum_json,
        qdrant_client=mock_qdrant_client,
        collection_name="test_collection",
        llm_provider=mock_provider
    )
    
    # Verify embedding was called for 1 chunk
    mock_provider.embed.assert_called_once()
    
    # Verify upsert was called on Qdrant
    mock_qdrant_client.upsert.assert_called_once()
    kwargs = mock_qdrant_client.upsert.call_args.kwargs
    assert kwargs["collection_name"] == "test_collection"
    assert len(kwargs["points"]) == 1
    assert kwargs["points"][0].payload["day"] == 1
