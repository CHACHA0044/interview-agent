"""
Purpose:
Defines the central, versioned AgentState schema.

Responsibilities:
- Acts as the definitive payload transferred between the Gateway (Redis) and the interview-agent.
- Orchestrates the state machine of an interview across multiple stateless HTTP requests.

Connected Files:
- app/schemas/domain.py

Important implementation notes:
- Versioning is strictly enforced (`state_version`).
- `extra="forbid"` prevents silent injection of unknown data into Redis.
"""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.domain import (
    CandidateContext,
    CurriculumSelection,
    PlannedQuestion,
    EvaluationResult,
    DifficultyState,
    InterviewStatus,
    FollowUpContext,
    ProgressionState
)


class StateMetadata(BaseModel):
    """Metadata regarding the structure and temporal state of the interview."""
    model_config = ConfigDict(extra="forbid")

    state_version: str = Field(default="1.0.0", pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")
    created_at_ts: float
    updated_at_ts: float


class InterviewProgress(BaseModel):
    """Tracks how far along the candidate is in the interview."""
    model_config = ConfigDict(extra="forbid")

    progression_state: ProgressionState = ProgressionState.QUESTION_PENDING
    current_slot: int = Field(default=0, ge=0)
    total_questions_asked: int = Field(default=0, ge=0)
    distinct_days_covered: int = Field(default=0, ge=0)
    days_covered_set: List[int] = Field(default_factory=list)
    current_question: Optional[PlannedQuestion] = None


class CompletionState(BaseModel):
    """Tracks whether the interview is finished and why."""
    model_config = ConfigDict(extra="forbid")

    status: InterviewStatus = InterviewStatus.PENDING
    is_eligible_for_completion: bool = False
    completion_reason: Optional[str] = None


class AgentState(BaseModel):
    """
    The foundational agentState holding all necessary data for the stateless
    interview-agent to resume and progress an interview.
    """
    model_config = ConfigDict(extra="forbid")

    session_id: str
    metadata: StateMetadata
    candidate_context: CandidateContext
    curriculum: CurriculumSelection
    interview_plan: List[PlannedQuestion] = Field(default_factory=list)
    progress: InterviewProgress = Field(default_factory=InterviewProgress)
    history: List[EvaluationResult] = Field(default_factory=list)
    difficulty_state: DifficultyState
    follow_up_context: FollowUpContext = Field(default_factory=FollowUpContext)
    completion: CompletionState = Field(default_factory=CompletionState)
