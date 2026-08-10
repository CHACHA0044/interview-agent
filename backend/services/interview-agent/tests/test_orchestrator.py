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
from tests.fakes import FakeAIClient, FailingFollowupAIClient

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


async def test_clarifying_question_consumes_no_slot_or_budget():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[4.0] * 50))

    res_start = await orchestrator.start("abc-clar", CANDIDATE)
    first_qid = res_start.question.questionId
    first_reply = res_start.reply
    state = res_start.agentState

    res = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-clar",
            candidate=CANDIDATE,
            agentState=state,
            conversation=_conversation(("agent", first_reply), ("candidate", "What do you mean by chunk size?")),
            currentQuestion=res_start.question,
            message="What do you mean by chunk size?",
        )
    )

    assert res.done is False
    # No question slot consumed and no follow-up budget burned.
    assert res.sessionView.questionCount == 1
    assert res.question.questionId == first_qid
    # The reply clarifies AND re-asks; it is not the question itself.
    assert "To clarify" in res.reply
    assert "answer in your own words" in res.reply.lower()
    # State must be untouched so the candidate can answer the original question.
    assert AgentState.model_validate(res.agentState).progress.total_questions_asked == 1
    assert AgentState.model_validate(res.agentState).follow_up_context.global_follow_up_budget == 4


async def test_non_answer_triggers_targeted_fallback_followup():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FailingFollowupAIClient(scores=[4.0] * 50))

    res_start = await orchestrator.start("abc-yes", CANDIDATE)
    first_qid = res_start.question.questionId
    state = res_start.agentState

    res = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-yes",
            candidate=CANDIDATE,
            agentState=state,
            conversation=_conversation(("agent", res_start.reply), ("candidate", "yes")),
            currentQuestion=res_start.question,
            message="yes",
        )
    )

    assert res.done is False
    assert res.question is not None
    assert res.question.followUpOf == first_qid
    # The deterministic fallback must be a targeted elaboration, not generic praise.
    assert "one-word" in res.reply.lower() or "reasoning" in res.reply.lower()


async def test_moderation_terminates_interview():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[9.0] * 50))

    res_start = await orchestrator.start("abc-mod", CANDIDATE)
    state = res_start.agentState

    res = await orchestrator.next(
        AgentNextRequest(
            sessionId="abc-mod",
            candidate=CANDIDATE,
            agentState=state,
            conversation=_conversation(("agent", res_start.reply), ("candidate", "fuck you, this is stupid")),
            currentQuestion=res_start.question,
            message="fuck you, this is stupid",
        )
    )

    assert res.done is True
    assert res.feedback is not None
    assert res.sessionView.status == "completed"
    assert any("policy" in gap.lower() for gap in res.feedback.gaps)
    # The violating response must be scored at the absolute floor.
    final_state = AgentState.model_validate(res.agentState)
    assert final_state.completion.is_eligible_for_completion is True
    assert final_state.history[-1].score == 0.0


async def test_start_restricted_to_selected_modules():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[9.0] * 50))

    res = await orchestrator.start(
        "abc-scope",
        CANDIDATE,
        curriculum_scope=["LLM Core, Prompting & Fine-Tuning"],
    )

    plan = res.agentState["interview_plan"]
    days = {q["day"] for q in plan}
    # Module 4 spans days 11-15; the whole plan must stay inside it.
    assert days <= set(range(11, 16))
    assert len(days) >= 4


async def test_start_scope_with_unmatched_titles_falls_back_to_general_plan():
    loader = CurriculumLoader()
    orchestrator = InterviewOrchestrator(loader, FakeAIClient(scores=[9.0] * 50))

    # No module title matches, so no scope constraint is applied.
    res = await orchestrator.start(
        "abc-scope-unmatched",
        CANDIDATE,
        curriculum_scope=["Nonexistent Module"],
    )

    plan = res.agentState["interview_plan"]
    assert len(plan) >= 4
