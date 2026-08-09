"""
Purpose:
Server-side content moderation for candidate answers.

Responsibilities:
- Flags abusive, profane, or otherwise inappropriate candidate input.
- Returns a human-readable reason when a message violates policy, so the
  interview can be terminated with a clear, deterministic audit trail.

Connected Files:
- app/services/orchestrator.py
"""

import re
from typing import Optional

# Profanity / slurs / abuse terms matched as whole words against lowercased input.
_MODERATION_TERMS = {
    "profanity": [
        "fuck",
        "fck",
        "fuk",
        "shit",
        "bitch",
        "asshole",
        "bastard",
        "dick",
        "cock",
        "cunt",
        "piss",
        "wanker",
        "motherfucker",
    ],
    "slurs": [
        "nigger",
        "nigga",
        "faggot",
        "tranny",
        "retard",
        "kike",
        "spic",
        "chink",
    ],
    "abuse": [
        "idiot",
        "moron",
        "stupid",
        "worthless",
        "scum",
        "loser",
        "suck my",
        "kill yourself",
        "kys",
        "shut up",
        "shutup",
    ],
}


def moderation_triggered(text: str) -> Optional[str]:
    """Return a human-readable reason when `text` violates content policy.

    Returns None when the input is clean (or empty). Matching is case-
    insensitive and word-boundary aware so "classic" is not flagged by
    "ass", while inflections like "fucking"/"bitches" still match their root.
    """
    lowered = (text or "").lower()
    if not lowered.strip():
        return None
    for category, terms in _MODERATION_TERMS.items():
        for term in terms:
            # \b term [optional trailing letters] \b  -> catches plurals/inflections.
            if re.search(rf"\b{re.escape(term)}[a-z]*\b", lowered):
                return f"{category}: '{term}'"
    return None
