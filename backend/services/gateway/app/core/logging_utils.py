"""Structured logging helpers for the Interview Agent Gateway.

Emits one JSON-tagged line per event:
    [GATEWAY] {"event": "...", "sessionId": "...", ...}

Design constraints:
- Pure stdlib only (logging module) — no extra deps.
- Synchronous and non-blocking (no I/O, just a log call).
- Never logs API keys, secrets, or full PII beyond what's already
  in the existing session context (name/id is fine).
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

_PREFIX = "[GATEWAY]"


def gw_log(event: str, *, debug: bool = False, **fields: Any) -> None:
    """Emit a single structured [GATEWAY] log line.

    Usage::

        gw_log("request_start", session_id=sid, request_type="start", store="in-memory")
        gw_log("request_done",  session_id=sid, latency_ms=142, status=200)

    ``debug=True`` emits at DEBUG level so high-frequency, low-signal events
    (e.g. the frontend LLM-status poll) stay invisible at the default INFO
    level and never obscure interview-turn logs.
    """
    payload: dict[str, Any] = {"event": event, "ts": round(time.time(), 3)}
    payload.update(fields)
    # json.dumps with default=str handles any non-serialisable sentinel values.
    if debug:
        logger.debug("%s %s", _PREFIX, json.dumps(payload, default=str))
    else:
        logger.info("%s %s", _PREFIX, json.dumps(payload, default=str))
