"""
Purpose:
Qualitative classification of candidate answers that drives interview quality.

Responsibilities:
- Classifies an answer into one of: ok / empty / too_short / yes_no / off_topic.
- Detects candidate clarifying questions that must NOT consume a question slot
  or follow-up budget (the orchestrator answers them and re-asks).

Connected Files:
- app/services/orchestrator.py
- app/services/decision_engine.py
"""

import re
from typing import List

YES_NO_EVASIONS = {
    "yes",
    "y",
    "yep",
    "yeah",
    "yup",
    "yess",
    "no",
    "n",
    "nope",
    "nah",
    "nop",
    "maybe",
    "idk",
    "dont know",
    "don't know",
    "dunno",
    "not sure",
    "no idea",
    "no clue",
    "pass",
    "i pass",
    "skip",
    "skip this",
    "i'll pass",
    "i will pass",
}

EVASION_PHRASES = (
    "i don't know",
    "i dont know",
    "i do not know",
    "not sure",
    "no idea",
    "no clue",
    "dunno",
    "i have no idea",
    "can't answer",
    "cannot answer",
)

CLARIFYING_PHRASES = (
    "what do you mean",
    "what does that mean",
    "what is the question",
    "can you clarify",
    "could you clarify",
    "can you repeat",
    "could you repeat",
    "repeat the question",
    "rephrase",
    "please repeat",
    "say that again",
    "come again",
    "ask again",
    "what exactly",
    "i don't understand the question",
    "i dont understand the question",
    "can you explain the question",
    "can you rephrase",
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", text.lower())).strip()


def classify_answer(answer: str, concepts: List[str]) -> str:
    """Classify a candidate answer into a quality kind.

    Returns one of "ok", "empty", "too_short", "yes_no", "off_topic".
    """
    text = (answer or "").strip()
    if not text:
        return "empty"

    normalized = _normalize(text)
    if normalized in YES_NO_EVASIONS:
        return "yes_no"

    words = text.split()
    if len(words) < 3:
        return "too_short"

    lowered = text.lower()
    if any(phrase in lowered for phrase in EVASION_PHRASES):
        return "yes_no"

    if concepts:
        matched = any(concept.lower() in lowered for concept in concepts)
        if not matched and len(words) <= 15:
            return "off_topic"

    return "ok"


def is_clarifying_question(message: str) -> bool:
    """Detect a candidate asking the interviewer a clarifying question.

    These must not be graded: the orchestrator answers them and re-asks the
    original question without consuming a slot or follow-up budget.
    """
    text = (message or "").strip()
    if not text:
        return False
    # Prose longer than this is treated as an answer, even with a trailing '?'.
    if len(text) > 200:
        return False
    lowered = text.lower()
    if any(phrase in lowered for phrase in CLARIFYING_PHRASES):
        return True
    return text.endswith("?")
