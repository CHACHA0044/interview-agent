"""
Purpose:
Provides a factory to instantiate the configured LLM provider.

Responsibilities:
- Reads application settings to determine which provider to use.
- Instantiates and configures the provider (e.g., OpenAICompatibleProvider).
- Supports FakeLLMProvider for offline/demo mode (LLM_PROVIDER=fake).

Connected Files:
- app/core/config.py
- app/llm/provider.py
- app/llm/openai_provider.py
- app/llm/fake_provider.py
"""

from app.core.config import settings
from app.llm.fake_provider import FakeLLMProvider
from app.llm.groq_provider import GroqProvider
from app.llm.openai_provider import OpenAICompatibleProvider
from app.llm.provider import ChatProvider


def get_llm_provider() -> ChatProvider:
    """
    Factory function to get the configured LLM provider.

    Returns:
        An instance of a class implementing ChatProvider.

    Raises:
        ValueError: If the configuration is missing required fields or provider type is unknown.
    """
    provider_type = settings.llm_provider.lower()

    if provider_type == "groq":
        api_key = settings.groq_api_key or settings.llm_api_key
        if not api_key:
            raise ValueError("GROQ_API_KEY or LLM_API_KEY environment variable is required for Groq provider.")

        return GroqProvider(
            api_key=api_key,
            model=settings.groq_model or "llama-3.3-70b-versatile",
            fallback_model=settings.groq_fallback_model or "llama-3.1-8b-instant",
        )
    elif provider_type == "openai":
        if not settings.llm_api_key:
            raise ValueError("LLM_API_KEY environment variable is required for OpenAI provider.")

        return OpenAICompatibleProvider(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            base_url=settings.llm_base_url
        )
    elif provider_type == "fake":
        return FakeLLMProvider(model=settings.llm_model)
    else:
        raise ValueError(f"Unknown LLM provider type configured: {provider_type}")

