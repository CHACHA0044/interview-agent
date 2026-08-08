"""
Purpose:
Verifies the adaptive difficulty logic perfectly matches Section 9.4 boundaries.

Responsibilities:
- Asserts stepping logic (up and down).
- Asserts momentum clearing.
- Asserts boundary clamping (Easy doesn't drop below Easy).

Connected Files:
- app/services/difficulty_adapter.py
"""

from app.schemas.domain import DifficultyState, Difficulty
from app.services.difficulty_adapter import adapt_difficulty


def test_adapt_difficulty_step_up():
    state = DifficultyState(current_difficulty=Difficulty.EASY, starting_difficulty=Difficulty.EASY)
    
    # First 8.0 -> counters increment but no step up yet
    state = adapt_difficulty(state, 8.5)
    assert state.consecutive_high_scores == 1
    assert state.current_difficulty == Difficulty.EASY
    
    # Second 8.0 -> step up!
    state = adapt_difficulty(state, 9.0)
    assert state.current_difficulty == Difficulty.MEDIUM
    assert state.consecutive_high_scores == 0  # Counter resets


def test_adapt_difficulty_step_down():
    state = DifficultyState(current_difficulty=Difficulty.HARD, starting_difficulty=Difficulty.HARD)
    
    state = adapt_difficulty(state, 4.0)
    assert state.consecutive_low_scores == 1
    
    state = adapt_difficulty(state, 2.5)
    assert state.current_difficulty == Difficulty.MEDIUM
    assert state.consecutive_low_scores == 0


def test_adapt_difficulty_momentum_clear():
    state = DifficultyState(current_difficulty=Difficulty.MEDIUM, starting_difficulty=Difficulty.MEDIUM)
    
    # Gets one high score
    state = adapt_difficulty(state, 9.0)
    assert state.consecutive_high_scores == 1
    
    # Next score is a 6.0 (middle tier). Must wipe momentum.
    state = adapt_difficulty(state, 6.0)
    assert state.consecutive_high_scores == 0
    assert state.consecutive_low_scores == 0
    assert state.current_difficulty == Difficulty.MEDIUM


def test_adapt_difficulty_max_boundary():
    state = DifficultyState(current_difficulty=Difficulty.HARD, starting_difficulty=Difficulty.HARD)
    
    # Two consecutive 10s should try to step up, but it clamps at HARD.
    state = adapt_difficulty(state, 10.0)
    state = adapt_difficulty(state, 10.0)
    
    assert state.current_difficulty == Difficulty.HARD
    assert state.consecutive_high_scores == 0  # Still resets after a "virtual" step


def test_adapt_difficulty_min_boundary():
    state = DifficultyState(current_difficulty=Difficulty.EASY, starting_difficulty=Difficulty.EASY)
    
    state = adapt_difficulty(state, 2.0)
    state = adapt_difficulty(state, 2.0)
    
    assert state.current_difficulty == Difficulty.EASY
    assert state.consecutive_low_scores == 0
