"""
Purpose:
Orchestrates the AI-powered candidate answer evaluation.

Responsibilities:
- Handles short-circuiting empty answers.
- Retrieves exact factual knowledge based on expected concepts.
- Uses prompt builders and structured output to securely format and parse the evaluation.

Connected Files:
- app/schemas/ai_output.py
- app/schemas/question.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py

Important implementation notes:
- Distinct from follow-up logic. The evaluator ONLY scores and identifies gaps.
- The `question_payload` dict matches the GeneratedQuestion model structure.
"""

import logging
from typing import Dict, Any

from qdrant_client import QdrantClient

from app.schemas.ai_output import EvaluationOutput
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_evaluation_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)


def evaluate_answer(
    question_payload: Dict[str, Any],
    candidate_answer: str,
    candidate_context: Dict[str, Any],
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> EvaluationOutput:
    """
    Evaluates a candidate's answer against the rubric using LLM reasoning.
    """
    logger.info(f"Evaluating answer for question topic: {question_payload.get('topic')}")
    
    # 1. Fast-path empty answers
    if not candidate_answer or not candidate_answer.strip():
        logger.info("Candidate answer is empty. Returning deterministic 0.0 evaluation.")
        fallback_eval = EvaluationOutput.fallback()
        fallback_eval.notes = "Candidate provided an empty answer."
        fallback_eval.gaps = ["Candidate provided no answer or remained silent."]
        return fallback_eval

    # 2. Prepare Semantic Search Query
    # Target the expected concepts to pull exactly what the candidate should have said
    expected_concepts = question_payload.get("expectedConcepts", [])
    topic = question_payload.get("topic", "")
    
    search_query = f"{topic} " + " ".join(expected_concepts)
    
    # 3. Retrieve Curriculum Context
    retrieval_result = retrieve(
        query=search_query,
        llm_provider=llm_provider,
        qdrant_client=qdrant_client
    )
    
    if retrieval_result.warnings:
        for w in retrieval_result.warnings:
            logger.warning(f"Retrieval warning during evaluation: {w}")
            
    # We pass retrieved text blocks as the 'retrieved_context' parameter
    retrieved_chunks_payload = [
        {"title": chunk.metadata.get("title", ""), "content": chunk.content}
        for chunk in retrieval_result.chunks
    ]
    
    # 4. Build the prompt payload
    messages = build_evaluation_prompt(
        candidate_context=candidate_context,
        retrieved_context=retrieved_chunks_payload,
        question=question_payload,
        candidate_answer=candidate_answer
    )
    
    # 5. Generate structured output with retries
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
