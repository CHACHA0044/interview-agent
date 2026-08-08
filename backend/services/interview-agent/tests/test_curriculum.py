"""
Purpose:
Verifies the Curriculum Selection logic and deterministic prioritizing of assessment days.

Responsibilities:
- Asserts that days are ordered correctly (Failed -> Skipped -> Weak -> Strong).
- Asserts that role keywords correctly prioritize strong days.
- Asserts concepts and module mappings are populated correctly.

Connected Files:
- app/services/curriculum_selection.py
- app/services/curriculum_loader.py
"""

import pytest
from unittest.mock import Mock

from app.schemas.domain import CandidateContext, CandidateTier
from app.services.curriculum_loader import CurriculumLoader, CurriculumDayDef
from app.services.curriculum_selection import extract_role_keywords, score_day_relevance, build_assessment_plan


def test_extract_role_keywords():
    assert set(extract_role_keywords("Senior Data Engineer")) == {"data"}
    assert set(extract_role_keywords("Machine Learning Intern")) == {"machine", "learning"}
    assert set(extract_role_keywords("Backend Developer")) == {"backend"}


def test_score_day_relevance():
    day = CurriculumDayDef(
        day=5,
        title="Vector Databases and Data Search",
        type="THEORY",
        tools=["Qdrant"],
        objectives=["Learn how to search data"]
    )
    
    # "data" appears 3 times in the corpus (Databases, Data, data)
    assert score_day_relevance(day, ["data"]) == 3
    assert score_day_relevance(day, ["backend"]) == 0


def test_build_assessment_plan_priority():
    # Setup mock loader
    mock_loader = Mock(spec=CurriculumLoader)
    
    # Let's mock a simple curriculum:
    # Day 1: Failed
    # Day 2: Skipped
    # Day 3: Weak
    # Day 4: Strong (Role relevant)
    # Day 5: Strong (Not relevant)
    # Day 6: Strong (Not relevant)
    
    def mock_get_day(day_id: int):
        days = {
            1: CurriculumDayDef(day=1, title="Intro", type="SETUP", tools=["Python"]),
            2: CurriculumDayDef(day=2, title="API", type="BUILD", tools=["FastAPI"]),
            3: CurriculumDayDef(day=3, title="Database", type="BUILD", tools=["SQL"]),
            4: CurriculumDayDef(day=4, title="Data Pipelines", type="THEORY", tools=["Airflow"]),
            5: CurriculumDayDef(day=5, title="CSS", type="BUILD", tools=["Tailwind"]),
            6: CurriculumDayDef(day=6, title="HTML", type="BUILD", tools=["HTML5"]),
        }
        return days.get(day_id)
        
    def mock_get_module(day_id: int):
        return 1 if day_id <= 3 else 2
        
    mock_loader.get_day.side_effect = mock_get_day
    mock_loader.get_module_for_day.side_effect = mock_get_module
    
    # Candidate Context
    candidate = CandidateContext(
        member_id="CAND-01",
        name="Test",
        job_role="Data Engineer",
        years_experience=5,
        tier=CandidateTier.STRONG,
        failed_days=[1],
        skipped_days=[2],
        weak_days=[3],
        strong_days=[4, 5, 6]
    )
    
    plan = build_assessment_plan(candidate, mock_loader)
    
    # 1 Failed + 1 Skipped + 1 Weak + Max 2 Strong = 5 days total
    assert len(plan.assessment_priorities) == 5
    
    # Priority order must be exactly: 1 (Failed) -> 2 (Skipped) -> 3 (Weak) -> 4 (Role matched) -> 6 (Tied fallback selects highest ID)
    assert plan.assessment_priorities == [1, 2, 3, 4, 6]
    assert plan.selected_days == [1, 2, 3, 4, 6]
    
    # Ensure modules were mapped uniquely and sorted
    assert plan.selected_modules == [1, 2]
    
    # Ensure day types are mapped
    assert plan.day_types[1] == "SETUP"
    assert plan.day_types[4] == "THEORY"
    
    # Ensure concepts extracted and deduplicated/sorted
    assert set(plan.relevant_concepts) == {"Python", "FastAPI", "SQL", "Airflow", "HTML5"}


def test_build_assessment_plan_empty():
    mock_loader = Mock(spec=CurriculumLoader)
    mock_loader.day_map = {1: None, 2: None, 3: None, 4: None}
    candidate = CandidateContext(
        member_id="CAND-02",
        name="Test 2",
        job_role="Unknown",
        years_experience=0,
        tier=CandidateTier.NOVICE,
        failed_days=[],
        skipped_days=[],
        weak_days=[],
        strong_days=[]
    )
    
    # Mock get_day so the fallback can successfully iterate tools
    def mock_get_day(d):
        return CurriculumDayDef(day=d, title=f"Day {d}", type="BUILD", tools=[])
    mock_loader.get_day.side_effect = mock_get_day
    mock_loader.get_module_for_day.return_value = 1
    
    plan = build_assessment_plan(candidate, mock_loader)
    
    # Fallback should force exactly 4 days
    assert plan.assessment_priorities == [1, 2, 3, 4]
    assert plan.selected_days == [1, 2, 3, 4]
    assert plan.relevant_concepts == []
