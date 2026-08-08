"""
Purpose:
Implements the RAG curriculum ingestion pipeline.

Responsibilities:
- Loads curriculum.json and validates the schema.
- Chunks curriculum days into searchable texts.
- Gathers embeddings for the chunks using the configured LLM provider.
- Upserts the vectors into Qdrant safely and idempotently.

Connected Files:
- app/schemas/curriculum.py
- app/rag/vector_store.py
- app/llm/factory.py

Important implementation notes:
- Uses deterministic UUIDs based on the 'day' integer for idempotent upserts.
- Extracts 'day', 'title', 'type', and 'tools' as Qdrant payload metadata.
"""

import json
import logging
import uuid
from typing import List, Dict, Any
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from app.schemas.curriculum import CurriculumData, CurriculumDay
from app.rag.vector_store import get_qdrant_client, recreate_collection
from app.llm.factory import get_llm_provider
from app.llm.provider import ChatProvider

logger = logging.getLogger(__name__)


def generate_stable_id(day: int) -> str:
    """Generate a stable UUID based on the curriculum day."""
    return str(uuid.uuid5(uuid.NAMESPACE_OID, f"curriculum_day_{day}"))


def format_day_chunk(day_data: CurriculumDay) -> str:
    """Formats a curriculum day into a rich text chunk for embeddings."""
    tools_str = ", ".join(day_data.tools) if day_data.tools else "None"
    objectives_str = "\n".join(f"- {obj}" for obj in day_data.objectives)
    
    return (
        f"Title: {day_data.title}\n"
        f"Type: {day_data.type}\n"
        f"Tools: {tools_str}\n"
        f"Objectives:\n{objectives_str}"
    )


def load_curriculum(file_path: Path) -> CurriculumData:
    """Loads and validates the curriculum JSON file."""
    if not file_path.exists():
        raise FileNotFoundError(f"Curriculum file not found at {file_path}")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return CurriculumData(**data)
    except json.JSONDecodeError as e:
        raise ValueError(f"Curriculum JSON is malformed: {e}")
    except Exception as e:
        raise ValueError(f"Failed to validate curriculum schema: {e}")


def ingest_curriculum(
    curriculum_path: Path,
    qdrant_client: QdrantClient,
    collection_name: str,
    llm_provider: ChatProvider,
    batch_size: int = 10
):
    """
    Main ingestion pipeline.
    Loads curriculum, generates embeddings, and upserts to Qdrant.
    """
    logger.info(f"Starting curriculum ingestion from {curriculum_path}")
    
    curriculum = load_curriculum(curriculum_path)
    days = curriculum.days
    
    if not days:
        logger.warning("Curriculum contains no days to ingest.")
        return

    logger.info(f"Loaded {len(days)} curriculum days. Generating embeddings...")

    # Process in batches to avoid overwhelming the embedding provider
    for i in range(0, len(days), batch_size):
        batch_days = days[i:i + batch_size]
        
        texts_to_embed = [format_day_chunk(day) for day in batch_days]
        
        try:
            embeddings = llm_provider.embed(texts_to_embed)
        except Exception as e:
            logger.error(f"Embedding generation failed for batch {i}-{i+batch_size}: {e}")
            raise
            
        points: List[PointStruct] = []
        for day, embedding, text_chunk in zip(batch_days, embeddings, texts_to_embed):
            payload: Dict[str, Any] = {
                "day": day.day,
                "title": day.title,
                "type": day.type,
                "tools": day.tools,
                "text": text_chunk
            }
            
            point = PointStruct(
                id=generate_stable_id(day.day),
                vector=embedding,
                payload=payload
            )
            points.append(point)
            
        try:
            qdrant_client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info(f"Successfully upserted batch {i}-{i+len(batch_days)} to Qdrant.")
        except Exception as e:
            logger.error(f"Failed to upsert batch to Qdrant: {e}")
            raise

    logger.info("Curriculum ingestion completed successfully.")


if __name__ == "__main__":
    # Example execution script
    from app.core.config import settings
    logging.basicConfig(level=logging.INFO)
    
    # Path is relative to the backend directory during execution
    curriculum_file = Path("../../curriculum.json").resolve()
    
    q_client = get_qdrant_client()
    # Recreate the collection (vector size 1536 for text-embedding-3-small)
    recreate_collection(q_client, vector_size=1536)
    
    provider = get_llm_provider()
    
    ingest_curriculum(
        curriculum_path=curriculum_file,
        qdrant_client=q_client,
        collection_name=settings.qdrant_collection,
        llm_provider=provider
    )
