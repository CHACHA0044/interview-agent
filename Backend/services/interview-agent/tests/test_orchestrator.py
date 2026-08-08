"""
Purpose:
Verifies the full InterviewOrchestrator state machine from Start to Finish.

Responsibilities:
- Proves start_interview generates a valid state and first question.
- Proves process_next_turn routes FollowUps correctly.
- Proves process_next_turn routes NEXT_QUESTION correctly.
- Proves exhaustion triggers FINISH action.

Connected Files:
- app/services/orchestrator.py
"""

from app.schemas.orchestration import StartInterviewRequest, NextTurnRequest
from app.schemas.domain import EvaluationResult, QuestionStrategy, FollowUpStrategy
from app.services.orchestrator import InterviewOrchestrator
from app.services.curriculum_loader import CurriculumLoader

# Minimal mocked curriculum
def test_full_orchestration_cycle():
    loader = CurriculumLoader(file_path="d:/interview-agent/curriculum.json")
    # The selector fallback or normal selector will pick at least 4 days.
    # This means we get 8 questions interleaved over 4 days.
    
    # 1. START
    orchestrator = InterviewOrchestrator(loader)
    
    # Send mock profile matching the schema
    mock_profile = {
        "member": {"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
        "missions": [],
        "signals": {}
    }
    
    req_start = StartInterviewRequest(session_id="abc-123", candidate_profile=mock_profile)
    res_start = orchestrator.start_interview(req_start)
    
    assert res_start.action_type == "QUESTION"
    assert res_start.updated_state.session_id == "abc-123"
    assert res_start.updated_state.progress.total_questions_asked == 1
    assert isinstance(res_start.payload, QuestionStrategy)
    
    state = res_start.updated_state
    
    # 2. SUBMIT BAD ANSWER (Trigger Follow-Up)
    # Score 4.0 triggers Follow-Up
    eval_bad = EvaluationResult(
        question_text="Q1", candidate_answer="A1", score=4.0, concept_coverage=0, 
        technical_accuracy=0, depth=0, strengths=[], gaps=["Everything"]
    )
    req_turn1 = NextTurnRequest(agent_state=state, evaluation_result=eval_bad, candidate_profile=mock_profile)
    res_turn1 = orchestrator.process_next_turn(req_turn1)
    
    assert res_turn1.action_type == "FOLLOW_UP"
    assert isinstance(res_turn1.payload, FollowUpStrategy)
    assert res_turn1.updated_state.progress.total_questions_asked == 2
    
    state = res_turn1.updated_state
    
    # 3. SUBMIT GOOD ANSWER (Trigger Next Question)
    # Score 9.0 -> Next Question
    eval_good = EvaluationResult(
        question_text="Q_F", candidate_answer="A_F", score=9.0, concept_coverage=1, 
        technical_accuracy=1, depth=1, strengths=[], gaps=[]
    )
    req_turn2 = NextTurnRequest(agent_state=state, evaluation_result=eval_good, candidate_profile=mock_profile)
    res_turn2 = orchestrator.process_next_turn(req_turn2)
    
    assert res_turn2.action_type == "QUESTION"
    assert isinstance(res_turn2.payload, QuestionStrategy)
    assert res_turn2.updated_state.progress.total_questions_asked == 3
    
    state = res_turn2.updated_state
    
    # 4. EXHAUST PLAN manually to test FINISH
    # 8 questions minimum, 4 days. Let's just mock the state reaching the end
    state.progress.current_slot = len(state.interview_plan)
    state.progress.total_questions_asked = 8
    state.progress.distinct_days_covered = 4
    
    # Submit one last answer
    req_final = NextTurnRequest(agent_state=state, evaluation_result=eval_good, candidate_profile=mock_profile)
    res_final = orchestrator.process_next_turn(req_final)
    
    assert res_final.action_type == "FINISH"
    assert res_final.payload is None
    assert res_final.updated_state.completion.status == "completed"
