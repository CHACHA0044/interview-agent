"""
Purpose:
Verifies the safe transitions and hard-floor limits of the ProgressionEngine.

Responsibilities:
- Asserts duplicate day handling works correctly.
- Asserts that premature FINISH calls are downgraded to NEXT_QUESTION.
- Asserts empty-plan fatalities trigger ValueError.

Connected Files:
- app/services/progression.py
- app/schemas/state.py
"""

import pytest
from typing import List
from app.schemas.state import AgentState, StateMetadata, InterviewProgress
from app.schemas.domain import (
    CandidateContext, CurriculumSelection, DifficultyState, 
    Difficulty, CandidateTier, PlannedQuestion, QuestionType, 
    FollowUpDecision, ProgressionState, InterviewStatus
)
from app.services.progression import advance_to_next_question, process_evaluation_decision

def _mock_state(plan: List[PlannedQuestion]) -> AgentState:
    metadata = StateMetadata(created_at_ts=0, updated_at_ts=0)
    candidate = CandidateContext(member_id="1", name="J", job_role="Dev", years_experience=2, tier=CandidateTier.STRONG)
    curr = CurriculumSelection(selected_days=[1,2,3,4], day_types={}, assessment_priorities=[], relevant_concepts=[], selected_modules=[])
    diff = DifficultyState(current_difficulty=Difficulty.MEDIUM, starting_difficulty=Difficulty.MEDIUM)
    
    return AgentState(
        session_id="abc",
        metadata=metadata,
        candidate_context=candidate,
        curriculum=curr,
        interview_plan=plan,
        difficulty_state=diff
    )

def test_advance_to_next_question_updates_difficulty_and_days():
    # Make a plan with multiple questions on the same day
    plan = [
        PlannedQuestion(day=5, module=1, topic="A", difficulty=Difficulty.EASY, concepts=[]),
        PlannedQuestion(day=5, module=1, topic="B", difficulty=Difficulty.EASY, concepts=[])
    ]
    state = _mock_state(plan)
    
    # Simulate difficulty adapting to HARD BEFORE the first pull
    state.difficulty_state.current_difficulty = Difficulty.HARD
    
    # Pull Q1
    state = advance_to_next_question(state)
    assert state.progress.current_slot == 1
    assert state.progress.distinct_days_covered == 1
    assert state.progress.total_questions_asked == 1
    assert state.progress.current_question is not None
    assert state.progress.current_question.difficulty == Difficulty.HARD # Dynamically applied!
    assert state.progress.days_covered_set == [5]
    
    # Pull Q2 (Same Day)
    state = advance_to_next_question(state)
    assert state.progress.current_slot == 2
    assert state.progress.distinct_days_covered == 1 # Did not increment! Duplicate day protection.
    assert state.progress.days_covered_set == [5]
    assert state.progress.total_questions_asked == 2


def test_finish_blocked_before_floor():
    state = _mock_state([
        PlannedQuestion(day=1, module=1, topic="A", difficulty=Difficulty.EASY, concepts=[])
    ])
    # Manually hack progress to simulate asking 7 questions across 4 days
    state.progress.total_questions_asked = 7
    state.progress.distinct_days_covered = 4
    
    # The decision engine incorrectly attempts to FINISH early
    state = process_evaluation_decision(state, FollowUpDecision.FINISH, None)
    
    # Defensive guard MUST override and pull next question instead!
    assert state.progress.progression_state == ProgressionState.QUESTION_PENDING
    assert state.completion.status == InterviewStatus.PENDING


def test_finish_allowed_after_floor():
    state = _mock_state([])
    # Met both boundaries exactly
    state.progress.total_questions_asked = 8
    state.progress.distinct_days_covered = 4
    
    state = process_evaluation_decision(state, FollowUpDecision.FINISH, None)
    
    # Should safely finish
    assert state.progress.progression_state == ProgressionState.COMPLETED
    assert state.completion.status == InterviewStatus.COMPLETED


def test_fatal_error_on_empty_plan_before_floor():
    # Empty plan, floor not met
    state = _mock_state([])
    
    with pytest.raises(ValueError) as exc:
        advance_to_next_question(state)
        
    assert "FATAL: Plan exhausted but hard floor not met" in str(exc.value)
