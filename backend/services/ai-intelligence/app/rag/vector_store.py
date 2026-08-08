"""
Purpose:
Provides the Qdrant client connection and helper methods for vector storage.

Responsibilities:
- Initialize the Qdrant client using application configuration.
- Expose methods to recreate the curriculum collection.
- Support upserting embeddings and metadata.

Connected Files:
- app/core/config.py
- app/rag/ingestion.py

Important implementation notes:
- Uses `qdrant-client`.
- Defaults to 1536 vector size (matches text-embedding-3-small). Can be changed based on LLM configuration.
- Recreating the collection drops existing data; designed for idempotent re-ingestion.
"""

import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_qdrant_client() -> QdrantClient:
    """Returns an initialized QdrantClient."""
    return QdrantClient(url=settings.qdrant_url)


def recreate_collection(client: QdrantClient, vector_size: int = 1536):
    """
    Recreates the configured Qdrant collection, dropping existing data.
    Ensures a clean state for re-ingestion.
    """
    collection_name = settings.qdrant_collection
    logger.info(f"Recreating Qdrant collection: {collection_name} with size {vector_size}")
    
    # We use recreating to ensure a fresh ingestion.
    # Note: `recreate_collection` is a helper in qdrant_client that drops if exists, then creates.
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
    )
