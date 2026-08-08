"""Unit tests for the session lifecycle (backend.md §21.1)."""

from app.schemas.api import Feedback
from tests.conftest import make_candidate
from tests.fakes import FakeAgentClient


def test_unknown_session_returns_404(client):
    resp = client.post(
        "/api/interview", json={"sessionId": "nope", "message": "hi"}
    )
    assert resp.status_code == 404
    assert "nope" in resp.json()["detail"]


def test_duplicate_start_returns_409(client):
    payload = {"sessionId": "abc-123", "candidate": make_candidate()}
    assert client.post("/api/interview", json=payload).status_code == 200
    resp = client.post("/api/interview", json=payload)
    assert resp.status_code == 409


def test_turn_on_completed_session_returns_409(client, fake_agent):
    client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    fake_agent.next_responses.append(
        FakeAgentClient.turn(
            "Done.",
            done=True,
            question_count=8,
            days_asked=[7, 12, 22, 27],
            scores=[8.0],
            feedback=Feedback(
                summary="summary", strengths=["a"], gaps=["b"], next=["c"]
            ),
        )
    )
    first = client.post(
        "/api/interview", json={"sessionId": "abc-123", "message": "final answer"}
    )
    assert first.status_code == 200
    assert first.json()["done"] is True

    resp = client.post(
        "/api/interview", json={"sessionId": "abc-123", "message": "too late"}
    )
    assert resp.status_code == 409


def test_completion_with_feedback(client, fake_agent):
    client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    fake_agent.next_responses.append(
        FakeAgentClient.turn(
            "Interview completed.",
            done=True,
            question_count=8,
            days_asked=[7, 12, 22, 27],
            feedback=Feedback(
                summary="Deep mastery in RAG.",
                strengths=["Vector search", "Prompt tuning"],
                gaps=["Observability"],
                next=["Practice Prometheus setup"],
            ),
        )
    )
    resp = client.post(
        "/api/interview", json={"sessionId": "abc-123", "message": "last answer"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["done"] is True
    assert body["reply"] == "Interview completed."
    feedback = body["feedback"]
    assert feedback["summary"] == "Deep mastery in RAG."
    assert feedback["strengths"] == ["Vector search", "Prompt tuning"]
    assert feedback["gaps"] == ["Observability"]
    assert feedback["next"] == ["Practice Prometheus setup"]


def test_completion_calls_agent_complete_when_feedback_missing(client, fake_agent):
    client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    fake_agent.next_responses.append(
        FakeAgentClient.turn(
            "Done.", done=True, question_count=8, days_asked=[7, 12, 22, 27]
        )
    )
    resp = client.post(
        "/api/interview", json={"sessionId": "abc-123", "message": "last answer"}
    )
    assert resp.status_code == 200
    assert resp.json()["done"] is True
    assert resp.json()["feedback"]["summary"] == "Finished."
    assert len(fake_agent.complete_calls) == 1


async def test_conversation_accumulates_across_turns(client, fake_agent, store):
    client.post(
        "/api/interview",
        json={"sessionId": "abc-123", "candidate": make_candidate()},
    )
    client.post("/api/interview", json={"sessionId": "abc-123", "message": "one"})
    client.post("/api/interview", json={"sessionId": "abc-123", "message": "two"})

    doc = await store.get("abc-123")
    assert doc is not None
    roles = [item.role for item in doc.conversation]
    assert roles == ["agent", "candidate", "agent", "candidate", "agent"]
