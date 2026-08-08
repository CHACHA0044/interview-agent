"""
Purpose:
FastAPI application entry point for the Interview Agent.

Responsibilities:
- Initializes FastAPI.
- Injects the CurriculumLoader, AIIntelligenceClient, and InterviewOrchestrator
  into app state.
- Mounts the internal API router.

Connected Files:
- app/api/router.py
- app/core/config.py
- app/services/curriculum_loader.py
- app/services/ai_client.py
- app/services/orchestrator.py
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import router
from app.core.config import settings
from app.services.ai_client import AIIntelligenceClient
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    loader = CurriculumLoader()
    ai_client = AIIntelligenceClient(
        base_url=settings.ai_service_url,
        timeout_seconds=settings.ai_timeout_seconds,
        retries=settings.ai_retries,
    )
    app.state.orchestrator = InterviewOrchestrator(
        loader,
        ai_client,
        followup_budget=settings.followup_budget,
        followup_max_per_question=settings.followup_max_per_question,
    )
    yield


app = FastAPI(
    title="Interview Agent Internal API",
    description="Stateless orchestration layer for interview planning and progression.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(router, prefix="/internal/interview", tags=["Interview"])


@app.get("/health", tags=["Health"])
async def root_health():
    return {"status": "ok", "service": "interview-agent"}
