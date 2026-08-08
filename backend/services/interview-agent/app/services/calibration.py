"""
Purpose:
Evaluates raw Candidate Profile JSON into a structured CandidateContext domain model.

Responsibilities:
- Parses the raw candidate profile input safely.
- Classifies days into strong, weak, failed, skipped based on deterministc rules.
- Computes candidate tier (expert, strong, developing, novice).
- Computes starting difficulty based on tier.

Connected Files:
- app/schemas/domain.py

Important implementation notes:
- Uses >= 3 attempts as the threshold for a "weak" day (if passed).
- Tier calculation blends years_experience, job role titles, and github signals.
- Safely handles missing optional metrics.
"""

from typing import Dict, Any, Tuple
from app.schemas.domain import CandidateContext, CandidateTier, Difficulty


def classify_mission(mission: Dict[str, Any]) -> str:
    """
    Categorizes a single mission/day based on deterministic rules.
    Returns one of: 'skipped', 'failed', 'weak', 'strong'.
    """
    if mission.get("skipped") is True:
        return "skipped"
    
    passed = mission.get("passed", False)
    if not passed:
        return "failed"
    
    attempts = mission.get("attempts") or 1
    if attempts >= 3:
        return "weak"
        
    return "strong"


def determine_tier(years: int, job_role: str, signals: Dict[str, int]) -> CandidateTier:
    """
    Calculates candidate tier based on experience and GitHub signals.
    """
    role_lower = job_role.lower()
    
    # Calculate signal strength (first try ratio)
    total_completed = signals.get("missionsCompleted") or 0
    first_try = signals.get("missionsFirstTry") or 0
    signal_ratio = (first_try / total_completed) if total_completed > 0 else 0.0

    # Role modifiers
    is_senior = any(title in role_lower for title in ["senior", "principal", "distinguished", "lead", "architect"])
    is_junior = any(title in role_lower for title in ["intern", "junior", "student"])

    # Expert check
    if (years >= 8 or is_senior) and signal_ratio >= 0.5:
        return CandidateTier.EXPERT

    # Strong check
    if (years >= 3 or is_senior) and signal_ratio >= 0.3:
        return CandidateTier.STRONG
        
    if years >= 5: # High experience but low signals
        return CandidateTier.STRONG

    # Novice check
    if (years == 0 or is_junior) and signal_ratio < 0.2:
        return CandidateTier.NOVICE

    # Developing (fallback)
    return CandidateTier.DEVELOPING


def calculate_starting_difficulty(tier: CandidateTier) -> Difficulty:
    """
    Returns the initial difficulty for the interview based on candidate tier.
    """
    if tier == CandidateTier.EXPERT:
        return Difficulty.HARD
    elif tier == CandidateTier.STRONG:
        return Difficulty.MEDIUM
    elif tier == CandidateTier.DEVELOPING:
        return Difficulty.MEDIUM
    return Difficulty.EASY


def build_candidate_context(raw_candidate: Dict[str, Any]) -> Tuple[CandidateContext, Difficulty]:
    """
    Orchestrates the analysis of the raw candidate profile into a structured CandidateContext 
    and determines the starting difficulty.
    
    Args:
        raw_candidate: The dictionary representation of a candidate from candidates.json
        
    Returns:
        A tuple of (CandidateContext, starting Difficulty)
    """
    member = raw_candidate.get("member", {})
    missions = raw_candidate.get("missions", [])
    signals = raw_candidate.get("signals", {})
    
    member_id = member.get("id", "UNKNOWN")
    name = member.get("name", "Unknown Candidate")
    job_role = member.get("jobRole", "Unknown Role")
    years_experience = member.get("yearsExperience", 0)
    
    strong_days = []
    weak_days = []
    failed_days = []
    skipped_days = []
    
    for mission in missions:
        day_num = mission.get("day")
        if day_num is None:
            continue
            
        classification = classify_mission(mission)
        if classification == "skipped":
            skipped_days.append(day_num)
        elif classification == "failed":
            failed_days.append(day_num)
        elif classification == "weak":
            weak_days.append(day_num)
        else:
            strong_days.append(day_num)
            
    tier = determine_tier(years=years_experience, job_role=job_role, signals=signals)
    difficulty = calculate_starting_difficulty(tier)
    
    context = CandidateContext(
        member_id=member_id,
        name=name,
        job_role=job_role,
        years_experience=years_experience,
        tier=tier,
        strong_days=strong_days,
        weak_days=weak_days,
        failed_days=failed_days,
        skipped_days=skipped_days
    )
    
    return context, difficulty
