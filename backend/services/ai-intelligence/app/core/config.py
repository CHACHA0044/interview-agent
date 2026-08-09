"""
Purpose:
Manages application configuration for the ai-intelligence service.

Responsibilities:
- Reads environment variables for LLM provider configuration.
- Provides typed settings using pydantic-settings.
- Implements validation and defaults for necessary credentials.

Connected Files:
- app/llm/factory.py
- app/llm/openai_provider.py

Important implementation notes:
- Defaults to 'fake' for LLM_PROVIDER so the service runs with no API keys
  (matches the docker-compose default). Real providers are selected by
  setting LLM_PROVIDER=openai plus LLM_API_KEY.
- Does not expose API keys in standard output or logs.
"""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM Configuration
    llm_provider: str = "fake"
    llm_model: str = "gpt-4o-mini"
    llm_api_key: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_temperature: float = 0.3

    # Groq Provider Configuration
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_fallback_model: str = "llama-3.1-8b-instant"
    # Additional rotated keys GROQ_API_KEY_2 ... GROQ_API_KEY_N are read directly
    # from the environment by app.llm.groq_key_pool (pydantic ignores extra vars).
    groq_recovery_interval_seconds: float = 300.0

    # Cerebras Provider Configuration (second step of the failover chain)
    cerebras_api_key: Optional[str] = None
    cerebras_model: str = "llama-3.3-70b"
    cerebras_base_url: str = "https://api.cerebras.ai/v1"

    # Qdrant Configuration
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    qdrant_collection: str = "curriculum_days"

    # Embedding / RAG Retrieval Configuration
    embeddings_model: str = "text-embedding-3-small"
    rag_top_k: int = 3
    rag_score_threshold: float = 0.70

    # In-memory curriculum fallback (used when Qdrant is unavailable).
    curriculum_path: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
