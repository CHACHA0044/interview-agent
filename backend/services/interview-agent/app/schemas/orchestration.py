"""
Purpose:
Defines the strict Request and Response payloads for the stateless Interview Agent.

Responsibilities:
- Formalizes the input boundary from the HTTP Gateway.
- Formalizes the output boundary to the HTTP Gateway.
- Uses Pydantic for rigorous runtime validation.
- Field names match backend/shared/schemas/agent_api.json exactly (camelCase).
  agentState is opaque to the Gateway: the agent serializes its internal
  AgentState model into that blob and rehydrates it on every call.

Connected Files:
- app/schemas/state.py
- app/schemas/domain.py
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class CandidateMember(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: Optional[int] = None
    education: Optional[str] = None
    status: Optional[str] = None


class CandidateMission(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = None
    attempts: Optional[int] = None
    skipped: Optional[bool] = None


class CandidateSignals(BaseModel):
    commitDays: Optional[int] = None
    missionsCompleted: Optional[int] = None
    missionsFirstTry: Optional[int] = None


class Candidate(BaseModel):
    """Candidate payload matching candidates.json, carried verbatim from the public request."""
    member: CandidateMember
    missions: List[CandidateMission] = Field(default_factory=list)
    signals: Optional[CandidateSignals] = None


class ConversationItem(BaseModel):
    role: Literal["agent", "candidate"]
    content: str


class Question(BaseModel):
    """Metadata for the question currently on the floor."""
    questionId: str
    type: str = "technical"
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    topic: str = ""
    day: int
    followUpOf: Optional[str] = None
    expectedConcepts: List[str] = Field(default_factory=list)


class SessionView(BaseModel):
    questionCount: int = 0
    daysAsked: List[int] = Field(default_factory=list)
    scores: List[float] = Field(default_factory=list)
    status: str = "active"
    followUpBudgetRemaining: Optional[int] = None
    currentDifficulty: Optional[str] = None


class Feedback(BaseModel):
    summary: str
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    next: List[str] = Field(default_factory=list)


class AgentTurnResponse(BaseModel):
    """Shared response shape for start / next / complete from the agent."""
    agentState: Dict[str, Any]
    sessionView: SessionView
    reply: str
    done: bool = False
    feedback: Optional[Feedback] = None
    question: Optional[Question] = None


class AgentStartRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    candidate: Candidate
    interviewConfig: Optional[Dict[str, Any]] = None


class AgentNextRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    candidate: Candidate
    agentState: Dict[str, Any]
    conversation: List[ConversationItem] = Field(default_factory=list)
    currentQuestion: Optional[Question] = None
    message: str


class AgentCompleteRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    agentState: Dict[str, Any]
