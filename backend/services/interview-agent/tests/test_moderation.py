"""
Purpose:
Verifies the server-side content moderation gate.

Connected Files:
- app/services/moderation.py
"""

from app.services.moderation import moderation_triggered


def test_clean_input_not_flagged():
    assert moderation_triggered("I would use a load balancer for this.") is None
    assert moderation_triggered("") is None
    assert moderation_triggered("   ") is None


def test_profanity_flagged():
    assert moderation_triggered("this is fucking hard") is not None


def test_abuse_flagged():
    assert moderation_triggered("you are a stupid idiot") is not None


def test_word_boundary_prevents_false_positive():
    # "classic" must not trip the "ass" family; only whole-word matches count.
    assert moderation_triggered("classic distributed systems") is None


def test_reason_is_identifiable():
    reason = moderation_triggered("fuck this")
    assert reason is not None
    assert "profanity" in reason
