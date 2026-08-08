"""
Purpose:
Transforms interview plan slots into execution-ready AI strategies.

Responsibilities:
- Converts a PlannedQuestion and CandidateContext into a QuestionStrategy.
- Embeds required candidate metadata (tier, role) into the payload.
- Guarantees the output perfectly matches the ai-intelligence API contract.

Connected Files:
- app/schemas/domain.py
"""

from app.schemas.domain import PlannedQuestion, CandidateContext, QuestionStrategy


def build_question_strategy(slot: PlannedQuestion, candidate: CandidateContext) -> QuestionStrategy:
    """
    Hydrates a scheduled interview slot with candidate context to create the final 
    payload sent to the AI Intelligence module.
    """
    return QuestionStrategy(
        day=slot.day,
        module=slot.module,
        topic=slot.topic,
        difficulty=slot.difficulty,
        concepts=slot.concepts,
        is_follow_up=slot.is_follow_up,
        follow_up_of=slot.follow_up_of,
        candidate_tier=candidate.tier,
        candidate_job_role=candidate.job_role
    )
