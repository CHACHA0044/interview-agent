"""Public API schemas — the contract of record from technical-spec.md.

These models validate both the incoming request and the outgoing response,
so the public contract can never drift.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


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


class InterviewRequest(BaseModel):
    sessionId: str = Field(min_length=1)
    candidate: Optional[Candidate] = None
    message: Optional[str] = None

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


class InterviewResponse(BaseModel):
    reply: str
    done: bool = False
    feedback: Optional[Feedback] = None


class HealthResponse(BaseModel):
    status: Literal["ok", "error"]
    service: str = "interview-gateway"
    checks: dict[str, str] = Field(default_factory=dict)
