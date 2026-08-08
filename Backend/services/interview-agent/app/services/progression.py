"""
Purpose:
Manages the global state transitions for the interview-agent.

Responsibilities:
- Evaluates follow-up constraints and transitions the state machine.
- Advances to the next planned question slot safely.
- Strictly guards completion, blocking FINISH until the 8-question, 4-day floor is met.
- Prevents double-counting distinct days.

Connected Files:
- app/schemas/state.py
- app/schemas/domain.py
"""

from typing import Optional
from app.schemas.state import AgentState
from app.schemas.domain import (
    FollowUpDecision, 
    FollowUpStrategy, 
    ProgressionState, 
    InterviewStatus,
    PlannedQuestion
)

def advance_to_next_question(state: AgentState) -> AgentState:
    """
    Safely pops the next question from the plan, applies the dynamic difficulty, 
    and mathematically updates the day-tracking progress.
    """
    progress = state.progress
    
    if progress.current_slot >= len(state.interview_plan):
        # The plan is exhausted. We must verify if we can finish.
        if _meets_hard_floor(state):
            return _mark_completed(state, "Plan exhausted naturally.")
        else:
            raise ValueError(
                f"FATAL: Plan exhausted but hard floor not met! "
                f"Asked {progress.total_questions_asked}/8 qs across "
                f"{progress.distinct_days_covered}/4 days."
            )
            
    # Pull next slot
    next_q = state.interview_plan[progress.current_slot]
    
    # Overwrite difficulty with our dynamically calibrated state
    next_q.difficulty = state.difficulty_state.current_difficulty
    
    # Track day uniquely
    if next_q.day not in progress.days_covered_set:
        progress.days_covered_set.append(next_q.day)
        progress.distinct_days_covered = len(progress.days_covered_set)
        
    progress.current_question = next_q
    progress.current_slot += 1
    progress.total_questions_asked += 1
    
    # Clean slate for follow-ups on a new question
    state.follow_up_context.followups_asked_on_current_question = 0
    
    # State update
    progress.progression_state = ProgressionState.QUESTION_PENDING
    
    return state


def process_evaluation_decision(
    state: AgentState, 
    decision: FollowUpDecision, 
    strategy: Optional[FollowUpStrategy] = None
) -> AgentState:
    """
    Mutates the global AgentState based on the outcome of the post-evaluation decision engine.
    """
    if decision == FollowUpDecision.FOLLOW_UP and strategy:
        # Convert FollowUpStrategy back into a PlannedQuestion for the state
        # The AI-Intelligence module handles generating the text itself later.
        follow_up_q = PlannedQuestion(
            day=strategy.day,
            module=strategy.module,
            topic="Follow Up", # Generic
            difficulty=strategy.difficulty,
            concepts=strategy.concepts_to_probe,
            is_follow_up=True,
            follow_up_of=strategy.previous_answer
        )
        
        state.progress.current_question = follow_up_q
        state.progress.total_questions_asked += 1
        state.progress.progression_state = ProgressionState.FOLLOW_UP_PENDING
        
        # Burn budgets
        state.follow_up_context.global_follow_up_budget -= 1
        state.follow_up_context.followups_asked_on_current_question += 1
        
        return state
        
    elif decision == FollowUpDecision.FINISH:
        if _meets_hard_floor(state):
            return _mark_completed(state, "Decision engine requested FINISH safely.")
        else:
            # Defensive override: Engine requested finish but we haven't met constraints!
            return advance_to_next_question(state)
            
    else:
        # NEXT_QUESTION
        return advance_to_next_question(state)


def _meets_hard_floor(state: AgentState) -> bool:
    """Verifies the unbreakable 8-question, 4-day boundaries."""
    # Note: total_questions_asked includes the current question we just graded.
    return (state.progress.total_questions_asked >= 8) and (state.progress.distinct_days_covered >= 4)


def _mark_completed(state: AgentState, reason: str) -> AgentState:
    """Terminates the progression state safely."""
    state.progress.progression_state = ProgressionState.COMPLETED
    state.completion.status = InterviewStatus.COMPLETED
    state.completion.is_eligible_for_completion = True
    state.completion.completion_reason = reason
    state.progress.current_question = None
    return state
