"""Structured error types and mapping for the gateway public API.

All non-2xx responses use the shape ``{"detail": "..."}`` on the public
endpoint (per backend.md §16.4). Internal upstream errors are mapped to
controlled HTTP statuses here.
"""

from __future__ import annotations

from typing import Any


class APIError(Exception):
    """Base class for errors surfaced to the public API."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        code: str | None = None,
        detail: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.detail = detail or {}

    def to_response(self) -> dict[str, Any]:
        return {"detail": self.message}


class SessionNotFoundError(APIError):
    status_code = 404
    code = "SESSION_NOT_FOUND"


class SessionExistsError(APIError):
    status_code = 409
    code = "SESSION_EXISTS"


class SessionCompletedError(APIError):
    status_code = 409
    code = "SESSION_COMPLETED"


class UpstreamUnavailableError(APIError):
    status_code = 503
    code = "UPSTREAM_UNAVAILABLE"


class UpstreamError(APIError):
    """The upstream answered but with an unexpected error status."""

    status_code = 502
    code = "UPSTREAM_ERROR"


def map_upstream_error(upstream_status: int, message: str) -> APIError:
    """Map an upstream HTTP status to a gateway APIError (backend.md §16.2)."""
    if upstream_status == 404:
        return SessionNotFoundError(message)
    if upstream_status == 409:
        return SessionCompletedError(message)
    if upstream_status >= 500:
        return UpstreamUnavailableError(message)
    return UpstreamError(message)
