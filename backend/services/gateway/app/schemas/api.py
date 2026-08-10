"""Public API schemas — the contract of record from technical-spec.md.

These models validate both the incoming request and the outgoing response,
so the public contract can never drift.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class CandidateMember(BaseModel):
    id: str = ""
    name: str = ""
    jobRole: str = ""
    yearsExperience: int | None = None
    education: str | None = None
    status: str | None = None


class CandidateMission(BaseModel):
    day: int
    title: str = ""
    passed: bool | None = None
    attempts: int | None = None
    skipped: bool | None = None


class CandidateSignals(BaseModel):
    commitDays: int | None = None
    missionsCompleted: int | None = None
    missionsFirstTry: int | None = None


class Candidate(BaseModel):
    member: CandidateMember
    missions: list[CandidateMission] = []
    signals: CandidateSignals | None = None


_FLOOR_CLAMP = {
    "minQuestions": (8, 12),
    "minCurriculumDays": (3, 5),
    "followupBudget": (2, 6),
    "followupMaxPerQuestion": (1, 3),
}


class InterviewConfig(BaseModel):
    """Optional per-interview configuration forwarded from the frontend.

    Carries floor overrides from the Settings page plus the requested
    curriculum module selection (focusTopics). Numeric floors outside the
    allowed range are silently clamped so stale/edge-case persisted settings
    never break the request.
    """

    minQuestions: int = 8
    minCurriculumDays: int = 4
    followupBudget: int = 4
    followupMaxPerQuestion: int = 2
    focusTopics: list[str] = Field(default_factory=list)

    @field_validator("minQuestions")
    @classmethod
    def _clamp_min_questions(cls, v: int) -> int:
        lo, hi = _FLOOR_CLAMP["minQuestions"]
        return max(lo, min(hi, v))

    @field_validator("minCurriculumDays")
    @classmethod
    def _clamp_min_curriculum_days(cls, v: int) -> int:
        lo, hi = _FLOOR_CLAMP["minCurriculumDays"]
        return max(lo, min(hi, v))

    @field_validator("followupBudget")
    @classmethod
    def _clamp_followup_budget(cls, v: int) -> int:
        lo, hi = _FLOOR_CLAMP["followupBudget"]
        return max(lo, min(hi, v))

    @field_validator("followupMaxPerQuestion")
    @classmethod
    def _clamp_followup_max(cls, v: int) -> int:
        lo, hi = _FLOOR_CLAMP["followupMaxPerQuestion"]
        return max(lo, min(hi, v))


class InterviewRequest(BaseModel):
    sessionId: str = Field(min_length=1)
    candidate: Optional[Candidate] = None
    message: Optional[str] = None
    interviewConfig: Optional[InterviewConfig] = None

    @model_validator(mode="after")
    def _exactly_one(self) -> "InterviewRequest":
        has_candidate = self.candidate is not None
        has_message = self.message is not None
        if has_candidate == has_message:
            raise ValueError(
                "exactly one of 'candidate' (start) or 'message' (turn) is required"
            )
        return self


class Feedback(BaseModel):
    summary: str
    strengths: list[str] = []
    gaps: list[str] = []
    next: list[str] = []


class Question(BaseModel):
    questionId: str
    type: str = "technical"
    difficulty: str = "medium"
    topic: str = ""
    day: int = 1
    followUpOf: Optional[str] = None
    expectedConcepts: list[str] = []


class SessionView(BaseModel):
    questionCount: int = 0
    daysAsked: list[int] = []
    scores: list[float] = []
    status: str = "active"
    followUpBudgetRemaining: int | None = None
    currentDifficulty: str | None = None


class InterviewResponse(BaseModel):
    reply: str
    done: bool = False
    feedback: Optional[Feedback] = None
    question: Optional[Question] = None
    session: Optional[SessionView] = None


class HealthResponse(BaseModel):
    status: Literal["ok", "error"]
    service: str = "interview-gateway"
    checks: dict[str, str] = Field(default_factory=dict)
