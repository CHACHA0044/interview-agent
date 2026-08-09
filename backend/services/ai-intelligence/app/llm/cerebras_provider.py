"""
Purpose:
Cerebras LLM provider with per-provider rate-limit cooldown tracking.

Responsibilities:
- Communicates with Cerebras' OpenAI-compatible inference API
  (https://api.cerebras.ai/v1) using its own client and endpoint.
- Serves as the second step in the provider failover chain
  (Groq key 1 -> Cerebras -> Groq keys 2..N -> FakeLLM).
- Tracks 429 exhaustion with a cooldown so a rate-limited provider is skipped
  until it recovers, without logging the API key.

Connected Files:
- app/llm/provider.py
- app/llm/groq_provider.py
- app/llm/groq_key_pool.py (reuses retry-after parsing)
"""

import logging
import time
from typing import Any, Dict, List, Optional

import openai
from openai import OpenAI

from app.llm.groq_key_pool import DEFAULT_RETRY_AFTER_SECONDS, extract_retry_after_seconds
from app.llm.provider import ChatProvider

logger = logging.getLogger(__name__)

# Model identifiers differ between Cerebras and Groq - never assume a Groq model
# (e.g. "llama-3.3-70b-versatile") is valid on Cerebras. This default is one of
# the models actually exposed by the account tied to CEREBRAS_API_KEY (verified
# via GET /v1/models; "llama-3.3-70b" returns 404 model_not_found on it).
CEREBRAS_DEFAULT_MODEL = "gemma-4-31b"
CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1"


class CerebrasProvider(ChatProvider):
    """ChatProvider implementation for the Cerebras inference API."""

    def __init__(
        self,
        api_key: str,
        model: str = CEREBRAS_DEFAULT_MODEL,
        base_url: str = CEREBRAS_BASE_URL,
    ) -> None:
        if not api_key:
            raise ValueError("API key must be provided for CerebrasProvider.")

        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.client = OpenAI(api_key=api_key, base_url=base_url, max_retries=0)

        self.exhausted_at: Optional[float] = None
        self.retry_after: Optional[float] = None

    # ------------------------------------------------------- cooldown state
    def cooldown_seconds(self) -> float:
        return self.retry_after if self.retry_after else DEFAULT_RETRY_AFTER_SECONDS

    def active(self) -> bool:
        if self.exhausted_at is None:
            return True
        elapsed = time.monotonic() - self.exhausted_at
        return elapsed >= self.cooldown_seconds()

    def recovery_eta(self) -> Optional[float]:
        if self.exhausted_at is None:
            return None
        remaining = self.cooldown_seconds() - (time.monotonic() - self.exhausted_at)
        return max(0.0, remaining)

    def exhaust(self, retry_after: Optional[float]) -> None:
        self.exhausted_at = time.monotonic()
        self.retry_after = retry_after if retry_after else DEFAULT_RETRY_AFTER_SECONDS

    def clear(self) -> None:
        self.exhausted_at = None
        self.retry_after = None

    # ---------------------------------------------------------- ChatProvider
    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate a completion via the Cerebras API.

        Raises:
            openai.OpenAIError: propagated so the caller can distinguish
                rate-limit (cooldown) failures from other errors.
        """
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Cerebras does not serve embeddings; delegate to a deterministic hash."""
        import hashlib

        vectors: List[List[float]] = []
        for text in texts:
            digest = hashlib.sha256(text.encode("utf-8")).digest()
            vector = [(digest[i] - 128) / 128.0 for i in range(16)]
            vectors.append(vector)
        return vectors

    def available(self) -> bool:
        try:
            self.client.models.list()
            return True
        except Exception:
            return False

    def degraded(self) -> bool:
        return not self.active()

    # -------------------------------------------------------------- status
    def status(self) -> dict:
        return {
            "provider": "cerebras",
            "configured": True,
            "model": self.model,
            "active": self.active(),
            "recovery_eta_seconds": self.recovery_eta(),
        }

    def attempt(
        self,
        messages: List[Dict[str, Any]],
        json_mode: bool,
        temperature: float,
    ):
        """Invoke with failover semantics for the provider chain.

        Returns a tuple ``(outcome, detail)`` where outcome is one of
        ``"ok"`` / ``"exhausted"`` / ``"error"``.
        """
        try:
            content = self.complete(
                messages, json_mode=json_mode, temperature=temperature
            )
            logger.info("[AI] llm_call_success provider=cerebras model=%s", self.model)
            return ("ok", content)
        except openai.RateLimitError as e:
            retry_after = extract_retry_after_seconds(e)
            self.exhaust(retry_after)
            logger.warning(
                "[AI] cerebras_rate_limit retry_after=%s", retry_after
            )
            return ("exhausted", retry_after)
        except openai.APIError as e:
            logger.warning("[AI] cerebras_api_error error=%s", e)
            return ("error", None)
        except Exception as e:
            logger.error("[AI] cerebras_provider_error error=%s", e)
            return ("error", None)
