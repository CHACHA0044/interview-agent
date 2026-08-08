"""
Purpose:
Verifies the InterviewOrchestrator state machine (master contract) from Start
to Finish, covering follow-ups, next-question routing, and completion.

Connected Files:
- app/services/orchestrator.py
"""

import os

from app.schemas.orchestration import AgentCompleteRequest, AgentNextRequest, Candidate
from app.schemas.state import AgentState
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator
from tests.fakes import FakeAIClient

os.environ.setdefault("CURRICULUM_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "curriculum.json"))

CANDIDATE = Candidate(
    member={"id": "1", "name": "J", "jobRole": "SWE", "yearsExperience": 2},
    missions=[],
    signals={},
)


def _conversation(*pairs):
    return [{"role": role, "content": content} for role, content in pairs]


async def test_full_orchestration_cycle():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[4.0, 9.0, 9.0, 9.0]))

    # 1. START
    res_start = await orchestrator.start("abc-123", CANDIDATE)
    assert res_start.done is False
    assert res_start.question is not None
    assert res_start.question.questionId
    assert res_start.sessionView.questionCount == 1
    first_qid = res_start.question.questionId

    state = res_start.agentState

    # 2. BAD ANSWER -> FOLLOW-UP (score 4.0)
    res_turn1 = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-123",
            candidate=CANDIDATE,
            agentState=state,
            conversation=_conversation(("agent", res_start.reply), ("candidate", "my bad answer")),
            currentQuestion=res_start.question,
            message="my bad answer",
        )
    )
    assert res_turn1.done is False
    assert res_turn1.question is not None
    assert res_turn1.question.followUpOf == first_qid
    followup_qid = res_turn1.question.questionId
    state = res_turn1.agentState
    conv = _conversation(("agent", res_start.reply), ("candidate", "my bad answer"), ("agent", res_turn1.reply))

    # 3. GOOD ANSWER ON FOLLOW-UP -> NEXT QUESTION (score 9.0)
    res_turn2 = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-123",
            candidate=CANDIDATE,
            agentState=state,
            conversation=_conversation(
                ("agent", res_start.reply),
                ("candidate", "my bad answer"),
                ("agent", res_turn1.reply),
                ("candidate", "solid answer"),
            ),
            currentQuestion=res_turn1.question,
            message="solid answer",
        )
    )
    assert res_turn2.done is False
    assert res_turn2.question is not None
    assert res_turn2.question.questionId != followup_qid
    assert res_turn2.sessionView.questionCount >= 3

    # 4. FORCE FLOORS MET THEN GOOD ANSWER -> FINISH
    st = AgentState.model_validate(res_turn2.agentState)
    st.progress.current_slot = len(st.interview_plan)
    st.progress.total_questions_asked = 8
    st.progress.distinct_days_covered = 4

    res_final = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-123",
            candidate=CANDIDATE,
            agentState=st.model_dump(),
            conversation=_conversation(("agent", "q"), ("candidate", "final answer")),
            currentQuestion=res_turn2.question,
            message="final answer",
        )
    )
    assert res_final.done is True
    assert res_final.feedback is not None
    assert res_final.feedback.summary
    assert res_final.sessionView.status == "completed"
    assert res_final.question is None


async def test_complete_returns_feedback_when_floors_met():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[9.0] * 10))

    res_start = await orchestrator.start("abc-456", CANDIDATE)
    st = AgentState.model_validate(res_start.agentState)
    st.progress.current_slot = len(st.interview_plan)
    st.progress.total_questions_asked = 8
    st.progress.distinct_days_covered = 4

    # Complete request only carries sessionId + agentState.
    res = await orchestrator.complete(
        AgentCompleteRequest(sessionId="abc-456", agentState=st.model_dump())
    )
    assert res.done is True
    assert res.feedback is not None
    assert res.sessionView.status == "completed"
