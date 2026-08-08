"""
Purpose:
Orchestrates the AI-powered adaptive follow-up question generation.

Responsibilities:
- Fetches specific curriculum context based on the candidate's missed concepts.
- Uses prompt builders to format the payload with the previous answer and reasoning gaps.
- Requests strict JSON structure from the LLM.
- Handles poor answers and network failures gracefully (incl. fake mode).

Connected Files:
- app/schemas/question.py
- app/schemas/contract.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py
"""

import logging
from typing import Any, Dict, List

from qdrant_client import QdrantClient

from app.llm.fake_provider import FakeLLMProvider
from app.schemas.contract import CandidateContext, CurriculumContext, RetrievedChunk
from app.schemas.question import FollowUpStrategy, GeneratedQuestion
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_followup_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)


def _fake_followup(
    strategy: FollowUpStrategy,
    candidate_context: CandidateContext,
    chunks: List[RetrievedChunk],
) -> GeneratedQuestion:
    """Deterministic follow-up generation for fake LLM mode."""
    weak = strategy.weakConcepts or ["the reasoning behind your answer"]
    previous = strategy.previousAnswer.strip()
    if not previous:
        previous = "[candidate did not provide an answer]"
    elif len(previous) > 200:
        previous = previous[:200] + "..."

    question = (
        f"Let's go deeper on {', '.join(weak)}. You said: \"{previous}\". "
        "Can you walk through the specific trade-offs and show how you would "
        "apply this in a real system?"
    )

    return GeneratedQuestion(
        question=question,
        type="follow-up",
        difficulty=strategy.difficulty,
        topic=strategy.questionStrategy.topic if strategy.questionStrategy else "follow-up",
        day=strategy.day,
        expectedConcepts=weak,
        retrievedContext=chunks,
    )


def generate_followup_question(
    strategy: FollowUpStrategy,
    candidate_context: CandidateContext,
    curriculum_context: CurriculumContext,
    conversation: List[Dict[str, str]],
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> GeneratedQuestion:
    """
    Generates a probing follow-up question based on the candidate's weak previous answer.
    """
    logger.info(f"Generating follow-up for topic: {strategy.day}")

    # Ensure even empty answers are tracked so the LLM can ask them to elaborate
    previous_answer = strategy.previousAnswer
    if not previous_answer or not previous_answer.strip():
        previous_answer = "[Candidate provided no clear answer or remained silent.]"

    # 1. Prepare Semantic Search Query
    search_query = f"{strategy.questionStrategy.topic if strategy.questionStrategy else ''} " + " ".join(strategy.weakConcepts)

    # 2. Retrieve Curriculum Context
    retrieval_result = retrieve(
        query=search_query,
        llm_provider=llm_provider,
        qdrant_client=qdrant_client,
        filters={"day": strategy.day}
    )

    if retrieval_result.warnings:
        for w in retrieval_result.warnings:
            logger.warning(f"Retrieval warning in follow-up: {w}")

    # 3. Fake mode: deterministic follow-up
    if isinstance(llm_provider, FakeLLMProvider):
        return _fake_followup(strategy, candidate_context, retrieval_result.chunks)

    curriculum_string = assemble_context(retrieval_result)

    retrieved_chunks_payload = [
        {
            "title": chunk.title,
            "content": "\n".join(chunk.objectives) if chunk.objectives else chunk.title,
            "day": chunk.day,
        }
        for chunk in retrieval_result.chunks
    ]

    messages = build_followup_prompt(
        candidate_context=candidate_context.model_dump(),
        curriculum_context={"content": curriculum_string},
        retrieved_context=retrieved_chunks_payload,
        followup_strategy=strategy.model_dump(),
        conversation_history=conversation
    )

    # 4. Generate structured question with retries
    try:
        generated_question = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=GeneratedQuestion,
            max_retries=2
        )
        generated_question.day = strategy.day
        generated_question.retrievedContext = retrieval_result.chunks
        generated_question.type = "follow-up"
        return generated_question
    except Exception as e:
        logger.error(f"Structured output completely failed during follow-up: {e}")
        fallback = GeneratedQuestion.fallback()
        fallback.day = strategy.day
        fallback.type = "follow-up"
        fallback.expectedConcepts = strategy.weakConcepts
        return fallback
