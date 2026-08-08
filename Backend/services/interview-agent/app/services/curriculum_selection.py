"""
Purpose:
Selects the curriculum days and modules to be assessed based on candidate context.

Responsibilities:
- Prioritizes assessment days (Failed -> Skipped -> Weak -> Strong).
- Cross-references job roles to extract keyword relevance for strong days.
- Extracts `relevant_concepts` (tools and keywords) from selected days.
- Maps selected days to their parent modules.

Connected Files:
- app/schemas/domain.py
- app/services/curriculum_loader.py
"""

from typing import List, Dict, Set
from app.schemas.domain import CandidateContext, CurriculumSelection
from app.services.curriculum_loader import CurriculumLoader, CurriculumDayDef


def extract_role_keywords(job_role: str) -> List[str]:
    """Extracts lowercase keywords from the job role to match against curriculum."""
    # Basic tokenization
    tokens = job_role.lower().replace("-", " ").split()
    # Remove generic filler words
    stop_words = {"senior", "junior", "principal", "lead", "engineer", "developer", "manager", "intern", "student"}
    keywords = [t for t in tokens if t not in stop_words and len(t) > 2]
    return keywords


def score_day_relevance(day_def: CurriculumDayDef, keywords: List[str]) -> int:
    """Scores a day based on how many job role keywords appear in its title or objectives."""
    if not keywords:
        return 0
        
    score = 0
    text_corpus = day_def.title.lower() + " " + " ".join([obj.lower() for obj in day_def.objectives])
    
    for kw in keywords:
        score += text_corpus.count(kw)
            
    return score


def build_assessment_plan(candidate: CandidateContext, loader: CurriculumLoader) -> CurriculumSelection:
    """
    Constructs the optimized CurriculumSelection for the interview assessment.
    
    Priority:
    1. Failed days (All)
    2. Skipped days (All)
    3. Weak days (All)
    4. Strong days (Max 2, prioritized by role relevance)
    """
    assessment_priorities: List[int] = []
    
    # 1. Add all Failed days
    for d in candidate.failed_days:
        if d not in assessment_priorities and loader.get_day(d):
            assessment_priorities.append(d)
            
    # 2. Add all Skipped days
    for d in candidate.skipped_days:
        if d not in assessment_priorities and loader.get_day(d):
            assessment_priorities.append(d)
            
    # 3. Add all Weak days
    for d in candidate.weak_days:
        if d not in assessment_priorities and loader.get_day(d):
            assessment_priorities.append(d)
            
    # 4. Add top 2 Strong days based on role match
    if candidate.strong_days:
        role_kws = extract_role_keywords(candidate.job_role)
        
        # Score each strong day
        scored_strong_days = []
        for d in candidate.strong_days:
            day_def = loader.get_day(d)
            if day_def and d not in assessment_priorities:
                score = score_day_relevance(day_def, role_kws)
                scored_strong_days.append((score, d))
                
        # Sort by score descending, then by day id descending (to prefer later/harder days if tied)
        scored_strong_days.sort(key=lambda x: (x[0], x[1]), reverse=True)
        
        # We want to pull at least 2 strong days, but if we are still under the 4-day minimum, we must pull more.
        current_len = len(assessment_priorities)
        needed_for_minimum = 4 - current_len
        take_count = max(2, needed_for_minimum)
        
        for _, d in scored_strong_days[:take_count]:
            assessment_priorities.append(d)
            
    # Fallback: if we STILL have < 4 days (e.g., candidate only attempted 2 days total),
    # we must pull from the general curriculum to satisfy the hard constraint.
    if len(assessment_priorities) < 4:
        all_days = sorted(list(loader.day_map.keys()))
        for d in all_days:
            if d not in assessment_priorities:
                assessment_priorities.append(d)
                if len(assessment_priorities) >= 4:
                    break

    # Now construct the final properties
    selected_modules: Set[int] = set()
    day_types: Dict[int, str] = {}
    relevant_concepts_set: Set[str] = set()
    
    for d in assessment_priorities:
        day_def = loader.get_day(d)
        if day_def:
            # Map type
            day_types[d] = day_def.type
            
            # Map module
            mod_id = loader.get_module_for_day(d)
            if mod_id is not None:
                selected_modules.add(mod_id)
                
            # Map concepts (tools)
            for tool in day_def.tools:
                relevant_concepts_set.add(tool)

    return CurriculumSelection(
        selected_modules=sorted(list(selected_modules)),
        selected_days=assessment_priorities,  # Keeping priority order
        day_types=day_types,
        assessment_priorities=assessment_priorities,
        relevant_concepts=sorted(list(relevant_concepts_set))
    )
