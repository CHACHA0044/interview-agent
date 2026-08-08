"""Shared fixture setup for contract tests.

No `__init__.py` is placed in shared/ — it must stay import-free. This
conftest makes the gateway service importable for gateway-compatibility
tests, and exposes JSON Schema loading/validation helpers.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import jsonschema
import pytest

HERE = Path(__file__).resolve().parent  # backend/shared/tests
SHARED_DIR = HERE.parent  # backend/shared
BACKEND_DIR = SHARED_DIR.parent  # backend
REPO_ROOT = BACKEND_DIR.parent  # repo root
GATEWAY_DIR = BACKEND_DIR / "services" / "gateway"
SCHEMA_DIR = SHARED_DIR / "schemas"


def load_schema(name: str) -> dict:
    with open(SCHEMA_DIR / name, encoding="utf-8") as fh:
        return json.load(fh)


def validator_for(full_schema: dict, def_name: str) -> jsonschema.Draft202012Validator:
    """Build a validator scoped to a single $def inside a schema document."""
    wrapper = {"$ref": f"#/$defs/{def_name}", "$defs": full_schema["$defs"]}
    return jsonschema.Draft202012Validator(wrapper)


def ensure_gateway_importable() -> None:
    if str(GATEWAY_DIR) not in sys.path:
        sys.path.insert(0, str(GATEWAY_DIR))


@pytest.fixture(scope="session")
def session_schema() -> dict:
    return load_schema("session.json")


@pytest.fixture(scope="session")
def agent_schema() -> dict:
    return load_schema("agent_api.json")


@pytest.fixture(scope="session")
def ai_schema() -> dict:
    return load_schema("ai_api.json")
