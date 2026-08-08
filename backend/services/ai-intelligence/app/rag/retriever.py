"""
Purpose:
Implements semantic retrieval against the Qdrant curriculum vector database.

Responsibilities:
- Generates query embeddings using the ChatProvider.
- Executes Qdrant search with optional metadata filtering.
- Falls back to in-memory curriculum lookup (source='fallback') when Qdrant is
  unavailable or when running with the FakeLLMProvider (backend.md §16.2).
- Assembles retrieved chunks into clean string context for LLM prompts.

Connected Files:
- app/schemas/retrieval.py
- app/rag/fallback.py
- app/core/config.py
"""

import logging
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.core.config import settings
from app.llm.fake_provider import FakeLLMProvider
from app.llm.provider import ChatProvider
from app.rag.fallback import fallback_retrieve
from app.schemas.retrieval import RetrievalResult

logger = logging.getLogger(__name__)


def build_metadata_filter(filters: Optional[Dict[str, Any]]) -> Optional[Filter]:
    """
    Constructs a Qdrant Filter from a dictionary of constraints.
    Supported fields align with ingestion payload: 'day', 'type', 'title', 'tools'.
    """
    if not filters:
        return None

    conditions = []
    for key, value in filters.items():
        if key in ["day", "type", "title"] and value is not None:
            conditions.append(
                FieldCondition(
                    key=key,
                    match=MatchValue(value=value)
                )
            )
        # For tools (which is a list), a MatchValue will match if the list contains the value.
        elif key == "tool" and value is not None:
            conditions.append(
                FieldCondition(
                    key="tools",
                    match=MatchValue(value=value)
                )
            )

    if not conditions:
        return None

    return Filter(must=conditions)  # type: ignore


def _qdrant_chunks(search_result) -> List[dict]:
    """Converts Qdrant search hits into contract-shaped RetrievedChunk dicts."""
    chunks: List[dict] = []
    for point in search_result:
        payload = point.payload or {}
        chunks.append(
            {
                "day": payload.get("day", 0),
                "title": payload.get("title", ""),
                "objectives": [],
                "tools": payload.get("tools", []),
                "score": point.score,
            }
        )
    return chunks


def retrieve(
    query: str,
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient,
    filters: Optional[Dict[str, Any]] = None,
    top_k: Optional[int] = None,
    score_threshold: Optional[float] = None
) -> RetrievalResult:
    """
    Executes a semantic search against Qdrant, degrading to the in-memory
    curriculum fallback when Qdrant is unavailable or the provider is fake.
    """
    top_k = top_k or settings.rag_top_k
    score_threshold = score_threshold if score_threshold is not None else settings.rag_score_threshold

    if not query or not query.strip():
        logger.warning("Retrieval called with empty query.")
        return RetrievalResult(query=query, total_found=0, warnings=["Empty query provided."])

    if isinstance(llm_provider, FakeLLMProvider):
        chunks = fallback_retrieve(query, filters=filters, top_k=top_k)
        return RetrievalResult(
            query=query,
            chunks=chunks,
            total_found=len(chunks),
            source="fallback",
            warnings=["Qdrant retrieval skipped in fake LLM mode; used in-memory curriculum fallback."],
        )

    try:
        # Generate embedding for the search query
        query_embedding = llm_provider.embed([query])[0]
    except Exception as e:
        logger.error(f"Failed to generate embedding for query: {e}")
        chunks = fallback_retrieve(query, filters=filters, top_k=top_k)
        return RetrievalResult(
            query=query,
            chunks=chunks,
            total_found=len(chunks),
            source="fallback",
            warnings=[f"Embedding generation failed: {e}"],
        )

    query_filter = build_metadata_filter(filters)

    try:
        search_result = qdrant_client.search(  # type: ignore
            collection_name=settings.qdrant_collection,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=top_k,
            score_threshold=score_threshold
        )
    except Exception as e:
        logger.error(f"Qdrant search failed: {e}")
        chunks = fallback_retrieve(query, filters=filters, top_k=top_k)
        return RetrievalResult(
            query=query,
            chunks=chunks,
            total_found=len(chunks),
            source="fallback",
            warnings=[f"Vector database search failed: {e}"],
        )

    return RetrievalResult(
        query=query,
        chunks=_qdrant_chunks(search_result),
        total_found=len(search_result),
        source="qdrant",
    )


def assemble_context(result: RetrievalResult) -> str:
    """
    Converts a RetrievalResult into a clean string block for LLM prompting.
    Preserves source metadata to ground the AI.
    """
    if not result.chunks:
        return "No relevant curriculum context found."

    assembled_blocks = []

    for idx, chunk in enumerate(result.chunks, 1):
        block = f"[Source {idx}: Day {chunk.day} - {chunk.title}]\n"
        if chunk.objectives:
            block += "\n".join(f"- {obj}" for obj in chunk.objectives)
        else:
            block += chunk.title
        assembled_blocks.append(block)

    return "\n\n---\n\n".join(assembled_blocks)
