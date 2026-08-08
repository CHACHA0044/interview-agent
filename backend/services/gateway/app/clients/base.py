"""Internal HTTP client with bounded timeouts and retries.

Retries are only applied on transport/connect failures (never on a processed
HTTP response), per backend.md §16.3.
"""

from __future__ import annotations

import logging

import httpx

from app.core.errors import UpstreamError, UpstreamUnavailableError

logger = logging.getLogger(__name__)

_RETRYABLE_EXC = (httpx.TransportError, httpx.TimeoutException)


class InternalHttpClient:
    """Small JSON client for internal service calls."""

    def __init__(
        self,
        base_url: str,
        *,
        connect_timeout: float = 2.0,
        request_timeout: float = 25.0,
        retries: int = 1,
        token: str = "",
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        headers = {}
        if token:
            headers["X-Internal-Token"] = token
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=httpx.Timeout(
                connect=connect_timeout,
                read=request_timeout,
                write=request_timeout,
                pool=connect_timeout,
            ),
            headers=headers,
            transport=transport,
        )
        self._retries = max(0, retries)

    async def post_json(self, path: str, payload: dict) -> dict:
        last_exc: Exception | None = None
        for attempt in range(self._retries + 1):
            try:
                response = await self._client.post(path, json=payload)
            except _RETRYABLE_EXC as exc:
                last_exc = exc
                if attempt < self._retries:
                    logger.warning(
                        "transport error calling %s (attempt %d): %s",
                        path,
                        attempt + 1,
                        exc,
                    )
                    continue
                raise UpstreamUnavailableError(
                    f"upstream transport failure: {exc}"
                ) from exc

            if response.status_code < 400:
                return response.json()

            if 400 <= response.status_code < 500:
                # 4xx is a contract issue; do not retry.
                raise UpstreamError(
                    f"upstream returned {response.status_code} for {path}: "
                    f"{response.text[:200]}"
                )
            if attempt < self._retries:
                logger.warning(
                    "upstream %s returned %s (attempt %d)",
                    path,
                    response.status_code,
                    attempt + 1,
                )
                continue
            raise UpstreamUnavailableError(
                f"upstream returned {response.status_code} for {path}"
            )
        raise UpstreamUnavailableError(str(last_exc))

    async def aclose(self) -> None:
        await self._client.aclose()
