"""
Purpose:
Defines the FastAPI router and HTTP endpoints for the ai-intelligence service.

Responsibilities:
- Handles request deserialization and validation.
- Routes data into the isolated service layer.
- Handles HTTP exception mapping without exposing internal stack traces.

Connected Files:
- app/api/dependencies.py
- app/schemas/api_requests.py
- app/services/question_generator.py
- app/services/followup_generator.py
- app/services/evaluator.py
- app/services/feedback_generator.py
- app/rag/retriever.py

Important implementation notes:
- Absolutely no LLM prompting or business logic exists in this file.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from qdrant_client import QdrantClient

from app.api.dependencies import get_llm_provider, get_qdrant_client
from app.llm.provider import ChatProvider

from app.schemas.api_requests import (
    GenerateQuestionRequest,
    GenerateFollowUpRequest,
    EvaluateAnswerRequest,
    GenerateFeedbackRequest,
    RetrieveContextRequest
)
from app.schemas.question import GeneratedQuestion
from app.schemas.ai_output import EvaluationOutput, FeedbackOutput
from app.schemas.retrieval import RetrievalResult

from app.services.question_generator import generate_interview_question
from app.services.followup_generator import generate_followup_question
from app.services.evaluator import evaluate_answer
from app.services.feedback_generator import generate_feedback
from app.rag.retriever import retrieve
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/ai", tags=["internal-ai"])


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check(
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Simple health check endpoint that verifies dependencies are reachable."""
    try:
        # Check Qdrant collections
        qdrant_client.get_collections()
        qdrant_ok = True
    except Exception as e:
        logger.error(f"Health check failed to reach Qdrant: {e}")
        qdrant_ok = False

    return {
        "status": "ok",
        "provider": settings.llm_provider,
        "qdrant_configured": qdrant_ok
    }


@router.post("/generate-question", response_model=GeneratedQuestion)
def api_generate_question(
    request: GenerateQuestionRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Generates an interview question using the LLM and RAG context."""
    try:
        return generate_interview_question(
            strategy=request.strategy,
            candidate_context=request.candidate_context,
            conversation_history=request.conversation_history,
            llm_provider=llm_provider,
            qdrant_client=qdrant_client
        )
    except Exception as e:
        logger.error(f"Failed to generate question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during question generation")


@router.post("/generate-followup", response_model=GeneratedQuestion)
def api_generate_followup(
    request: GenerateFollowUpRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Generates a probing follow-up based on a weak candidate answer."""
    try:
        return generate_followup_question(
            strategy=request.strategy,
            previous_answer=request.previous_answer,
            candidate_context=request.candidate_context,
            conversation_history=request.conversation_history,
            llm_provider=llm_provider,
            qdrant_client=qdrant_client
        )
    except Exception as e:
        logger.error(f"Failed to generate follow-up: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during follow-up generation")


@router.post("/evaluate-answer", response_model=EvaluationOutput)
def api_evaluate_answer(
    request: EvaluateAnswerRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Evaluates a candidate's answer against the factual rubric."""
    try:
        return evaluate_answer(
            question_payload=request.question_payload,
            candidate_answer=request.candidate_answer,
            candidate_context=request.candidate_context,
            llm_provider=llm_provider,
            qdrant_client=qdrant_client
        )
    except Exception as e:
        logger.error(f"Failed to evaluate answer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during evaluation")


@router.post("/generate-feedback", response_model=FeedbackOutput)
def api_generate_feedback(
    request: GenerateFeedbackRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider)
):
    """Synthesizes the entire interview history into actionable feedback."""
    try:
        return generate_feedback(
            candidate=request.candidate,
            candidate_context=request.candidate_context,
            evaluations=request.evaluations,
            coverage=request.coverage,
            missed_concepts=request.missed_concepts,
            topic_scores=request.topic_scores,
            llm_provider=llm_provider
        )
    except Exception as e:
        logger.error(f"Failed to generate feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during feedback synthesis")


@router.post("/retrieve-context", response_model=RetrievalResult)
def api_retrieve_context(
    request: RetrieveContextRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Provides raw semantic search access to the curriculum knowledge base."""
    try:
        return retrieve(
            query=request.query,
            llm_provider=llm_provider,
            qdrant_client=qdrant_client,
            filters=request.filters
        )
    except Exception as e:
        logger.error(f"Failed to retrieve context: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during retrieval")
