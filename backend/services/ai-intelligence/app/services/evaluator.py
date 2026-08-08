"""
Purpose:
Orchestrates the AI-powered candidate answer evaluation.

Responsibilities:
- Handles short-circuiting empty answers.
- Retrieves exact factual knowledge based on expected concepts.
- Produces deterministic, contract-valid evaluations in fake LLM mode.
- Uses prompt builders and structured output to securely format and parse the evaluation.

Connected Files:
- app/schemas/ai_output.py
- app/schemas/question.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py
"""

import logging
from typing import Any, Dict

from qdrant_client import QdrantClient

from app.llm.fake_provider import FakeLLMProvider
from app.schemas.ai_output import EvaluationOutput
from app.schemas.contract import CandidateContext
from app.schemas.question import GeneratedQuestion
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_evaluation_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)


def _fake_evaluation(
    question: GeneratedQuestion,
    candidate_answer: str,
    candidate_context: CandidateContext,
) -> EvaluationOutput:
    """Deterministic heuristic evaluation for fake LLM mode."""
    answer_lower = candidate_answer.lower()
    words = candidate_answer.split()
    expected_concepts = question.expectedConcepts or []

    if not expected_concepts:
        concept_coverage = min(1.0, len(words) / 60)
    else:
        matched = [c for c in expected_concepts if c.lower() in answer_lower]
        concept_coverage = len(matched) / len(expected_concepts)

    depth = min(1.0, len(words) / 90)
    technical_accuracy = min(1.0, concept_coverage + 0.2)

    score = round(10 * (0.5 * concept_coverage + 0.3 * depth + 0.2 * min(1.0, len(words) / 40)), 1)
    score = min(10.0, max(0.0, score))

    matched_concepts = [c for c in expected_concepts if c.lower() in answer_lower]
    gaps = [c for c in expected_concepts if c.lower() not in answer_lower]

    strengths = [
        f"Covered concept: {c}" for c in matched_concepts[:3]
    ] or (["The answer is on topic and shows effort."] if words else [])

    gaps = gaps or ["Could go deeper on the technical details."]

    return EvaluationOutput(
        score=score,
        conceptCoverage=round(concept_coverage, 2),
        technicalAccuracy=round(technical_accuracy, 2),
        depth=round(depth, 2),
        strengths=strengths,
        gaps=gaps,
        followUpRequired=score < 6.0,
        notes="Deterministic evaluation (fake LLM mode)."
    )


def evaluate_answer(
    question_payload: GeneratedQuestion,
    candidate_answer: str,
    candidate_context: CandidateContext,
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> EvaluationOutput:
    """
    Evaluates a candidate's answer against the rubric using LLM reasoning.
    """
    logger.info(f"Evaluating answer for question topic: {question_payload.topic}")

    # 1. Fast-path empty answers
    if not candidate_answer or not candidate_answer.strip():
        logger.info("Candidate answer is empty. Returning deterministic 0.0 evaluation.")
        fallback_eval = EvaluationOutput.fallback()
        fallback_eval.notes = "Candidate provided an empty answer."
        fallback_eval.gaps = ["Candidate provided no answer or remained silent."]
        return fallback_eval

    # 2. Fake mode: deterministic heuristic evaluation
    if isinstance(llm_provider, FakeLLMProvider):
        return _fake_evaluation(question_payload, candidate_answer, candidate_context)

    # 3. Prepare Semantic Search Query
    expected_concepts = question_payload.expectedConcepts or []
    topic = question_payload.topic or ""

    search_query = f"{topic} " + " ".join(expected_concepts)

    # 4. Retrieve Curriculum Context
    retrieval_result = retrieve(
        query=search_query,
        llm_provider=llm_provider,
        qdrant_client=qdrant_client
    )

    if retrieval_result.warnings:
        for w in retrieval_result.warnings:
            logger.warning(f"Retrieval warning during evaluation: {w}")

    retrieved_chunks_payload = [
        {
            "title": chunk.title,
            "content": "\n".join(chunk.objectives) if chunk.objectives else chunk.title,
            "day": chunk.day,
        }
        for chunk in retrieval_result.chunks
    ]

    # 5. Build the prompt payload
    messages = build_evaluation_prompt(
        candidate_context=candidate_context.model_dump(),
        retrieved_context=retrieved_chunks_payload,
        question=question_payload.model_dump(exclude={"retrievedContext"}),
        candidate_answer=candidate_answer
    )

    # 6. Generate structured output with retries
    try:
        evaluation = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=EvaluationOutput,
            max_retries=2
        )
        return evaluation
    except Exception as e:
        logger.error(f"Structured output completely failed during evaluation: {e}")
        return EvaluationOutput.fallback()
