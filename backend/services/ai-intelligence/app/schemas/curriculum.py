"""
Purpose:
Defines Pydantic models to validate the Curriculum JSON structure.

Responsibilities:
- Safely parse the raw curriculum.json file.
- Expose typed access to modules and days for the chunking pipeline.

Connected Files:
- app/rag/ingestion.py

Important implementation notes:
- These models strictly match the provided curriculum.json schema.
"""

from typing import List
from pydantic import BaseModel, Field


class CurriculumModule(BaseModel):
    n: int
    title: str
    days: List[int]


class CurriculumDay(BaseModel):
    day: int
    title: str
    type: str
    tools: List[str] = Field(default_factory=list)
    objectives: List[str] = Field(default_factory=list)


class CurriculumData(BaseModel):
    cohort: str
    modules: List[CurriculumModule]
    days: List[CurriculumDay]
