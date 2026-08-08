# Shared Contracts — Interview Agent

Version: **v1**

This directory is the **single source of truth for internal data contracts** between the
three backend services. Services do **not** import Python from here; each service mirrors
these contracts in its own local Pydantic models. Drift is caught by contract tests.

---

## 1. Contract version

- Current version: **v1** (frozen).
- The version is documented here and in `backend.md`. No per-field version numbers.

## 2. Ownership

| Artifact | Owner |
|---|---|
| `services/gateway/**` (public API, sessions, orchestration) | **Pranav** |
| `services/interview-agent/**` (behavior, planning, strategy) | **Shezan** |
| `services/ai-intelligence/**` (LLM, RAG, evaluation, feedback) | **Meraj** |
| `shared/**` (schemas, this doc, contract tests) | **All three review; Pranav maintains the files** |
| `data/**` (read-only inputs: `candidates.json`, `curriculum.json`) | All (copy owned by Pranav) |

`shared/` contains **no business logic and no importable Python code** — contract documents
(JSON Schemas) and this change log only.

## 3. Public API relationship

The public contract from `technical-spec.md` is authoritative and unchanged:

```
POST /api/interview   (no authentication)
```

| Phase | Request | Response |
|---|---|---|
| Start | `{"sessionId":"abc-123","candidate":{...candidate.json}}` | `{"reply":"Welcome...","done":false}` |
| Turn | `{"sessionId":"abc-123","message":"..."}` | `{"reply":"...","done":false}` |
| Final | last turn | `{"reply":"Interview completed.","done":true,"feedback":{"summary":"...","strengths":[],"gaps":[],"next":[]}}` |

Only the **Gateway** is exposed to the frontend. The frontend cannot observe that a
microservice architecture exists behind it.

## 4. Gateway → Interview Agent

Schemas: [`shared/schemas/agent_api.json`](../schemas/agent_api.json)

| Endpoint | Request | Response |
|---|---|---|
| `POST /internal/interview/start` | `agentStartRequest` | `agentStartResponse` |
| `POST /internal/interview/next` | `agentNextRequest` | `agentNextResponse` |
| `POST /internal/interview/follow-up` | `agentFollowUpRequest` | `agentFollowUpResponse` |
| `POST /internal/interview/complete` | `agentCompleteRequest` | `agentCompleteResponse` |
| `GET /health` | — | `healthResponse` |

Key rules:

- The **Gateway supplies**: `sessionId`, `candidate`, the full `conversation`, the current
  `agentState` blob, the `currentQuestion`, and the candidate's latest `message`.
- The **Agent returns**: `reply`, `done`, an (updated) opaque `agentState`, `sessionView`
  counters, optional `question` metadata, and — on completion — `feedback`.
- `agentState` is **opaque to the Gateway**: it is stored verbatim in Redis and passed back
  on the next call. The Gateway never validates or interprets it. Its meaning is owned by
  the Interview Agent.
- `sessionView` (`questionCount`, `daysAsked`, `scores`, `status`) is the only state the
  Gateway copies into its session document, for telemetry and tests.
- `follow-up` is optional; the Agent may fold follow-ups into `next`. When used, it carries
  the previous answer (via `message`/`conversation`) and must not introduce a new topic.

### 4.1 Completion ownership (hackathon floors)

> **The Interview Agent owns interview completion logic. The interview must not complete
> before satisfying the hackathon minimum of 8 questions across at least 4 curriculum days.**

- **The Gateway does NOT implement completion rules.** It never counts questions, never
  compares against floors, and never blocks or forces `done`. It stores/transports the
  Agent's `sessionView` counters verbatim and forwards the Agent's `done` flag unchanged.
  `MIN_QUESTIONS` / `MIN_CURRICULUM_DAYS` exist in the Gateway env only as configuration
  surface mirrored from backend.md §18.1 — the Gateway code must not act on them.
- `done` in `start` / `next` / `follow-up` responses is the **Agent's decision**. The schema
  keeps it a plain boolean and places **no maximum on `questionCount`** and **no minimum on
  `done=true`**, so the Agent may keep the interview open at 8, 9, 10+ questions and 4+
  distinct days, and must not return `done: true` before its own floors are satisfied.
- Only the **`complete`** response constrains `done` (`agentCompleteResponse.done:
  const true`), because `complete` is the terminal step the Agent has already decided.
- These contracts deliberately do **not** hard-code `8` or `4` into any schema. The Interview
  Agent owns the exact progression rule and may exceed the floors (upward-only, per
  backend.md §9.4). Contract tests in `shared/tests/test_interview_floors.py` prove the
  contract can represent 8+ questions and 4+ distinct days and permits no early completion.

## 5. Interview Agent → AI Intelligence

Schemas: [`shared/schemas/ai_api.json`](../schemas/ai_api.json)

| Endpoint | Request | Response |
|---|---|---|
| `POST /internal/ai/generate-question` | `generateQuestionRequest` | `generateQuestionResponse` |
| `POST /internal/ai/generate-followup` | `generateFollowupRequest` | `generateFollowupResponse` |
| `POST /internal/ai/evaluate-answer` | `evaluateAnswerRequest` | `evaluateAnswerResponse` |
| `POST /internal/ai/generate-feedback` | `generateFeedbackRequest` | `generateFeedbackResponse` |
| `POST /internal/ai/retrieve-context` | `retrieveContextRequest` | `retrieveContextResponse` |
| `GET /health` | — | `healthResponse` |

Key rules:

- **The Agent decides WHAT to ask** (`questionStrategy`, `followUpStrategy`); **AI
  Intelligence decides HOW to word it** (`question`, `type`, `difficulty`, `topic`, `day`,
  `expectedConcepts`, `retrievedContext`).
- `evaluateAnswerResponse` has a **deterministic structure** (`score`, `conceptCoverage`,
  `technicalAccuracy`, `depth`, `strengths`, `gaps`, `followUpRequired`, optional `notes`).
  LLM-backed and heuristic/fallback paths must produce the same schema.
- `retrieveContextResponse.source` is `qdrant` for vector retrieval and `fallback` when
  Qdrant is unavailable (documented minimal fallback in backend.md §16.2).
- `generateFeedbackResponse` uses exactly the four public contract fields
  (`summary`, `strengths`, `gaps`, `next`).
- These contracts do **not** prescribe prompt content, scoring weights, RAG internals,
  embedding models, or provider behavior. Those belong to Meraj.

## 6. Session structure

Schema: [`shared/schemas/session.json`](../schemas/session.json)

- The Gateway stores active interviews in Redis: key `session:{sessionId}`, JSON value, TTL
  (default 3600 s, refreshed on each turn).
- The document holds `sessionId`, `status`, `createdAt`, `updatedAt`, `candidate`,
  `agentState`, `currentQuestion`, `questionCount`, `daysAsked`, `conversation`, `scores`,
  `topicScores`, `finalFeedback`.
- `agentState` is opaque (see §4). Everything else is written by the Gateway from the
  Agent's `sessionView` plus the verbatim `candidate`/`conversation`.
- `questionCount` and `daysAsked` are **records**, not rules: the schema imposes no cap on
  `questionCount` and no requirement on `daysAsked`. Completion floors are the Agent's job
  (§4.1). `sessionView.daysAsked` items must be unique.

### 6.1 Data files location (mismatch with backend.md §15)

- backend.md §15 documents the read-only datasets at `backend/data/candidates.json` and
  `backend/data/curriculum.json`.
- The files currently live at the **repo root**: `./candidates.json` and
  `./curriculum.json` (outside `backend/`). The contract tests resolve them from the repo
  root (`REPO_ROOT`) and the frontend may also read them there.
- **Decision (least disruptive):** keep the files at the repo root for now — do not move or
  duplicate them. If a later repo re-org moves them into `backend/data/`, the only code that
  must change is the `REPO_ROOT`/data path in `backend/shared/tests/conftest.py` (and the
  Gateway tests' data-path helper). Datasets are read-only inputs; never edit them during a
  move.

## 7. Error format

All non-2xx responses use a structured error body (backend.md §16.4):

```json
{ "error": { "code": "SESSION_NOT_FOUND", "message": "session not found: abc-123", "detail": {} } }
```

- Internal services return the `{error: {...}}` shape above.
- The Gateway maps internal errors to the public `{detail: "..."}` shape for the single
  public endpoint.
- Status mapping (backend.md §16.2): unknown session → `404`; completed session receives a
  turn → `409`; validation → `422`; internal upstream failure → `503`; unexpected upstream
  error → `502`.

## 8. Health endpoints

Every service exposes `GET /health`:

```
200 {"status":"ok","service":"interview-gateway"}
```

- `interview-gateway`: liveness + Redis reachability (503 with `checks` when Redis is down).
- `interview-agent`: own liveness.
- `ai-intelligence`: own liveness plus optional Qdrant/LLM probe status.

Health checks must **never** depend on real LLM API calls.

## 9. Versioning rules

- Versioning is deliberately simple: the whole contract set is **v1**.
- A **breaking change** is any change to a request/response shape, a required/optional
  field, a type, an enum value, or an endpoint path that a producer or consumer must react
  to. Non-breaking additions (new optional fields, new endpoints) still require review.
- No developer silently modifies a shared contract.

## 10. Change approval process

Any breaking contract change requires, in order:

1. **Proposal** — describe the change, why it is needed, and who is affected, in this file.
2. **Team review** — all three owners approve (Gateway = Pranav, Agent = Shezan,
   AI = Meraj).
3. **Schema update** — edit the JSON Schema in `shared/schemas/`.
4. **CONTRACTS.md update** — document the change and bump the version if breaking.
5. **Contract tests update** — extend `shared/tests/` fixtures to cover the change.
6. **Producer + consumer updated** — both sides update their local Pydantic models in the
   same integration PR.

Contract tests fail on the producer side and the consumer side before integration, so a
change cannot silently slip through.

---

## Change log

| Version | Date | Change |
|---|---|---|
| v1 | 2026-08-08 | Initial freeze of session, Gateway → Agent, and Agent → AI contracts per backend.md §8.1 / §8.2 / §10.2. |
| v1 (docs+tests) | 2026-08-08 | Final architecture + contract audit. **Non-breaking** (no shape changes): documented that the Interview Agent owns interview completion logic (hackathon minimum of 8 questions across at least 4 curriculum days; no early completion) and that the Gateway must not enforce floors (§4.1); documented data-file location mismatch (§6.1); added `shared/tests/test_interview_floors.py` proving the contract supports 8+ questions, 4+ distinct days, follow-ups, and valid final feedback. |
