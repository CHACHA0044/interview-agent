"""Validate that the shared schema documents are well-formed and self-consistent."""

from conftest import load_schema


def _ref_name(ref: str | None) -> str | None:
    if ref is None:
        return None
    return ref.rsplit("/", 1)[-1]


def test_all_schema_files_are_valid_draft2020_12():
    for name in ("session.json", "agent_api.json", "ai_api.json"):
        schema = load_schema(name)
        assert schema.get("$schema", "").endswith("/draft/2020-12/schema")
        import jsonschema

        jsonschema.Draft202012Validator.check_schema(schema)


def test_agent_endpoint_refs_resolve(agent_schema):
    for endpoint, mapping in agent_schema["endpoints"].items():
        for part in ("request", "response"):
            ref = mapping[part]
            if ref is None:
                continue
            assert _ref_name(ref) in agent_schema["$defs"], (
                f"{endpoint} {part} references missing def {ref}"
            )


def test_ai_endpoint_refs_resolve(ai_schema):
    for endpoint, mapping in ai_schema["endpoints"].items():
        for part in ("request", "response"):
            ref = mapping[part]
            if ref is None:
                continue
            assert _ref_name(ref) in ai_schema["$defs"], (
                f"{endpoint} {part} references missing def {ref}"
            )


def test_session_schema_defs_resolve(session_schema):
    refs = {
        "#/$defs/candidate",
        "#/$defs/question",
        "#/$defs/conversationItem",
        "#/$defs/topicScore",
        "#/$defs/feedback",
    }
    for ref in refs:
        assert _ref_name(ref) in session_schema["$defs"]


def test_health_endpoints_exposed(agent_schema, ai_schema):
    assert "GET /health" in agent_schema["endpoints"]
    assert "GET /health" in ai_schema["endpoints"]
