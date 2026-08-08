"""
Purpose:
Unit tests for the LLM Provider abstraction.

Responsibilities:
- Verify configuration defaults and overrides.
- Test initialization and factory resolution.
- Test failure conditions for missing API keys.
- Basic test of OpenAICompatibleProvider instantiation.

Connected Files:
- app/core/config.py
- app/llm/factory.py
- app/llm/openai_provider.py

Important implementation notes:
- Requires pydantic, openai, and pytest.
- Mocks environment variables during tests to ensure isolation.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from app.llm.factory import get_llm_provider
from app.llm.openai_provider import OpenAICompatibleProvider
from app.core.config import Settings


def test_config_defaults():
    """Verify default configurations are set correctly."""
    # Temporarily remove any env vars that might affect the test
    with patch.dict(os.environ, {}, clear=True):
        settings = Settings()
        assert settings.llm_provider == "openai"
        assert settings.llm_model == "gpt-4o-mini"
        assert settings.llm_api_key is None
        assert settings.llm_base_url is None


def test_openai_provider_initialization():
    """Verify that OpenAI provider requires an API key."""
    with pytest.raises(ValueError, match="API key must be provided"):
        OpenAICompatibleProvider(api_key="", model="gpt-4o-mini")

    provider = OpenAICompatibleProvider(api_key="test-key", model="gpt-4o-mini", base_url="http://localhost:8080")
    assert provider.model == "gpt-4o-mini"
    assert str(provider.client.base_url) == "http://localhost:8080"
    # The SDK masks the key or exposes it depending on the version, but we just want to ensure it instantiated without error.


@patch("app.llm.factory.settings")
def test_factory_openai_missing_key(mock_settings):
    """Factory should fail if openai is chosen but no key is present."""
    mock_settings.llm_provider = "openai"
    mock_settings.llm_api_key = None
    mock_settings.llm_model = "gpt-4o-mini"
    mock_settings.llm_base_url = None

    with pytest.raises(ValueError, match="LLM_API_KEY environment variable is required"):
        get_llm_provider()


@patch("app.llm.factory.settings")
def test_factory_openai_success(mock_settings):
    """Factory should succeed and return OpenAICompatibleProvider when configured."""
    mock_settings.llm_provider = "openai"
    mock_settings.llm_api_key = "test-api-key"
    mock_settings.llm_model = "gpt-4o-mini"
    mock_settings.llm_base_url = None

    provider = get_llm_provider()
    assert isinstance(provider, OpenAICompatibleProvider)
    assert provider.model == "gpt-4o-mini"


@patch("app.llm.factory.settings")
def test_factory_unknown_provider(mock_settings):
    """Factory should raise ValueError for unknown provider."""
    mock_settings.llm_provider = "unknown"
    
    with pytest.raises(ValueError, match="Unknown LLM provider type configured"):
        get_llm_provider()
