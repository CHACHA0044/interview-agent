"""
Purpose:
Manages application configuration for the interview-agent service.

Responsibilities:
- Reads environment variables for the ai-intelligence client and follow-up limits.
- Provides typed settings using pydantic-settings.

Connected Files:
- app/services/ai_client.py
- app/services/orchestrator.py

Important implementation notes:
- Field names map to environment variables (AI_SERVICE_URL, AI_TIMEOUT_SECONDS,
  AI_RETRIES, FOLLOWUP_BUDGET, FOLLOWUP_MAX_PER_QUESTION) via pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_service_url: str = "http://ai-intelligence:8002"
    ai_timeout_seconds: float = 30.0
    ai_retries: int = 2
    followup_budget: int = 4
    followup_max_per_question: int = 2

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
