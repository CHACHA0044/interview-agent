"""Public API route: POST /api/interview.

This is the only public route of the system (backend.md §7). It dispatches to
session start or turn handling based on whether the body carries a candidate
or a message.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.schemas.api import InterviewRequest, InterviewResponse
from app.sessions.lifecycle import SessionLifecycle

router = APIRouter()


def _lifecycle(request: Request) -> SessionLifecycle:
    return request.app.state.lifecycle


@router.post("/api/interview", response_model=InterviewResponse)
async def interview(
    body: InterviewRequest,
    request: Request,
    lifecycle: SessionLifecycle = Depends(_lifecycle),
) -> InterviewResponse:
    if body.candidate is not None:
        return await lifecycle.start(body.sessionId, body.candidate)
    if body.message is None:
        raise ValueError("message required for turn")
    return await lifecycle.next(body.sessionId, body.message)
