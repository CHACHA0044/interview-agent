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
  AI_RETRIES, FOLLOWUP_BUDGET, FOLLOWUP_MAX_PER_QUESTION, MIN_QUESTIONS,
  MIN_CURRICULUM_DAYS) via pydantic-settings.
- Range enforcement keeps values within tested bounds. Settings arriving from
  the per-request interviewConfig (forwarded by the gateway) override these
  defaults for a single interview session.
"""

from typing import Annotated

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_service_url: str = "http://ai-intelligence:8002"
    ai_timeout_seconds: float = 30.0
    ai_retries: int = 2

    # Follow-up floor config (also configurable per-request from frontend Settings).
    followup_budget: Annotated[int, Field(ge=2, le=6)] = 4
    followup_max_per_question: Annotated[int, Field(ge=1, le=3)] = 2

    # Hard floor for interview completion (also configurable per-request).
    min_questions: Annotated[int, Field(ge=8, le=12)] = 8
    min_curriculum_days: Annotated[int, Field(ge=3, le=5)] = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
