"""
Purpose:
Verifies the deterministic candidate calibration logic.

Responsibilities:
- Asserts that days are properly bucketed into strong/weak/failed/skipped.
- Asserts that the tiered scoring mechanism assigns the right CandidateTier.
- Asserts starting difficulty is correctly mapped.
- Ensures robustness against missing or empty candidate data.

Connected Files:
- app/services/calibration.py
"""

from app.services.calibration import (
    classify_mission,
    determine_tier,
    calculate_starting_difficulty,
    build_candidate_context
)
from app.schemas.domain import CandidateTier, Difficulty


def test_classify_mission():
    assert classify_mission({"skipped": True, "passed": True, "attempts": 1}) == "skipped"
    assert classify_mission({"passed": False, "attempts": 5}) == "failed"
    assert classify_mission({"passed": True, "attempts": 1}) == "strong"
    assert classify_mission({"passed": True, "attempts": 2}) == "strong"
    assert classify_mission({"passed": True, "attempts": 3}) == "weak"
    assert classify_mission({"passed": True, "attempts": 5}) == "weak"
    assert classify_mission({}) == "failed"  # Missing 'passed' defaults to false


def test_determine_tier():
    # Expert: High experience, High signals
    assert determine_tier(10, "Software Engineer", {"missionsCompleted": 30, "missionsFirstTry": 25}) == CandidateTier.EXPERT
    
    # Expert: Borderline experience, Senior title, High signals
    assert determine_tier(5, "Senior Developer", {"missionsCompleted": 30, "missionsFirstTry": 18}) == CandidateTier.EXPERT
    
    # Strong: Moderate experience, Moderate signals
    assert determine_tier(4, "Backend Dev", {"missionsCompleted": 30, "missionsFirstTry": 10}) == CandidateTier.STRONG
    
    # Strong: High experience, Poor signals
    assert determine_tier(15, "Manager", {"missionsCompleted": 20, "missionsFirstTry": 2}) == CandidateTier.STRONG
    
    # Novice: Zero experience, Poor signals
    assert determine_tier(0, "Intern", {"missionsCompleted": 20, "missionsFirstTry": 1}) == CandidateTier.NOVICE
    
    # Developing: Low experience, average signals
    assert determine_tier(2, "Junior Dev", {"missionsCompleted": 20, "missionsFirstTry": 5}) == CandidateTier.DEVELOPING
    
    # Developing: Zero experience, high signals (prevents being novice)
    assert determine_tier(0, "Student", {"missionsCompleted": 30, "missionsFirstTry": 15}) == CandidateTier.DEVELOPING


def test_calculate_starting_difficulty():
    assert calculate_starting_difficulty(CandidateTier.EXPERT) == Difficulty.HARD
    assert calculate_starting_difficulty(CandidateTier.STRONG) == Difficulty.MEDIUM
    assert calculate_starting_difficulty(CandidateTier.DEVELOPING) == Difficulty.MEDIUM
    assert calculate_starting_difficulty(CandidateTier.NOVICE) == Difficulty.EASY


def test_build_candidate_context_integration():
    raw_candidate = {
        "member": {
            "id": "CAND-999",
            "name": "Alice Edgecase",
            "jobRole": "Principal Architect",
            "yearsExperience": 12
        },
        "missions": [
            {"day": 1, "passed": True, "attempts": 1},
            {"day": 2, "passed": True, "attempts": 3},
            {"day": 3, "passed": False, "attempts": 4},
            {"day": 4, "skipped": True}
        ],
        "signals": {
            "missionsCompleted": 30,
            "missionsFirstTry": 28
        }
    }
    
    context, diff = build_candidate_context(raw_candidate)
    
    assert context.member_id == "CAND-999"
    assert context.tier == CandidateTier.EXPERT
    assert diff == Difficulty.HARD
    
    assert context.strong_days == [1]
    assert context.weak_days == [2]
    assert context.failed_days == [3]
    assert context.skipped_days == [4]


def test_build_candidate_context_missing_data():
    raw_candidate = {}  # Completely empty payload
    context, diff = build_candidate_context(raw_candidate)
    
    assert context.member_id == "UNKNOWN"
    assert context.tier == CandidateTier.NOVICE  # 0 years, 0 signals
    assert diff == Difficulty.EASY
    assert context.strong_days == []
    assert context.weak_days == []
    assert context.failed_days == []
    assert context.skipped_days == []
