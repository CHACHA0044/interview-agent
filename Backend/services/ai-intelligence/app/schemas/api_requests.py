"""
Purpose:
Defines the Pydantic schemas for the internal AI API request payloads.

Responsibilities:
- Strongly type incoming JSON payloads to ensure validity before hitting the service layer.
- Enforce required keys for candidate context and strategies.

Connected Files:
- app/api/endpoints.py
- app/schemas/question.py

Important implementation notes:
- These schemas decouple the API layer from the raw business logic signatures.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.schemas.question import QuestionStrategy, FollowUpStrategy


class GenerateQuestionRequest(BaseModel):
    strategy: QuestionStrategy
    candidate_context: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class GenerateFollowUpRequest(BaseModel):
    strategy: FollowUpStrategy
    previous_answer: str
    candidate_context: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)


class EvaluateAnswerRequest(BaseModel):
    question_payload: Dict[str, Any]
    candidate_answer: str
    candidate_context: Dict[str, Any] = Field(default_factory=dict)


class GenerateFeedbackRequest(BaseModel):
    candidate: Dict[str, Any]
    candidate_context: Dict[str, Any] = Field(default_factory=dict)
    evaluations: List[Dict[str, Any]] = Field(default_factory=list)
    coverage: Dict[str, float] = Field(default_factory=dict)
    missed_concepts: Dict[str, List[str]] = Field(default_factory=dict)
    topic_scores: List[Dict[str, Any]] = Field(default_factory=list)


class RetrieveContextRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = Field(default=None)
