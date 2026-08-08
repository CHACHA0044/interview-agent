"""
Purpose:
Defines Pydantic models for semantic retrieval outputs.

Responsibilities:
- Strongly type the output of Qdrant searches / in-memory fallback.
- Ensure metadata (day, title, objectives, tools) is cleanly separated from content.
- Gracefully handle warnings when queries fail or find zero results.

Connected Files:
- app/rag/retriever.py
"""

from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.contract import RetrievedChunk


class RetrievalResult(BaseModel):
    """Represents the complete result of a retrieval operation."""
    query: str = Field(..., description="The original search query")
    chunks: List[RetrievedChunk] = Field(default_factory=list, description="List of retrieved chunks")
    total_found: int = Field(0, description="Number of chunks retrieved")
    source: str = Field("qdrant", description="'qdrant' or 'fallback'")
    warnings: List[str] = Field(default_factory=list, description="Any warnings such as missing collections")
