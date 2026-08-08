"""
Purpose:
Adapts the interview difficulty up or down based on candidate performance.

Responsibilities:
- Increments or resets rolling score counters.
- Triggers a difficulty tier change (EASY <-> MEDIUM <-> HARD) on consecutive scores.
- Restricts difficulty within valid enum boundaries.

Connected Files:
- app/schemas/domain.py
"""

from app.schemas.domain import DifficultyState, Difficulty


# Map Difficulty enum to integer for easier bounding
_DIFFICULTY_ORDER = {
    Difficulty.EASY: 1,
    Difficulty.MEDIUM: 2,
    Difficulty.HARD: 3
}

_REVERSE_DIFFICULTY = {
    1: Difficulty.EASY,
    2: Difficulty.MEDIUM,
    3: Difficulty.HARD
}


def adapt_difficulty(state: DifficultyState, latest_score: float) -> DifficultyState:
    """
    Evaluates the latest answer score and deterministically steps the difficulty 
    up or down, updating the tracking counters in the state.
    """
    
    # 1. Update Momentum Counters
    if latest_score >= 8.0:
        state.consecutive_high_scores += 1
        state.consecutive_low_scores = 0
    elif latest_score < 5.0:
        state.consecutive_low_scores += 1
        state.consecutive_high_scores = 0
    else:
        # Middle scores (5.0 <= score < 8.0) break both streaks
        state.consecutive_high_scores = 0
        state.consecutive_low_scores = 0
        
    # 2. Evaluate Step
    current_level = _DIFFICULTY_ORDER[state.current_difficulty]
    level_changed = False
    
    if state.consecutive_high_scores >= 2:
        current_level += 1
        level_changed = True
    elif state.consecutive_low_scores >= 2:
        current_level -= 1
        level_changed = True
        
    # 3. Clamp Boundaries
    current_level = max(1, min(3, current_level))
    
    # 4. Apply Changes
    if level_changed:
        state.current_difficulty = _REVERSE_DIFFICULTY[current_level]
        # Reset counters after a successful tier change so they have to earn the next step again.
        state.consecutive_high_scores = 0
        state.consecutive_low_scores = 0
        
    return state
