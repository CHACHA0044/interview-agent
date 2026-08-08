"""Fakes for gateway tests."""

from __future__ import annotations

from app.schemas.api import Candidate, Feedback
from app.schemas.internal import (
    AgentTurnResponse,
    ConversationItem,
    Question,
    SessionView,
)


class FakeAgentClient:
    """Scripted agent double — returns canned responses, records calls."""

    def __init__(self) -> None:
        self.start_calls: list[dict] = []
        self.next_calls: list[dict] = []
        self.complete_calls: list[dict] = []
        self.start_response: AgentTurnResponse | None = None
        self.next_responses: list[AgentTurnResponse] = []
        self.complete_response: AgentTurnResponse | None = None
        self.raise_error: Exception | None = None

    @staticmethod
    def turn(
        reply: str,
        *,
        done: bool = False,
        question_count: int = 1,
        days_asked: list[int] | None = None,
        scores: list[float] | None = None,
        feedback: Feedback | None = None,
        agent_state: dict | None = None,
        question: Question | None = None,
    ) -> AgentTurnResponse:
        return AgentTurnResponse(
            agentState=agent_state or {"version": 1, "planIndex": 0},
            sessionView=SessionView(
                questionCount=question_count,
                daysAsked=days_asked or [],
                scores=scores or [],
                status="completed" if done else "active",
            ),
            reply=reply,
            done=done,
            feedback=feedback,
            question=question,
        )

    async def start(self, session_id: str, candidate: Candidate) -> AgentTurnResponse:
        self.start_calls.append({"sessionId": session_id, "candidate": candidate})
        if self.raise_error is not None:
            raise self.raise_error
        return self.start_response or self.turn("Welcome. Let's begin.")

    async def next(
        self,
        session_id: str,
        candidate: Candidate,
        agent_state: dict,
        conversation: list[ConversationItem],
        current_question: Question | None,
        message: str,
    ) -> AgentTurnResponse:
        self.next_calls.append(
            {
                "sessionId": session_id,
                "candidate": candidate,
                "agentState": agent_state,
                "conversation": conversation,
                "currentQuestion": current_question,
                "message": message,
            }
        )
        if self.raise_error is not None:
            raise self.raise_error
        if self.next_responses:
            return self.next_responses.pop(0)
        return self.turn("Good. Next question.")

    async def complete(
        self, session_id: str, agent_state: dict
    ) -> AgentTurnResponse:
        self.complete_calls.append({"sessionId": session_id, "agentState": agent_state})
        if self.raise_error is not None:
            raise self.raise_error
        return self.complete_response or self.turn(
            "Interview completed.",
            done=True,
            feedback=Feedback(
                summary="Finished.", strengths=["x"], gaps=["y"], next=["z"]
            ),
        )
