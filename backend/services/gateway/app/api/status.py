"""Public route: GET /api/llm/status.

Proxies the ai-intelligence failover snapshot so the frontend can render the
current active provider/key and rotation history without any internal access.

Log-noise contract: the frontend polls this endpoint every ~4s. Requests are
routed through ``InternalHttpClient.get_json(quiet=True)`` so the httpx INFO
line is suppressed, and the route emits only a DEBUG-level ``status_poll``
line. At the default INFO log level a live interview leaves no trace of the
poll, so status polling never obscures interview-turn logs.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request

from app.clients.base import InternalHttpClient
from app.core.logging_utils import gw_log

router = APIRouter()

logger = logging.getLogger(__name__)


def _ai_client(request: Request) -> InternalHttpClient:
    return request.app.state.ai_client


@router.get("/api/llm/status")
async def llm_status(request: Request) -> dict:
    status_payload = await _ai_client(request).get_json(
        "/internal/ai/llm/status", quiet=True
    )
    gw_log(
        "status_poll",
        debug=True,
        provider=status_payload.get("provider"),
        active_slot=status_payload.get("active_slot"),
        rotations=len(status_payload.get("rotations") or []),
        all_exhausted=status_payload.get("all_exhausted"),
    )
    return status_payload
