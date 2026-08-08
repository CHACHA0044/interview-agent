"""Deployment validation tests for single-container Render configuration.

Verifies:
- Service configurations accept single-container loopback URLs and PORT settings.
"""

from conftest import ensure_gateway_importable
ensure_gateway_importable()

from app.core.config import Settings as GatewaySettings


def test_gateway_settings_port_and_loopback_defaults():
    settings = GatewaySettings(
        port=10000,
        agent_service_url="http://127.0.0.1:8001",
        ai_service_url="http://127.0.0.1:8002",
    )
    assert settings.port == 10000
    assert settings.agent_service_url == "http://127.0.0.1:8001"
    assert settings.ai_service_url == "http://127.0.0.1:8002"
