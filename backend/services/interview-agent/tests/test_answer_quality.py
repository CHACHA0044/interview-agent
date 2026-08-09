"""
Purpose:
Verifies candidate answer classification and clarifying-question detection.

Connected Files:
- app/services/answer_quality.py
"""

from app.services.answer_quality import classify_answer, is_clarifying_question


def test_empty_answer():
    assert classify_answer("", ["kubernetes"]) == "empty"
    assert classify_answer("   ", ["kubernetes"]) == "empty"


def test_yes_no_answers():
    for reply in ("yes", "no", "yep", "nope", "maybe", "idk", "i don't know", "not sure"):
        assert classify_answer(reply, ["kubernetes"]) == "yes_no", reply


def test_too_short_answer():
    assert classify_answer("use indexes", ["indexes"]) == "too_short"


def test_off_topic_short_answer():
    assert classify_answer("I like pizza a lot", ["kubernetes", "containers"]) == "off_topic"


def test_off_topic_requires_short_length():
    # A long answer that misses every concept is NOT auto-flagged off-topic.
    long_answer = "I would approach this by looking at how systems behave in practice. " * 8
    assert classify_answer(long_answer, ["kubernetes", "containers"]) == "ok"


def test_valid_answer():
    assert classify_answer("kubernetes manages containers across a cluster", ["kubernetes"]) == "ok"


def test_clarifying_question_by_question_mark():
    assert is_clarifying_question("What do you mean by chunk size?")
    assert is_clarifying_question("Can you repeat that?")


def test_clarifying_question_by_phrase_without_mark():
    assert is_clarifying_question("what do you mean")
    assert is_clarifying_question("can you rephrase")


def test_long_prose_with_trailing_question_is_an_answer():
    prose = "We use horizontal scaling because it is simpler to operate, and " * 10
    assert not is_clarifying_question(prose + "right?")


def test_empty_is_not_clarifying():
    assert not is_clarifying_question("")
    assert not is_clarifying_question("   ")
