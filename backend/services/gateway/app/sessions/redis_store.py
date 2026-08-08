"""TTL-backed session store.

Redis is the single source of session truth (backend.md §10). Every session
carries a TTL that is refreshed on each turn. An in-memory implementation is
provided for tests and for local runs without Redis.
"""

from __future__ import annotations

import json
from typing import Protocol

from app.schemas.internal import SessionDoc


class SessionStore(Protocol):
    async def get(self, session_id: str) -> SessionDoc | None: ...

    async def save(self, doc: SessionDoc) -> None: ...

    async def delete(self, session_id: str) -> bool: ...

    async def ping(self) -> bool: ...


class RedisSessionStore:
    """Redis-backed store. Key: ``session:{sessionId}``, value: JSON, TTL."""

    def __init__(self, redis_client, ttl_seconds: int) -> None:
        self._redis = redis_client
        self._ttl = ttl_seconds

    @staticmethod
    def _key(session_id: str) -> str:
        return f"session:{session_id}"

    async def get(self, session_id: str) -> SessionDoc | None:
        raw = await self._redis.get(self._key(session_id))
        if raw is None:
            return None
        return SessionDoc.model_validate_json(raw)

    async def save(self, doc: SessionDoc) -> None:
        raw = doc.model_dump_json()
        await self._redis.set(self._key(doc.sessionId), raw, ex=self._ttl)

    async def delete(self, session_id: str) -> bool:
        removed = await self._redis.delete(self._key(session_id))
        return bool(removed)

    async def ping(self) -> bool:
        try:
            return bool(await self._redis.ping())
        except Exception:
            return False


class InMemorySessionStore:
    """Deterministic in-memory store mirroring the Redis semantics for tests."""

    def __init__(self, ttl_seconds: int = 3600) -> None:
        self._ttl = ttl_seconds
        self._docs: dict[str, SessionDoc] = {}

    async def get(self, session_id: str) -> SessionDoc | None:
        return self._docs.get(session_id)

    async def save(self, doc: SessionDoc) -> None:
        self._docs[doc.sessionId] = doc

    async def delete(self, session_id: str) -> bool:
        return self._docs.pop(session_id, None) is not None

    async def ping(self) -> bool:
        return True
