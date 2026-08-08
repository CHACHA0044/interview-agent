"""
Purpose:
Provides builder functions to construct prompts for the ChatProvider.

Responsibilities:
- Isolates prompt construction from the main service logic.
- Injects dynamic data (candidate context, curriculum, history) safely into user messages.
- Prevents hardcoding of variable data directly into system prompts.

Connected Files:
- app/llm/prompts/system_interviewer.py
- app/llm/prompts/system_evaluator.py
- app/llm/prompts/system_feedback.py

Important implementation notes:
- Input parameters use `dict` and `list` types temporarily to maintain forward compatibility with Pydantic models to be defined later.
- Returns a list of dictionaries in the standard `[{"role": "...", "content": "..."}]` format required by ChatProvider.
"""

import json
from typing import Any, Dict, List

from app.llm.prompts.system_interviewer import SYSTEM_INTERVIEWER
from app.llm.prompts.system_evaluator import SYSTEM_EVALUATOR
from app.llm.prompts.system_feedback import SYSTEM_FEEDBACK


def format_json_block(data: Any) -> str:
    """Helper to cleanly format dictionaries/lists into JSON strings for prompts."""
    return json.dumps(data, indent=2)


def build_question_prompt(
    candidate_context: Dict[str, Any],
    curriculum_context: Dict[str, Any],
    retrieved_context: List[Dict[str, Any]],
    question_strategy: Dict[str, Any],
    conversation_history: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """
    Builds the prompt payload for generating a new interview question.
    """
    user_content = (
        f"CANDIDATE CONTEXT:\n{format_json_block(candidate_context)}\n\n"
        f"CURRICULUM OVERVIEW:\n{format_json_block(curriculum_context)}\n\n"
        f"RETRIEVED KNOWLEDGE FOR CURRENT TOPIC:\n{format_json_block(retrieved_context)}\n\n"
        f"QUESTION STRATEGY TO EXECUTE:\n{format_json_block(question_strategy)}\n\n"
        f"CONVERSATION HISTORY:\n{format_json_block(conversation_history)}\n\n"
        "Based on the strategy and retrieved knowledge, generate the next question."
    )

    return [
        {"role": "system", "content": SYSTEM_INTERVIEWER},
        {"role": "user", "content": user_content}
    ]


def build_followup_prompt(
    candidate_context: Dict[str, Any],
    curriculum_context: Dict[str, Any],
    retrieved_context: List[Dict[str, Any]],
    followup_strategy: Dict[str, Any],
    conversation_history: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """
    Builds the prompt payload for generating a follow-up question.
    """
    user_content = (
        f"CANDIDATE CONTEXT:\n{format_json_block(candidate_context)}\n\n"
        f"RETRIEVED KNOWLEDGE FOR CURRENT TOPIC:\n{format_json_block(retrieved_context)}\n\n"
        f"FOLLOW-UP STRATEGY TO EXECUTE:\n{format_json_block(followup_strategy)}\n\n"
        f"CONVERSATION HISTORY:\n{format_json_block(conversation_history)}\n\n"
        "Based on the follow-up strategy, probe the candidate's last answer to uncover missing concepts."
    )

    return [
        {"role": "system", "content": SYSTEM_INTERVIEWER},
        {"role": "user", "content": user_content}
    ]


def build_evaluation_prompt(
    candidate_context: Dict[str, Any],
    retrieved_context: List[Dict[str, Any]],
    question: Dict[str, Any],
    candidate_answer: str
) -> List[Dict[str, str]]:
    """
    Builds the prompt payload for evaluating a candidate's answer.
    """
    user_content = (
        f"CANDIDATE CONTEXT:\n{format_json_block(candidate_context)}\n\n"
        f"RETRIEVED KNOWLEDGE / SOURCE OF TRUTH:\n{format_json_block(retrieved_context)}\n\n"
        f"QUESTION ASKED:\n{format_json_block(question)}\n\n"
        f"CANDIDATE ANSWER:\n{candidate_answer}\n\n"
        "Evaluate the candidate's answer based on the grading rubric and output strict JSON."
    )

    return [
        {"role": "system", "content": SYSTEM_EVALUATOR},
        {"role": "user", "content": user_content}
    ]


def build_feedback_prompt(
    candidate: Dict[str, Any],
    candidate_context: Dict[str, Any],
    evaluations: List[Dict[str, Any]],
    coverage: Dict[str, float],
    missed_concepts: Dict[str, List[str]],
    topic_scores: List[Dict[str, Any]]
) -> List[Dict[str, str]]:
    """
    Builds the prompt payload for synthesizing final interview feedback.
    """
    user_content = (
        f"CANDIDATE PROFILE:\n{format_json_block(candidate)}\n\n"
        f"CANDIDATE CONTEXT:\n{format_json_block(candidate_context)}\n\n"
        f"EVALUATIONS HISTORY:\n{format_json_block(evaluations)}\n\n"
        f"CURRICULUM COVERAGE METRICS:\n{format_json_block(coverage)}\n\n"
        f"MISSED CONCEPTS BY DAY:\n{format_json_block(missed_concepts)}\n\n"
        f"TOPIC SCORES:\n{format_json_block(topic_scores)}\n\n"
        "Synthesize the final feedback JSON payload per the system instructions."
    )

    return [
        {"role": "system", "content": SYSTEM_FEEDBACK},
        {"role": "user", "content": user_content}
    ]
