"""
Purpose:
Groq LLM provider implementing the full provider failover chain.

Failover order (per requirement):
    1. GROQ_API_KEY (primary key)        - tried first
    2. Cerebras (CEREBRAS_API_KEY)       - tried second, own client/endpoint
    3. GROQ_API_KEY_2 ... GROQ_API_KEY_9 - tried in order, only after both the
                                           primary Groq key and Cerebras failed
    4. FakeLLMProvider                   - final safety net, only when every
                                           provider/key above is exhausted

Each provider/key tracks 429 exhaustion with a cooldown (retry-after parsed from
"Please try again in 16m47s." style errors) and recovers in the background without
a restart. Never logs API keys - only key_N labels.
"""

import logging
import threading
import time
from typing import Any, Callable, Dict, List, Optional, Union

import openai
from openai import OpenAI

from app.llm.cerebras_provider import CEREBRAS_DEFAULT_MODEL, CerebrasProvider
from app.llm.fake_provider import FakeLLMProvider
from app.llm.groq_key_pool import (
    DEFAULT_RECOVERY_INTERVAL_SECONDS,
    GroqKey,
    GroqKeyPool,
    discover_groq_api_keys,
    extract_retry_after_seconds,
)
from app.llm.provider import ChatProvider

logger = logging.getLogger(__name__)

GROQ_DEFAULT_PRIMARY_MODEL = "llama-3.3-70b-versatile"
GROQ_DEFAULT_FALLBACK_MODEL = "llama-3.1-8b-instant"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

_OUTCOME_OK = "ok"
_OUTCOME_EXHAUSTED = "exhausted"
_OUTCOME_ERROR = "error"


class _ChainSlot:
    """A step in the failover chain (provider/key pair)."""

    __slots__ = ("label", "display", "active", "invoke")

    def __init__(
        self,
        label: str,
        display: str,
        active: bool,
        invoke: Callable[[List[Dict[str, Any]], bool, float], tuple],
    ) -> None:
        self.label = label
        self.display = display
        self.active = active
        self.invoke = invoke


class GroqProvider(ChatProvider):
    """
    Groq LLM provider with multi-key rotation, Cerebras failover, and a FakeLLM
    safety net. Primary Groq key -> Cerebras -> Groq keys 2..N -> FakeLLM.
    """

    def __init__(
        self,
        api_keys: Union[str, List[str]],
        model: str = GROQ_DEFAULT_PRIMARY_MODEL,
        fallback_model: str = GROQ_DEFAULT_FALLBACK_MODEL,
        base_url: str = GROQ_BASE_URL,
        cerebras_api_key: Optional[str] = None,
        cerebras_model: Optional[str] = None,
        cerebras_base_url: Optional[str] = None,
        recovery_interval_seconds: float = DEFAULT_RECOVERY_INTERVAL_SECONDS,
    ):
        keys: List[str] = [api_keys] if isinstance(api_keys, str) else list(api_keys)
        if not keys:
            raise ValueError("At least one Groq API key must be provided.")

        self.model = model
        self.fallback_model = fallback_model
        self.base_url = base_url
        self.recovery_interval_seconds = recovery_interval_seconds

        self._pool = GroqKeyPool(keys, recovery_interval_seconds=recovery_interval_seconds)
        # max_retries=0: the openai SDK's internal backoff (up to tens of seconds
        # per attempt) would otherwise defeat the provider-level failover chain,
        # which is designed to rotate to the next key/model promptly on a 429.
        self._clients: Dict[int, OpenAI] = {
            key.index: OpenAI(
                api_key=key.secret, base_url=base_url, max_retries=0
            )
            for key in self._pool.keys()
        }
        if cerebras_api_key:
            self._cerebras = CerebrasProvider(
                api_key=cerebras_api_key,
                model=cerebras_model or CEREBRAS_DEFAULT_MODEL,
                base_url=cerebras_base_url or "https://api.cerebras.ai/v1",
            )
        else:
            self._cerebras = None

        self._fake_fallback = FakeLLMProvider()
        self._rotation_lock = threading.Lock()
        self._rotation_count = 0
        self._last_rotation: Optional[dict] = None
        # Bounded history of rotation events so the UI can replay the chain
        # (e.g. "Groq key 1 -> Cerebras -> Groq key 2 -> FakeLLM") across polls.
        self._rotation_history: List[dict] = []
        # Guards the once-per-episode "fake fallback reached" notification so it
        # fires a single time until a real provider successfully serves again.
        self._fake_active = False

    # ---------------------------------------------------------- chain order
    def _ordered_slots(self) -> List[_ChainSlot]:
        slots: List[_ChainSlot] = []
        primary = self._pool.primary_key()
        slots.append(
            _ChainSlot(
                primary.label,
                primary.display_name,
                self._pool.is_active(primary),
                lambda m, j, t: self._try_groq_key(primary, m, j, t),
            )
        )
        if self._cerebras is not None:
            slots.append(
                _ChainSlot(
                    "cerebras",
                    "Cerebras",
                    self._cerebras.active(),
                    lambda m, j, t: self._cerebras.attempt(m, j, t),
                )
            )
        for key in self._pool.other_keys():
            slots.append(
                _ChainSlot(
                    key.label,
                    key.display_name,
                    self._pool.is_active(key),
                    lambda m, j, t, k=key: self._try_groq_key(k, m, j, t),
                )
            )
        return slots

    def active_slot(self) -> str:
        """The first slot that can currently serve - shown in the UI."""
        for slot in self._ordered_slots():
            if slot.active:
                return slot.display
        return "FakeLLM"

    def degraded(self) -> bool:
        """True only when every provider/key in the chain is down."""
        return not any(slot.active for slot in self._ordered_slots())

    # ------------------------------------------------------------- ChatProvider
    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate completion following the failover chain:
        Groq key 1 -> Cerebras -> Groq keys 2..N -> FakeLLM.
        """
        slots = self._ordered_slots()
        if not any(slot.active for slot in slots):
            # Every real provider/key is cooling down or disabled - fake is the
            # only option left, and it is only ever reached here.
            return self._emit_fake_fallback(
                messages, json_mode, temperature, reason="all_providers_exhausted"
            )

        for idx, slot in enumerate(slots):
            if not slot.active:
                continue
            outcome, detail = slot.invoke(messages, json_mode, temperature)
            if outcome == _OUTCOME_OK:
                self._fake_active = False
                return detail
            if outcome == _OUTCOME_EXHAUSTED:
                next_slot = slots[idx + 1] if idx + 1 < len(slots) else None
                to_display = next_slot.display if next_slot else "FakeLLM"
                self._record_rotation(slot.display, to_display, detail, reason="rate_limit")
                if to_display == "FakeLLM":
                    self._fake_active = True

        # Every slot was tried and none could serve - fake is the last resort.
        return self._emit_fake_fallback(
            messages, json_mode, temperature, reason="all_providers_failed"
        )

    def _emit_fake_fallback(
        self,
        messages: List[Dict[str, Any]],
        json_mode: bool,
        temperature: float,
        reason: str,
    ) -> str:
        """Log + notify (once per episode) when FakeLLMProvider is reached.

        FakeLLMProvider must only ever be reached after every real provider/key
        in the chain has been tried and failed. This is the single funnel point
        for that transition, and it is never reached earlier.
        """
        logger.warning(
            "[AI] provider_failover to=FakeLLMProvider reason=%s "
            "- all providers exhausted, using fallback",
            reason,
        )
        if not self._fake_active:
            self._record_rotation(
                "All providers",
                "FakeLLM",
                None,
                reason="all_providers_exhausted",
            )
            self._fake_active = True
        return self._fake_fallback.complete(
            messages, json_mode=json_mode, temperature=temperature
        )

    def _try_groq_key(
        self,
        key: GroqKey,
        messages: List[Dict[str, Any]],
        json_mode: bool,
        temperature: float,
    ) -> tuple:
        """Attempt primary then fallback model on one Groq key.

        Returns (outcome, detail): ("ok", content) on success; ("exhausted",
        retry_after) when the key hit a rate limit on all attempts; ("error",
        None) for non-rate-limit failures.
        """
        saw_rate_limit = False
        last_retry_after: Optional[float] = None
        for model in (self.model, self.fallback_model):
            try:
                content = self._call_groq(key, model, messages, json_mode, temperature)
                logger.info(
                    "[AI] llm_call_success provider=groq key=%s model=%s",
                    key.label,
                    model,
                )
                return (_OUTCOME_OK, content)
            except openai.RateLimitError as e:
                saw_rate_limit = True
                last_retry_after = extract_retry_after_seconds(e)
                logger.warning(
                    "[AI] groq_rate_limit key=%s model=%s retry_after=%s",
                    key.label,
                    model,
                    last_retry_after,
                )
                continue
            except openai.APIError as e:
                logger.warning(
                    "[AI] groq_api_error key=%s model=%s error=%s", key.label, model, e
                )
                continue
            except Exception as e:
                logger.error(
                    "[AI] groq_provider_error key=%s model=%s error=%s",
                    key.label,
                    model,
                    e,
                )
                continue

        if saw_rate_limit:
            # A 429 on any model attempt exhausts the key. Cool it down with the
            # parsed retry hint when present, else the default cooldown, so the
            # chain actually rotates away instead of hammering the same key.
            self._pool.exhaust(key, last_retry_after)
            return (_OUTCOME_EXHAUSTED, last_retry_after)
        return (_OUTCOME_ERROR, None)

    def _call_groq(
        self,
        key: GroqKey,
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

        response = self._clients[key.index].chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Groq does not serve vector embeddings; delegate safely to FakeLLM."""
        return self._fake_fallback.embed(texts)

    def available(self) -> bool:
        """Check reachability of the Groq API via the primary key."""
        try:
            primary = self._pool.primary_key()
            self._clients[primary.index].models.list()
            return True
        except Exception:
            return False

    # ------------------------------------------------------------- observability
    def _record_rotation(
        self,
        from_display: str,
        to_display: str,
        retry_after: Optional[float],
        reason: str = "rate_limit",
    ) -> None:
        with self._rotation_lock:
            self._rotation_count += 1
            rotation = {
                "seq": self._rotation_count,
                "at": round(time.time(), 3),
                "from": from_display,
                "to": to_display,
                "retry_after_seconds": retry_after,
                "reason": reason,
            }
            self._last_rotation = rotation
            self._rotation_history.append(rotation)
            if len(self._rotation_history) > 20:
                del self._rotation_history[: len(self._rotation_history) - 20]
        logger.warning(
            "[AI] provider_rotation from=%s to=%s reason=%s retry_after=%s",
            from_display,
            to_display,
            reason,
            retry_after,
        )

    def status(self) -> dict:
        slots = self._ordered_slots()
        return {
            "provider": "groq",
            "primary_model": self.model,
            "fallback_model": self.fallback_model,
            "active_slot": self.active_slot(),
            "all_exhausted": not any(slot.active for slot in slots),
            "fake_active": self._fake_active,
            "slots": [
                {"label": slot.label, "display": slot.display, "active": slot.active}
                for slot in slots
            ],
            "pool": self._pool.status(),
            "cerebras": self._cerebras.status() if self._cerebras else {
                "provider": "cerebras", "configured": False, "active": False,
            },
            "last_rotation": self._last_rotation,
            "rotations": list(self._rotation_history),
        }


def build_groq_provider_from_settings(settings) -> GroqProvider:
    """Construct a GroqProvider from application settings + env Groq keys."""
    primary = settings.groq_api_key or settings.llm_api_key
    api_keys = discover_groq_api_keys(primary_fallback=primary)
    if not api_keys:
        raise ValueError(
            "GROQ_API_KEY or LLM_API_KEY environment variable is required for Groq provider."
        )
    return GroqProvider(
        api_keys=api_keys,
        model=settings.groq_model or GROQ_DEFAULT_PRIMARY_MODEL,
        fallback_model=settings.groq_fallback_model or GROQ_DEFAULT_FALLBACK_MODEL,
        cerebras_api_key=settings.cerebras_api_key,
        cerebras_model=settings.cerebras_model,
        cerebras_base_url=settings.cerebras_base_url,
        recovery_interval_seconds=settings.groq_recovery_interval_seconds,
    )
