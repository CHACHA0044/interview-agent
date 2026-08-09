"""Internal payload models shared with the interview-agent service.

Mirrors the contracts in backend.md §8.1. ``agentState`` is an opaque blob
that the gateway stores verbatim and never interprets.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.api import Candidate, Feedback


class ConversationItem(BaseModel):
    role: Literal["agent", "candidate"]
    content: str


class Question(BaseModel):
    questionId: str
    type: str = "technical"
    difficulty: str = "medium"
    topic: str = ""
    day: int
    followUpOf: Optional[str] = None
    expectedConcepts: list[str] = Field(default_factory=list)


class SessionView(BaseModel):
    questionCount: int = 0
    daysAsked: list[int] = Field(default_factory=list)
    scores: list[float] = Field(default_factory=list)
    status: str = "active"
    followUpBudgetRemaining: int | None = None
    currentDifficulty: str | None = None


class AgentStartRequest(BaseModel):
    sessionId: str
    candidate: Candidate


class AgentNextRequest(BaseModel):
    sessionId: str
    candidate: Candidate
    agentState: dict[str, Any]
    conversation: list[ConversationItem]
    currentQuestion: Optional[Question] = None
    message: str


class AgentCompleteRequest(BaseModel):
    sessionId: str
    agentState: dict[str, Any]


class AgentTurnResponse(BaseModel):
    """Shared response shape for start / next / complete from the agent."""

    agentState: dict[str, Any]
    sessionView: SessionView
    reply: str
    done: bool = False
    feedback: Optional[Feedback] = None
    question: Optional[Question] = None


class SessionDoc(BaseModel):
    """Redis session document (backend.md §10.2)."""

    sessionId: str
    status: Literal["active", "completed"] = "active"
    createdAt: datetime
    updatedAt: datetime
    candidate: Candidate
    agentState: dict[str, Any] = Field(default_factory=dict)
    currentQuestion: Optional[Question] = None
    questionCount: int = 0
    daysAsked: list[int] = Field(default_factory=list)
    conversation: list[ConversationItem] = Field(default_factory=list)
    scores: list[float] = Field(default_factory=list)
    topicScores: list[dict[str, Any]] = Field(default_factory=list)
    finalFeedback: Optional[Feedback] = None
