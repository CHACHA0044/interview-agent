"""
Purpose:
Defines shared contract-shaped models used by the ai-intelligence API.

Responsibilities:
- Mirror the shapes defined in backend/shared/schemas/ai_api.json
  (candidateContext, curriculumContext, retrievedChunk, conversationItem).
- Keep the service layer decoupled from raw request dicts.

Connected Files:
- app/schemas/question.py
- app/schemas/api_requests.py
- app/api/endpoints.py
"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ConversationItem(BaseModel):
    role: Literal["agent", "candidate"]
    content: str


class CandidateContext(BaseModel):
    candidateId: str
    name: str
    role: str
    tier: str  # expert | strong | developing | novice
    strongDays: List[int] = Field(default_factory=list)
    weakDays: List[int] = Field(default_factory=list)
    failedDays: List[int] = Field(default_factory=list)
    skippedDays: List[int] = Field(default_factory=list)


class DayInfo(BaseModel):
    day: int
    title: str
    type: str
    tools: List[str] = Field(default_factory=list)
    objectives: List[str] = Field(default_factory=list)


class ModuleInfo(BaseModel):
    n: int
    title: str
    days: List[int] = Field(default_factory=list)


class CurriculumContext(BaseModel):
    modules: List[ModuleInfo] = Field(default_factory=list)
    days: Dict[str, DayInfo] = Field(default_factory=dict)
    plannedDays: List[int] = Field(default_factory=list)


class RetrievedChunk(BaseModel):
    day: int
    title: str
    objectives: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    score: Optional[float] = None
