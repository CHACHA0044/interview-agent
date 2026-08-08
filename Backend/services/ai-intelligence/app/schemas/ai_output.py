"""
Purpose:
Defines Pydantic models for structured AI output parsing.

Responsibilities:
- Enforce strict typing on LLM responses for Evaluation and Feedback.
- Provide deterministic fallback methods to safely handle LLM failures without fabricating data.

Connected Files:
- app/llm/structured_output.py

Important implementation notes:
- Naming matches exactly the contract required by the Technical Specification.
- Fallback methods are designed to be safe and conservative.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class EvaluationOutput(BaseModel):
    """Structured output expected from the evaluation prompt."""
    score: float = Field(..., description="Overall score (0.0 to 10.0)")
    conceptCoverage: float = Field(..., description="Concept coverage (0.0 to 1.0)")
    technicalAccuracy: float = Field(..., description="Technical accuracy (0.0 to 1.0)")
    depth: float = Field(..., description="Depth of understanding (0.0 to 1.0)")
    strengths: List[str] = Field(..., description="List of short strength points")
    gaps: List[str] = Field(..., description="List of missing concepts or inaccuracies")
    followUpRequired: bool = Field(..., description="Whether a follow up is required")
    notes: Optional[str] = Field(None, description="Internal reasoning for the score")

    @classmethod
    def fallback(cls) -> "EvaluationOutput":
        """
        Deterministic fallback when the LLM repeatedly fails to return valid JSON.
        Does not fabricate performance data.
        """
        return cls(
            score=0.0,
            conceptCoverage=0.0,
            technicalAccuracy=0.0,
            depth=0.0,
            strengths=[],
            gaps=["Evaluation failed due to LLM error. Answer could not be analyzed."],
            followUpRequired=True,
            notes="Fallback evaluation due to repeated parsing failures."
        )


class FeedbackOutput(BaseModel):
    """Structured output expected from the feedback synthesis prompt."""
    summary: str = Field(..., description="Overall interview summary")
    strengths: List[str] = Field(..., description="Candidate's top strengths")
    gaps: List[str] = Field(..., description="Candidate's main gaps")
    next: List[str] = Field(..., description="Actionable next steps")

    @classmethod
    def fallback(cls) -> "FeedbackOutput":
        """
        Deterministic fallback when the LLM repeatedly fails to return valid JSON.
        """
        return cls(
            summary="The AI intelligence service encountered a critical failure and could not generate a final summary.",
            strengths=[],
            gaps=[],
            next=["Review the raw interview logs to manually assess candidate performance."]
        )
