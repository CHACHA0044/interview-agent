"""Live end-to-end interview tests against the real gateway -> agent -> ai chain.

Everything runs over real HTTP: uvicorn subprocesses for ai-intelligence,
interview-agent and the gateway, with a transparent recording proxy between the
gateway and the agent. No service internals are mocked or patched; the fake LLM
provider is the production default (LLM_PROVIDER=fake) and the curriculum is
loaded from the real backend/curriculum.json.
"""

from __future__ import annotations

import json
import pathlib
import uuid

import httpx
import pytest

from harness import (
    GATEWAY_URL,
    load_candidates,
    load_curriculum,
    DifficultyProbePolicy,
    run_interview,
    strong_answer,
    weak_answer,
)

CANDIDATES = load_candidates()


def _sid(label: str) -> str:
    return f"e2e-{label}-{uuid.uuid4().hex[:8]}"


def _save(dest: pathlib.Path, rec: dict) -> None:
    dest.write_text(json.dumps(rec, indent=2), encoding="utf-8")


def _plan_days(rec: dict) -> set[int]:
    return {p["day"] for p in rec["plan"]}


def _session_files(sessions_dir: pathlib.Path) -> list[pathlib.Path]:
    return sorted(p for p in pathlib.Path(sessions_dir).glob("e2e-*.json"))


# ---------------------------------------------------------------------------
# 1. Expert candidate, strong answers: hard floor, top clamp, no follow-ups.
# ---------------------------------------------------------------------------


def test_expert_strong_full_interview(stack, transcript, sessions_dir):
    candidate = CANDIDATES["CAND-001"]  # Sarah Johnson, Senior Data Engineer
    sid = _sid("expert")
    rec = run_interview(
        stack, transcript, sid, candidate, strong_answer,
        out_path=sessions_dir / f"{sid}.json",
    )

    assert rec["startingTier"] == "expert"
    assert rec["startingDifficulty"] == "hard"
    assert rec["finished"] is True

    turns = rec["turns"]
    assert len(turns) == 8, f"expected exactly 8 turns, got {len(turns)}"
    # no follow-ups anywhere (all scores >= 8)
    assert all(not t["isFollowUp"] for t in turns)
    assert all(t["score"] == 10.0 for t in turns)
    # hard floor: done is false for every turn except the last
    for t in turns[:-1]:
        assert t["nextDone"] is False
    assert turns[-1]["nextDone"] is True

    # difficulty stays clamped at the top despite consecutive 10s
    assert all(t["difficultyState"]["current_difficulty"] == "hard" for t in turns)
    assert all(t["difficulty"] == "hard" for t in turns)

    final = rec["finalSessionView"]
    assert final["questionCount"] == 8
    assert len(set(final["daysAsked"])) >= 4

    feedback = rec["feedback"]
    assert feedback["summary"].startswith("Sarah Johnson")
    assert "10.0/10" in feedback["summary"]
    assert all(s.startswith("Covered concept:") for s in feedback["strengths"])
    assert feedback["gaps"] and feedback["next"]

    assert len(rec["plan"]) == 8
    assert len(_plan_days(rec)) >= 4


# ---------------------------------------------------------------------------
# 2. Novice candidate, weak answers: follow-up budget, per-question cap, clamp.
# ---------------------------------------------------------------------------


def test_novice_weak_followups_budget_and_bottom_clamp(stack, transcript, sessions_dir):
    candidate = CANDIDATES["CAND-017"]  # Tyler Brooks, Junior Developer
    sid = _sid("novice")
    rec = run_interview(
        stack, transcript, sid, candidate, weak_answer,
        out_path=sessions_dir / f"{sid}.json",
    )

    assert rec["startingTier"] == "novice"
    assert rec["startingDifficulty"] == "easy"
    assert rec["finished"] is True

    turns = rec["turns"]
    assert all(t["score"] < 5.0 for t in turns)
    assert all(t["difficultyState"]["current_difficulty"] == "easy" for t in turns)
    assert all(t["difficulty"] == "easy" for t in turns)

    followup_turns = [t for t in turns if t["isFollowUp"]]
    assert len(followup_turns) == 4, f"expected the global budget of 4 follow-ups, got {len(followup_turns)}"

    # global budget starts at 4 and is fully consumed; per-question runs never exceed 2
    assert rec["startFollowUpContext"]["global_follow_up_budget"] == 4
    assert turns[-1]["followUpContext"]["global_follow_up_budget"] == 4 - len(followup_turns)
    runs = []
    run = 0
    for t in turns:
        if t["isFollowUp"]:
            run += 1
        else:
            if run:
                runs.append(run)
            run = 0
    if run:
        runs.append(run)
    assert max(runs) <= 2, f"more than 2 follow-ups on a single question: {runs}"

    # a follow-up question quotes the previous answer ("You said: ...")
    quoted = 0
    for t in turns:
        nq = t["nextQuestion"]
        if nq and nq.get("followUpOf") is not None:
            assert "You said:" in t["nextReply"]
            assert t["answer"] in t["nextReply"]
            quoted += 1
    assert quoted == len(followup_turns)

    # still completes with the hard floor met
    assert turns[-1]["nextDone"] is True
    assert rec["finalSessionView"]["questionCount"] >= 8
    assert len(set(rec["finalSessionView"]["daysAsked"])) >= 4

    feedback = rec["feedback"]
    assert feedback["summary"].startswith("Tyler Brooks")
    assert "averaging" in feedback["summary"]
    assert feedback["gaps"]


# ---------------------------------------------------------------------------
# 3. Strong candidate, mixed performance: difficulty rises then falls.
# ---------------------------------------------------------------------------


def test_strong_mixed_difficulty_adaptation(stack, transcript, sessions_dir):
    candidate = CANDIDATES["CAND-003"]  # Emily Chen, AI Engineer (starts medium)
    sid = _sid("mixed")
    rec = run_interview(
        stack, transcript, sid, candidate, DifficultyProbePolicy(),
        out_path=sessions_dir / f"{sid}.json",
    )

    assert rec["startingTier"] == "strong"
    assert rec["startingDifficulty"] == "medium"
    assert rec["finished"] is True

    turns = rec["turns"]
    assert len(turns) >= 8
    assert any(t["score"] == 10.0 for t in turns)
    assert any(t["score"] < 5.0 for t in turns)
    assert any(t["isFollowUp"] for t in turns)

    states = [t["difficultyState"]["current_difficulty"] for t in turns]

    # rise: a hard difficulty state must be followed by a hard question
    assert any(
        states[i] == "hard" and turns[i + 1]["difficulty"] == "hard"
        for i in range(len(turns) - 1)
    ), "difficulty never rose to hard"
    # fall: hard -> medium transition after the weak streak
    assert any(
        states[i] == "hard" and states[i + 1] == "medium"
        for i in range(len(turns) - 1)
    ), "difficulty never adapted back down"

    assert turns[-1]["nextDone"] is True
    assert rec["finalSessionView"]["questionCount"] >= 8
    assert len(set(rec["finalSessionView"]["daysAsked"])) >= 4


# ---------------------------------------------------------------------------
# 4. Personalization: different candidates -> different tier/difficulty/plan.
# ---------------------------------------------------------------------------


def test_personalization_across_candidates(stack, transcript, run_dir):
    picks = [
        ("CAND-001", "Sarah Johnson"),   # expert -> hard
        ("CAND-003", "Emily Chen"),      # strong -> medium
        ("CAND-007", "Ethan Brooks"),    # developing -> medium
        ("CAND-017", "Tyler Brooks"),    # novice -> easy
    ]
    summary = {}
    with httpx.Client(base_url=GATEWAY_URL, timeout=60) as client:
        for cid, name in picks:
            candidate = CANDIDATES[cid]
            sid = _sid(f"start-{cid.lower()}")
            start = client.post(
                "/api/interview", json={"sessionId": sid, "candidate": candidate}
            )
            start.raise_for_status()
            entry = transcript.poll(sid, 0)
            resp = entry["response"]
            ag = resp["agentState"]
            plan_days = sorted({p["day"] for p in ag["interview_plan"]})
            summary[cid] = {
                "name": name,
                "tier": ag["candidate_context"]["tier"],
                "startingDifficulty": ag["difficulty_state"]["current_difficulty"],
                "planDays": plan_days,
                "firstQuestionTopic": resp["question"]["topic"],
                "firstQuestionDifficulty": resp["question"]["difficulty"],
            }

    tiers = {v["tier"] for v in summary.values()}
    assert tiers == {"expert", "strong", "developing", "novice"}, tiers
    difficulties = {v["startingDifficulty"] for v in summary.values()}
    assert "hard" in difficulties and "easy" in difficulties and "medium" in difficulties

    assert summary["CAND-001"]["startingDifficulty"] == "hard"
    assert summary["CAND-017"]["startingDifficulty"] == "easy"
    assert summary["CAND-001"]["firstQuestionDifficulty"] == "hard"
    assert summary["CAND-017"]["firstQuestionDifficulty"] == "easy"

    # plans are personalized, not identical
    assert summary["CAND-001"]["planDays"] != summary["CAND-017"]["planDays"]
    assert summary["CAND-003"]["planDays"] != summary["CAND-017"]["planDays"]
    assert all(len(v["planDays"]) >= 4 for v in summary.values())

    _save(run_dir / "personalization.json", {"profiles": summary})
    print(json.dumps(summary, indent=2))


# ---------------------------------------------------------------------------
# 5. Curriculum grounding: every question maps to the real curriculum days.
# ---------------------------------------------------------------------------


def test_curriculum_grounding(stack, transcript, sessions_dir):
    curriculum = load_curriculum()
    days_map = {d["day"]: d for d in curriculum["days"]}

    recs = [json.loads(p.read_text(encoding="utf-8")) for p in _session_files(sessions_dir)]
    if not recs:  # isolated run fallback
        candidate = CANDIDATES["CAND-001"]
        sid = _sid("grounding")
        recs = [run_interview(stack, transcript, sid, candidate, strong_answer,
                              out_path=sessions_dir / f"{sid}.json")]

    assert recs, "no sessions available for grounding checks"
    for rec in recs:
        plan = rec["plan"]
        assert len(plan) >= 8, f"plan shorter than the 8-question floor: {len(plan)}"
        plan_days = set()
        for p in plan:
            day = days_map.get(p["day"])
            assert day is not None, f"plan references unknown day {p['day']}"
            assert p["topic"] == day["title"], f"plan topic mismatch on day {p['day']}"
            assert set(p["concepts"]) <= set(day["tools"]), (
                f"plan concepts not grounded on day {p['day']}"
            )
            plan_days.add(p["day"])
        assert len(plan_days) >= 4

        for t in rec["turns"]:
            day = days_map.get(t["day"])
            assert day is not None, f"turn references unknown day {t['day']}"
            assert t["topic"] == day["title"], f"turn topic mismatch on day {t['day']}"
            assert set(t["expectedConcepts"]) <= set(day["tools"]), (
                f"turn {t['turn']} concepts not grounded on day {t['day']}"
            )

        asked = set(rec["finalSessionView"]["daysAsked"])
        assert asked <= plan_days


# ---------------------------------------------------------------------------
# 6. Final feedback shape and specificity.
# ---------------------------------------------------------------------------


def test_feedback_shape_and_specificity(stack, transcript, sessions_dir):
    recs = {r["candidateId"]: r for r in
            (json.loads(p.read_text(encoding="utf-8")) for p in _session_files(sessions_dir))}
    if "CAND-001" not in recs:
        candidate = CANDIDATES["CAND-001"]
        sid = _sid("feedback")
        rec = run_interview(stack, transcript, sid, candidate, strong_answer,
                            out_path=sessions_dir / f"{sid}.json")
        recs[rec["candidateId"]] = rec

    expected = {"summary", "strengths", "gaps", "next"}
    for cid, rec in recs.items():
        fb = rec["feedback"]
        assert fb is not None
        assert set(fb) == expected, f"{cid}: feedback keys {set(fb)}"
        assert isinstance(fb["summary"], str) and fb["summary"].strip()
        assert fb["next"]
        assert rec["candidateName"] in fb["summary"], f"{cid}: summary does not name candidate"

    sarah = recs["CAND-001"]["feedback"]
    assert "performed well" in sarah["summary"]
    assert all(s.startswith("Covered concept:") for s in sarah["strengths"])

    tyler = recs.get("CAND-017")
    if tyler:
        assert "building fundamentals" in tyler["feedback"]["summary"]
        assert tyler["feedback"]["gaps"]


# ---------------------------------------------------------------------------
# 7. Public error contract and graceful degradation with Redis down.
# ---------------------------------------------------------------------------


def test_public_error_contract_and_health(stack, transcript, sessions_dir):
    with httpx.Client(base_url=GATEWAY_URL, timeout=60) as client:
        # graceful degradation: with no Redis the gateway runs its in-memory store
        health = client.get("/health")
        assert health.status_code == 200
        body = health.json()
        assert body["checks"]["store"] == "in-memory"

        # 404 unknown session
        unknown = _sid("unknown")
        r = client.post("/api/interview", json={"sessionId": unknown, "message": "hi"})
        assert r.status_code == 404
        assert "session not found" in r.json()["detail"]

        # 409 duplicate start
        dup = _sid("dup")
        candidate = CANDIDATES["CAND-002"]
        assert client.post("/api/interview", json={"sessionId": dup, "candidate": candidate}).status_code == 200
        r = client.post("/api/interview", json={"sessionId": dup, "candidate": candidate})
        assert r.status_code == 409
        assert "session already exists" in r.json()["detail"]

        # 422 malformed: neither candidate nor message; and both
        neither = client.post("/api/interview", json={"sessionId": _sid("none")})
        assert neither.status_code == 422
        both = client.post(
            "/api/interview",
            json={"sessionId": _sid("both"), "candidate": candidate, "message": "hi"},
        )
        assert both.status_code == 422

        # 409 reuse of a completed session
        done = _sid("done")
        rec = run_interview(stack, transcript, done, candidate, strong_answer,
                            out_path=sessions_dir / f"{done}.json")
        assert rec["finished"] is True
        r = client.post("/api/interview", json={"sessionId": done, "message": "one more"})
        assert r.status_code == 409
        assert "session already completed" in r.json()["detail"]
