"""FastAPI application factory for the Interview Agent Gateway."""

from __future__ import annotations

import logging

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import interview
from app.clients.agent_client import AgentClient
from app.clients.base import InternalHttpClient
from app.core.config import Settings, get_settings
from app.core.errors import APIError
from app.schemas.api import HealthResponse
from app.sessions.lifecycle import SessionLifecycle
from app.sessions.redis_store import RedisSessionStore

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    if not isinstance(level, int):
        level = logging.INFO
    logging.basicConfig(level=level)

    app = FastAPI(title="Interview Agent Gateway", version="1.0.0")
    app.state.settings = settings

    store = RedisSessionStore(
        redis_client=aioredis.from_url(
            settings.redis_url, decode_responses=True
        ),
        ttl_seconds=settings.session_ttl_seconds,
    )
    agent_http = InternalHttpClient(
        base_url=settings.agent_service_url,
        connect_timeout=settings.connect_timeout_seconds,
        request_timeout=settings.request_timeout_seconds,
        retries=settings.retries,
        token=settings.internal_api_token,
    )
    app.state.session_store = store
    app.state.agent_client = AgentClient(agent_http)
    app.state.lifecycle = SessionLifecycle(store, app.state.agent_client)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(interview.router)

    @app.exception_handler(APIError)
    async def _api_error_handler(request: Request, exc: APIError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code, content=exc.to_response()
        )

    @app.get("/health", response_model=HealthResponse)
    async def health(request: Request) -> HealthResponse:
        store: RedisSessionStore = request.app.state.session_store
        redis_ok = await store.ping()
        checks = {"redis": "ok" if redis_ok else "down"}
        if not redis_ok:
            return JSONResponse(
                status_code=503,
                content=HealthResponse(
                    status="error", checks=checks
                ).model_dump(),
            )
        return HealthResponse(status="ok", checks=checks)

    return app


app = create_app()
