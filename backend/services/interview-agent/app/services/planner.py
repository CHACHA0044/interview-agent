"""
Purpose:
Generates the deterministic interview assessment plan schedule.

Responsibilities:
- Allocates exactly 8 question slots across the prioritized curriculum days.
- Interleaves questions by module to prevent clustering of topics.
- Generates strongly typed PlannedQuestion objects to be saved into AgentState.

Connected Files:
- app/schemas/domain.py
- app/services/curriculum_selection.py

Important implementation notes:
- The algorithm guarantees at least 1 question per selected day, and distributes the rest based on priority.
- Module interleaving is performed using a round-robin pop from module-bucketed lists.
"""

from typing import List, Dict, Optional
from collections import defaultdict, deque

from app.schemas.domain import PlannedQuestion, CandidateContext, CurriculumSelection, DifficultyState, QuestionType
from app.services.curriculum_loader import CurriculumLoader


def generate_interview_plan(
    candidate: CandidateContext,
    curriculum_selection: CurriculumSelection,
    difficulty_state: DifficultyState,
    loader: CurriculumLoader
) -> List[PlannedQuestion]:
    """
    Constructs the initial deterministic interview plan consisting of 8 interleaved questions.
    """
    days = curriculum_selection.assessment_priorities
    
    if len(days) < 4:
        raise ValueError("Cannot construct a valid interview plan: CurriculumSelection has fewer than 4 distinct days.")

    # We need exactly 8 questions.
    TOTAL_QUESTIONS = 8
    
    # 1. Distribute questions across the days
    # Give 1 question to each day first
    day_counts: Dict[int, int] = {d: 1 for d in days}
    remaining_slots = TOTAL_QUESTIONS - len(days)
    
    # Distribute remaining slots heavily favoring the highest priority days (front of the list)
    priority_index = 0
    while remaining_slots > 0 and len(days) > 0:
        day_id = days[priority_index % len(days)]
        day_counts[day_id] += 1
        remaining_slots -= 1
        priority_index += 1

    # 2. Group questions by module
    module_buckets: Dict[int, deque] = defaultdict(deque)
    
    for day_id, count in day_counts.items():
        mod_id = loader.get_module_for_day(day_id)
        if mod_id is None:
            continue
            
        day_def = loader.get_day(day_id)
        if not day_def:
            continue
            
        for _ in range(count):
            pq = PlannedQuestion(
                day=day_id,
                module=mod_id,
                topic=day_def.title,
                difficulty=difficulty_state.starting_difficulty,
                concepts=day_def.tools,
                type=QuestionType.TECHNICAL,
                is_follow_up=False,
                follow_up_of=None
            )
            module_buckets[mod_id].append(pq)
            
    # 3. Interleave by module
    interleaved_plan: List[PlannedQuestion] = []
    # Sort module IDs to ensure deterministic round-robin starting with the earliest module
    sorted_modules = sorted(list(module_buckets.keys()))
    
    # Round-robin pop from modules
    while any(len(bucket) > 0 for bucket in module_buckets.values()):
        for mod_id in sorted_modules:
            if module_buckets[mod_id]:
                interleaved_plan.append(module_buckets[mod_id].popleft())

    return interleaved_plan
