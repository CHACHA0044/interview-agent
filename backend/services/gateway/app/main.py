"""FastAPI application factory for the Interview Agent Gateway."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

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
from app.sessions.redis_store import InMemorySessionStore, RedisSessionStore

logger = logging.getLogger(__name__)


async def _resolve_session_store(settings: Settings):
    """Use Redis when reachable; otherwise fall back to in-memory storage.

    The single-container deployment (backend.md, Render) runs without Redis, so
    the gateway degrades gracefully instead of failing every session call.
    """
    redis_client = aioredis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_connect_timeout=settings.connect_timeout_seconds,
    )
    redis_store = RedisSessionStore(
        redis_client=redis_client,
        ttl_seconds=settings.session_ttl_seconds,
    )
    try:
        reachable = await asyncio.wait_for(
            redis_store.ping(), timeout=settings.connect_timeout_seconds + 1.0
        )
    except Exception:
        reachable = False
    if not reachable:
        logger.warning(
            "redis unavailable at %s; using in-memory session store",
            settings.redis_url,
        )
        return InMemorySessionStore(ttl_seconds=settings.session_ttl_seconds)
    logger.info("session store: redis at %s", settings.redis_url)
    return redis_store


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    if not isinstance(level, int):
        level = logging.INFO
    logging.basicConfig(level=level)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        store = await _resolve_session_store(settings)
        app.state.session_store = store
        app.state.lifecycle = SessionLifecycle(store, app.state.agent_client)
        yield

    app = FastAPI(
        title="Interview Agent Gateway",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.settings = settings

    agent_http = InternalHttpClient(
        base_url=settings.agent_service_url,
        connect_timeout=settings.connect_timeout_seconds,
        request_timeout=settings.request_timeout_seconds,
        retries=settings.retries,
        token=settings.internal_api_token,
    )
    app.state.agent_client = AgentClient(agent_http)

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
        store = request.app.state.session_store
        store_kind = (
            "redis" if isinstance(store, RedisSessionStore) else "in-memory"
        )
        redis_ok = await store.ping()
        checks = {
            "redis": "ok" if redis_ok else "down",
            "store": store_kind,
        }
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
