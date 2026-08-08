"""
Purpose:
The stateless orchestration entry point for the Interview Agent, adapted to the
master gateway contract (backend/shared/schemas/agent_api.json).

Responsibilities:
- Coordinates the deterministic engine (Planning, Difficulty, Progression).
- Talks to ai-intelligence over its internal contract (backend/shared/schemas/ai_api.json).
- Maintains strict stateless execution: all state travels in agentState.
- Provides start / next / complete entry points and deterministic AI fallbacks.

Connected Files:
- app/schemas/orchestration.py
- app/schemas/state.py
- app/services/ai_client.py
- app/services/contract_mappers.py
- app/services/*.py (deterministic engine)
"""

import logging
import time
import uuid
from collections import defaultdict
from typing import Any, Dict, List, Optional

from app.schemas.domain import (
    DifficultyState,
    EvaluationResult,
    FollowUpDecision,
    FollowUpStrategy,
    PlannedQuestion,
    ProgressionState,
)
from app.schemas.orchestration import (
    AgentNextRequest,
    AgentTurnResponse,
    Candidate,
    Feedback,
    Question,
    SessionView,
)
from app.schemas.state import (
    AgentState,
    CompletionState,
    FollowUpContext,
    InterviewProgress,
    StateMetadata,
)

from app.services.ai_client import AIIntelligenceClient, AIIntelligenceError
from app.services.calibration import build_candidate_context
from app.services.contract_mappers import (
    build_curriculum_context,
    candidate_context_to_ai,
    conversation_to_ai,
    followup_strategy_to_ai,
    question_strategy_to_ai,
)
from app.services.curriculum_loader import CurriculumLoader
from app.services.curriculum_selection import build_assessment_plan
from app.services.decision_engine import evaluate_next_step
from app.services.difficulty_adapter import adapt_difficulty
from app.services.planner import generate_interview_plan
from app.services.progression import advance_to_next_question, process_evaluation_decision
from app.services.strategy_builder import build_question_strategy

logger = logging.getLogger(__name__)


class InterviewOrchestrator:
    """Stateless orchestrator exposing the master agent contract."""

    def __init__(
        self,
        curriculum_loader: CurriculumLoader,
        ai_client: AIIntelligenceClient,
        followup_budget: int = 4,
        followup_max_per_question: int = 2,
    ) -> None:
        self.curriculum_loader = curriculum_loader
        self.ai_client = ai_client
        self.followup_budget = followup_budget
        self.followup_max_per_question = followup_max_per_question

    # ------------------------------------------------------------------ start

    async def start(self, session_id: str, candidate: Candidate) -> AgentTurnResponse:
        raw_candidate = candidate.model_dump()
        candidate_context, starting_diff = build_candidate_context(raw_candidate)
        curriculum_selection = build_assessment_plan(candidate_context, self.curriculum_loader)
        difficulty_state = DifficultyState(
            current_difficulty=starting_diff,
            starting_difficulty=starting_diff,
        )
        interview_plan = generate_interview_plan(
            candidate_context,
            curriculum_selection,
            difficulty_state,
            self.curriculum_loader,
        )
        now = time.time()
        metadata = StateMetadata(created_at_ts=now, updated_at_ts=now)
        state = AgentState(
            session_id=session_id,
            metadata=metadata,
            candidate_context=candidate_context,
            candidate_payload=raw_candidate,
            curriculum=curriculum_selection,
            interview_plan=interview_plan,
            difficulty_state=difficulty_state,
            progress=InterviewProgress(),
            completion=CompletionState(),
            follow_up_context=FollowUpContext(
                global_follow_up_budget=self.followup_budget,
                max_followups_per_question=self.followup_max_per_question,
            ),
        )
        state = advance_to_next_question(state)
        current = state.progress.current_question
        if current is None:
            raise ValueError("FATAL: Interview plan produced no question.")
        strategy = build_question_strategy(current, state.candidate_context)
        return await self._respond_question(state, strategy, conversation=[])

    # ------------------------------------------------------------------ next

    async def next(self, request: AgentNextRequest) -> AgentTurnResponse:
        state = AgentState.model_validate(request.agentState)
        state.metadata.updated_at_ts = time.time()

        current_question = state.progress.current_question
        if current_question is None:
            raise ValueError("Invalid state: no current question to grade.")

        # Resolve the question id this answer belongs to.
        qid = (
            current_question.question_id
            or (request.currentQuestion.questionId if request.currentQuestion else None)
            or str(uuid.uuid4())
        )
        current_question.question_id = qid

        # 1. Evaluate the candidate's answer.
        evaluation = await self._evaluate_answer(state, current_question, request.message)
        evaluation.question_id = qid
        evaluation.day = current_question.day
        evaluation.topic = current_question.topic
        state.history.append(evaluation)

        # 2. Adapt difficulty from the score.
        state.difficulty_state = adapt_difficulty(state.difficulty_state, evaluation.score)

        # 3. Decide the next step (follow-up / next question / finish).
        decision, follow_up_strategy = evaluate_next_step(
            current_question=current_question,
            evaluation=evaluation,
            follow_up_context=state.follow_up_context,
            candidate=state.candidate_context,
            question_count=state.progress.total_questions_asked,
            distinct_days_completed=state.progress.distinct_days_covered,
            remaining_plan_slots=len(state.interview_plan) - state.progress.current_slot,
        )

        # 4. Apply the decision to global state.
        state = process_evaluation_decision(state, decision, follow_up_strategy)

        # 5. Produce the response.
        if state.progress.progression_state == ProgressionState.COMPLETED:
            return await self._respond_completed(state)
        if state.progress.progression_state == ProgressionState.FOLLOW_UP_PENDING:
            return await self._respond_follow_up(state, follow_up_strategy, request.conversation)
        if state.progress.progression_state == ProgressionState.QUESTION_PENDING:
            current = state.progress.current_question
            if current is None:
                raise ValueError("Invalid state: QUESTION_PENDING without a current question.")
            strategy = build_question_strategy(current, state.candidate_context)
            return await self._respond_question(state, strategy, request.conversation)

        raise ValueError(f"Unknown state machine transition: {state.progress.progression_state}")

    # -------------------------------------------------------------- complete

    async def complete(self, request) -> AgentTurnResponse:
        state = AgentState.model_validate(request.agentState)
        state.metadata.updated_at_ts = time.time()

        state = process_evaluation_decision(state, FollowUpDecision.FINISH, None)
        if state.progress.progression_state != ProgressionState.COMPLETED:
            raise ValueError(
                "Cannot complete interview: hard floors not met "
                f"({state.progress.total_questions_asked} questions, "
                f"{state.progress.distinct_days_covered} days)."
            )
        return await self._respond_completed(state)

    # ------------------------------------------------------------- responses

    async def _respond_question(
        self,
        state: AgentState,
        strategy,
        conversation,
    ) -> AgentTurnResponse:
        text = await self._generate_question(state, strategy, conversation)
        current = state.progress.current_question
        if current is None:
            raise ValueError("Invalid state: no current question to expose.")
        qid = current.question_id or str(uuid.uuid4())
        current.question_id = qid
        current.question_text = text
        return AgentTurnResponse(
            agentState=state.model_dump(),
            sessionView=self._session_view(state),
            reply=text,
            done=False,
            feedback=None,
            question=self._question_metadata(current),
        )

    async def _respond_follow_up(
        self,
        state: AgentState,
        follow_up_strategy: Optional[FollowUpStrategy],
        conversation,
    ) -> AgentTurnResponse:
        if follow_up_strategy is None:
            raise ValueError("Invalid state: FOLLOW_UP_PENDING without a follow-up strategy.")
        current = state.progress.current_question
        if current is None:
            raise ValueError("Invalid state: FOLLOW_UP_PENDING without a current question.")
        text = await self._generate_follow_up(state, follow_up_strategy, current, conversation)
        qid = current.question_id or str(uuid.uuid4())
        current.question_id = qid
        current.question_text = text
        return AgentTurnResponse(
            agentState=state.model_dump(),
            sessionView=self._session_view(state),
            reply=text,
            done=False,
            feedback=None,
            question=self._question_metadata(current),
        )

    async def _respond_completed(self, state: AgentState) -> AgentTurnResponse:
        feedback = await self._generate_feedback(state)
        return AgentTurnResponse(
            agentState=state.model_dump(),
            sessionView=self._session_view(state),
            reply="The assessment interview is complete. Here is your feedback summary.",
            done=True,
            feedback=feedback,
            question=None,
        )

    # ------------------------------------------------------------ AI helpers

    async def _generate_question(self, state: AgentState, strategy, conversation) -> str:
        payload_strategy = question_strategy_to_ai(strategy)
        try:
            result = await self.ai_client.generate_question(
                candidate_context=candidate_context_to_ai(state.candidate_context),
                curriculum_context=build_curriculum_context(
                    self.curriculum_loader,
                    [pq.day for pq in state.interview_plan],
                ),
                conversation=conversation_to_ai(conversation),
                question_strategy=payload_strategy,
            )
            text = result.get("question")
            if text and text.strip():
                return text
        except AIIntelligenceError as exc:
            logger.warning("question generation failed, using fallback: %s", exc)
        return self._fallback_question_text(strategy)

    async def _generate_follow_up(
        self,
        state: AgentState,
        follow_up_strategy: FollowUpStrategy,
        current: PlannedQuestion,
        conversation,
    ) -> str:
        try:
            result = await self.ai_client.generate_followup(
                candidate_context=candidate_context_to_ai(state.candidate_context),
                curriculum_context=build_curriculum_context(
                    self.curriculum_loader,
                    [pq.day for pq in state.interview_plan],
                ),
                conversation=conversation_to_ai(conversation),
                follow_up_strategy=followup_strategy_to_ai(
                    follow_up_strategy,
                    topic=current.topic,
                    concepts=current.concepts,
                ),
            )
            text = result.get("question")
            if text and text.strip():
                return text
        except AIIntelligenceError as exc:
            logger.warning("follow-up generation failed, using fallback: %s", exc)
        return self._fallback_followup_text(follow_up_strategy, current.topic)

    async def _evaluate_answer(
        self,
        state: AgentState,
        current_question: PlannedQuestion,
        answer: str,
    ) -> EvaluationResult:
        ai_question = {
            "questionId": current_question.question_id,
            "question": current_question.question_text or current_question.topic,
            "type": current_question.type.value,
            "difficulty": current_question.difficulty.value,
            "topic": current_question.topic,
            "day": current_question.day,
            "expectedConcepts": list(current_question.concepts),
            "followUpOf": current_question.follow_up_of,
        }
        try:
            result = await self.ai_client.evaluate_answer(
                question=ai_question,
                candidate_context=candidate_context_to_ai(state.candidate_context),
                candidate_answer=answer,
            )
            return EvaluationResult(
                question_text=ai_question["question"],
                candidate_answer=answer,
                score=float(result.get("score", 5.0)),
                concept_coverage=float(result.get("conceptCoverage", 0.5)),
                technical_accuracy=float(result.get("technicalAccuracy", 0.5)),
                depth=float(result.get("depth", 0.5)),
                strengths=list(result.get("strengths", [])),
                gaps=list(result.get("gaps", [])),
                follow_up_required=bool(result.get("followUpRequired", False)),
            )
        except AIIntelligenceError as exc:
            logger.warning("evaluation failed, using fallback: %s", exc)
            return self._fallback_evaluation(current_question, answer)

    async def _generate_feedback(self, state: AgentState) -> Feedback:
        evaluations, coverage, missed, topic_scores = self._feedback_inputs(state)
        try:
            result = await self.ai_client.generate_feedback(
                candidate=state.candidate_payload,
                candidate_context=candidate_context_to_ai(state.candidate_context),
                evaluations=evaluations,
                coverage=coverage,
                missed_concepts=missed,
                topic_scores=topic_scores,
            )
            return Feedback(
                summary=str(result.get("summary", "")),
                strengths=list(result.get("strengths", [])),
                gaps=list(result.get("gaps", [])),
                next=list(result.get("next", [])),
            )
        except AIIntelligenceError as exc:
            logger.warning("feedback generation failed, using fallback: %s", exc)
            return self._fallback_feedback(state)

    # ----------------------------------------------------------- deterministic fallbacks

    def _fallback_question_text(self, strategy) -> str:
        lines = [
            f"{strategy.difficulty.value.capitalize()} question on {strategy.topic} (Day {strategy.day}):",
            "Explain the following concepts in your own words:",
        ]
        for concept in strategy.concepts[:5]:
            lines.append(f"- {concept}")
        return "\n".join(lines)

    def _fallback_followup_text(self, follow_up_strategy: FollowUpStrategy, topic: str) -> str:
        probes = follow_up_strategy.concepts_to_probe[:3]
        probe_text = ", ".join(probes) if probes else "the topic"
        return (
            f"Let's dig a little deeper on {topic}. Based on your previous answer, "
            f"can you explain how {probe_text} connect to the bigger picture?"
        )

    def _fallback_evaluation(self, current_question: PlannedQuestion, answer: str) -> EvaluationResult:
        answer_lower = (answer or "").strip().lower()
        words = answer_lower.split()
        if not words:
            return EvaluationResult(
                question_text=current_question.question_text or current_question.topic,
                candidate_answer=answer,
                score=1.0,
                concept_coverage=0.0,
                technical_accuracy=0.0,
                depth=0.0,
                gaps=["No answer provided."],
                follow_up_required=True,
            )
        concepts = current_question.concepts or []
        if concepts:
            matched = [c for c in concepts if c.lower() in answer_lower]
            coverage = len(matched) / len(concepts)
            gaps = [c for c in concepts if c.lower() not in answer_lower]
            strengths = [c for c in concepts if c.lower() in answer_lower][:3]
        else:
            coverage = min(len(words) / 40.0, 1.0)
            gaps = []
            strengths = ["Provided a response."] if coverage > 0.5 else []
        score = round(min(2.0 + coverage * 8.0, 10.0), 2)
        return EvaluationResult(
            question_text=current_question.question_text or current_question.topic,
            candidate_answer=answer,
            score=score,
            concept_coverage=coverage,
            technical_accuracy=min(coverage + 0.1, 1.0),
            depth=coverage,
            strengths=strengths,
            gaps=gaps,
            follow_up_required=score < 6.0,
        )

    def _fallback_feedback(self, state: AgentState) -> Feedback:
        strengths: List[str] = []
        gaps: List[str] = []
        for h in state.history:
            strengths.extend(h.strengths)
            gaps.extend(h.gaps)
        avg = (sum(h.score for h in state.history) / len(state.history)) if state.history else 0.0
        name = state.candidate_payload.get("member", {}).get("name", "Candidate")
        summary = (
            f"{name} completed the assessment interview with an average score of "
            f"{avg:.1f}/10 across {len(state.history)} questions."
        )
        next_steps = (
            [f"Review curriculum Day {d}." for d in sorted(state.progress.days_covered_set)]
            or ["Review the core curriculum material."]
        )
        return Feedback(
            summary=summary,
            strengths=list(dict.fromkeys(strengths))[:5],
            gaps=list(dict.fromkeys(gaps))[:5],
            next=next_steps,
        )

    # ------------------------------------------------------------------ misc

    def _feedback_inputs(self, state: AgentState):
        evaluations: List[Dict[str, Any]] = []
        per_day_evals: Dict[int, List[EvaluationResult]] = defaultdict(list)
        per_day_gaps: Dict[int, List[str]] = defaultdict(list)
        topic_buckets: Dict[str, Dict[str, Any]] = {}

        for h in state.history:
            day = h.day or 0
            per_day_evals[day].append(h)
            if h.gaps:
                per_day_gaps[day].extend(h.gaps)
            evaluations.append(
                {
                    "questionId": h.question_id or "",
                    "score": h.score,
                    "day": day,
                    "strengths": list(h.strengths),
                    "gaps": list(h.gaps),
                }
            )
            topic = h.topic or "General"
            bucket = topic_buckets.setdefault(
                topic, {"module": 0, "topic": topic, "score": 0.0, "maxScore": 0.0}
            )
            bucket["score"] += h.score
            bucket["maxScore"] += 10.0
            if h.day:
                mod_id = self.curriculum_loader.get_module_for_day(h.day)
                if mod_id is not None:
                    bucket["module"] = mod_id

        coverage = {
            day: round(sum(e.concept_coverage for e in evals) / len(evals), 4)
            for day, evals in per_day_evals.items()
            if evals
        }
        missed = {
            day: list(dict.fromkeys(gaps))
            for day, gaps in per_day_gaps.items()
            if gaps
        }
        return evaluations, coverage, missed, list(topic_buckets.values())

    @staticmethod
    def _session_view(state: AgentState) -> SessionView:
        completed = state.progress.progression_state == ProgressionState.COMPLETED
        return SessionView(
            questionCount=state.progress.total_questions_asked,
            daysAsked=sorted(set(state.progress.days_covered_set)),
            scores=[h.score for h in state.history],
            status="completed" if completed else "active",
        )

    @staticmethod
    def _question_metadata(current: PlannedQuestion) -> Question:
        return Question(
            questionId=current.question_id or str(uuid.uuid4()),
            type=current.type.value,
            difficulty=current.difficulty.value,
            topic=current.topic,
            day=current.day,
            followUpOf=current.follow_up_of,
            expectedConcepts=list(current.concepts),
        )
