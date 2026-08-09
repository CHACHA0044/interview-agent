"""
Purpose:
Manages the pool of Groq API keys with automatic rate-limit rotation.

Responsibilities:
- Discovers GROQ_API_KEY, GROQ_API_KEY_2, ..., GROQ_API_KEY_N from the environment.
- Tracks per-key exhaustion with cooldown timestamps and retry-after hints parsed
  from Groq rate-limit error bodies (e.g. "Please try again in 16m47s.").
- Periodically re-enables cooled-down keys in the background (daemon thread) so a
  key recovers without a service restart.
- Exposes pool status for observability endpoints (never exposes key secrets).

Connected Files:
- app/llm/groq_provider.py
- app/llm/factory.py
"""

import logging
import os
import re
import threading
import time
from typing import List, Optional

logger = logging.getLogger(__name__)

# Cooldown used when a rate-limit error carries no parseable retry hint.
DEFAULT_RETRY_AFTER_SECONDS = 300.0
# How often the background recovery thread re-checks exhausted keys.
DEFAULT_RECOVERY_INTERVAL_SECONDS = 300.0

_RETRY_PATTERNS = [
    re.compile(r"try again in\s+(\d+)\s*m\s*(\d+)\s*s", re.IGNORECASE),
    re.compile(r"try again in\s+(\d+)\s*s", re.IGNORECASE),
    re.compile(r"retry[\s_-]*after[\s:]+(\d+)\s*s", re.IGNORECASE),
]


def extract_retry_after_seconds(error) -> Optional[float]:
    """Best-effort parse of a Groq rate-limit retry hint.

    Prefers the ``Retry-After`` header when the SDK surfaces one, then falls back
    to text patterns such as ``Please try again in 16m47s.`` Returns None when no
    usable hint is found (callers apply DEFAULT_RETRY_AFTER_SECONDS).
    """
    headers = getattr(error, "headers", None) or {}
    if isinstance(headers, dict):
        header = headers.get("Retry-After")
    else:
        try:
            header = headers.get("Retry-After")
        except Exception:
            header = None
    if header:
        try:
            return float(header)
        except (TypeError, ValueError):
            pass

    text = str(error)
    for index, pattern in enumerate(_RETRY_PATTERNS):
        match = pattern.search(text)
        if not match:
            continue
        if index == 0:  # "try again in 16m47s" -> minutes + optional seconds
            minutes = int(match.group(1))
            seconds = int(match.group(2)) if match.group(2) else 0
            total = minutes * 60 + seconds
        else:  # "try again in 30s" / "retry after 30s" -> total seconds
            total = int(match.group(1))
        return float(total)
    return None


class GroqKey:
    """A single Groq API key with exhaustion/cooldown state (no secret logging)."""

    __slots__ = ("index", "secret", "exhausted_at", "retry_after")

    def __init__(self, index: int, secret: str) -> None:
        self.index = index
        self.secret = secret
        self.exhausted_at: Optional[float] = None
        self.retry_after: Optional[float] = None

    @property
    def label(self) -> str:
        return f"groq_key_{self.index}"

    @property
    def display_name(self) -> str:
        return f"Groq key {self.index}"

    def cooldown_seconds(self) -> float:
        return self.retry_after if self.retry_after else DEFAULT_RETRY_AFTER_SECONDS

    def is_active(self) -> bool:
        """A key is active when not cooling down (or its cooldown has elapsed)."""
        if self.exhausted_at is None:
            return True
        elapsed = time.monotonic() - self.exhausted_at
        return elapsed >= self.cooldown_seconds()

    def recovery_eta(self) -> Optional[float]:
        """Seconds remaining until this key can serve again, or None if active."""
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


class GroqKeyPool:
    """Rotating pool of Groq API keys with cooldown tracking and recovery."""

    def __init__(
        self,
        api_keys: List[str],
        recovery_interval_seconds: float = DEFAULT_RECOVERY_INTERVAL_SECONDS,
    ) -> None:
        if not api_keys:
            raise ValueError("At least one Groq API key is required.")
        self._keys: List[GroqKey] = [
            GroqKey(index=index, secret=secret)
            for index, secret in enumerate(api_keys, start=1)
        ]
        self._lock = threading.Lock()
        self.recovery_interval_seconds = recovery_interval_seconds
        self._start_recovery_loop()

    @classmethod
    def from_env(
        cls, recovery_interval_seconds: float = DEFAULT_RECOVERY_INTERVAL_SECONDS
    ) -> "GroqKeyPool":
        """Discover GROQ_API_KEY, GROQ_API_KEY_2, ..., GROQ_API_KEY_N from env."""
        return cls(
            discover_groq_api_keys(),
            recovery_interval_seconds=recovery_interval_seconds,
        )

    # ------------------------------------------------------------------ keys
    def keys(self) -> List[GroqKey]:
        return list(self._keys)

    def primary_key(self) -> GroqKey:
        return self._keys[0]

    def other_keys(self) -> List[GroqKey]:
        return self._keys[1:]

    def is_active(self, key: GroqKey) -> bool:
        return key.is_active()

    def exhaust(self, key: GroqKey, retry_after: Optional[float]) -> None:
        with self._lock:
            key.exhaust(retry_after)

    def recover_expired(self) -> int:
        """Re-enable keys whose cooldown has elapsed. Returns count recovered."""
        recovered = 0
        with self._lock:
            for key in self._keys:
                if key.exhausted_at is not None and key.is_active():
                    key.clear()
                    recovered += 1
        return recovered

    # -------------------------------------------------------------- status
    def total(self) -> int:
        return len(self._keys)

    def active_count(self) -> int:
        return sum(1 for key in self._keys if key.is_active())

    def exhausted_count(self) -> int:
        return sum(1 for key in self._keys if key.exhausted_at is not None and not key.is_active())

    def all_exhausted(self) -> bool:
        return not any(key.is_active() for key in self._keys)

    def earliest_recovery_eta(self) -> Optional[float]:
        etas = [eta for key in self._keys if (eta := key.recovery_eta()) is not None]
        return min(etas) if etas else None

    def status(self) -> dict:
        keys = [
            {
                "index": key.index,
                "label": key.label,
                "active": key.is_active(),
                "recovery_eta_seconds": key.recovery_eta(),
            }
            for key in self._keys
        ]
        return {
            "provider": "groq",
            "total": self.total(),
            "active": self.active_count(),
            "exhausted": self.exhausted_count(),
            "all_exhausted": self.all_exhausted(),
            "earliest_recovery_eta_seconds": self.earliest_recovery_eta(),
            "keys": keys,
        }

    # ----------------------------------------------------------- recovery
    def _start_recovery_loop(self) -> None:
        def _loop() -> None:
            while True:
                time.sleep(self.recovery_interval_seconds)
                try:
                    recovered = self.recover_expired()
                    if recovered:
                        logger.info("[AI] groq_key_pool_recovered count=%d", recovered)
                except Exception:
                    logger.exception("[AI] groq key pool recovery check failed")

        thread = threading.Thread(
            target=_loop, name="groq-key-pool-recovery", daemon=True
        )
        thread.start()


def discover_groq_api_keys(primary_fallback: Optional[str] = None) -> List[str]:
    """Return ordered Groq keys: GROQ_API_KEY, GROQ_API_KEY_2, ..., GROQ_API_KEY_N.

    The primary key may fall back to a value already loaded from a dotenv file
    (pydantic-settings) since numbered keys are always read straight from the
    process environment.
    """
    keys: List[str] = []
    primary = os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY") or primary_fallback
    if primary:
        keys.append(primary)
    index = 2
    while True:
        key = os.getenv(f"GROQ_API_KEY_{index}")
        if not key:
            break
        keys.append(key)
        index += 1
    return keys
