"""
Purpose:
Orchestrates the AI-powered adaptive follow-up question generation.

Responsibilities:
- Fetches specific curriculum context based on the candidate's missed concepts.
- Uses prompt builders to format the payload with the previous answer and reasoning gaps.
- Requests strict JSON structure from the LLM.
- Handles poor answers and network failures gracefully.

Connected Files:
- app/schemas/question.py
- app/rag/retriever.py
- app/llm/structured_output.py
- app/llm/prompts/builders.py

Important implementation notes:
- Distinct from standard question generation; strictly targets weaknesses.
"""

import logging
from typing import Dict, Any, List

from qdrant_client import QdrantClient

from app.schemas.question import FollowUpStrategy, GeneratedQuestion, QuestionStrategy
from app.llm.provider import ChatProvider
from app.llm.structured_output import generate_structured_output
from app.llm.prompts.builders import build_followup_prompt
from app.rag.retriever import retrieve, assemble_context

logger = logging.getLogger(__name__)


def generate_followup_question(
    strategy: FollowUpStrategy,
    previous_answer: str,
    candidate_context: Dict[str, Any],
    conversation_history: List[Dict[str, str]],
    llm_provider: ChatProvider,
    qdrant_client: QdrantClient
) -> GeneratedQuestion:
    """
    Generates a probing follow-up question based on the candidate's weak previous answer.
    """
    logger.info(f"Generating follow-up for topic: {strategy.topic} (Day {strategy.day})")
    
    # Ensure even empty answers are tracked so the LLM can ask them to elaborate
    if not previous_answer or not previous_answer.strip():
        previous_answer = "[Candidate provided no clear answer or remained silent.]"

    # 1. Prepare Semantic Search Query
    # Target the specifically weak concepts to ground the LLM's follow-up factually
    search_query = f"{strategy.topic} " + " ".join(strategy.weakConcepts)
    
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
            
    curriculum_string = assemble_context(retrieval_result)
    
    # We pass retrieved text blocks as the 'retrieved_context' parameter
    retrieved_chunks_payload = [
        {"title": chunk.metadata.get("title", ""), "content": chunk.content}
        for chunk in retrieval_result.chunks
    ]
    
    # 3. Build the prompt payload
    # Add the previous answer to the end of the history temporarily so the prompt builder context sees it
    # But builders.build_followup_prompt should have expected the history to include the user answer.
    # Actually, in the Technical Specification, the follow-up strategy prompts usually get the answer directly,
    # or it's just part of the conversation history. We will append the previous answer as a 'user' message 
    # to the history so the LLM sees it immediately before strategy.
    
    history_with_answer = list(conversation_history)
    history_with_answer.append({"role": "user", "content": previous_answer})
    
    messages = build_followup_prompt(
        candidate_context=candidate_context,
        curriculum_context={"content": curriculum_string},
        retrieved_context=retrieved_chunks_payload,
        followup_strategy=strategy.model_dump(),
        conversation_history=history_with_answer
    )
    
    # 4. Generate structured question with retries
    try:
        generated_question = generate_structured_output(
            provider=llm_provider,
            messages=messages,
            model_class=GeneratedQuestion,
            max_retries=2
        )
        # Ensure it's marked as a follow up
        generated_question.type = "follow-up"
        return generated_question
    except Exception as e:
        logger.error(f"Structured output completely failed during follow-up: {e}")
        # Construct a temporary QuestionStrategy to pass to the fallback
        temp_strategy = QuestionStrategy(
            day=strategy.day,
            module=0,
            topic=strategy.topic,
            difficulty="medium",
            concepts=strategy.weakConcepts,
            isFollowUp=True,
            followUpOf=None
        )
        fallback = GeneratedQuestion.fallback(strategy=temp_strategy)
        fallback.type = "follow-up"
        return fallback
