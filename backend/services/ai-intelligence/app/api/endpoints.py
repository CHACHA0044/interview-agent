"""
Purpose:
Defines the FastAPI router and HTTP endpoints for the ai-intelligence service.

Responsibilities:
- Handles request deserialization and validation.
- Routes data into the isolated service layer.
- Exposes exactly the /internal/ai/* contract from backend/shared/schemas/ai_api.json.

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
from app.core.config import settings
from app.llm.provider import ChatProvider

from app.schemas.api_requests import (
    EvaluateAnswerRequest,
    GenerateFeedbackRequest,
    GenerateFollowUpRequest,
    GenerateQuestionRequest,
    RetrieveContextRequest,
    RetrieveContextResponse,
)
from app.schemas.ai_output import EvaluationOutput, FeedbackOutput
from app.schemas.question import GeneratedQuestion

from app.services.question_generator import generate_interview_question
from app.services.followup_generator import generate_followup_question
from app.services.evaluator import evaluate_answer
from app.services.feedback_generator import generate_feedback
from app.rag.retriever import retrieve

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal/ai", tags=["internal-ai"])


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Liveness endpoint. Never performs real LLM calls (backend.md §8.3)."""
    return {
        "status": "ok",
        "service": "ai-intelligence",
        "provider": settings.llm_provider,
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
            strategy=request.questionStrategy,
            candidate_context=request.candidateContext,
            curriculum_context=request.curriculumContext,
            conversation=[item.model_dump() for item in request.conversation],
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
            strategy=request.followUpStrategy,
            candidate_context=request.candidateContext,
            curriculum_context=request.curriculumContext,
            conversation=[item.model_dump() for item in request.conversation],
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
            question_payload=request.question,
            candidate_answer=request.candidateAnswer,
            candidate_context=request.candidateContext,
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
            candidate_context=request.candidateContext,
            evaluations=request.evaluations,
            coverage=request.coverage,
            missed_concepts=request.missedConcepts,
            topic_scores=request.topicScores,
            llm_provider=llm_provider
        )
    except Exception as e:
        logger.error(f"Failed to generate feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during feedback synthesis")


@router.post("/retrieve-context", response_model=RetrieveContextResponse)
def api_retrieve_context(
    request: RetrieveContextRequest,
    llm_provider: ChatProvider = Depends(get_llm_provider),
    qdrant_client: QdrantClient = Depends(get_qdrant_client)
):
    """Provides raw semantic search access to the curriculum knowledge base."""
    try:
        filters = {}
        if request.day is not None:
            filters["day"] = request.day
        if request.module is not None:
            filters["module"] = request.module
        result = retrieve(
            query=request.query,
            llm_provider=llm_provider,
            qdrant_client=qdrant_client,
            filters=filters,
            top_k=request.topK
        )
        return RetrieveContextResponse(
            context=result.chunks,
            source=result.source
        )
    except Exception as e:
        logger.error(f"Failed to retrieve context: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during retrieval")
