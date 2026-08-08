"""
Purpose:
Defines foundational domain models and enums for the interview-agent service.

Responsibilities:
- Strongly types the domain logic.
- Defines boundaries, constants, and validation rules for components of the interview state.
- Ensures consistency across the microservice.

Connected Files:
- app/schemas/state.py

Important implementation notes:
- Uses Pydantic for validation and serialization.
- Forbids unknown arbitrary fields to ensure Redis payload integrity.
"""

from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict, Field


class CandidateTier(str, Enum):
    NOVICE = "novice"
    DEVELOPING = "developing"
    STRONG = "strong"
    EXPERT = "expert"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class ProgressionState(str, Enum):
    QUESTION_PENDING = "QUESTION_PENDING"
    WAITING_FOR_ANSWER = "WAITING_FOR_ANSWER"
    EVALUATING = "EVALUATING"
    FOLLOW_UP_PENDING = "FOLLOW_UP_PENDING"
    COMPLETABLE = "COMPLETABLE"
    COMPLETED = "COMPLETED"


class QuestionType(str, Enum):
    TECHNICAL = "technical"
    CONCEPTUAL = "conceptual"
    FOLLOW_UP = "follow-up"


class CandidateContext(BaseModel):
    """Contextual information about the candidate driving the interview's expectations."""
    model_config = ConfigDict(extra="forbid")

    member_id: str
    name: str
    job_role: str
    years_experience: int = Field(ge=0, le=100)
    tier: CandidateTier
    strong_days: List[int] = Field(default_factory=list)
    weak_days: List[int] = Field(default_factory=list)
    failed_days: List[int] = Field(default_factory=list)
    skipped_days: List[int] = Field(default_factory=list)


class CurriculumSelection(BaseModel):
    """The subset of the curriculum this interview will cover."""
    model_config = ConfigDict(extra="forbid")

    selected_modules: List[int] = Field(default_factory=list)
    selected_days: List[int] = Field(default_factory=list)
    day_types: Dict[int, str] = Field(default_factory=dict)
    assessment_priorities: List[int] = Field(default_factory=list)
    relevant_concepts: List[str] = Field(default_factory=list)


class PlannedQuestion(BaseModel):
    """A question scheduled to be asked (or currently being asked) in the interview."""
    model_config = ConfigDict(extra="forbid")

    day: int
    module: int
    topic: str
    difficulty: Difficulty
    concepts: List[str] = Field(default_factory=list)
    type: QuestionType = QuestionType.TECHNICAL
    is_follow_up: bool = False
    follow_up_of: Optional[str] = None
    question_text: Optional[str] = None  # Populated when actually generated


class QuestionStrategy(BaseModel):
    """The strict payload sent to the AI Intelligence module for question generation."""
    model_config = ConfigDict(extra="forbid")
    
    day: int
    module: int
    topic: str
    difficulty: Difficulty
    concepts: List[str]
    is_follow_up: bool
    follow_up_of: Optional[str] = None
    candidate_tier: CandidateTier
    candidate_job_role: str


class FollowUpDecision(str, Enum):
    """The outcome decision after evaluating an answer."""
    FOLLOW_UP = "FOLLOW_UP"
    NEXT_QUESTION = "NEXT_QUESTION"
    FINISH = "FINISH"


class FollowUpStrategy(BaseModel):
    """The payload sent to AI Intelligence for generating a follow-up question."""
    model_config = ConfigDict(extra="forbid")
    
    day: int
    module: int
    previous_answer: str
    concepts_to_probe: List[str]
    difficulty: Difficulty
    reason_for_follow_up: str
    candidate_tier: CandidateTier
    candidate_job_role: str


class FollowUpContext(BaseModel):
    """Tracks state limits for follow-ups to prevent loops."""
    model_config = ConfigDict(extra="forbid")
    
    followups_asked_on_current_question: int = 0
    global_follow_up_budget: int = 4


class EvaluationResult(BaseModel):
    """The outcome of an evaluated candidate answer."""
    model_config = ConfigDict(extra="forbid")

    question_text: str
    candidate_answer: str
    score: float = Field(ge=0.0, le=10.0)
    concept_coverage: float = Field(ge=0.0, le=1.0)
    technical_accuracy: float = Field(ge=0.0, le=1.0)
    depth: float = Field(ge=0.0, le=1.0)
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    follow_up_required: bool = False


class DifficultyState(BaseModel):
    """Tracks the rolling difficulty calibration of the interview."""
    model_config = ConfigDict(extra="forbid")

    current_difficulty: Difficulty
    starting_difficulty: Difficulty
    rolling_average_score: float = Field(default=0.0, ge=0.0, le=10.0)
    consecutive_high_scores: int = Field(default=0, ge=0)
    consecutive_low_scores: int = Field(default=0, ge=0)
