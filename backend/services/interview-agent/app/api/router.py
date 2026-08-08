"""
Purpose:
Defines the FastAPI routing layer for the Interview Agent (master agent contract).

Responsibilities:
- Handles HTTP requests and delegates to the Orchestrator.
- Maps domain ValueErrors to HTTP 400 Bad Request.
- Exposes start, next, complete, and health endpoints.

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
        return await orchestrator.start(payload.sessionId, payload.candidate)
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
