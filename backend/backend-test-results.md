# Backend Test Results

_Generated 2026-08-09 by the backend verification task._

## 1. Phase A — existing per-service suites (real unit/integration tests)

All four suites run green. The earlier deep-dive claimed 164 collected; re-measured, the true collected count is **176 (175 passed + 1 skipped)**. The 12-test drift is explained: the deep-dive grep (`^\s*def test_`) missed `async def test_*` functions (8 in gateway, 4 in interview-agent).

| Suite | Collected | Failed |
|---|---|---:|
| gateway | 26 | 0 |
| interview-agent | 43 | 0 |
| ai-intelligence | 46 | 1 (live-key Groq test, skipped) |
| shared | 60 | 0 |
| **Total** | **176** | **1 skipped** |

Re-run commands (each from its service directory):

```text
python -m pytest    # from backend/services/gateway (or backend/shared)
python -m pytest    # from backend/services/interview-agent (or backend/shared)
python -m pytest    # from backend/services/ai-intelligence (or backend/shared)
python -m pytest    # from backend/services/shared (or backend/shared)
```

## 2. Phase B — live end-to-end interview tests (new)

The public gateway API only exposes `{reply, done, feedback}` per turn, so scores, days and difficulty are invisible to an external client. To observe the real behavior through the real HTTP chain without touching internals, the suite runs the services as subprocesses and inserts a **transparent recording proxy** (gateway -> proxy -> interview-agent -> ai-intelligence). The proxy forwards every request verbatim and logs JSON bodies to `proxy.jsonl`; it mocks nothing.

- Services: ai-intelligence `:8012`, interview-agent `:8011`, recording proxy `:8013`, gateway `:8010`.
- `LLM_PROVIDER=fake` (the production default), curriculum from `backend/curriculum.json`, Redis pointed at an unreachable port so the gateway exercises its documented in-memory fallback.
- Stack ready in ~4.1s; 51 gateway→agent calls recorded.

### 2.1 Test results

| Test | Scenario | Result |
|---|---|---|
| `test_expert_strong_full_interview` | CAND-001 expert, all-strong answers | PASS |
| `test_novice_weak_followups_budget_and_bottom_clamp` | CAND-017 novice, all-weak answers | PASS |
| `test_strong_mixed_difficulty_adaptation` | CAND-003 strong, mixed answers | PASS |
| `test_personalization_across_candidates` | 4 tiers, distinct plans/difficulty | PASS |
| `test_curriculum_grounding` | every question maps to curriculum.json days/tools | PASS |
| `test_feedback_shape_and_specificity` | feedback summary/strengths/gaps/next | PASS |
| `test_public_error_contract_and_health` | 404/409/409/422 + in-memory health | PASS |

Run command (from `backend/`): `python -m pytest tests_e2e -q` — **7 passed**.

### 2.2 Session summaries

| Session | Candidate | Tier | Start | Q's | Follow-ups | Days asked | Avg score |
|---|---|---|---|---:|---:|---|---:|---:|
| e2e-expert-48802ff9 | Sarah Johnson | expert | hard | 8 | 0 | 5 | 10.0 |
| e2e-done-3da879de | Alex Turner | strong | medium | 8 | 0 | 7 | 10.0 |
| e2e-mixed-77595846 | Emily Chen | strong | medium | 12 | 4 | 4 | 5.6 |
| e2e-novice-976774b3 | Tyler Brooks | novice | easy | 14 | 4 | 10 | 1.3 |

### 2.3 Personalization across candidates

All four tiers are represented and produce different starting difficulty, plans and first questions.

| Candidate | Tier | Starting difficulty | Plan days | First question |
|---|---|---|---|---|
| Sarah Johnson | expert | hard | 8, 10, 12, 28, 29 | hard: Vector Databases Overview |
| Emily Chen | strong | medium | 21, 22, 23, 31 | medium: Model Context Protocol (MCP) |
| Ethan Brooks | developing | medium | 22, 27, 28, 31 | medium: Multi-Agent Orchestration |
| Tyler Brooks | novice | easy | 1, 3, 7, 8, 10, 12, 16, 22, 28, 31 | easy: VS Code & Python Environment Setup |

### 2.4 Difficulty adaptation trace (CAND-003, strong → medium start)

Two consecutive scores ≥ 8 step difficulty up; two consecutive < 5 step it down. The trace shows medium → hard → medium → hard → medium → hard.

| Turn | Q/FU | Day | Difficulty asked | Score | Difficulty state after | Budget left |
|---|---|---:|---|---:|---|---:|
| 0 | question | 23 | medium | 10.0 | medium | 4 |
| 1 | question | 31 | medium | 10.0 | hard | 4 |
| 2 | question | 23 | hard | 1.3 | hard | 3 |
| 3 | follow-up | 23 | hard | 1.3 | medium | 2 |
| 4 | follow-up | 23 | hard | 1.3 | medium | 2 |
| 5 | question | 31 | medium | 10.0 | medium | 2 |
| 6 | question | 22 | medium | 10.0 | hard | 2 |
| 7 | question | 22 | hard | 1.3 | hard | 1 |
| 8 | follow-up | 22 | hard | 1.3 | medium | 0 |
| 9 | follow-up | 22 | hard | 1.3 | medium | 0 |
| 10 | question | 21 | medium | 10.0 | medium | 0 |
| 11 | question | 21 | medium | 10.0 | hard | 0 |

### 2.5 Follow-up behavior

- Weak answers (score < 6) trigger a follow-up that quotes the previous answer (`You said: "..."`) and targets the missed concepts.
- Global budget = 4, max 2 follow-ups per question (verified: 4 follow-ups consumed, no run > 2).
- Novice candidate at EASY stayed EASY (bottom clamp); expert at HARD stayed HARD (top clamp).

### 2.6 Curriculum grounding

Every planned slot and every asked question's `day`/`topic`/`expectedConcepts` was validated against `curriculum.json` (day exists, topic == day title, concepts ⊆ day tools); `daysAsked` ⊆ plan days.

### 2.7 Error contract

- 404 unknown session; 409 duplicate start; 409 reuse of a completed session; 422 missing or ambiguous payload.
- Gateway `/health` with Redis down returns 200 and `store: in-memory`.

## 3. New gaps / findings

- **Public API omits scores/days/difficulty** — The gateway only exposes `{reply, done, feedback}`; an external client cannot see scores, difficulty or per-question metadata. Internal visibility required the recording proxy.
- **Plan length is a floor, not an exact count** — The planner nominally targets 8 questions, but candidates with many weak/skipped days get more (CAND-017 Tyler: 10-question plan). Completion is still guarded by the ≥8-question/≥4-day floor, so behavior is safe, but interview length varies and the documented 'exactly 8' wording is inaccurate.
- **Follow-ups inherit the graded question's difficulty** — A follow-up takes the difficulty of the question it probes, not the current dynamic difficulty (visible in the trace: hard follow-ups while the state shows medium). Cosmetic, but the follow-up can feel harder than the adapted level.
- **Health cannot distinguish 'Redis down' from 'in-memory ok'** — `/health` pings the active store; with the fallback it returns 200 / `checks.redis: ok` even though real Redis is unreachable. Ops tooling would not see the degradation.
- **Fake-mode evaluation always emits a generic gap** — 100%-coverage answers still produce `Could go deeper on the technical details.`, which then leaks into day-level feedback (`Day 8: revisit Could go deeper...`). Fake-mode only; cosmetic.
- **Expected concepts are not in the public reply** — The public question text enumerates concepts for easy/medium/hard templates, but the exact `expectedConcepts` list only exists in the internal agent response (captured via the proxy).

## 4. Artifacts

- `tests_e2e/` — harness, recording proxy, tests, `report.py`.
- `tests_e2e/transcripts/latest/` — service logs, `proxy.jsonl`, per-session JSON transcripts.
- Full per-session transcripts under `tests_e2e/transcripts/latest/sessions/` (4 sessions).
