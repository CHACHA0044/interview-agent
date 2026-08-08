"""
Purpose:
Defines the Pydantic schemas for the internal AI API request payloads.

Responsibilities:
- Strongly type incoming JSON payloads to ensure validity before hitting the service layer.
- Field names match backend/shared/schemas/ai_api.json exactly (camelCase).

Connected Files:
- app/api/endpoints.py
- app/schemas/question.py
- app/schemas/contract.py
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.contract import (
    CandidateContext,
    ConversationItem,
    CurriculumContext,
    RetrievedChunk,
)
from app.schemas.question import FollowUpStrategy, GeneratedQuestion, QuestionStrategy


class GenerateQuestionRequest(BaseModel):
    candidateContext: CandidateContext
    curriculumContext: CurriculumContext = Field(default_factory=CurriculumContext)
    conversation: List[ConversationItem] = Field(default_factory=list)
    questionStrategy: QuestionStrategy
    retrievalQuery: Optional[str] = None


class GenerateFollowUpRequest(BaseModel):
    candidateContext: CandidateContext
    curriculumContext: CurriculumContext = Field(default_factory=CurriculumContext)
    conversation: List[ConversationItem] = Field(default_factory=list)
    followUpStrategy: FollowUpStrategy


class EvaluateAnswerRequest(BaseModel):
    question: GeneratedQuestion
    candidateContext: CandidateContext
    retrievedContext: List[RetrievedChunk] = Field(default_factory=list)
    candidateAnswer: str


class GenerateFeedbackRequest(BaseModel):
    candidate: Dict[str, Any]
    candidateContext: CandidateContext = Field(default_factory=CandidateContext)
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)
    coverage: Dict[str, float] = Field(default_factory=dict)
    missedConcepts: Dict[str, List[str]] = Field(default_factory=dict)
    topicScores: List[Dict[str, Any]] = Field(default_factory=list)


class RetrieveContextRequest(BaseModel):
    query: str
    day: Optional[int] = None
    module: Optional[int] = None
    topic: Optional[str] = None
    candidateContext: Optional[CandidateContext] = None
    topK: Optional[int] = None


class RetrieveContextResponse(BaseModel):
    context: List[RetrievedChunk] = Field(default_factory=list)
    source: str  # "qdrant" | "fallback"
