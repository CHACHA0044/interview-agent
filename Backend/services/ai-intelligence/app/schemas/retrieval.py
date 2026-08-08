"""
Purpose:
Defines Pydantic models for semantic retrieval outputs.

Responsibilities:
- Strongly type the output of Qdrant searches.
- Ensure metadata (day, type, tools, title) is cleanly separated from content.
- Gracefully handle warnings when queries fail or find zero results.

Connected Files:
- app/rag/retriever.py

Important implementation notes:
- Supports capturing metadata mapped during ingestion.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    """Represents a single semantically retrieved curriculum chunk."""
    content: str = Field(..., description="The chunk text")
    score: float = Field(..., description="Similarity score from Qdrant")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Source info like day, type, tools")
    source: str = Field(default="qdrant", description="Source identifier")


class RetrievalResult(BaseModel):
    """Represents the complete result of a retrieval operation."""
    query: str = Field(..., description="The original search query")
    chunks: List[RetrievedChunk] = Field(default_factory=list, description="List of relevant chunks")
    total_found: int = Field(0, description="Number of chunks retrieved")
    warnings: List[str] = Field(default_factory=list, description="Any warnings such as missing collections")
