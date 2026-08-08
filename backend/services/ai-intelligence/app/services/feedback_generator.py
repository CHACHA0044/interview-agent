"""
Purpose:
Orchestrates the AI-powered interview feedback synthesis.

Responsibilities:
- Synthesizes evaluation data into a clean, actionable feedback summary.
- Handles edge cases where no evaluation data is present.
- Produces deterministic, contract-valid feedback in fake LLM mode.
- Relies strictly on passed evaluations, without independently re-evaluating the candidate.

Connected Files:
- app/schemas/ai_output.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py
"""

import logging
from typing import Any, Dict, List

from app.llm.fake_provider import FakeLLMProvider
from app.schemas.ai_output import FeedbackOutput
from app.schemas.contract import CandidateContext
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_feedback_prompt

logger = logging.getLogger(__name__)


def _fake_feedback(
    candidate: Dict[str, Any],
    evaluations: List[Dict[str, Any]],
    missed_concepts: Dict[str, List[str]],
    topic_scores: List[Dict[str, Any]],
) -> FeedbackOutput:
    """Deterministic feedback synthesis for fake LLM mode."""
    scores = [float(e.get("score", 0.0)) for e in evaluations if e.get("score") is not None]
    name = candidate.get("member", {}).get("name", "the candidate")
    avg = sum(scores) / len(scores) if scores else 0.0
    total = len(evaluations)

    strengths: List[str] = []
    gaps: List[str] = []
    for e in evaluations:
        strengths.extend(e.get("strengths", []))
        gaps.extend(e.get("gaps", []))

    def dedupe(items: List[str]) -> List[str]:
        seen = set()
        out = []
        for item in items:
            key = item.strip().lower()
            if key and key not in seen:
                seen.add(key)
                out.append(item.strip())
        return out

    top_strengths = dedupe(strengths)[:3]
    top_gaps = dedupe(gaps)[:3]

    for day, concepts in missed_concepts.items():
        top_gaps.append(f"Day {day}: revisit {', '.join(concepts[:2])}")

    next_steps = [
        "Review the flagged gaps and work through targeted practice questions.",
        "Re-attempt the curriculum days that showed lower coverage.",
        "Focus on explaining concepts aloud to build technical articulation.",
    ]
    if avg >= 7.5:
        summary = (
            f"{name} performed well, averaging {avg:.1f}/10 across {total} questions. "
            "Coverage is strong; the next focus is deepening the flagged edge cases."
        )
    elif avg >= 5.0:
        summary = (
            f"{name} demonstrated a developing understanding, averaging {avg:.1f}/10 across {total} questions. "
            "Core concepts are present but need more depth and precision."
        )
    else:
        summary = (
            f"{name} is still building fundamentals, averaging {avg:.1f}/10 across {total} questions. "
            "Several core concepts need review before moving on."
        )

    return FeedbackOutput(
        summary=summary,
        strengths=top_strengths,
        gaps=dedupe(top_gaps)[:4],
        next=next_steps,
    )


def generate_feedback(
    candidate: Dict[str, Any],
    candidate_context: CandidateContext,
    evaluations: List[Dict[str, Any]],
    coverage: Dict[str, float],
    missed_concepts: Dict[str, List[str]],
    topic_scores: List[Dict[str, Any]],
    llm_provider: ChatProvider
) -> FeedbackOutput:
    """
    Synthesizes aggregated interview evaluation data into actionable feedback.
    """
    logger.info(f"Generating feedback for candidate: {candidate.get('member', {}).get('name', 'Unknown')}")

    # 1. Fast-path empty evaluations
    if not evaluations:
        logger.warning("No evaluations provided for feedback synthesis.")
        fallback = FeedbackOutput.fallback()
        fallback.summary = "No evaluation data was recorded to synthesize feedback."
        return fallback

    # 2. Fake mode: deterministic feedback synthesis
    if isinstance(llm_provider, FakeLLMProvider):
        return _fake_feedback(candidate, evaluations, missed_concepts, topic_scores)

    # 3. Build the prompt payload
    messages = build_feedback_prompt(
        candidate=candidate,
        candidate_context=candidate_context.model_dump(),
        evaluations=evaluations,
        coverage=coverage,
        missed_concepts=missed_concepts,
        topic_scores=topic_scores
    )

    # 4. Generate structured feedback with retries
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
