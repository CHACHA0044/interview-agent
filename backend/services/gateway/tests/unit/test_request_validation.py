"""Unit tests for public request validation (backend.md §21.1)."""

from tests.conftest import make_candidate


def test_start_contract(client):
    resp = client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Welcome. Let's begin."
    assert body["done"] is False
    assert body["feedback"] is None


def test_turn_contract(client):
    client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    resp = client.post(
        "/api/interview", json={"sessionId": "abc-123", "message": "Embeddings are vectors."}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Good. Next question."
    assert body["done"] is False


def test_missing_session_id(client):
    resp = client.post("/api/interview", json={"candidate": make_candidate()})
    assert resp.status_code == 422


def test_both_candidate_and_message(client):
    resp = client.post(
        "/api/interview",
        json={
            "sessionId": "abc-123",
            "candidate": make_candidate(),
            "message": "hi",
        },
    )
    assert resp.status_code == 422


def test_neither_candidate_nor_message(client):
    resp = client.post("/api/interview", json={"sessionId": "abc-123"})
    assert resp.status_code == 422


def test_empty_session_id(client):
    resp = client.post(
        "/api/interview",
        json={"sessionId": "", "candidate": make_candidate()},
    )
    assert resp.status_code == 422


def test_bad_candidate_shape(client):
    resp = client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": {"not": "a candidate"}},
    )
    assert resp.status_code == 422
