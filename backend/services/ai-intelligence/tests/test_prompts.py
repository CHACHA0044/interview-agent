"""
Purpose:
Unit tests for prompt builder functions.

Responsibilities:
- Verify that system prompts are correctly injected as the first message.
- Verify that dynamic context variables are formatted as JSON inside the user message.
- Ensure the prompt payloads match the required ChatProvider structure.

Connected Files:
- app/llm/prompts/builders.py
- app/llm/prompts/system_interviewer.py
- app/llm/prompts/system_evaluator.py
- app/llm/prompts/system_feedback.py

Important implementation notes:
- Uses mock dictionaries to verify JSON serialization into the prompt strings.
"""

import json
from app.llm.prompts.builders import (
    build_question_prompt,
    build_followup_prompt,
    build_evaluation_prompt,
    build_feedback_prompt
)
from app.llm.prompts.system_interviewer import SYSTEM_INTERVIEWER
from app.llm.prompts.system_evaluator import SYSTEM_EVALUATOR
from app.llm.prompts.system_feedback import SYSTEM_FEEDBACK


def test_build_question_prompt():
    candidate_context = {"tier": "strong"}
    curriculum = {"modules": ["RAG"]}
    retrieved = [{"title": "Embeddings"}]
    strategy = {"difficulty": "medium"}
    history = [{"role": "user", "content": "hi"}]

    messages = build_question_prompt(
        candidate_context, curriculum, retrieved, strategy, history
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == SYSTEM_INTERVIEWER
    
    user_msg = messages[1]["content"]
    assert "CANDIDATE CONTEXT:" in user_msg
    assert json.dumps(candidate_context, indent=2) in user_msg
    assert json.dumps(curriculum, indent=2) in user_msg
    assert json.dumps(retrieved, indent=2) in user_msg
    assert json.dumps(strategy, indent=2) in user_msg
    assert json.dumps(history, indent=2) in user_msg


def test_build_followup_prompt():
    candidate_context = {"tier": "strong"}
    curriculum = {"modules": ["RAG"]}
    retrieved = [{"title": "Embeddings"}]
    strategy = {"weakConcepts": ["cosine"]}
    history = [{"role": "user", "content": "answer"}]

    messages = build_followup_prompt(
        candidate_context, curriculum, retrieved, strategy, history
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == SYSTEM_INTERVIEWER
    
    user_msg = messages[1]["content"]
    assert "FOLLOW-UP STRATEGY TO EXECUTE:" in user_msg
    assert json.dumps(strategy, indent=2) in user_msg


def test_build_evaluation_prompt():
    candidate_context = {"tier": "strong"}
    retrieved = [{"title": "Embeddings"}]
    question = {"expectedConcepts": ["vector"]}
    answer = "I use vectors."

    messages = build_evaluation_prompt(
        candidate_context, retrieved, question, answer
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == SYSTEM_EVALUATOR
    
    user_msg = messages[1]["content"]
    assert "CANDIDATE ANSWER:" in user_msg
    assert "I use vectors." in user_msg
    assert json.dumps(question, indent=2) in user_msg


def test_build_feedback_prompt():
    candidate = {"name": "Sarah"}
    candidate_context = {"tier": "expert"}
    evaluations = [{"score": 8.0}]
    coverage = {"12": 0.8}
    missed_concepts = {"12": ["chunking"]}
    topic_scores = [{"module": 4, "score": 9.0}]

    messages = build_feedback_prompt(
        candidate, candidate_context, evaluations, coverage, missed_concepts, topic_scores
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[0]["content"] == SYSTEM_FEEDBACK
    
    user_msg = messages[1]["content"]
    assert "CANDIDATE PROFILE:" in user_msg
    assert json.dumps(candidate, indent=2) in user_msg
    assert json.dumps(evaluations, indent=2) in user_msg
    assert json.dumps(missed_concepts, indent=2) in user_msg
