"""Session lifecycle orchestration: start, turn, complete.

The gateway owns the session document in Redis and drives the agent through
its internal API. It stores agentState verbatim and copies only the safe
sessionView fields into the document (backend.md §10.2).
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.errors import (
    SessionCompletedError,
    SessionExistsError,
    SessionNotFoundError,
)
from app.core.logging_utils import gw_log
from app.schemas.api import Candidate, InterviewRequest, InterviewResponse
from app.schemas.internal import ConversationItem, SessionDoc

_AGENT_ROLE = "agent"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _store_kind(store) -> str:
    """Return 'redis' or 'in-memory' depending on the active session store."""
    from app.sessions.redis_store import RedisSessionStore
    return "redis" if isinstance(store, RedisSessionStore) else "in-memory"


class SessionLifecycle:
    """Coordinates session storage with the interview-agent client."""

    def __init__(self, store, agent_client) -> None:
        self._store = store
        self._agent = agent_client

    async def start(
        self,
        session_id: str,
        candidate: Candidate,
        interview_config: Optional[Dict[str, Any]] = None,
    ) -> InterviewResponse:
        store_kind = _store_kind(self._store)
        gw_log(
            "request_start",
            session_id=session_id,
            request_type="start",
            candidate_id=candidate.member.id,
            store=store_kind,
        )
        existing = await self._store.get(session_id)
        if existing is not None:
            raise SessionExistsError(
                f"session already exists: {session_id}",
                detail={"sessionId": session_id},
            )

        now = _utcnow()
        doc = SessionDoc(
            sessionId=session_id,
            status="active",
            createdAt=now,
            updatedAt=now,
            candidate=candidate,
        )
        t0 = time.monotonic()
        result = await self._agent.start(session_id, candidate, interview_config=interview_config)
        latency_ms = round((time.monotonic() - t0) * 1000)
        self._apply_turn(doc, result)
        await self._store.save(doc)

        gw_log(
            "request_done",
            session_id=session_id,
            request_type="start",
            store=store_kind,
            agent_latency_ms=latency_ms,
            status=200,
            done=result.done,
        )
        return self._to_response(doc, result, result.feedback)

    async def next(
        self, session_id: str, message: str
    ) -> InterviewResponse:
        doc = await self._store.get(session_id)
        if doc is None:
            raise SessionNotFoundError(
                f"session not found: {session_id}",
                detail={"sessionId": session_id},
            )
        if doc.status == "completed":
            raise SessionCompletedError(
                f"session already completed: {session_id}",
                detail={"sessionId": session_id},
            )

        store_kind = _store_kind(self._store)
        turn_number = len(doc.conversation) // 2 + 1  # rough turn count
        gw_log(
            "request_start",
            session_id=session_id,
            request_type="turn",
            turn=turn_number,
            store=store_kind,
            answer_len=len(message),
        )

        doc.conversation.append(
            ConversationItem(role="candidate", content=message)
        )
        t0 = time.monotonic()
        result = await self._agent.next(
            session_id,
            doc.candidate,
            doc.agentState,
            doc.conversation,
            doc.currentQuestion,
            message,
        )
        latency_ms = round((time.monotonic() - t0) * 1000)
        self._apply_turn(doc, result)

        if result.done:
            feedback = result.feedback
            if feedback is None:
                completed = await self._agent.complete(session_id, result.agentState)
                feedback = completed.feedback
            doc.status = "completed"
            doc.finalFeedback = feedback
            doc.updatedAt = _utcnow()
            await self._store.save(doc)
            gw_log(
                "request_done",
                session_id=session_id,
                request_type="turn",
                store=store_kind,
                agent_latency_ms=latency_ms,
                status=200,
                done=True,
            )
            return self._to_response(doc, result, feedback)

        await self._store.save(doc)
        gw_log(
            "request_done",
            session_id=session_id,
            request_type="turn",
            store=store_kind,
            agent_latency_ms=latency_ms,
            status=200,
            done=False,
        )
        return self._to_response(doc, result, None)

    def _apply_turn(self, doc: SessionDoc, result) -> None:
        """Copy safe agent outputs into the session document."""
        doc.agentState = result.agentState
        doc.currentQuestion = result.question or doc.currentQuestion
        doc.questionCount = result.sessionView.questionCount
        doc.daysAsked = list(result.sessionView.daysAsked)
        doc.scores = list(result.sessionView.scores)
        doc.conversation.append(
            ConversationItem(role=_AGENT_ROLE, content=result.reply)
        )
        doc.updatedAt = _utcnow()

    @staticmethod
    def _to_response(doc: SessionDoc, result, feedback) -> InterviewResponse:
        return InterviewResponse(
            reply=result.reply,
            done=result.done,
            feedback=feedback,
            question=result.question.model_dump() if result.question else None,
            session=result.sessionView.model_dump(),
        )
