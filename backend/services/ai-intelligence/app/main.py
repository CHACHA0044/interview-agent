"""
Purpose:
Entry point for the AI Intelligence FastAPI application.

Responsibilities:
- Initializes the FastAPI app.
- Registers routers.
- Handles global application state and middleware.

Connected Files:
- app/api/endpoints.py
- app/core/config.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router as internal_ai_router
from app.api.dependencies import get_provider_status

app = FastAPI(
    title="AI Intelligence Service",
    description="Internal AI service for the Interview Agent.",
    version="1.0.0"
)

# Standard internal microservice CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.config import settings

# Mount the internal API routes
app.include_router(internal_ai_router)


@app.get("/health")
def root_health():
    return {
        "status": "ok",
        "service": "ai-intelligence",
        "provider": settings.llm_provider,
        "llm": get_provider_status(),
    }

