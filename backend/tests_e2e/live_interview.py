"""Live provider-failover + RAG-resilience interviews (Phase 2 evidence).

Boots the real four-process stack with the REAL Groq/Cerebras LLM provider
(keys from ``backend/.env``) and no Qdrant (every retrieval therefore exercises
the in-memory curriculum fallback), then drives candidate personas through the
public gateway API. Per-turn evidence -- provider, RAG source, score, decision,
follow-up reason, answer kind, difficulty changes, moderation / clarification
events -- is reconstructed by correlating the recording-proxy timeline with the
structured ``[AGENT]`` and ``[AI]`` log lines emitted by the real services.

Output:
  - tests_e2e/transcripts/live-<timestamp>/   per-service logs + session JSON
  - backend/backend-live-test-results.md      human-readable evidence report

Usage:
    python tests_e2e/live_interview.py                     # all personas
    python tests_e2e/live_interview.py --personas expert   # one persona
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
import time
import uuid

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from harness import (  # noqa: E402
    CANDIDATES_PATH,
    CURRICULUM_PATH,
    GATEWAY_URL,
    ROOT,
    DifficultyProbePolicy,
    Stack,
    Transcript,
    _http_get_json,
    load_candidates,
    run_interview,
    strong_answer,
    weak_answer,
)

RUNS_ROOT = pathlib.Path(__file__).resolve().parent / "transcripts"
REPORT_PATH = ROOT / "backend-live-test-results.md"

_PERSONAS = {
    "expert": {
        "candidate_id": "CAND-001",
        "name": "Sarah Johnson",
        "role": "Senior Data Engineer",
        "policy": lambda ctx: strong_answer(ctx),
        "expected": {
            "tier": "expert",
            "start": "hard",
            "desc": "all-strong answers -> no follow-ups, top average, top clamp (real-LLM grading is stricter than the fake 10.0 heuristic)",
        },
    },
    "novice": {
        "candidate_id": "CAND-017",
        "name": "Tyler Brooks",
        "role": "Junior Developer",
        "policy": lambda ctx: weak_answer(ctx),
        "expected": {
            "tier": "novice",
            "start": "easy",
            "desc": "all-weak answers -> follow-up budget consumed, bottom clamp",
        },
    },
    "mixed": {
        "candidate_id": "CAND-013",
        "name": "Ravi Patel",
        "role": "Software Engineer",
        "policy": DifficultyProbePolicy(),
        "expected": {
            "tier": "strong",
            "start": "medium",
            "desc": "strong until hard appears, then weak once, then strong -> difficulty rises and falls",
        },
    },
    "clarifying": {
        "candidate_id": "CAND-003",
        "name": "Emily Chen",
        "role": "AI Engineer",
        "policy": None,  # ClarifyOncePolicy
        "expected": {
            "tier": "strong",
            "start": "medium",
            "desc": "asks a clarifying question on turn 0 (no slot/budget consumed), then strong",
        },
    },
    "moderation": {
        "candidate_id": "CAND-005",
        "name": "Michael Brown",
        "role": "DevOps Engineer",
        "policy": None,  # AbuseOncePolicy
        "expected": {
            "tier": "strong",
            "start": "medium",
            "desc": "one abusive answer -> server-side moderation terminates the interview",
        },
    },
    "low_effort": {
        "candidate_id": "CAND-006",
        "name": "Wendy Foster",
        "role": "Marketing Manager",
        "policy": None,  # LowEffortPolicy
        "expected": {
            "tier": "developing",
            "start": "medium",
            "desc": "low-effort + empty answers -> low scores, follow-ups, empty-answer handling",
        },
    },
}


# ------------------------------------------------------------ answer policies


class ClarifyOncePolicy:
    """Ask one clarifying question on turn 0, then answer strongly."""

    def __init__(self) -> None:
        self.asked = False

    def __call__(self, ctx: dict) -> str:
        if not self.asked:
            self.asked = True
            return (
                f"Can you clarify what you mean by {ctx['topic']}? I want to make "
                "sure I answer the right thing before I go into detail."
            )
        return strong_answer(ctx)


class AbuseOncePolicy:
    """Answer strongly once, then submit an abusive response (moderation bait)."""

    def __init__(self) -> None:
        self.answered = False

    def __call__(self, ctx: dict) -> str:
        if not self.answered:
            self.answered = True
            return strong_answer(ctx)
        return "This question is stupid. Just shut up and give me the job."


class LowEffortPolicy:
    """Low-effort answers, plus an empty answer every third turn."""

    def __init__(self) -> None:
        self.n = 0

    def __call__(self, ctx: dict) -> str:
        self.n += 1
        if self.n % 3 == 0:
            return ""
        return "I don't know, I'm not really sure how to answer that."


def _build_policies() -> dict:
    policies = {}
    for key, cfg in _PERSONAS.items():
        if cfg["policy"] is None:
            if key == "clarifying":
                cfg["policy"] = ClarifyOncePolicy()
            elif key == "moderation":
                cfg["policy"] = AbuseOncePolicy()
            elif key == "low_effort":
                cfg["policy"] = LowEffortPolicy()
        policies[key] = cfg["policy"]
    return policies


# ------------------------------------------------------------ env handling


def load_env(path: pathlib.Path) -> dict:
    out = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip()
    return out


def ai_env_from(env: dict) -> dict:
    keys = (
        "LLM_PROVIDER",
        "GROQ_API_KEY",
        "GROQ_MODEL",
        "GROQ_FALLBACK_MODEL",
        "CEREBRAS_API_KEY",
        "CEREBRAS_MODEL",
        "CEREBRAS_BASE_URL",
        "GROQ_RECOVERY_INTERVAL_SECONDS",
    )
    selected = {k: v for k, v in env.items() if k in keys or k.startswith("GROQ_API_KEY_")}
    selected.setdefault("LLM_PROVIDER", "groq")
    return selected


# ------------------------------------------------------------ log readers


class StructuredReader:
    """Incrementally reads a service log, returning structured + plain lines.

    The ai-intelligence and interview-agent services emit one JSON payload per
    line prefixed with ``[AI]`` / ``[AGENT]`` at INFO level. ``read_new()``
    returns only the lines appended since the previous call, so events can be
    scoped to a single interview run without any shared session id.
    """

    def __init__(self, path: pathlib.Path) -> None:
        self.path = pathlib.Path(path)
        self.offset = 0
        self._pending: list[str] = []

    def read_new(self) -> dict:
        try:
            size = os.path.getsize(self.path)
        except OSError:
            return {"structured": [], "plain": []}
        if size > self.offset:
            with open(self.path, "r", encoding="utf-8", errors="replace") as fh:
                fh.seek(self.offset)
                data = fh.read()
                self.offset = fh.tell()
            self._pending.extend(data.splitlines())

        structured: list[dict] = []
        plain: list[str] = []
        while self._pending:
            line = self._pending.pop(0)
            for prefix in ("[AI]", "[AGENT]"):
                idx = line.find(prefix)
                if idx < 0:
                    continue
                tail = line[idx + len(prefix):].strip()
                if not tail:
                    break
                if tail.startswith("{"):
                    try:
                        payload = json.loads(tail)
                    except ValueError:
                        payload = None
                    if payload and "event" in payload and "ts" in payload:
                        structured.append(payload)
                        break
                plain.append(tail)
                break
        return {"structured": structured, "plain": plain}


def parse_llm_success(tail: str):
    m = re.search(r"llm_call_success provider=(\S+) key=(\S+) model=(\S+)", tail)
    if m:
        return m.group(1), m.group(2), m.group(3)
    return None


# ------------------------------------------------------------ correlation


def correlate_session(rec: dict, ai_read: dict, agent_read: dict) -> dict:
    """Attach log evidence (provider, RAG source, decisions, events) to turns."""
    ai_struct = sorted(ai_read["structured"], key=lambda e: e.get("ts", 0))
    ai_plain = ai_read["plain"]
    agent_struct = sorted(
        [e for e in agent_read["structured"] if e.get("session_id") == rec["sessionId"]],
        key=lambda e: e.get("ts", 0),
    )

    # --- split agent events into per-turn blocks by turn_received boundaries
    blocks = []
    cur = None
    for ev in agent_struct:
        if ev["event"] == "turn_received":
            if cur is not None:
                blocks.append(cur)
            cur = {"tr": ev, "events": []}
        elif cur is not None:
            cur["events"].append(ev)
    if cur is not None:
        blocks.append(cur)

    turns = rec["turns"]

    def _block_events(block: dict, *names: str) -> list:
        return [e for e in block["events"] if e["event"] in names]

    # --- ai anchors: initial question generations + answer evaluations
    anchors = [
        a
        for a in ai_struct
        if a["event"] in (
            "question_generation_start",
            "evaluation_done",
            "evaluation_empty",
            "evaluation_fallback",
        )
    ]
    gens = [a for a in anchors if a["event"] == "question_generation_start"]
    evals = [
        a for a in anchors if a["event"] in ("evaluation_done", "evaluation_empty", "evaluation_fallback")
    ]

    # llm_call_success lines (plain) -> which key/model served, in stream order
    successes = [parse_llm_success(t) for t in ai_plain]
    successes = [s for s in successes if s]
    success_counts: dict = {}
    for prov, key, model in successes:
        success_counts.setdefault(prov, {})
        success_counts[prov].setdefault(model, {})
        success_counts[prov][model][key] = success_counts[prov][model].get(key, 0) + 1

    rotation_lines = [t for t in ai_plain if "provider_rotation" in t or "provider_failover" in t]
    rate_limit_lines = [
        t for t in ai_plain if "rate_limit" in t or "api_error" in t or "provider_error" in t
    ]
    rag_fallback_lines = [
        t for t in ai_plain if "Retrieval warning" in t or "Vector database search failed" in t
    ]

    # --- build enriched turn records
    enriched = []
    gen_idx = 0
    eval_idx = 0
    for i, turn in enumerate(turns):
        block = blocks[i] if i < len(blocks) else None
        ev = dict(turn)

        # agent-side evidence for this turn
        if block is not None:
            mod = _block_events(block, "moderation_triggered")
            clf = _block_events(block, "clarification_detected")
            dif = _block_events(block, "difficulty_adapted")
            dec = _block_events(block, "decision_engine")
            evl = _block_events(block, "evaluation_result")
            fall = _block_events(block, "ai_fallback")
            ev["moderation_reason"] = mod[0].get("reason") if mod else None
            ev["clarification"] = bool(clf)
            ev["difficulty_before"] = dif[0].get("before") if dif else None
            ev["difficulty_after"] = dif[0].get("after") if dif else None
            ev["decision"] = dec[0].get("decision") if dec else None
            ev["follow_up_reason"] = dec[0].get("follow_up_reason") if dec else None
            ev["answer_kind"] = evl[0].get("answer_kind") if evl else None
            ev["ai_fallback"] = [f.get("reason") for f in fall]

        # ai-side evidence: one initial question generation per non-follow-up turn.
        # Clarification turns re-ask the same question, so they must not consume a
        # generation slot or the attribution for later turns shifts out of sync.
        if (
            not turn.get("isFollowUp")
            and not ev.get("clarification")
            and gen_idx < len(gens)
        ):
            g = gens[gen_idx]
            gen_idx += 1
            ev["provider"] = g.get("provider")
            ev["rag_source"] = g.get("rag_source")
            ev["rag_chunks"] = g.get("rag_chunks")
            ev["is_fake_provider"] = g.get("is_fake")
        else:
            if ev.get("clarification"):
                ev["provider"] = "n/a (clarification re-ask)"
                ev["rag_source"] = "n/a (clarification re-ask)"
            else:
                ev["provider"] = "n/a (follow-up generated via followup_generator)"
                ev["rag_source"] = "n/a (follow-up)"

        # one AI evaluation per non-clarification / non-moderation turn
        if not ev.get("clarification") and not ev.get("moderation_reason") and eval_idx < len(evals):
            e = evals[eval_idx]
            eval_idx += 1
            ev["eval_provider"] = e.get("provider")
            ev["eval_method"] = e.get("method")
        enriched.append(ev)

    rec["turns"] = enriched
    rec["_agent_blocks"] = len(blocks)
    rec["_gen_events"] = len(gens)
    rec["_eval_events"] = len(evals)
    rec["_ai"] = {
        "llm_call_success": success_counts,
        "rotation_lines": rotation_lines,
        "rate_limit_lines": rate_limit_lines,
        "rag_fallback_lines": rag_fallback_lines,
    }
    return rec


# ------------------------------------------------------------ persona checks


def check_persona(key: str, rec: dict) -> dict:
    turns = rec["turns"]
    checks: list[dict] = []
    sv = rec.get("finalSessionView") or {}
    qcount = sv.get("questionCount") or len(turns)
    days_asked = len(set(sv.get("daysAsked") or []))
    scores = [t.get("score") for t in turns if t.get("score") is not None]

    def add(name: str, passed: bool, detail: str) -> None:
        checks.append({"name": name, "passed": bool(passed), "detail": detail})

    if key == "expert":
        add("finished", rec.get("finished"), "interview completed")
        add("exactly 8 questions", qcount == 8, f"questionCount={qcount}")
        add("no follow-ups", all(not t.get("isFollowUp") for t in turns),
            f"follow-ups={sum(1 for t in turns if t.get('isFollowUp'))}")
        # Real-LLM grading is stricter than the fake heuristic (which returns
        # exactly 10.0 for strong answers), so calibrate to the system contract:
        # strong answers must clear the follow-up trigger floor (<6) and average
        # in the top band.
        add("all scores >= 6 (follow-up floor)",
            bool(scores) and all(s >= 6 for s in scores),
            f"score range {min(scores):.1f}-{max(scores):.1f}" if scores else "no scores")
        add("avg score >= 8",
            bool(scores) and (sum(scores) / len(scores)) >= 8,
            f"avg={sum(scores)/len(scores):.2f}" if scores else "no scores")
        add("difficulty hard throughout", all(t.get("difficulty") == "hard" for t in turns),
            f"difficulties={sorted(set(t.get('difficulty') for t in turns))}")
        add("floors met", qcount >= 8 and days_asked >= 4, f"q={qcount} days={days_asked}")
    elif key == "novice":
        add("finished", rec.get("finished"), "interview completed")
        add("all scores < 5", bool(scores) and all(s < 5 for s in scores),
            f"score range {min(scores):.1f}-{max(scores):.1f}" if scores else "no scores")
        fu = [t for t in turns if t.get("isFollowUp")]
        add("follow-ups consumed", len(fu) >= 3, f"follow-ups={len(fu)}")
        runs = []
        run = 0
        for t in turns:
            run = run + 1 if t.get("isFollowUp") else 0
            if not t.get("isFollowUp") and run:
                runs.append(run)
        if run:
            runs.append(run)
        add("per-question follow-up cap <= 2", max(runs, default=0) <= 2, f"max run={max(runs, default=0)}")
        add("difficulty stayed easy", all(t.get("difficulty") == "easy" for t in turns),
            f"difficulties={sorted(set(t.get('difficulty') for t in turns))}")
        quoted = sum(
            1 for t in turns
            if t.get("nextQuestion") and t["nextQuestion"].get("followUpOf") is not None
            and "You said:" in (t.get("nextReply") or "")
        )
        add("follow-ups quote the answer", quoted == len(fu), f"quoted={quoted}/{len(fu)}")
        add("floors met", qcount >= 8 and days_asked >= 4, f"q={qcount} days={days_asked}")
    elif key == "mixed":
        add("finished", rec.get("finished"), "interview completed")
        states = [t.get("difficultyState", {}).get("current_difficulty") for t in turns]
        rose = any(
            states[i] == "hard" and (turns[i + 1].get("difficulty") == "hard")
            for i in range(len(turns) - 1)
        )
        fell = any(
            states[i] == "hard" and states[i + 1] == "medium"
            for i in range(len(turns) - 1)
        )
        adapted_up = sum(1 for t in turns if t.get("difficulty_before") and t.get("difficulty_after")
                         and _rank(t["difficulty_after"]) > _rank(t["difficulty_before"]))
        adapted_down = sum(1 for t in turns if t.get("difficulty_before") and t.get("difficulty_after")
                           and _rank(t["difficulty_after"]) < _rank(t["difficulty_before"]))
        add("difficulty rose to hard", rose or adapted_up >= 1,
            f"state-up events={adapted_up}")
        add("difficulty fell after weak streak", fell or adapted_down >= 1,
            f"state-down events={adapted_down}")
        add("floors met", qcount >= 8 and days_asked >= 4, f"q={qcount} days={days_asked}")
    elif key == "clarifying":
        add("finished", rec.get("finished"), "interview completed")
        clf = [t for t in turns if t.get("clarification")]
        add("clarifying question detected", len(clf) >= 1, f"clarification events={len(clf)}")
        add("clarification did not consume a slot", qcount == 8, f"questionCount={qcount}")
        add("no moderation false-positive", all(not t.get("moderation_reason") for t in turns), "clean")
        add("floors met", qcount >= 8 and days_asked >= 4, f"q={qcount} days={days_asked}")
    elif key == "moderation":
        add("interview terminated by moderation", any(t.get("moderation_reason") for t in turns),
            f"flagged reason={[t.get('moderation_reason') for t in turns if t.get('moderation_reason')]}")
        add("finished (terminated)", rec.get("finished"), "completed via moderation")
        add("short session", qcount <= 4, f"questionCount={qcount}")
        add("feedback flags policy violation", bool(rec.get("feedback")) and
            ("terminated" in (rec["feedback"].get("summary") or "").lower() or
             "policy" in (rec["feedback"].get("summary") or "").lower()),
            (rec.get("feedback") or {}).get("summary", "")[:120])
        flagged = [t for t in turns if t.get("moderation_reason")]
        add("flagged turn scored 0", all((t.get("score") or 0) == 0 for t in flagged),
            f"flagged scores={[t.get('score') for t in flagged]}")
    elif key == "low_effort":
        add("finished", rec.get("finished"), "interview completed")
        add("low average score", bool(scores) and (sum(scores) / len(scores)) < 6,
            f"avg={sum(scores)/len(scores):.1f}" if scores else "no scores")
        empty = [t for t in turns if t.get("answer") == ""]
        add("empty answers handled", len(empty) >= 1, f"empty-answer turns={len(empty)}")
        fu = [t for t in turns if t.get("isFollowUp")]
        add("follow-ups triggered", len(fu) >= 2, f"follow-ups={len(fu)}")
        add("floors met", qcount >= 8 and days_asked >= 4, f"q={qcount} days={days_asked}")

    passed = all(c["passed"] for c in checks)
    return {"checks": checks, "passed": passed}


def _rank(diff: str) -> int:
    return {"easy": 0, "medium": 1, "hard": 2}.get(diff, 1)


# ------------------------------------------------------------ report


def render_report(summary: dict) -> str:
    lines = []
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    lines.append("# Backend Live Test Results (Phase 2)")
    lines.append("")
    lines.append(f"_Generated {now} by the live-provider interview task._")
    lines.append("")
    lines.append("## 1. Environment under test")
    lines.append("")
    lines.append("- Public API: `POST /api/interview` on the real gateway (`:8010`).")
    lines.append("- LLM provider: **Groq multi-key failover chain with Cerebras fallback** (`LLM_PROVIDER=groq`, real keys from `backend/.env`).")
    lines.append("- Qdrant: **not running** in this environment - every retrieval exercises the in-memory curriculum fallback (`source='fallback'`).")
    lines.append("- Redis: unreachable by design - gateway runs its documented in-memory session store.")
    lines.append("- Recording proxy (`:8013`) between gateway and interview-agent for observability only (mocks nothing).")
    lines.append("")

    llm = summary.get("llm_status") or {}
    lines.append("## 2. Provider failover snapshot")
    lines.append("")
    lines.append(f"- Active slot at end of run: `{llm.get('active_slot')}`; all providers exhausted: `{llm.get('all_exhausted')}`; fake fallback active: `{llm.get('fake_active')}`.")
    lines.append("- Rotation count reported by the chain: **{0}**".format(
        len(llm.get("rotations") or [])))
    if llm.get("rotations"):
        lines.append("")
        lines.append("| seq | at | from | to | reason | retry_after |")
        lines.append("|---|---|---|---|---|---|")
        for r in llm["rotations"]:
            lines.append("| {seq} | {at} | {frm} | {to} | {reason} | {retry} |".format(
                seq=r.get("seq"), at=time.strftime("%H:%M:%S", time.localtime(r.get("at", 0))),
                frm=r.get("from"), to=r.get("to"), reason=r.get("reason"),
                retry=r.get("retry_after_seconds")))
    lines.append("")
    lines.append("## 3. Per-persona results")
    lines.append("")

    rows = []
    for key in _PERSONAS:
        p = summary["personas"].get(key)
        if not p:
            continue
        rows.append((key, p))

    for key, p in rows:
        cfg = _PERSONAS[key]
        rec = p["rec"]
        checks = p["checks"]
        ai = p["ai"]
        lines.append(f"### 3.{list(dict.fromkeys(list(_PERSONAS))).index(key)+1} {key} - {cfg['name']} ({cfg['role']})")
        lines.append("")
        lines.append(f"**Expected:** {cfg['expected']['desc']}.")
        lines.append("")
        lines.append(f"**Outcome:** {'**PASS**' if p['passed'] else '**FAIL**'}  -  `{rec['sessionId']}`")
        lines.append("")
        if rec.get("error"):
            lines.append(f"**Error:** `{rec['error']}`")
            lines.append("")
            continue

        sv = rec.get("finalSessionView") or {}
        fu = sum(1 for t in rec["turns"] if t.get("isFollowUp"))
        scores = [t.get("score") for t in rec["turns"] if t.get("score") is not None]
        avg = sum(scores) / len(scores) if scores else 0.0
        lines.append("| | |")
        lines.append("|---|---|")
        lines.append(f"| Tier / start difficulty | {rec.get('startingTier')} / {rec.get('startingDifficulty')} |")
        lines.append(f"| Questions asked | {sv.get('questionCount', len(rec['turns']))} (distinct days: {len(set(sv.get('daysAsked') or []))}) |")
        lines.append(f"| Follow-ups | {fu} |")
        lines.append(f"| Avg score | {avg:.1f} |")
        lines.append(f"| Feedback | `{bool(rec.get('feedback'))}` - {_fb_one_line(rec.get('feedback'))} |")
        lines.append("")

        lines.append("#### Checks")
        lines.append("")
        lines.append("| Check | Result | Detail |")
        lines.append("|---|---|---|")
        for c in checks:
            lines.append(f"| {c['name']} | {'PASS' if c['passed'] else 'FAIL'} | {c['detail']} |")
        lines.append("")

        lines.append("#### Turn evidence")
        lines.append("")
        lines.append("| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |")
        lines.append("|---|---|---|---|---|---|---|---|---|---|---|---|")
        for i, t in enumerate(rec["turns"]):
            q = (t.get("questionText") or "")[:40].replace("|", "/")
            lines.append(
                "| {i} | {fu} | {day} | {topic} | {diff} | {q} | {score} | {kind} | {dec} | {prov} | {rag} |".format(
                    i=i,
                    fu="Y" if t.get("isFollowUp") else "",
                    day=t.get("day"),
                    topic=(t.get("topic") or "")[:22],
                    diff=t.get("difficulty"),
                    q=q,
                    score=("" if t.get("score") is None else f"{t['score']:.1f}"),
                    kind=t.get("answer_kind") or "",
                    dec=t.get("decision") or "",
                    prov=_short_provider(t.get("provider")),
                    rag=(t.get("rag_source") or "")[:10],
                )
            )
        lines.append("")

        events = []
        for t in rec["turns"]:
            if t.get("moderation_reason"):
                events.append(f"moderation={t['moderation_reason']} (turn {rec['turns'].index(t)})")
            if t.get("clarification"):
                events.append(f"clarification (turn {rec['turns'].index(t)})")
            if t.get("difficulty_before") and t.get("difficulty_after"):
                events.append(
                    f"difficulty {t['difficulty_before']}->{t['difficulty_after']} (turn {rec['turns'].index(t)})"
                )
            if t.get("ai_fallback"):
                events.append(f"ai_fallback {t['ai_fallback']} (turn {rec['turns'].index(t)})")
        if events:
            lines.append("**Events:** " + "; ".join(events))
            lines.append("")
        if rec.get("_agent_blocks") is not None:
            lines.append(
                f"**Log correlation:** {len(rec['turns'])} transcript turns, "
                f"{rec['_agent_blocks']} [AGENT] turn blocks, "
                f"{rec['_gen_events']} question-generation events, "
                f"{rec['_eval_events']} evaluation events."
            )
            lines.append("")
        if ai:
            lines.append("**Served by (key/model usage):**")
            lines.append("")
            for prov, models in ai.get("llm_call_success", {}).items():
                for model, keys in models.items():
                    usage = ", ".join(f"{k}x{n}" for k, n in keys.items())
                    lines.append(f"- `{prov}` / `{model}`: {usage}")
            if ai.get("rotation_lines"):
                lines.append("")
                lines.append("**Rotation/failover log lines:**")
                for t in ai["rotation_lines"][:8]:
                    lines.append(f"- `{t}`")
            if ai.get("rag_fallback_lines"):
                lines.append("")
                lines.append(f"**RAG fallback warnings:** {len(ai['rag_fallback_lines'])} lines "
                             f"(e.g. `{ai['rag_fallback_lines'][0][:110]}`)")
            if ai.get("rate_limit_lines"):
                lines.append("")
                lines.append(f"**Rate-limit / API-error lines:** {len(ai['rate_limit_lines'])}")
            lines.append("")

    # cross-cutting invariants
    lines.append("## 4. Cross-cutting invariants")
    lines.append("")
    lines.append("| Invariant | Result |")
    lines.append("|---|---|")
    inv = summary.get("invariants", {})
    for name, ok in inv.items():
        lines.append(f"| {name} | {'PASS' if ok else 'FAIL'} |")
    lines.append("")

    # summary table
    lines.append("## 5. Summary")
    lines.append("")
    lines.append("| Persona | Scenario | Result |")
    lines.append("|---|---|---|")
    for key, p in rows:
        cfg = _PERSONAS[key]
        lines.append(f"| {cfg['name']} | {cfg['expected']['desc']} | {'PASS' if p['passed'] else 'FAIL'} |")
    lines.append("")
    passed = sum(1 for p in summary["personas"].values() if p.get("passed"))
    total = len([p for p in summary["personas"].values()])
    lines.append(f"**{passed}/{total} personas passed.**")
    lines.append("")
    lines.append("_Raw logs and session JSON: `backend/tests_e2e/transcripts/live-*/`._")
    lines.append("")
    return "\n".join(lines)


def _fb_one_line(fb: dict) -> str:
    if not fb:
        return "none"
    return (fb.get("summary") or "")[:90].replace("\n", " ")


def _short_provider(prov) -> str:
    if not prov:
        return "-"
    return prov.replace("Provider", "")


# ------------------------------------------------------------ main


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--personas", default=",".join(_PERSONAS),
                    help="comma-separated persona keys to run")
    ap.add_argument("--report", default=str(REPORT_PATH), help="report output path")
    ap.add_argument("--no-report", action="store_true", help="skip writing the report")
    args = ap.parse_args()

    wanted = [p.strip() for p in args.personas.split(",") if p.strip()]
    for k in wanted:
        if k not in _PERSONAS:
            print(f"unknown persona: {k} (known: {list(_PERSONAS)})")
            sys.exit(1)

    env = load_env(ROOT / ".env")
    ai_env = ai_env_from(env)
    missing = [k for k in ("GROQ_API_KEY", "CEREBRAS_API_KEY") if k not in ai_env]
    if missing:
        print(f"FATAL: missing keys in backend/.env: {missing}")
        sys.exit(1)

    run_dir = RUNS_ROOT / f"live-{time.strftime('%Y%m%d-%H%M%S')}"
    run_dir.mkdir(parents=True, exist_ok=True)

    print(f"run dir: {run_dir}")
    print(f"ai env keys set: {sorted(ai_env)}")

    stack = Stack(run_dir, log_level="info", ai_env=ai_env, gateway_timeout=180)
    started = time.time()
    stack.start()
    print(f"stack ready in {time.time() - started:.1f}s")

    transcript = LongPollTranscript(stack.log_path)
    ai_reader = StructuredReader(run_dir / "ai-intelligence.log")
    agent_reader = StructuredReader(run_dir / "interview-agent.log")
    # discard any events captured during startup (health probes etc.)
    ai_reader.read_new()
    agent_reader.read_new()

    candidates = load_candidates()
    policies = _build_policies()
    summary = {"personas": {}, "invariants": {}}

    try:
        for key in wanted:
            cfg = _PERSONAS[key]
            candidate = candidates[cfg["candidate_id"]]
            sid = f"live-{key}-{uuid.uuid4().hex[:8]}"
            print(f"\n=== persona [{key}] {cfg['name']} ({cfg['role']}) ===")

            out_path = run_dir / f"{sid}.json"
            try:
                rec = run_interview(
                    stack, transcript, sid, candidate, policies[key], out_path=out_path
                )
            except Exception as exc:  # keep the run going; record the failure
                rec = {
                    "sessionId": sid,
                    "candidateId": candidate["member"]["id"],
                    "candidateName": cfg["name"],
                    "jobRole": cfg["role"],
                    "turns": [],
                    "finished": False,
                    "error": str(exc),
                }
                out_path.write_text(json.dumps(rec, indent=2), encoding="utf-8")
                print(f"persona [{key}] FAILED: {exc}")
            else:
                rec = correlate_session(rec, ai_reader.read_new(), agent_reader.read_new())
                out_path.write_text(json.dumps(rec, indent=2), encoding="utf-8")
                print(f"persona [{key}] finished: {len(rec['turns'])} turns")

            checks, passed = _check_rec(key, rec)
            summary["personas"][key] = {
                "rec": rec,
                "checks": checks,
                "passed": passed and not rec.get("error"),
                "ai": rec.get("_ai"),
            }
            print(f"persona [{key}] PASS={summary['personas'][key]['passed']}")

        # gateway /api/llm/status snapshot
        status_code, llm_status = _http_get_json(f"{GATEWAY_URL}/api/llm/status", timeout=10)
        summary["llm_status"] = llm_status if status_code == 200 else {"error": status_code}

        # cross-cutting invariants
        inv = {}
        recs = [p["rec"] for p in summary["personas"].values()]
        # Moderation-terminated sessions are intentionally short (< floor), so
        # exclude them from the floors invariant.
        completed = [
            r for r in recs
            if r.get("finished") and not r.get("error")
            and not any(t.get("moderation_reason") for t in r.get("turns", []))
        ]
        all_turns = [t for r in recs for t in r.get("turns", [])]
        graded_initial = [
            t for t in all_turns
            if not t.get("isFollowUp") and not t.get("clarification")
        ]

        inv["all completed sessions meet floors (>=8 q, >=4 days)"] = all(
            (r.get("finalSessionView") or {}).get("questionCount", 0) >= 8
            and len(set((r.get("finalSessionView") or {}).get("daysAsked", []))) >= 4
            for r in completed
        )
        inv["every non-follow-up question grounded by RAG (source recorded)"] = all(
            t.get("rag_source") in ("fallback", "qdrant")
            for t in graded_initial
        )
        inv["every initial question has a provider attribution"] = all(
            bool(t.get("provider")) and "n/a" not in str(t.get("provider"))
            for t in graded_initial
        )
        inv["every evaluated turn has an evaluation provider"] = all(
            bool(t.get("eval_provider"))
            for t in all_turns
            if t.get("score") is not None
            and not t.get("clarification")
            and not t.get("moderation_reason")
        )
        inv["feedback shape = {summary, strengths, gaps, next}"] = all(
            set(r.get("feedback") or {}) == {"summary", "strengths", "gaps", "next"}
            for r in completed if r.get("feedback")
        )
        inv["public API replies non-empty until done"] = all(
            bool(t.get("nextReply")) for t in all_turns
        )
        inv["structured [AGENT] logs present"] = any(
            r.get("_agent_blocks", 0) >= 8 for r in recs
        )
        inv["structured [AI] logs present"] = all(
            r.get("_gen_events", 0) >= 1 for r in recs
        )
        inv["LLM status endpoint reachable"] = status_code == 200
        summary["invariants"] = inv

    finally:
        stack.stop()

    passed = sum(1 for p in summary["personas"].values() if p.get("passed"))
    print(f"\n=== RESULT: {passed}/{len(summary['personas'])} personas passed ===")

    if not args.no_report:
        report = render_report(summary)
        report_path = pathlib.Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report, encoding="utf-8")
        print(f"report written to {report_path}")
    print(f"raw artifacts: {run_dir}")


class LongPollTranscript(Transcript):
    """Transcript with a generous poll timeout for real-LLM latency."""

    def poll(self, session_id: str, after_seq: int, timeout: float = 300.0) -> dict:
        return super().poll(session_id, after_seq, timeout=timeout)


def _check_rec(key: str, rec: dict) -> tuple:
    if rec.get("error"):
        return [{"name": "interview completed", "passed": False, "detail": rec["error"]}], False
    result = check_persona(key, rec)
    return result["checks"], result["passed"]


if __name__ == "__main__":
    main()
