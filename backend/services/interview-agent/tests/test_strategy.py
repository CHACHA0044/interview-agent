"""
Purpose:
Verifies the QuestionStrategy mapping and the contract mappers used to talk to
ai-intelligence.

Responsibilities:
- Asserts that a PlannedQuestion maps perfectly to a QuestionStrategy.
- Asserts candidate context is seamlessly injected.
- Validates the ai_api contract payload builders (camelCase).

Connected Files:
- app/services/strategy_builder.py
- app/services/contract_mappers.py
"""

import os

from app.schemas.domain import (
    CandidateContext,
    CandidateTier,
    Difficulty,
    FollowUpStrategy,
    PlannedQuestion,
    QuestionType,
)
from app.services.contract_mappers import (
    build_curriculum_context,
    candidate_context_to_ai,
    followup_strategy_to_ai,
    question_strategy_to_ai,
)
from app.services.curriculum_loader import CurriculumLoader
from app.services.strategy_builder import build_question_strategy

os.environ.setdefault("CURRICULUM_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "curriculum.json"))


def _candidate() -> CandidateContext:
    return CandidateContext(
        member_id="CAND-01",
        name="Test",
        job_role="Data Scientist",
        years_experience=4,
        tier=CandidateTier.EXPERT,
        strong_days=[],
        weak_days=[],
        failed_days=[],
        skipped_days=[],
    )


def test_build_question_strategy():
    slot = PlannedQuestion(
        day=5,
        module=2,
        topic="Vector Math",
        difficulty=Difficulty.HARD,
        concepts=["Cosine Similarity"],
        type=QuestionType.TECHNICAL,
        is_follow_up=False,
    )

    strategy = build_question_strategy(slot, _candidate())

    # Assert exact 1:1 mapping from slot
    assert strategy.day == 5
    assert strategy.module == 2
    assert strategy.topic == "Vector Math"
    assert strategy.difficulty == Difficulty.HARD
    assert strategy.concepts == ["Cosine Similarity"]
    assert strategy.is_follow_up is False
    assert strategy.follow_up_of is None

    # Assert candidate context injected
    assert strategy.candidate_tier == CandidateTier.EXPERT
    assert strategy.candidate_job_role == "Data Scientist"


def test_question_strategy_to_ai_mapping():
    slot = PlannedQuestion(
        day=5,
        module=2,
        topic="Vector Math",
        difficulty=Difficulty.HARD,
        concepts=["Cosine Similarity"],
    )
    strategy = build_question_strategy(slot, _candidate())

    payload = question_strategy_to_ai(strategy)

    assert payload["day"] == 5
    assert payload["module"] == 2
    assert payload["topic"] == "Vector Math"
    assert payload["difficulty"] == "hard"
    assert payload["concepts"] == ["Cosine Similarity"]
    assert payload["isFollowUp"] is False
    assert payload["followUpOf"] is None


def test_followup_strategy_to_ai_mapping():
    strategy = FollowUpStrategy(
        day=5,
        module=2,
        previous_answer="I don't know",
        concepts_to_probe=["Cosine Similarity"],
        difficulty=Difficulty.HARD,
        reason_for_follow_up="score below threshold",
        candidate_tier=CandidateTier.EXPERT,
        candidate_job_role="Data Scientist",
        follow_up_of="parent-123",
    )

    payload = followup_strategy_to_ai(strategy, topic="Vector Math", concepts=["Cosine Similarity"])

    assert payload["day"] == 5
    assert payload["difficulty"] == "hard"
    assert payload["previousAnswer"] == "I don't know"
    assert payload["weakConcepts"] == ["Cosine Similarity"]
    assert payload["questionStrategy"]["topic"] == "Vector Math"
    assert payload["questionStrategy"]["isFollowUp"] is True
    assert payload["questionStrategy"]["followUpOf"] == "parent-123"


def test_candidate_context_to_ai_mapping():
    payload = candidate_context_to_ai(_candidate())

    assert payload["candidateId"] == "CAND-01"
    assert payload["name"] == "Test"
    assert payload["role"] == "Data Scientist"
    assert payload["tier"] == "expert"
    assert payload["strongDays"] == []
    assert payload["weakDays"] == []


def test_build_curriculum_context():
    loader = CurriculumLoader()
    payload = build_curriculum_context(loader, planned_days=[1, 2, 3, 4])

    assert "modules" in payload
    assert "days" in payload
    assert "plannedDays" in payload
    assert payload["plannedDays"] == [1, 2, 3, 4]
    assert isinstance(payload["days"], dict)
    assert len(loader.day_map) > 0
