"""Unit tests for the internal HTTP client (backend.md §21.1)."""

import httpx
import pytest

from app.clients.base import InternalHttpClient
from app.core.errors import UpstreamError, UpstreamUnavailableError


def make_transport(handler):
    return httpx.MockTransport(handler)


async def test_successful_post():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"reply": "ok"})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        assert await client.post_json("/internal/interview/start", {"a": 1}) == {
            "reply": "ok"
        }
    finally:
        await client.aclose()


async def test_retries_on_transport_error():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            raise httpx.ConnectError("boom")
        return httpx.Response(200, json={"ok": True})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        result = await client.post_json("/x", {})
        assert result == {"ok": True}
        assert calls["n"] == 2
    finally:
        await client.aclose()


async def test_exhausted_retries_raises_unavailable():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        raise httpx.ConnectError("boom")

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        with pytest.raises(UpstreamUnavailableError):
            await client.post_json("/x", {})
        assert calls["n"] == 2
    finally:
        await client.aclose()


async def test_retries_on_5xx_upstream():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(503, json={"error": {}})
        return httpx.Response(200, json={"ok": True})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        result = await client.post_json("/x", {})
        assert result == {"ok": True}
        assert calls["n"] == 2
    finally:
        await client.aclose()


async def test_no_retry_on_processed_4xx():
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(422, json={"detail": "bad"})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        with pytest.raises(UpstreamError):
            await client.post_json("/x", {})
        assert calls["n"] == 1
    finally:
        await client.aclose()


async def test_sends_internal_token_header():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["token"] = request.headers.get("X-Internal-Token")
        return httpx.Response(200, json={})

    client = InternalHttpClient(
        "http://agent.test",
        transport=make_transport(handler),
        token="sekret",
    )
    try:
        await client.post_json("/x", {})
        assert captured["token"] == "sekret"
    finally:
        await client.aclose()


async def test_get_json_quiet_suppresses_httpx_info(caplog):
    import logging

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"provider": "groq"})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        httpx_logger = logging.getLogger("httpx")
        prev = httpx_logger.level
        httpx_logger.setLevel(logging.INFO)
        try:
            with caplog.at_level(logging.INFO, logger="httpx"):
                result = await client.get_json("/status", quiet=True)
        finally:
            httpx_logger.setLevel(prev)
        assert result == {"provider": "groq"}
        assert not any(
            record.name == "httpx" and record.levelno == logging.INFO
            for record in caplog.records
        )
    finally:
        await client.aclose()


async def test_get_json_default_still_logs_httpx_info(caplog):
    import logging

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={})

    client = InternalHttpClient(
        "http://agent.test", transport=make_transport(handler), retries=1
    )
    try:
        httpx_logger = logging.getLogger("httpx")
        prev = httpx_logger.level
        httpx_logger.setLevel(logging.INFO)
        try:
            with caplog.at_level(logging.INFO, logger="httpx"):
                await client.get_json("/status")
        finally:
            httpx_logger.setLevel(prev)
        assert any(
            record.name == "httpx" and record.levelno == logging.INFO
            for record in caplog.records
        )
    finally:
        await client.aclose()
