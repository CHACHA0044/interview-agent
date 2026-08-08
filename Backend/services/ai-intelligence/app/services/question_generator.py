"""
Purpose:
Orchestrates the AI-powered interview question generation pipeline.

Responsibilities:
- Coordinates RAG retrieval to fetch curriculum context for the target day.
- Uses prompt builders to format the LLM payload.
- Requests structured JSON generation from the LLM.
- Handles empty contexts and complete LLM failures gracefully.

Connected Files:
- app/schemas/question.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py

Important implementation notes:
- Requires a configured LLM provider and Qdrant client from the caller.
- Uses the deterministic GeneratedQuestion.fallback() on critical failure.
"""

import logging
from typing import Dict, Any, List

from qdrant_client import QdrantClient

from app.schemas.question import QuestionStrategy, GeneratedQuestion
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_question_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)


def generate_interview_question(
    strategy: QuestionStrategy,
    candidate_context: Dict[str, Any],
    conversation_history: List[Dict[str, str]],
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> GeneratedQuestion:
    """
    Generates a technical interview question grounded in the RAG curriculum context.
    """
    logger.info(f"Generating question for topic: {strategy.topic} (Day {strategy.day})")
    
    # 1. Prepare Semantic Search Query
    # Use topic and concepts for maximum semantic relevance
    search_query = f"{strategy.topic} " + " ".join(strategy.concepts)
    
    # 2. Retrieve Curriculum Context
    retrieval_result = retrieve(
        query=search_query,
        llm_provider=llm_provider,
        qdrant_client=qdrant_client,
        filters={"day": strategy.day}
    )
    
    if retrieval_result.warnings:
        for w in retrieval_result.warnings:
            logger.warning(f"Retrieval warning: {w}")
            
    # Assemble curriculum chunks into a string format
    curriculum_string = assemble_context(retrieval_result)
    
    # Pack the curriculum payload matching the expected prompt format
    curriculum_payload = {
        "modules": [f"Module {strategy.module}"],
        "content": curriculum_string
    }
    
    # We pass retrieved text blocks as the 'retrieved_context' parameter
    # The prompt builder expects a list of dictionaries if it's raw chunks, or we can just pass the string.
    # Looking at builders.py from Task 2:
    # it expects `retrieved: List[Dict[str, Any]]` or similar. Let's pass the raw chunks.
    retrieved_chunks_payload = [
        {"title": chunk.metadata.get("title", ""), "content": chunk.content}
        for chunk in retrieval_result.chunks
    ]
    
    # 3. Build the prompt payload
    messages = build_question_prompt(
        candidate_context=candidate_context,
        curriculum_context=curriculum_payload,
        retrieved_context=retrieved_chunks_payload,
        question_strategy=strategy.model_dump(),
        conversation_history=conversation_history
    )
    
    # 4. Generate structured question with retries
    try:
        generated_question = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=GeneratedQuestion,
            max_retries=2
        )
        return generated_question
    except Exception as e:
        logger.error(f"Structured output completely failed: {e}")
        # Trigger safe deterministic fallback
        return GeneratedQuestion.fallback(strategy=strategy)
