"""
Purpose:
Defines the FastAPI routing layer for the Interview Agent (master agent contract).

Responsibilities:
- Handles HTTP requests and delegates to the Orchestrator.
- Maps domain ValueErrors to HTTP 400 Bad Request.
- Exposes start, next, complete, and health endpoints.
- Extracts optional interviewConfig overrides (min_questions etc.) from start requests.

Connected Files:
- app/schemas/orchestration.py
- app/services/orchestrator.py
"""

from fastapi import APIRouter, HTTPException, Request

from app.schemas.orchestration import (
    AgentCompleteRequest,
    AgentNextRequest,
    AgentStartRequest,
    AgentTurnResponse,
)

router = APIRouter()


def _get_orchestrator(request: Request):
    """Helper to extract the globally instantiated orchestrator from app state."""
    return request.app.state.orchestrator


@router.post("/start", response_model=AgentTurnResponse)
async def start_interview(payload: AgentStartRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        # Apply per-request floor overrides from frontend Settings when provided.
        config = payload.interviewConfig or {}
        if config:
            from app.core.config import settings as _cfg
            # Clamp each value to the server-enforced safe range.
            _CLAMP = {
                "minQuestions": (8, 12),
                "minCurriculumDays": (3, 5),
                "followupBudget": (2, 6),
                "followupMaxPerQuestion": (1, 3),
            }
            def _clamp(key, default):
                lo, hi = _CLAMP[key]
                return max(lo, min(hi, int(config.get(key, default))))

            orchestrator.min_questions = _clamp("minQuestions", orchestrator.min_questions)
            orchestrator.min_curriculum_days = _clamp("minCurriculumDays", orchestrator.min_curriculum_days)
            orchestrator.followup_budget = _clamp("followupBudget", orchestrator.followup_budget)
            orchestrator.followup_max_per_question = _clamp("followupMaxPerQuestion", orchestrator.followup_max_per_question)

        # Optional curriculum scope: restrict the assessment plan to the modules
        # the user selected on the Interview Setup page.
        focus_topics = config.get("focusTopics") if config else None
        if focus_topics is not None:
            if not isinstance(focus_topics, list) or not all(isinstance(t, str) for t in focus_topics):
                raise HTTPException(
                    status_code=400,
                    detail="focusTopics must be a list of module title strings",
                )
            focus_topics = [t for t in focus_topics if t]
        return await orchestrator.start(
            payload.sessionId,
            payload.candidate,
            curriculum_scope=focus_topics or None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/next", response_model=AgentTurnResponse)
async def process_next(payload: AgentNextRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return await orchestrator.next(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/complete", response_model=AgentTurnResponse)
async def process_complete(payload: AgentCompleteRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return await orchestrator.complete(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/health")
async def health_check():
    """Returns the service health status."""
    return {"status": "ok", "service": "interview-agent"}
