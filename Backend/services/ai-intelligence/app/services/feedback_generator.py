"""
Purpose:
Orchestrates the AI-powered interview feedback synthesis.

Responsibilities:
- Synthesizes evaluation data into a clean, actionable feedback summary.
- Handles edge cases where no evaluation data is present.
- Relies strictly on passed evaluations, without independently re-evaluating the candidate.

Connected Files:
- app/schemas/ai_output.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py

Important implementation notes:
- Uses the deterministic `FeedbackOutput.fallback()` on failure.
"""

import logging
from typing import Dict, Any, List

from app.schemas.ai_output import FeedbackOutput
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_feedback_prompt

logger = logging.getLogger(__name__)


def generate_feedback(
    candidate: Dict[str, Any],
    candidate_context: Dict[str, Any],
    evaluations: List[Dict[str, Any]],
    coverage: Dict[str, float],
    missed_concepts: Dict[str, List[str]],
    topic_scores: List[Dict[str, Any]],
    llm_provider: ChatProvider
) -> FeedbackOutput:
    """
    Synthesizes aggregated interview evaluation data into actionable feedback.
    """
    logger.info(f"Generating feedback for candidate: {candidate.get('name', 'Unknown')}")
    
    # 1. Fast-path empty evaluations
    if not evaluations:
        logger.warning("No evaluations provided for feedback synthesis.")
        fallback = FeedbackOutput.fallback()
        fallback.summary = "No evaluation data was recorded to synthesize feedback."
        return fallback

    # 2. Build the prompt payload
    messages = build_feedback_prompt(
        candidate=candidate,
        candidate_context=candidate_context,
        evaluations=evaluations,
        coverage=coverage,
        missed_concepts=missed_concepts,
        topic_scores=topic_scores
    )
    
    # 3. Generate structured feedback with retries
    try:
        feedback = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=FeedbackOutput,
            max_retries=2
        )
        return feedback
    except Exception as e:
        logger.error(f"Structured output completely failed during feedback synthesis: {e}")
        return FeedbackOutput.fallback()
