"""Session lifecycle orchestration: start, turn, complete.

The gateway owns the session document in Redis and drives the agent through
its internal API. It stores agentState verbatim and copies only the safe
sessionView fields into the document (backend.md §10.2).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.core.errors import (
    SessionCompletedError,
    SessionExistsError,
    SessionNotFoundError,
)
from app.schemas.api import Candidate, InterviewRequest, InterviewResponse
from app.schemas.internal import ConversationItem, SessionDoc

_AGENT_ROLE = "agent"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SessionLifecycle:
    """Coordinates session storage with the interview-agent client."""

    def __init__(self, store, agent_client) -> None:
        self._store = store
        self._agent = agent_client

    async def start(
        self, session_id: str, candidate: Candidate
    ) -> InterviewResponse:
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
        result = await self._agent.start(session_id, candidate)
        self._apply_turn(doc, result)
        await self._store.save(doc)
        return self._to_response(doc, result.reply, result.feedback, result.done)

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

        doc.conversation.append(
            ConversationItem(role="candidate", content=message)
        )
        result = await self._agent.next(
            session_id,
            doc.candidate,
            doc.agentState,
            doc.conversation,
            doc.currentQuestion,
            message,
        )
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
            return self._to_response(doc, result.reply, feedback, True)

        await self._store.save(doc)
        return self._to_response(doc, result.reply, None, False)

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
    def _to_response(
        doc: SessionDoc, reply: str, feedback, done: bool
    ) -> InterviewResponse:
        return InterviewResponse(reply=reply, done=done, feedback=feedback)
