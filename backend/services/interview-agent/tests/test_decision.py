"""
Purpose:
Verifies the strict evaluation boundaries of the decision engine.

Responsibilities:
- Asserts that poor scores trigger follow-ups.
- Asserts follow-up limits perfectly block infinite loops.
- Asserts that FINISH requests before meeting hard constraints are downgraded.

Connected Files:
- app/services/decision_engine.py
"""

from app.schemas.domain import (
    FollowUpDecision, 
    FollowUpContext,
    EvaluationResult,
    PlannedQuestion,
    CandidateContext,
    CandidateTier,
    Difficulty,
    QuestionType
)
from app.services.decision_engine import evaluate_next_step

def test_trigger_follow_up():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Test", difficulty=Difficulty.EASY, concepts=["SQL"], type=QuestionType.TECHNICAL
    )
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="A!", score=5.0, concept_coverage=0.5, 
        technical_accuracy=0.5, depth=0.5, strengths=[], gaps=["SQL Joins"], follow_up_required=True
    )
    context = FollowUpContext(followups_asked_on_current_question=0, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate, 
        question_count=1, distinct_days_completed=1, remaining_plan_slots=7
    )
    
    assert decision == FollowUpDecision.FOLLOW_UP
    assert strategy is not None
    assert strategy.previous_answer == "A!"
    assert strategy.concepts_to_probe == ["SQL Joins"]
    assert "scored 5.0" in strategy.reason_for_follow_up


def test_follow_up_loop_protection():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Test", difficulty=Difficulty.EASY, concepts=["SQL"]
    )
    # Poor score
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="A!", score=2.0, concept_coverage=0.1, 
        technical_accuracy=0.1, depth=0.1, strengths=[], gaps=["SQL Joins"], follow_up_required=True
    )
    
    # We already asked 2 follow-ups on this question! Limit reached.
    context = FollowUpContext(followups_asked_on_current_question=2, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate, 
        question_count=3, distinct_days_completed=1, remaining_plan_slots=5
    )
    
    # Must reject follow-up loop and move to next question!
    assert decision == FollowUpDecision.NEXT_QUESTION
    assert strategy is None


def test_finish_blocked_by_constraints():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Test", difficulty=Difficulty.EASY, concepts=["SQL"]
    )
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="A!", score=9.0, concept_coverage=0.9, 
        technical_accuracy=0.9, depth=0.9, strengths=[], gaps=[], follow_up_required=False
    )
    context = FollowUpContext(followups_asked_on_current_question=0, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    # Run out of plan slots, but haven't met the hard constraints yet (e.g. only asked 7 questions)
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate, 
        question_count=7, distinct_days_completed=4, remaining_plan_slots=0
    )
    
    # Must NOT finish!
    assert decision == FollowUpDecision.NEXT_QUESTION


def test_finish_allowed():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Test", difficulty=Difficulty.EASY, concepts=["SQL"]
    )
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="A!", score=9.0, concept_coverage=0.9, 
        technical_accuracy=0.9, depth=0.9, strengths=[], gaps=[], follow_up_required=False
    )
    context = FollowUpContext(followups_asked_on_current_question=0, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    # Met constraints (>=8 Qs, >=4 Days) AND plan slots exhausted
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate, 
        question_count=8, distinct_days_completed=4, remaining_plan_slots=0
    )
    
    assert decision == FollowUpDecision.FINISH


def test_non_answer_forces_follow_up_with_targeted_reason():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Kubernetes", difficulty=Difficulty.EASY,
        concepts=["pods", "deployments"], type=QuestionType.TECHNICAL
    )
    # A "yes" answer may evaluate high on wording heuristics; the classifier
    # still forces a targeted follow-up.
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="yes", score=6.0, concept_coverage=0.6, 
        technical_accuracy=0.6, depth=0.4, strengths=[], gaps=[], follow_up_required=False
    )
    context = FollowUpContext(followups_asked_on_current_question=0, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate,
        question_count=1, distinct_days_completed=1, remaining_plan_slots=7,
        non_answer_kind="yes_no"
    )
    
    assert decision == FollowUpDecision.FOLLOW_UP
    assert strategy is not None
    assert strategy.non_answer_kind == "yes_no"
    # The targeted probe uses the question concepts, not a generic gap.
    assert "pods" in strategy.concepts_to_probe
    assert "yes/no" in strategy.reason_for_follow_up


def test_repeated_question_forces_progression():
    current_question = PlannedQuestion(
        day=5, module=1, topic="Test", difficulty=Difficulty.EASY, concepts=["SQL"]
    )
    evaluation = EvaluationResult(
        question_text="Q?", candidate_answer="A!", score=2.0, concept_coverage=0.1, 
        technical_accuracy=0.1, depth=0.1, strengths=[], gaps=["SQL Joins"], follow_up_required=True
    )
    context = FollowUpContext(followups_asked_on_current_question=0, global_follow_up_budget=4)
    candidate = CandidateContext(
        member_id="C-1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG
    )
    
    # Even with full follow-up budget available, a repeated question must advance.
    decision, strategy = evaluate_next_step(
        current_question, evaluation, context, candidate,
        question_count=3, distinct_days_completed=1, remaining_plan_slots=5,
        repeats_prior_question=True
    )
    
    assert decision == FollowUpDecision.NEXT_QUESTION
    assert strategy is None
