"""
Purpose:
Executes the post-evaluation state transition logic for the interview.

Responsibilities:
- Determines whether to FOLLOW_UP, move to NEXT_QUESTION, or FINISH.
- Enforces strict limits on follow-up loops to prevent the AI from stalling.
- Enforces the hard floor of >= 8 questions and >= 4 days before allowing FINISH.
- Generates the FollowUpStrategy payload if FOLLOW_UP is selected.

Connected Files:
- app/schemas/domain.py
"""

from typing import Tuple, Optional, List
from app.schemas.domain import (
    FollowUpDecision, 
    FollowUpStrategy, 
    FollowUpContext,
    EvaluationResult,
    PlannedQuestion,
    CandidateContext
)


def evaluate_next_step(
    current_question: PlannedQuestion,
    evaluation: EvaluationResult,
    follow_up_context: FollowUpContext,
    candidate: CandidateContext,
    question_count: int,
    distinct_days_completed: int,
    remaining_plan_slots: int
) -> Tuple[FollowUpDecision, Optional[FollowUpStrategy]]:
    """
    Evaluates the candidate's answer and determines the next logical step 
    for the interview orchestration state machine.
    """
    
    # RULE 1: Evaluate Follow-up Trigger
    # Score < 6.0 AND global budget > 0 AND local budget < 2
    if evaluation.score < 6.0:
        if follow_up_context.global_follow_up_budget > 0 and follow_up_context.followups_asked_on_current_question < 2:
            # We will follow up.
            reason = f"Candidate scored {evaluation.score}. Probing gaps: {', '.join(evaluation.gaps)}"
            strategy = FollowUpStrategy(
                day=current_question.day,
                module=current_question.module,
                previous_answer=evaluation.candidate_answer,
                concepts_to_probe=evaluation.gaps if evaluation.gaps else ["Technical reasoning"],
                difficulty=current_question.difficulty,
                reason_for_follow_up=reason,
                candidate_tier=candidate.tier,
                candidate_job_role=candidate.job_role
            )
            return FollowUpDecision.FOLLOW_UP, strategy

    # RULE 2: Evaluate Completion Trigger
    # Hard floor: Must have asked >= 8 questions across >= 4 days.
    # Note: question_count includes the current question we just evaluated.
    meets_hard_floor = (question_count >= 8) and (distinct_days_completed >= 4)
    
    # We attempt to finish if there are no more planned questions.
    if remaining_plan_slots <= 0:
        if meets_hard_floor:
            return FollowUpDecision.FINISH, None
        else:
            # Emergency fallback: We ran out of plan slots but haven't met the hard floor!
            # The planner shouldn't let this happen, but if it does, we MUST force a NEXT_QUESTION 
            # to trigger a replan.
            return FollowUpDecision.NEXT_QUESTION, None
            
    # RULE 3: Default to Next Question
    return FollowUpDecision.NEXT_QUESTION, None
