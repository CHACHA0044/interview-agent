"""Application configuration for the Interview Agent Gateway."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    port: int = 8000
    backend_port: int = 8000
    redis_url: str = "redis://redis:6379/0"
    session_ttl_seconds: int = 3600
    agent_service_url: str = "http://interview-agent:8001"
    ai_service_url: str = "http://ai-intelligence:8002"
    frontend_origins: str = "http://localhost:5173"
    min_questions: int = 8
    min_curriculum_days: int = 4
    internal_api_token: str = ""
    log_level: str = "INFO"
    connect_timeout_seconds: float = 2.0
    request_timeout_seconds: float = 25.0
    retries: int = 1
    keepalive_interval_seconds: float = 180.0

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
