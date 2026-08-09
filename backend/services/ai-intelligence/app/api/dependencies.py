"""
Purpose:
FastAPI dependency injection for shared resources.

Responsibilities:
- Lazily instantiates the LLM provider and Qdrant client.
- Injects these clients into route handlers, maintaining clean architecture.

Connected Files:
- app/api/endpoints.py
- app/llm/factory.py
- app/core/config.py
"""

from typing import Generator

from qdrant_client import QdrantClient

from app.core.config import settings
from app.llm.provider import ChatProvider
from app.llm.factory import get_llm_provider as factory_get_llm_provider

# Singletons
_llm_provider = None
_qdrant_client = None


def get_llm_provider() -> ChatProvider:
    """Dependency to inject the configured ChatProvider."""
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = factory_get_llm_provider()
    return _llm_provider


def get_qdrant_client() -> QdrantClient:
    """Dependency to inject the configured QdrantClient."""
    global _qdrant_client
    if _qdrant_client is None:
        if settings.qdrant_url:
            _qdrant_client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key if settings.qdrant_api_key else None,
            )
        else:
            # Fallback to local memory mode for tests if not provided
            _qdrant_client = QdrantClient(location=":memory:")
    return _qdrant_client


def get_provider_status() -> dict:
    """Observability snapshot of the active LLM provider (never exposes keys).

    Used by the health endpoints so the gateway/frontend can surface the current
    active provider/key and exhaustion state (e.g. "Groq 6/9 keys active").
    """
    provider = get_llm_provider()
    status_method = getattr(provider, "status", None)
    if callable(status_method):
        try:
            status = status_method()
            if isinstance(status, dict):
                return status
        except Exception as e:  # pragma: no cover - defensive
            return {"provider": type(provider).__name__, "status_error": str(e)}
    return {
        "provider": type(provider).__name__,
        "configured": True,
        "all_exhausted": False,
    }
