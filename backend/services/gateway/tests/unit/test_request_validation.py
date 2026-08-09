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


def test_start_contract_forwards_interview_config(client, fake_agent):
    resp = client.post(
        "/api/interview",
        json={
            "sessionId": "cfg-1",
            "candidate": make_candidate(),
            "interviewConfig": {"minQuestions": 10, "followupBudget": 3},
        },
    )
    assert resp.status_code == 200
    assert fake_agent.start_calls[0]["interviewConfig"] == {
        "minQuestions": 10,
        "minCurriculumDays": 4,
        "followupBudget": 3,
        "followupMaxPerQuestion": 2,
    }


def test_start_contract_clamps_out_of_range_interview_config(client, fake_agent):
    resp = client.post(
        "/api/interview",
        json={
            "sessionId": "cfg-2",
            "candidate": make_candidate(),
            "interviewConfig": {"minQuestions": 99, "followupMaxPerQuestion": 0},
        },
    )
    assert resp.status_code == 200
    assert fake_agent.start_calls[0]["interviewConfig"] == {
        "minQuestions": 12,
        "minCurriculumDays": 4,
        "followupBudget": 4,
        "followupMaxPerQuestion": 1,
    }


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
