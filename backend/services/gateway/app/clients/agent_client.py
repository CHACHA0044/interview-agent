"""Client for the interview-agent internal service (backend.md §8.1)."""

from __future__ import annotations

from app.clients.base import InternalHttpClient
from app.schemas.api import Candidate
from app.schemas.internal import (
    AgentCompleteRequest,
    AgentNextRequest,
    AgentStartRequest,
    AgentTurnResponse,
    ConversationItem,
    Question,
)


class AgentClient:
    def __init__(self, http: InternalHttpClient) -> None:
        self._http = http

    async def start(self, session_id: str, candidate: Candidate) -> AgentTurnResponse:
        payload = AgentStartRequest(sessionId=session_id, candidate=candidate)
        data = await self._http.post_json(
            "/internal/interview/start", payload.model_dump(mode="json")
        )
        return AgentTurnResponse.model_validate(data)

    async def next(
        self,
        session_id: str,
        candidate: Candidate,
        agent_state: dict,
        conversation: list[ConversationItem],
        current_question: Question | None,
        message: str,
    ) -> AgentTurnResponse:
        payload = AgentNextRequest(
            sessionId=session_id,
            candidate=candidate,
            agentState=agent_state,
            conversation=conversation,
            currentQuestion=current_question,
            message=message,
        )
        data = await self._http.post_json(
            "/internal/interview/next", payload.model_dump(mode="json")
        )
        return AgentTurnResponse.model_validate(data)

    async def complete(
        self, session_id: str, agent_state: dict
    ) -> AgentTurnResponse:
        payload = AgentCompleteRequest(
            sessionId=session_id, agentState=agent_state
        )
        data = await self._http.post_json(
            "/internal/interview/complete", payload.model_dump(mode="json")
        )
        return AgentTurnResponse.model_validate(data)
