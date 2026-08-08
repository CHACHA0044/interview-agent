"""
Purpose:
The stateless orchestration entry point for the Interview Agent.

Responsibilities:
- Coordinates all internal deterministic services (Planning, Difficulty, Progression).
- Maintains strict stateless execution bounds.
- Processes incoming requests from the HTTP Gateway and outputs final AgentState payloads.

Connected Files:
- app/schemas/orchestration.py
- app/services/calibration.py
- app/services/curriculum_selection.py
- app/services/planner.py
- app/services/strategy_builder.py
- app/services/difficulty_adapter.py
- app/services/decision_engine.py
- app/services/progression.py
"""

import time
from typing import Optional

from app.schemas.orchestration import (
    StartInterviewRequest, 
    NextTurnRequest, 
    OrchestratorResponse, 
    FollowUpRequest, 
    CompleteRequest
)
from app.schemas.state import AgentState, StateMetadata, InterviewProgress, CompletionState, FollowUpContext
from app.schemas.domain import DifficultyState, FollowUpDecision, ProgressionState

from app.services.calibration import build_candidate_context, calculate_starting_difficulty
from app.services.curriculum_selection import build_assessment_plan
from app.services.planner import generate_interview_plan
from app.services.strategy_builder import build_question_strategy
from app.services.difficulty_adapter import adapt_difficulty
from app.services.decision_engine import evaluate_next_step
from app.services.progression import advance_to_next_question, process_evaluation_decision

# To avoid circular imports, the caller must supply the curriculum loader
from app.services.curriculum_loader import CurriculumLoader


class InterviewOrchestrator:
    """
    The main orchestrator. It receives raw HTTP payloads and yields exactly what 
    needs to happen next (Question, Follow-Up, or Finish) along with the mutated state.
    """
    
    def __init__(self, curriculum_loader: CurriculumLoader):
        self.curriculum_loader = curriculum_loader
        
    def start_interview(self, request: StartInterviewRequest) -> OrchestratorResponse:
        """
        Initializes an interview from scratch.
        Builds the candidate profile, selects the curriculum, generates the plan,
        and yields the first QuestionStrategy.
        """
        # 1. Candidate Context & Starting Difficulty
        candidate_context, starting_diff = build_candidate_context(request.candidate_profile)
        
        # 2. Curriculum
        curriculum_selection = build_assessment_plan(candidate_context, self.curriculum_loader)
        
        # 3. Setup Initial State Variables
        difficulty_state = DifficultyState(
            current_difficulty=starting_diff,
            starting_difficulty=starting_diff
        )
        
        # 4. Generate Interleaved Plan
        interview_plan = generate_interview_plan(
            candidate_context, curriculum_selection, difficulty_state, self.curriculum_loader
        )
        
        # 5. Build Final AgentState Object
        metadata = StateMetadata(
            created_at_ts=time.time(),
            updated_at_ts=time.time()
        )
        
        state = AgentState(
            session_id=request.session_id,
            metadata=metadata,
            candidate_context=candidate_context,
            curriculum=curriculum_selection,
            interview_plan=interview_plan,
            difficulty_state=difficulty_state,
            progress=InterviewProgress(),
            completion=CompletionState(),
            follow_up_context=FollowUpContext()
        )
        
        # 4. Advance to first question
        state = advance_to_next_question(state)
        
        # 5. Build Strategy
        strategy = build_question_strategy(state.progress.current_question, state.candidate_context) # type: ignore
        
        return OrchestratorResponse(
            updated_state=state,
            action_type="QUESTION",
            payload=strategy
        )

    def process_next_turn(self, request: NextTurnRequest) -> OrchestratorResponse:
        """
        Processes a graded answer. Mutates difficulty, makes a follow-up/next/finish decision,
        and yields the updated state.
        """
        state = request.agent_state
        eval_result = request.evaluation_result
        
        state.metadata.updated_at_ts = time.time()
        state.history.append(eval_result)
        
        # 1. Adapt Difficulty
        state.difficulty_state = adapt_difficulty(state.difficulty_state, eval_result.score)
        
        # 2. Make Follow-up Decision
        current_question = state.progress.current_question
        if not current_question:
            raise ValueError("Invalid state: cannot process next turn without a current question.")
            
        decision, follow_up_strategy = evaluate_next_step(
            current_question=current_question,
            evaluation=eval_result,
            follow_up_context=state.follow_up_context,
            candidate=state.candidate_context,
            question_count=state.progress.total_questions_asked,
            distinct_days_completed=state.progress.distinct_days_covered,
            remaining_plan_slots=len(state.interview_plan) - state.progress.current_slot
        )
        
        # 3. Apply Decision to Global State (Burns budgets, checks hard floors)
        state = process_evaluation_decision(state, decision, follow_up_strategy)
        
        # 4. Return correct Action Type
        if state.progress.progression_state == ProgressionState.COMPLETED:
            return OrchestratorResponse(
                updated_state=state,
                action_type="FINISH",
                payload=None
            )
            
        elif state.progress.progression_state == ProgressionState.FOLLOW_UP_PENDING:
            return OrchestratorResponse(
                updated_state=state,
                action_type="FOLLOW_UP",
                payload=follow_up_strategy
            )
            
        elif state.progress.progression_state == ProgressionState.QUESTION_PENDING:
            question_strategy = build_question_strategy(state.progress.current_question, state.candidate_context) # type: ignore
            return OrchestratorResponse(
                updated_state=state,
                action_type="QUESTION",
                payload=question_strategy
            )
            
        raise ValueError(f"Unknown state machine transition: {state.progress.progression_state}")

    def process_manual_follow_up(self, request: FollowUpRequest) -> OrchestratorResponse:
        """
        Forces a follow-up transition, bypassing the standard decision engine score checks.
        Uses the provided evaluation_result to extract the gaps/context.
        """
        state = request.agent_state
        eval_result = request.evaluation_result
        current_question = state.progress.current_question
        
        if not current_question:
            raise ValueError("Invalid state: cannot process follow-up without a current question.")
            
        reason = f"Manual/Forced follow-up. Gaps: {', '.join(eval_result.gaps)}"
        
        # Build the strategy directly
        from app.schemas.domain import FollowUpStrategy
        follow_up_strategy = FollowUpStrategy(
            day=current_question.day,
            module=current_question.module,
            previous_answer=eval_result.candidate_answer,
            concepts_to_probe=eval_result.gaps if eval_result.gaps else ["Technical reasoning"],
            difficulty=current_question.difficulty,
            reason_for_follow_up=reason,
            candidate_tier=state.candidate_context.tier,
            candidate_job_role=state.candidate_context.job_role
        )
        
        # Force the decision engine mutation directly
        state = process_evaluation_decision(state, FollowUpDecision.FOLLOW_UP, follow_up_strategy)
        
        return OrchestratorResponse(
            updated_state=state,
            action_type="FOLLOW_UP",
            payload=follow_up_strategy
        )

    def process_complete(self, request: CompleteRequest) -> OrchestratorResponse:
        """
        Attempts to explicitly complete the interview.
        Throws a ValueError if the hard floors (8 questions, 4 days) are not met.
        """
        state = request.agent_state
        
        # We can simulate a FINISH decision to let the progression engine run its checks
        state = process_evaluation_decision(state, FollowUpDecision.FINISH, None)
        
        if state.progress.progression_state != ProgressionState.COMPLETED:
            raise ValueError(
                f"Cannot complete interview. Hard floors not met. "
                f"Asked {state.progress.total_questions_asked}/8 qs, "
                f"Covered {state.progress.distinct_days_covered}/4 days."
            )
            
        return OrchestratorResponse(
            updated_state=state,
            action_type="FINISH",
            payload=None
        )
