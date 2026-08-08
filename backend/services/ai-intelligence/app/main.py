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

# Mount the internal API routes
app.include_router(internal_ai_router)
