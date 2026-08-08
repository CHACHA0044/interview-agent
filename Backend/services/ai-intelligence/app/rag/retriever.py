"""
Purpose:
Implements semantic retrieval against the Qdrant curriculum vector database.

Responsibilities:
- Generates query embeddings using the ChatProvider.
- Executes Qdrant search with optional metadata filtering.
- Assembles retrieved chunks into clean string context for LLM prompts.
- Gracefully handles empty results and network exceptions.

Connected Files:
- app/schemas/retrieval.py
- app/rag/vector_store.py
- app/core/config.py

Important implementation notes:
- Requires the ingestion pipeline to have populated the Qdrant collection.
- Never fabricates curriculum data when zero results are found.
"""

import logging
from typing import Dict, Any, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.core.config import settings
from app.llm.provider import ChatProvider
from app.schemas.retrieval import RetrievedChunk, RetrievalResult

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
        
    return Filter(must=conditions) # type: ignore


def retrieve(
    query: str,
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient,
    filters: Optional[Dict[str, Any]] = None,
    top_k: Optional[int] = None,
    score_threshold: Optional[float] = None
) -> RetrievalResult:
    """
    Executes a semantic search against Qdrant.
    """
    top_k = top_k or settings.rag_top_k
    score_threshold = score_threshold if score_threshold is not None else settings.rag_score_threshold
    
    if not query or not query.strip():
        logger.warning("Retrieval called with empty query.")
        return RetrievalResult(query=query, total_found=0, warnings=["Empty query provided."])

    try:
        # Generate embedding for the search query
        query_embedding = llm_provider.embed([query])[0]
    except Exception as e:
        logger.error(f"Failed to generate embedding for query: {e}")
        return RetrievalResult(query=query, total_found=0, warnings=[f"Embedding generation failed: {e}"])
        
    query_filter = build_metadata_filter(filters)

    try:
        search_result = qdrant_client.search( # type: ignore
            collection_name=settings.qdrant_collection,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=top_k,
            score_threshold=score_threshold
        )
    except Exception as e:
        logger.error(f"Qdrant search failed: {e}")
        return RetrievalResult(query=query, total_found=0, warnings=[f"Vector database search failed: {e}"])

    chunks: List[RetrievedChunk] = []
    for point in search_result:
        # Extract metadata saved during ingestion
        payload = point.payload or {}
        content = payload.get("text", "")
        
        # Build clean metadata dict
        metadata = {
            "day": payload.get("day"),
            "title": payload.get("title"),
            "type": payload.get("type"),
            "tools": payload.get("tools", [])
        }
        
        chunk = RetrievedChunk(
            content=content,
            score=point.score,
            metadata=metadata
        )
        chunks.append(chunk)

    return RetrievalResult(
        query=query,
        chunks=chunks,
        total_found=len(chunks)
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
        day = chunk.metadata.get("day", "Unknown")
        title = chunk.metadata.get("title", "Unknown Title")
        
        block = f"[Source {idx}: Day {day} - {title}]\n{chunk.content}"
        assembled_blocks.append(block)
        
    return "\n\n---\n\n".join(assembled_blocks)
