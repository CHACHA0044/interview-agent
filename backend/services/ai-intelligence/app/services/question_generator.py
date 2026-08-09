"""
Purpose:
Orchestrates the AI-powered interview question generation pipeline.

Responsibilities:
- Coordinates RAG retrieval to fetch curriculum context for the target day.
- Uses prompt builders to format the LLM payload.
- Requests structured JSON generation from the LLM.
- Produces deterministic, contract-valid questions in fake LLM mode
  (LLM_PROVIDER=fake) so the demo runs with no API keys.

Connected Files:
- app/schemas/question.py
- app/schemas/contract.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py
"""

import json
import logging
import time
from typing import Any, Dict, List

from qdrant_client import QdrantClient

from app.llm.fake_provider import FakeLLMProvider
from app.schemas.contract import CandidateContext, CurriculumContext, RetrievedChunk
from app.schemas.question import QuestionStrategy, GeneratedQuestion
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_question_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)
_AI_PREFIX = "[AI]"


def _ai_log(event: str, **fields: Any) -> None:
    payload: dict[str, Any] = {"event": event, "ts": round(time.time(), 3)}
    payload.update(fields)
    logger.info("%s %s", _AI_PREFIX, json.dumps(payload, default=str))


def _fake_question(
    strategy: QuestionStrategy,
    candidate_context: CandidateContext,
    chunks: List[RetrievedChunk],
) -> GeneratedQuestion:
    """Deterministic question generation for fake LLM mode."""
    topic = strategy.topic
    concepts = strategy.concepts or []
    difficulty = strategy.difficulty
    role = candidate_context.role or "the role"

    concept_list = ", ".join(concepts) if concepts else "the core ideas behind this topic"

    if difficulty == "hard":
        ask = (
            f"As a {role}, explain {topic}. Cover {concept_list}. "
            "Include the real-world trade-offs, failure modes, and how you would "
            "choose between approaches in production."
        )
    elif difficulty == "easy":
        ask = (
            f"As a {role}, walk through {topic} in simple terms. Make sure to touch on "
            f"{concept_list}, using a concrete example to show your understanding."
        )
    else:
        ask = (
            f"As a {role}, explain {topic}. Be specific about {concept_list}, and describe "
            "how these ideas connect to building real systems."
        )

    return GeneratedQuestion(
        question=ask,
        type="technical",
        difficulty=difficulty,
        topic=topic,
        day=strategy.day,
        expectedConcepts=concepts,
        retrievedContext=chunks,
    )


def generate_interview_question(
    strategy: QuestionStrategy,
    candidate_context: CandidateContext,
    curriculum_context: CurriculumContext,
    conversation: List[Dict[str, str]],
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> GeneratedQuestion:
    """
    Generates a technical interview question grounded in the RAG curriculum context.
    """
    provider_name = type(llm_provider).__name__
    is_fake = isinstance(llm_provider, FakeLLMProvider)

    logger.info(f"Generating question for topic: {strategy.topic} (Day {strategy.day})")

    # 1. Prepare Semantic Search Query
    search_query = f"{strategy.topic} " + " ".join(strategy.concepts)

    # 2. Retrieve Curriculum Context
    retrieval_result = retrieve(
        query=search_query,
        llm_provider=llm_provider,
        qdrant_client=qdrant_client,
        filters={"day": strategy.day}
    )

    rag_source = retrieval_result.source or ("fallback" if is_fake else "qdrant")
    _ai_log(
        "question_generation_start",
        provider=provider_name,
        is_fake=is_fake,
        topic=strategy.topic,
        day=strategy.day,
        rag_source=rag_source,
        rag_chunks=len(retrieval_result.chunks),
    )

    if retrieval_result.warnings:
        for w in retrieval_result.warnings:
            logger.warning(f"Retrieval warning: {w}")

    # 3. Fake mode: deterministic question
    if is_fake:
        _ai_log("question_generated", provider=provider_name, method="fake_deterministic", topic=strategy.topic)
        return _fake_question(strategy, candidate_context, retrieval_result.chunks)

    curriculum_string = assemble_context(retrieval_result)

    curriculum_payload = {
        "modules": [f"Module {strategy.module}"],
        "content": curriculum_string
    }

    retrieved_chunks_payload = [
        {
            "title": chunk.title,
            "content": "\n".join(chunk.objectives) if chunk.objectives else chunk.title,
            "day": chunk.day,
        }
        for chunk in retrieval_result.chunks
    ]

    # 4. Build the prompt payload
    messages = build_question_prompt(
        candidate_context=candidate_context.model_dump(),
        curriculum_context=curriculum_payload,
        retrieved_context=retrieved_chunks_payload,
        question_strategy=strategy.model_dump(),
        conversation_history=conversation
    )

    # 5. Generate structured question with retries
    try:
        generated_question = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=GeneratedQuestion,
            max_retries=2
        )
        # Ensure the day and grounding context are always populated.
        generated_question.day = strategy.day
        generated_question.retrievedContext = retrieval_result.chunks
        _ai_log("question_generated", provider=provider_name, method="llm", topic=strategy.topic, day=strategy.day)
        return generated_question
    except Exception as e:
        logger.error(f"Structured output completely failed: {e}")
        _ai_log("question_fallback", provider=provider_name, reason=str(e), topic=strategy.topic)
        return GeneratedQuestion.fallback(strategy=strategy)
