"""
Purpose:
Verifies the interview planning logic.

Responsibilities:
- Asserts that exactly 8 questions are generated.
- Asserts that at least 4 distinct days are used.
- Verifies module interleaving.
- Verifies validation errors are triggered on impossible constraints.

Connected Files:
- app/services/planner.py
- app/services/curriculum_selection.py
"""

import pytest
from unittest.mock import Mock

from app.schemas.domain import CandidateContext, CurriculumSelection, DifficultyState, CandidateTier, Difficulty
from app.services.curriculum_loader import CurriculumLoader, CurriculumDayDef
from app.services.planner import generate_interview_plan


def test_generate_interview_plan_success():
    mock_loader = Mock(spec=CurriculumLoader)
    
    # Days 1, 2, 3 in Module 1. Days 4, 5 in Module 2.
    def mock_get_day(day_id: int):
        return CurriculumDayDef(
            day=day_id,
            title=f"Day {day_id}",
            type="BUILD",
            tools=["Python"],
            objectives=["Learn"]
        )
        
    def mock_get_module(day_id: int):
        return 1 if day_id <= 3 else 2
        
    mock_loader.get_day.side_effect = mock_get_day
    mock_loader.get_module_for_day.side_effect = mock_get_module
    
    candidate = CandidateContext(
        member_id="CAND-01",
        name="Test",
        job_role="Dev",
        years_experience=2,
        tier=CandidateTier.DEVELOPING,
        failed_days=[1],
        skipped_days=[2],
        weak_days=[3],
        strong_days=[4]
    )
    
    selection = CurriculumSelection(
        selected_modules=[1, 2],
        selected_days=[1, 2, 3, 4],
        day_types={1: "BUILD", 2: "BUILD", 3: "BUILD", 4: "BUILD"},
        assessment_priorities=[1, 2, 3, 4],
        relevant_concepts=["Python"]
    )
    
    difficulty_state = DifficultyState(
        current_difficulty=Difficulty.MEDIUM,
        starting_difficulty=Difficulty.MEDIUM,
        rolling_average_score=0.0
    )
    
    plan = generate_interview_plan(candidate, selection, difficulty_state, mock_loader)
    
    assert len(plan) == 8
    
    # Verify 4 distinct days are present
    days_in_plan = {q.day for q in plan}
    assert len(days_in_plan) == 4
    
    # Verify module interleaving
    # With day counts: D1=2, D2=2, D3=2, D4=2
    # Mod 1 gets D1, D2, D3 (6 questions). Mod 2 gets D4 (2 questions)
    # The pop order should alternate until Mod 2 is exhausted.
    
    modules_in_order = [q.module for q in plan]
    
    # It should look something like: 1, 2, 1, 2, 1, 1, 1, 1
    assert modules_in_order[0] == 1
    assert modules_in_order[1] == 2
    assert modules_in_order[2] == 1
    assert modules_in_order[3] == 2
    # Module 2 is empty, rest are module 1
    assert all(m == 1 for m in modules_in_order[4:])


def test_generate_interview_plan_validation_error():
    mock_loader = Mock(spec=CurriculumLoader)
    candidate = CandidateContext(
        member_id="CAND-01", name="Test", job_role="Dev", years_experience=2, tier=CandidateTier.DEVELOPING
    )
    
    # Invalid selection: < 4 days
    selection = CurriculumSelection(
        assessment_priorities=[1, 2, 3]
    )
    difficulty_state = DifficultyState(current_difficulty=Difficulty.MEDIUM, starting_difficulty=Difficulty.MEDIUM)
    
    with pytest.raises(ValueError) as exc_info:
        generate_interview_plan(candidate, selection, difficulty_state, mock_loader)
        
    assert "fewer than 4 distinct days" in str(exc_info.value)
