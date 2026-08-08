"""
Purpose:
Defines the FastAPI routing layer for the Interview Agent.

Responsibilities:
- Handles HTTP requests and delegates to the Orchestrator.
- Maps domain ValueErrors to HTTP 400 Bad Request.
- Exposes start, next, follow-up, complete, and health endpoints.

Connected Files:
- app/schemas/orchestration.py
- app/services/orchestrator.py
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

from app.schemas.orchestration import (
    StartInterviewRequest,
    NextTurnRequest,
    FollowUpRequest,
    CompleteRequest,
    OrchestratorResponse
)

router = APIRouter()


def _get_orchestrator(request: Request):
    """Helper to extract the globally instantiated orchestrator from app state."""
    return request.app.state.orchestrator


@router.post("/start", response_model=OrchestratorResponse)
async def start_interview(payload: StartInterviewRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return orchestrator.start_interview(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/next", response_model=OrchestratorResponse)
async def process_next(payload: NextTurnRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return orchestrator.process_next_turn(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/follow-up", response_model=OrchestratorResponse)
async def process_follow_up(payload: FollowUpRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return orchestrator.process_manual_follow_up(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/complete", response_model=OrchestratorResponse)
async def process_complete(payload: CompleteRequest, request: Request):
    orchestrator = _get_orchestrator(request)
    try:
        return orchestrator.process_complete(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/health")
async def health_check():
    """Returns the service health status."""
    return {"status": "ok", "service": "interview-agent"}
