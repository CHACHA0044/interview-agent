"""Integration tests for the full public flow through the gateway."""

from app.schemas.api import Feedback
from tests.conftest import make_candidate
from tests.fakes import FakeAgentClient


def test_full_interview_flow(client, fake_agent):
    start = client.post(
        "/api/interview",
        json={"sessionId": "s1", "candidate": make_candidate()},
    )
    assert start.status_code == 200
    assert start.json() == {"reply": "Welcome. Let's begin.", "done": False, "feedback": None}

    for i in range(2):
        resp = client.post(
            "/api/interview", json={"sessionId": "s1", "message": f"answer {i}"}
        )
        assert resp.status_code == 200
        assert resp.json()["done"] is False

    fake_agent.next_responses.append(
        FakeAgentClient.turn(
            "Interview completed.",
            done=True,
            question_count=8,
            days_asked=[7, 12, 22, 27],
            scores=[8.0, 7.5],
            feedback=Feedback(
                summary="summary",
                strengths=["a"],
                gaps=["b"],
                next=["c"],
            ),
        )
    )
    final = client.post(
        "/api/interview", json={"sessionId": "s1", "message": "final"}
    )
    assert final.status_code == 200
    body = final.json()
    assert body["done"] is True
    assert body["feedback"] == {
        "summary": "summary",
        "strengths": ["a"],
        "gaps": ["b"],
        "next": ["c"],
    }
    assert len(fake_agent.next_calls) == 3


def test_upstream_unavailable_maps_to_503(client, fake_agent):
    from app.core.errors import UpstreamUnavailableError

    fake_agent.raise_error = UpstreamUnavailableError("agent down")
    resp = client.post(
        "/api/interview",
        json={"sessionId": "s2", "candidate": make_candidate()},
    )
    assert resp.status_code == 503
    assert resp.json()["detail"] == "agent down"


def test_multiple_candidates_isolated(client, fake_agent):
    for sid in ("s3", "s4"):
        start = client.post(
            "/api/interview",
            json={"sessionId": sid, "candidate": make_candidate()},
        )
        assert start.status_code == 200

    assert client.post(
        "/api/interview", json={"sessionId": "s3", "message": "hi"}
    ).status_code == 200
    assert client.post(
        "/api/interview", json={"sessionId": "s4", "message": "hi"}
    ).status_code == 200
