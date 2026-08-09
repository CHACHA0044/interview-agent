"""
Unit and integration tests for Groq LLM Provider.
"""

import os
import pytest
from app.llm.groq_provider import GroqProvider, GROQ_DEFAULT_PRIMARY_MODEL, GROQ_DEFAULT_FALLBACK_MODEL


def test_groq_provider_initialization():
    provider = GroqProvider(api_keys=["gsk_dummy_key_123"])
    assert provider.model == GROQ_DEFAULT_PRIMARY_MODEL
    assert provider.fallback_model == GROQ_DEFAULT_FALLBACK_MODEL
    assert provider.active_slot() == "Groq key 1"


def test_groq_provider_live_key_completion():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        pytest.skip("GROQ_API_KEY environment variable not set")

    provider = GroqProvider(api_keys=[key])
    messages = [{"role": "user", "content": "Respond with exactly one word: 'READY'"}]
    res = provider.complete(messages, temperature=0.0)
    assert len(res) > 0


def test_groq_provider_fallback_on_invalid_model():
    key = os.getenv("GROQ_API_KEY", "gsk_dummy_key_123")
    provider = GroqProvider(
        api_keys=[key],
        model="nonexistent-model-70b",
        fallback_model="llama-3.1-8b-instant"
    )
    messages = [{"role": "user", "content": "Hello"}]
    res = provider.complete(messages)
    assert len(res) > 0


def test_groq_provider_fallback_to_fake_on_total_failure():
    # Bad key forces complete failover to FakeLLMProvider
    provider = GroqProvider(api_keys=["invalid_key_9999999999"])
    messages = [{"role": "user", "content": "Hello"}]
    res = provider.complete(messages)
    assert len(res) > 0
