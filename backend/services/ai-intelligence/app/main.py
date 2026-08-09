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
import logging
import os

# Honor LOG_LEVEL env (INFO for live failover/RAG evidence runs; WARNING default
# keeps normal operation quiet). Root level is WARNING by default, which would
# otherwise suppress the structured [AI] INFO lines used by tests_e2e/live_interview.py.
# basicConfig adds a handler to the root logger when none exists (uvicorn only
# configures its own loggers), so INFO lines actually get emitted; setLevel alone
# is silently dropped by the lastResort handler when root has no handler.
_log_level = os.getenv("LOG_LEVEL", "WARNING").upper()
logging.basicConfig(level=_log_level, format="%(levelname)s: %(message)s")
logging.getLogger().setLevel(_log_level)


class _StatusPollAccessFilter(logging.Filter):
    """Drop default-level uvicorn access lines for the LLM-status endpoint.

    The gateway proxies GET /internal/ai/llm/status every ~4s for the frontend
    badge; at INFO that would emit ~15 lines/minute and obscure interview-turn
    logs. Mirrors the gateway's equivalent filter.
    """

    _IGNORED = ("/internal/ai/llm/status",)

    def filter(self, record: logging.LogRecord) -> bool:
        return not any(path in record.getMessage() for path in self._IGNORED)


logging.getLogger("uvicorn.access").addFilter(_StatusPollAccessFilter())

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

