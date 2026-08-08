"""
Purpose:
FastAPI application entry point for the Interview Agent.

Responsibilities:
- Initializes FastAPI.
- Injects the CurriculumLoader and InterviewOrchestrator into app state.
- Mounts the internal API router.

Connected Files:
- app/api/router.py
- app/services/curriculum_loader.py
- app/services/orchestrator.py
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.router import router
from app.services.curriculum_loader import CurriculumLoader
from app.services.orchestrator import InterviewOrchestrator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load Curriculum once on startup
    loader = CurriculumLoader()
    app.state.orchestrator = InterviewOrchestrator(loader)
    yield
    # Cleanup on shutdown
    pass

app = FastAPI(
    title="Interview Agent Internal API",
    description="Stateless orchestration layer for interview planning and progression.",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(router, prefix="/internal/interview", tags=["Interview"])
# Add a simple root health check as well
@app.get("/health", tags=["Health"])
async def root_health():
    return {"status": "ok", "service": "interview-agent"}
