"""
Purpose:
Groq LLM provider implementation with automatic model failover and zero-downtime fallback.

Responsibilities:
- Communicates with Groq's high-speed inference API via OpenAI-compatible endpoint.
- Primary model: `llama-3.3-70b-versatile`
- Secondary model failover: `llama-3.1-8b-instant` (bypasses 70b daily/minute rate limits)
- Final failover: `FakeLLMProvider` (guarantees 100% uptime if Groq API rate limit or outage occurs)
"""

import logging
from typing import Any, Dict, List, Optional
import openai
from openai import OpenAI

from app.llm.provider import ChatProvider
from app.llm.fake_provider import FakeLLMProvider

logger = logging.getLogger(__name__)

GROQ_DEFAULT_PRIMARY_MODEL = "llama-3.3-70b-versatile"
GROQ_DEFAULT_FALLBACK_MODEL = "llama-3.1-8b-instant"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class GroqProvider(ChatProvider):
    """
    Groq LLM provider with multi-model failover and FakeLLM safety net.
    """

    def __init__(
        self,
        api_key: str,
        model: str = GROQ_DEFAULT_PRIMARY_MODEL,
        fallback_model: str = GROQ_DEFAULT_FALLBACK_MODEL,
        base_url: str = GROQ_BASE_URL,
    ):
        if not api_key:
            raise ValueError("API key must be provided for GroqProvider.")

        self.api_key = api_key
        self.model = model
        self.fallback_model = fallback_model
        self.base_url = base_url
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self._fake_fallback = FakeLLMProvider()

    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate completion using Groq primary model -> fallback model -> FakeLLM.
        """
        # Attempt 1: Primary Groq model (e.g., llama-3.3-70b-versatile)
        try:
            return self._call_groq(
                model=self.model,
                messages=messages,
                json_mode=json_mode,
                temperature=temperature,
            )
        except (openai.RateLimitError, openai.APIError) as e:
            logger.warning(
                f"Groq primary model '{self.model}' hit rate limit/error: {e}. "
                f"Failing over to secondary model '{self.fallback_model}'..."
            )
        except Exception as e:
            logger.error(f"Unexpected error with Groq primary model '{self.model}': {e}")

        # Attempt 2: Secondary Groq model (e.g., llama-3.1-8b-instant)
        try:
            return self._call_groq(
                model=self.fallback_model,
                messages=messages,
                json_mode=json_mode,
                temperature=temperature,
            )
        except Exception as e:
            logger.warning(
                f"Groq secondary model '{self.fallback_model}' failed: {e}. "
                "Failing over to deterministic FakeLLM Provider..."
            )

        # Attempt 3: Deterministic FakeLLM fallback (guarantees system never crashes)
        return self._fake_fallback.complete(
            messages, json_mode=json_mode, temperature=temperature
        )

    def _call_groq(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        json_mode: bool,
        temperature: float,
    ) -> str:
        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Groq does not serve vector embeddings; delegate safely to FakeLLM.
        """
        return self._fake_fallback.embed(texts)

    def available(self) -> bool:
        """
        Check reachability of Groq API.
        """
        try:
            self.client.models.list()
            return True
        except Exception:
            return False
