"""Public route: GET /api/llm/status.

Proxies the ai-intelligence failover snapshot so the frontend can render the
current active provider/key and rotation history without any internal access.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.clients.base import InternalHttpClient

router = APIRouter()


def _ai_client(request: Request) -> InternalHttpClient:
    return request.app.state.ai_client


@router.get("/api/llm/status")
async def llm_status(request: Request) -> dict:
    return await _ai_client(request).get_json("/internal/ai/llm/status")
