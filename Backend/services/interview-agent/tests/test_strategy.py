"""
Purpose:
Verifies the QuestionStrategy mapping and AI integration interface.

Responsibilities:
- Asserts that a PlannedQuestion maps perfectly to a QuestionStrategy.
- Asserts candidate context is seamlessly injected.
- Validates the ai_client stub returns a mocked response formatted with the strategy.

Connected Files:
- app/services/strategy_builder.py
- app/services/ai_client.py
"""

from app.schemas.domain import PlannedQuestion, CandidateContext, CandidateTier, Difficulty, QuestionType
from app.services.strategy_builder import build_question_strategy
from app.services.ai_client import AIIntelligenceClient


def test_build_question_strategy():
    slot = PlannedQuestion(
        day=5,
        module=2,
        topic="Vector Math",
        difficulty=Difficulty.HARD,
        concepts=["Cosine Similarity"],
        type=QuestionType.TECHNICAL,
        is_follow_up=False
    )
    
    candidate = CandidateContext(
        member_id="CAND-01",
        name="Test",
        job_role="Data Scientist",
        years_experience=4,
        tier=CandidateTier.EXPERT,
        strong_days=[],
        weak_days=[],
        failed_days=[],
        skipped_days=[]
    )
    
    strategy = build_question_strategy(slot, candidate)
    
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


def test_ai_client_mock():
    client = AIIntelligenceClient()
    
    strategy = build_question_strategy(
        PlannedQuestion(
            day=1, module=1, topic="Setup", difficulty=Difficulty.EASY, concepts=["Python"]
        ),
        CandidateContext(
            member_id="C-1", name="J", job_role="Intern", years_experience=0, tier=CandidateTier.NOVICE
        )
    )
    
    question_text = client.generate_question_from_strategy(strategy)
    
    # Assert the mock string properly interpolated the strategy properties
    assert "[MOCK]" in question_text
    assert "easy" in question_text
    assert "Setup" in question_text
    assert "novice Intern" in question_text
    assert "Python" in question_text
