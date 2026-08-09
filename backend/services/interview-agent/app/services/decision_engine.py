"""
Purpose:
Executes the post-evaluation state transition logic for the interview.

Responsibilities:
- Determines whether to FOLLOW_UP, move to NEXT_QUESTION, or FINISH.
- Enforces strict limits on follow-up loops to prevent the AI from stalling.
- Enforces the configurable hard floor of >= min_questions and >= min_curriculum_days
  before allowing FINISH (defaults: 8 questions / 4 days, tunable via Settings).
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

_ANSWER_KIND_LABELS = {
    "empty": "no answer",
    "too_short": "too-short",
    "yes_no": "yes/no",
    "off_topic": "off-topic",
}


def evaluate_next_step(
    current_question: PlannedQuestion,
    evaluation: EvaluationResult,
    follow_up_context: FollowUpContext,
    candidate: CandidateContext,
    question_count: int,
    distinct_days_completed: int,
    remaining_plan_slots: int,
    non_answer_kind: str = "ok",
    repeats_prior_question: bool = False,
    min_questions: int = 8,
    min_curriculum_days: int = 4,
) -> Tuple[FollowUpDecision, Optional[FollowUpStrategy]]:
    """
    Evaluates the candidate's answer and determines the next logical step 
    for the interview orchestration state machine.

    Args:
        min_questions: Hard floor for total questions before FINISH is allowed.
        min_curriculum_days: Hard floor for distinct curriculum days before FINISH is allowed.
    """

    # RULE 0: Loop Safeguard
    # If the exact same question text is being graded a second time, the agent
    # must not stall on it. Force progression to the next planned question.
    if repeats_prior_question:
        return FollowUpDecision.NEXT_QUESTION, None

    # RULE 1: Evaluate Follow-up Trigger
    # A low score OR a non-answer (empty / too short / yes-no / off-topic)
    # triggers a targeted follow-up while the global + per-question budgets allow.
    score_triggers_follow_up = evaluation.score < 6.0 or non_answer_kind != "ok"
    if score_triggers_follow_up:
        if (
            follow_up_context.global_follow_up_budget > 0
            and follow_up_context.followups_asked_on_current_question < follow_up_context.max_followups_per_question
        ):
            if non_answer_kind != "ok":
                probes = (
                    list(current_question.concepts)
                    if current_question.concepts
                    else (evaluation.gaps or ["Technical reasoning"])
                )
                label = _ANSWER_KIND_LABELS.get(
                    non_answer_kind, non_answer_kind.replace("_", " ")
                )
                reason = (
                    f"Candidate gave a {label} response. "
                    f"Requesting elaboration on {', '.join(probes[:3])}."
                )
            else:
                probes = evaluation.gaps if evaluation.gaps else ["Technical reasoning"]
                reason = f"Candidate scored {evaluation.score}. Probing gaps: {', '.join(evaluation.gaps)}"
            strategy = FollowUpStrategy(
                day=current_question.day,
                module=current_question.module,
                previous_answer=evaluation.candidate_answer,
                concepts_to_probe=probes,
                difficulty=current_question.difficulty,
                reason_for_follow_up=reason,
                candidate_tier=candidate.tier,
                candidate_job_role=candidate.job_role,
                follow_up_of=current_question.question_id,
                non_answer_kind=non_answer_kind
            )
            return FollowUpDecision.FOLLOW_UP, strategy

    # RULE 2: Evaluate Completion Trigger
    # Hard floor: Must have asked >= min_questions across >= min_curriculum_days.
    # Note: question_count includes the current question we just evaluated.
    meets_hard_floor = (question_count >= min_questions) and (distinct_days_completed >= min_curriculum_days)
    
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
