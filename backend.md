# BACKEND.md — Microservice Architecture for The Interview Agent

**Project:** The Interview Agent — "Build the interviewer, not the interview."
**Event:** ABTalks Vibe Coding Hackathon
**Team:** Pranav · Shezan · Meraj
**Status:** Architecture blueprint. No implementation code in this document.

---

## 1. EXECUTIVE SUMMARY

The backend is rebuilt as **three independently deployable microservices** that speak HTTP/REST:

| # | Service | Port | Owner | Core job |
|---|---------|------|-------|----------|
| 1 | `interview-gateway` | 8000 | Pranav | Public API, request lifecycle, Redis sessions, orchestration of internal calls |
| 2 | `interview-agent` | 8001 | Shezan | Interview *behavior*: candidate context, planning, question/follow-up strategy, progression |
| 3 | `ai-intelligence` | 8002 | Meraj | Everything AI: LLM abstraction, prompts, RAG/Qdrant, question/evaluation/feedback generation |

Plus two private infrastructure stores: **Redis** (ephemeral session state, TTL) and **Qdrant**
(vector database for curriculum retrieval). Redis and Qdrant are reachable only inside the
private network — never from the public frontend.

The **only** service exposed to the frontend is the Gateway. The public contract in
`technical-spec.md` is preserved byte-for-byte: `POST /api/interview`, keyed by `sessionId`,
ending with `done: true` + `feedback {summary, strengths, gaps, next}`. The frontend cannot tell
that a microservice architecture exists behind the Gateway.

The architecture keeps every functional requirement of the previous modular-monolith plan
(minimum 8 questions, minimum 4 curriculum days, candidate personalization, adaptive follow-ups,
contextual conversation, structured evaluation, actionable feedback) while giving each service its
own application entry point, Dockerfile, environment, tests, and owner — so the three developers
work in parallel without touching the same files.

---

## 2. ARCHITECTURE OVERVIEW

```
            ┌───────────────────────────────────────────────────────────────────┐
            │                        PRIVATE NETWORK                            │
            │                                                                   │
 frontend   │   ┌────────────────┐        ┌────────────────┐        ┌──────────┐ │
    │       │   │   Gateway      │  HTTP  │ Interview Agent│  HTTP  │ AI Int.  │ │
    │  POST │   │  :8000         ├───────►│ :8001          ├───────►│ :8002    │ │
    │ /api/ │   │                │        │                │        │    │     │ │
    ▼ interview│ │  Redis ←─────►│        │                │        │  Qdrant  │ │
    │       │   └────────────────┘        │                │        │  Embed.  │ │
    │       │                            └────────────────┘        │  LLM     │ │
    │       │                                                     └──────────┘ │
    └───────┴───────────────────────────────────────────────────────────────────┘
                    public           internal          internal (LLM/RAG/Vector)
```

Direction of calls:
- **Frontend → Gateway** (the only public route).
- **Gateway → Redis** (session store) and **Gateway → Interview Agent** (start / next / follow-up / complete).
- **Interview Agent → AI Intelligence** (generate question, generate follow-up, evaluate answer, retrieve context, generate feedback).
- **AI Intelligence → Qdrant** (vector retrieval) and **AI Intelligence → LLM** (OpenAI-compatible provider).

---

## 3. WHY THE ORIGINAL ARCHITECTURE WAS A MODULAR MONOLITH

The previous plan (`BACKEND_TEAM_PLAN.md`) placed every concern inside one FastAPI application:

```
backend/app/
  api/  core/  schemas/  services/  agents/  prompts/
  evaluation/  curriculum/  candidates/  sessions/  utils/
```

That gave us clean *logical* boundaries but a single *deployment unit*:

1. **One process, one Dockerfile, one container.** Interview logic, LLM prompting, RAG, evaluation
   and feedback could never be scaled, upgraded, or failed independently.
2. **Shared in-memory session registry inside the app process.** No real session infrastructure;
   state dies with the process.
3. **LLM/RAG code was adjacent to HTTP/API code** — one tight package, one deploy.
4. **No independent service contracts.** The "interfaces" were Python imports; changing one
   function signature rippled across the whole repo.
5. **Everything had to be tested together** for the API layer to be meaningful.

The rewrite keeps the *good* ideas (the schemas, the rubric, the 8/4 hard floors, the ownership
split, the test matrix) and makes them real: each logical module becomes a process with its own
lifecycle, storage, failure domain, and HTTP contract.

---

## 4. NEW MICROSERVICE ARCHITECTURE

Three services, two private stores, HTTP between services, one public route.

### 4.1 Service responsibilities (summary)

| Service | Responsibilities | Must NOT contain |
|---|---|---|
| **Gateway** | Public FastAPI app; `POST /api/interview`; request/response validation; CORS; session lifecycle; Redis session store (TTL); calling Interview Agent; calling AI Intelligence when required; timeouts; bounded retries; structured error mapping; health endpoint; env config; API logging; final response assembly | LLM prompting, RAG, evaluation algorithms, feedback generation, detailed question generation |
| **Interview Agent** | Candidate context; tier calculation; strong/weak/failed/skipped day analysis; curriculum selection; interview planning; question strategy; follow-up strategy; progression logic; difficulty calibration; "what to ask next"; maintains its own reasoning state (supplied by Gateway); issues structured requests to AI Intelligence | Provider-specific LLM code, embeddings, vector search, prompt *content* authoring, scoring math |
| **AI Intelligence** | LLM provider abstraction; OpenAI-compatible client; prompt management; question generation; follow-up generation; answer evaluation (rubric); feedback synthesis; RAG ingestion; embeddings; vector search; retrieval; evaluation reasoning; final feedback output | Public API exposure, session state, CORS to browser, interview flow decisions |

### 4.2 The "intelligence split" that defines the whole system

> **The Interview Agent decides WHAT should be asked.**
> **The AI Intelligence service decides HOW to generate the language — and how to judge answers.**

The Interview Agent is a deterministic state machine. Given candidate context, a plan, and the
conversation, it produces a `QuestionStrategy` (day, module, difficulty, whether this is a
follow-up, which concepts to probe) and hands it to AI Intelligence, which turns the strategy into
natural language and, later, into an evaluation. If the LLM provider disappears, the agent's flow
still works against AI Intelligence's deterministic fallback modes.

---

## 5. SERVICE RESPONSIBILITIES (detail)

### 5.1 `interview-gateway` (Pranav)

- Public FastAPI app bound to `:8000`.
- `POST /api/interview` — the only public route besides `GET /health`.
- Pydantic validation of the public request (`sessionId` + exactly one of `candidate`/`message`).
- Pydantic validation of the outgoing response so the public contract can never drift.
- CORS allow-list from `FRONTEND_ORIGINS`.
- **Session lifecycle** (create / load / update / complete / expire) backed by Redis with TTL.
- Orchestration of the interview:
  - start → `interview-agent /internal/interview/start`
  - turn → `interview-agent /internal/interview/next`
  - completion → `interview-agent /internal/interview/complete`
- Direct call to `ai-intelligence /health` and, if needed, `ai-intelligence /internal/ai/generate-feedback` (the agent already does this in the standard flow; the Gateway path exists as a fallback/recovery hook).
- HTTP client with **connect timeout**, **request timeout**, and **bounded retry** for idempotent calls only.
- Structured error mapping (§16): internal failures surface as controlled `503`, bad state as `404/409`, validation as `422`.
- `GET /health` reporting readiness (own process + Redis reachability).
- Structured request logging (method, path, sessionId, status, latency, upstream service).
- Final assembly of the public `InterviewResponse`.

### 5.2 `interview-agent` (Shezan)

Stateless over HTTP; all long-lived state is passed in by the Gateway and returned as
`agentState`. It owns:

- **Candidate context** — tier (`expert | strong | developing | novice`), strong/weak/failed/
  skipped day analysis, experience/role calibration.
- **Curriculum selection** — module mapping, day-type filtering, building the assessment plan.
- **Interview planning** — a coverage plan of ≥ 8 questions across ≥ 4 distinct days, interleaved
  across modules, prioritizing failed → skipped → weak → representative strong days, boosted by
  job-role keywords.
- **Question strategy** — for each plan slot, emits a `QuestionStrategy` (day, module, difficulty,
  concepts to probe, follow-up-of) sent to AI Intelligence for wording.
- **Follow-up strategy** — after an evaluation, decides follow-up vs next question vs finish
  (rules in §9.4), and encodes the previous answer into the follow-up request.
- **Difficulty calibration** — stepping up/down based on rolling scores and starting difficulty
  from tier/experience.
- **Progression logic and completion rule** — hard floors: never finish before 8 questions and 4
  distinct days.
- **Maintains its interview reasoning** — a versioned `agentState` JSON blob that the Gateway
  stores verbatim in Redis and passes back on the next call.

Internal API surface:
```
POST /internal/interview/start      GET /health
POST /internal/interview/next
POST /internal/interview/follow-up
POST /internal/interview/complete
```

### 5.3 `ai-intelligence` (Meraj)

Owns **all** LLM and RAG functionality:

- **LLM provider abstraction** — `ChatProvider` protocol, OpenAI-compatible HTTP/SDK client,
  configurable `base_url`/`model`/`api_key` so OpenAI, Azure OpenAI, Groq, and local Ollama are
  drop-in.
- **Prompt architecture** — system prompts for interviewer wording, evaluator, and feedback
  synthesis, plus builder functions; all prompts live in `app/llm/prompts/`.
- **Structured output** — JSON mode / function-calling with Pydantic validation and retry-on-parse-failure.
- **RAG pipeline** — ingestion (chunk curriculum.json → embeddings → Qdrant), semantic retrieval,
  and context assembly (§11).
- **Question generation** — converts a `QuestionStrategy` + retrieved curriculum context into
  polished question text.
- **Follow-up generation** — converts a follow-up strategy + previous answer + retrieved context
  into a probing question.
- **Answer evaluation** — rubric scoring producing a **deterministic structure** (`score`,
  `conceptCoverage`, `technicalAccuracy`, `depth`, `strengths`, `gaps`, `followUpRequired`)
  even though the reasoning uses an LLM; deterministic heuristic fallback when the LLM fails.
- **Feedback generation** — synthesizes `{summary, strengths, gaps, next}` from evaluations,
  coverage, candidate profile, and missed concepts.

Internal API surface:
```
POST /internal/ai/generate-question     POST /internal/ai/evaluate-answer
POST /internal/ai/generate-followup     POST /internal/ai/generate-feedback
POST /internal/ai/retrieve-context      GET /health
```

---

## 6. OWNERSHIP MATRIX

| Area | Files / services | Owner |
|---|---|---|
| API Gateway, public API, Redis sessions, session lifecycle, API schemas, service communication, internal shared secret, CORS, error handling, timeouts, retries, Docker Compose, deployment, env config, gateway tests, integration tests, final system integration | `services/gateway/**`, `docker-compose.yml`, root `.env.example`, `README.md` | **Pranav** |
| Candidate context, tier calculation, curriculum planning, assessment-day selection, interview plan, question strategy, difficulty calibration, follow-up decision logic, interview progression, agent service + agent tests | `services/interview-agent/**` | **Shezan** |
| LLM provider, prompt architecture, RAG, embeddings, Qdrant/vector DB, retrieval, question generation, follow-up generation, answer evaluation, rubric, feedback generation, AI service + tests, LLM failure handling | `services/ai-intelligence/**` | **Meraj** |
| Shared contracts (frozen Phase 1; changes only via team review) | `shared/**` | All (written by Pranav, reviewed by all) |
| Data files (read-only inputs) | `data/**` | All (copy owned by Pranav) |

Workload is balanced: Pranav owns cross-cutting integration + one service; Shezan owns one service
end-to-end; Meraj owns the largest service (AI + RAG + evaluation + feedback) split into two phases
(4 and 5) for pacing.

---

## 7. PUBLIC API CONTRACT (unchanged, authoritative)

From `technical-spec.md`. **This is the contract of record. Nothing below changes it.**

```
POST /api/interview        (no authentication)
```

| Phase | Request | Response |
|---|---|---|
| Start | `{"sessionId":"abc-123","candidate":{...candidate.json}}` | `{"reply":"Welcome...","done":false}` |
| Turn | `{"sessionId":"abc-123","message":"..."}` | `{"reply":"...","done":false}` |
| Final | last turn | `{"reply":"Interview completed.","done":true,"feedback":{"summary":"...","strengths":[],"gaps":[],"next":[]}}` |

Rules enforced by the Gateway:
- `sessionId` non-empty string.
- Exactly one of `candidate` / `message`. Both or neither → `422`.
- `candidate` validated against the `Candidate` shape from `candidates.json`.
- Unknown session → `404`. Completed session receives a turn → `409` (client must start a new
  sessionId). Invalid body → `422`. Internal upstream failure → `503` (controlled, §16).
- Response shape is re-validated on the way out; the Gateway can never emit a non-compliant body.

---

## 8. INTERNAL SERVICE CONTRACTS

All internal calls are `POST` with `Content-Type: application/json` (except `GET /health`).
Internal services may require the optional `X-Internal-Token` header (§21). The Gateway is the only
caller of the Interview Agent; the Interview Agent is the only caller of AI Intelligence (Gateway
may also call AI Intelligence `/health` and the feedback-recovery hook).

### 8.1 Gateway → Interview Agent

**`POST /internal/interview/start`**
```json
{
  "sessionId": "abc-123",
  "candidate": { "member": {}, "missions": [], "signals": {} }
}
```
```json
{
  "agentState": { "version": 1, "plan": [], "planIndex": 0, "followUpBudget": 4, "lastScores": [] },
  "sessionView": { "questionCount": 1, "daysAsked": [12], "scores": [], "status": "active" },
  "reply": "Welcome, Sarah. You completed the RAG end-to-end build... Let's start: ...",
  "question": { "questionId": "q-1", "type": "technical", "difficulty": "medium", "topic": "LLM Core, Prompting & Fine-Tuning", "day": 12 },
  "done": false
}
```

**`POST /internal/interview/next`**
```json
{
  "sessionId": "abc-123",
  "candidate": { "member": {}, "missions": [], "signals": {} },
  "agentState": { "version": 1, "plan": [], "planIndex": 1, "followUpBudget": 4, "lastScores": [] },
  "conversation": [ { "role": "agent", "content": "..." }, { "role": "candidate", "content": "..." } ],
  "currentQuestion": { "questionId": "q-1", "type": "technical", "difficulty": "medium", "topic": "...", "day": 12, "expectedConcepts": ["..."] },
  "message": "Vector embeddings represent dense numerical representations..."
}
```
```json
{
  "agentState": { "version": 1, "plan": [], "planIndex": 2, "followUpBudget": 3, "lastScores": [7.5], "coverage": { "12": 0.75 } },
  "sessionView": { "questionCount": 2, "daysAsked": [12], "scores": [7.5], "status": "active" },
  "reply": "Good, and when would you choose... ?",
  "question": { "questionId": "q-2", "type": "technical", "difficulty": "hard", "topic": "...", "day": 12, "followUpOf": "q-1" },
  "done": false
}
```

**`POST /internal/interview/follow-up`** (same shape as `next`; only used for explicit follow-ups
if the agent separates them — the agent may also fold follow-ups into `next`; see §9.4)

**`POST /internal/interview/complete`**
```json
{ "sessionId": "abc-123", "agentState": { "version": 1, "plan": [], "planIndex": 8, "followUpBudget": 1, "lastScores": [8.0, ...], "coverage": { "7": 0.8, "12": 0.75, "22": 0.9, "27": 0.5 } } }
```
```json
{
  "agentState": { "version": 1, "status": "completed" },
  "sessionView": { "questionCount": 8, "daysAsked": [7, 12, 22, 27], "scores": [8.0, ...], "status": "completed" },
  "reply": "Interview completed.",
  "done": true,
  "feedback": { "summary": "...", "strengths": [], "gaps": [], "next": [] }
}
```

### 8.2 Interview Agent → AI Intelligence

**`POST /internal/ai/generate-question`**
```json
{
  "candidateContext": { "candidateId": "CAND-001", "name": "Sarah Johnson", "role": "Senior Data Engineer", "tier": "strong", "strongDays": [], "weakDays": [], "failedDays": [], "skippedDays": [29] },
  "curriculumContext": { "modules": [], "days": {}, "plannedDays": [12, 7, 22, 27] },
  "conversation": [ { "role": "agent", "content": "..." } ],
  "questionStrategy": { "day": 12, "module": 4, "topic": "LLM Core, Prompting & Fine-Tuning", "difficulty": "medium", "concepts": ["zero-shot", "few-shot", "chain-of-thought"], "isFollowUp": false, "followUpOf": null },
  "retrievalQuery": "prompt engineering zero-shot few-shot chain-of-thought"
}
```
```json
{
  "question": "Can you describe the difference between zero-shot, few-shot, and chain-of-thought prompting, and when you would choose each?",
  "type": "technical",
  "difficulty": "medium",
  "topic": "LLM Core, Prompting & Fine-Tuning",
  "day": 12,
  "expectedConcepts": ["zero-shot", "few-shot", "chain-of-thought", "reasoning"],
  "retrievedContext": [ { "day": 12, "title": "Prompt Engineering Fundamentals", "objectives": [], "tools": [] } ]
}
```

**`POST /internal/ai/generate-followup`**
```json
{
  "candidateContext": { "...": "..." },
  "curriculumContext": { "...": "..." },
  "conversation": [ { "role": "candidate", "content": "Vector embeddings are dense numerical representations..." } ],
  "followUpStrategy": { "day": 12, "difficulty": "hard", "previousAnswer": "Vector embeddings are dense numerical representations...", "weakConcepts": ["chain-of-thought"], "questionStrategy": { "...": "..." } }
}
```
Response identical to `generate-question` (`question`, `type`, `difficulty`, `topic`, `day`,
`expectedConcepts`).

**`POST /internal/ai/evaluate-answer`**
```json
{
  "question": { "questionId": "q-2", "type": "technical", "difficulty": "hard", "topic": "...", "day": 12, "expectedConcepts": ["zero-shot", "few-shot", "chain-of-thought", "reasoning"] },
  "candidateContext": { "...": "..." },
  "retrievedContext": [ { "day": 12, "title": "Prompt Engineering Fundamentals", "objectives": [], "tools": [] } ],
  "candidateAnswer": "..."
}
```
```json
{
  "score": 7.5,
  "conceptCoverage": 0.8,
  "technicalAccuracy": 0.75,
  "depth": 0.7,
  "strengths": [],
  "gaps": ["chain-of-thought"],
  "followUpRequired": true,
  "notes": "Strong on zero-shot/few-shot; chain-of-thought reasoning only implied."
}
```
Evaluation output structure is **deterministic** — same inputs produce the same schema, and in
fallback mode the same scores.

**`POST /internal/ai/retrieve-context`**
```json
{ "query": "vector embeddings semantic search cosine similarity", "day": 7, "topic": "Embeddings & Vector Search", "candidateContext": { "...": "..." }, "topK": 3 }
```
```json
{ "context": [ { "day": 7, "title": "Embeddings Explained", "objectives": [], "tools": [], "score": 0.93 } ], "source": "qdrant" }
```

**`POST /internal/ai/generate-feedback`**
```json
{
  "candidate": { "member": {}, "missions": [], "signals": {} },
  "candidateContext": { "...": "..." },
  "evaluations": [ { "questionId": "q-1", "score": 8.0, "day": 12, "gaps": [], "strengths": [] } ],
  "coverage": { "7": 0.8, "12": 0.75, "22": 0.9, "27": 0.5 },
  "missedConcepts": { "12": ["chain-of-thought"] },
  "topicScores": [ { "module": 4, "topic": "LLM Core, Prompting & Fine-Tuning", "score": 7.5, "maxScore": 10, "notes": "..." } ]
}
```
```json
{ "summary": "...", "strengths": ["Vector search", "Prompt tuning"], "gaps": ["Observability"], "next": ["Practice Prometheus setup"] }
```

### 8.3 Health

```
GET /health  → 200 {"status":"ok","service":"interview-gateway"}         (any service)
```
Gateway `/health` also reflects Redis reachability. Agent `/health` reports its own liveness.
AI `/health` reports liveness plus optional Qdrant/LLM probe status.

---

## 9. DATA FLOW

### 9.1 Start
```
Frontend ──POST /api/interview {sessionId, candidate}──► Gateway
  Gateway: validate body; create Redis session {status:active, candidate}
  Gateway ──POST /internal/interview/start──► Interview Agent
  Agent: build CandidateContext → CurriculumContext → InterviewPlan → QuestionStrategy
  Agent ──POST /internal/ai/retrieve-context──► AI Intelligence ──► Qdrant
  Agent ──POST /internal/ai/generate-question──► AI Intelligence ──► LLM
  Agent: returns agentState + first question
  Gateway: persist agentState + currentQuestion + conversation; reply = question text
  Gateway ──{reply, done:false}──► Frontend
```

### 9.2 Turn
```
Frontend ──POST /api/interview {sessionId, message}──► Gateway
  Gateway: load session (404 unknown / 409 completed); append candidate message
  Gateway ──POST /internal/interview/next {candidate, agentState, conversation, currentQuestion, message}──► Interview Agent
  Agent ──POST /internal/ai/evaluate-answer (includes RAG context)──► AI Intelligence
  Agent decides: FollowUp | NextQuestion | Finish (rules §9.4)
     FollowUp:  ──/internal/ai/generate-followup──► AI Intelligence
     Next:      ──/internal/ai/generate-question──► AI Intelligence (advance plan)
     Finish:    ──/internal/interview/complete──► AI Intelligence /generate-feedback
  Agent: returns updated agentState + sessionView + reply + done
  Gateway: persist; return {reply, done:false} or final {reply, done:true, feedback}
```

### 9.3 Complete
The Gateway calls `/internal/interview/complete` when the agent signals `done:true` (or as the
standard completion path when the last `next` returns `done:true`). The agent assembles final
feedback via AI Intelligence `generate-feedback` and returns it. The Gateway marks the Redis
session `completed`, attaches `feedback`, and emits the final public response. Gateway then lets
the session expire via TTL (§10).

### 9.4 Follow-up / difficulty / completion rules (preserved from the previous plan)

- **Follow-up trigger:** `score < 6.0` on an important day AND `followUpBudget > 0` AND fewer than 2
  follow-ups already asked on that question. Follow-up always quotes the candidate's previous
  answer (`followUpOf` set) and never introduces a new topic.
- **Difficulty:** 2 consecutive scores ≥ 8 → step up (`easy→medium→hard`); 2 consecutive scores < 5
  → step down. Starting difficulty from tier/experience (novice starts easy, expert starts medium/hard).
- **Completion:** `planIndex >= len(plan)` OR (`daysAsked >= 4` AND `questionCount >= 8` AND last
  answer was not a follow-up). **Never complete before 8 questions and 4 distinct days**
  (env floors; upward-only override).
- **Conversation context:** the full transcript travels in every request, so the agent (and the AI
  service) remain conversational across requests.

---

## 10. SESSION ARCHITECTURE (Gateway + Redis)

### 10.1 Why Redis

Redis stores **ephemeral, active-interview state only**. It is the single source of session truth
so the stateless Interview Agent and AI Intelligence services can be scaled/redeployed freely
without losing an interview. Using Redis (rather than in-process dict) is what makes the Gateway
independently deployable and horizontally replicable.

Compliance with hackathon restrictions:
- **Ephemeral only.** Every session carries a TTL (default 3600 s, refreshed on each turn). No
  permanent user history is written.
- **No authentication, no user accounts** — none required by `technical-spec.md`.
- **No long-term candidate history.** Candidate data enters per-request from the frontend payload
  and lives only inside the active session document.

### 10.2 Session schema (Redis, key `session:{sessionId}`, JSON value, TTL)

```json
{
  "sessionId": "abc-123",
  "status": "active",
  "createdAt": "2026-08-08T10:00:00Z",
  "updatedAt": "2026-08-08T10:12:00Z",
  "candidate": { "member": {}, "missions": [], "signals": {} },
  "agentState": { "version": 1, "plan": [], "planIndex": 3, "followUpBudget": 2, "lastScores": [7.5, 8.0], "coverage": { "12": 0.78 } },
  "currentQuestion": { "questionId": "q-3", "type": "technical", "difficulty": "medium", "topic": "...", "day": 7, "expectedConcepts": [] },
  "questionCount": 3,
  "daysAsked": [12, 7],
  "conversation": [ { "role": "agent", "content": "..." }, { "role": "candidate", "content": "..." } ],
  "scores": [7.5, 8.0],
  "topicScores": [],
  "finalFeedback": null
}
```

Lifecycle: `create` (start) → `update` (each turn; refresh TTL) → `completed` (final response,
feedback stored, TTL retained until expiry) → expired/deleted. The Gateway never interprets
`agentState` — it stores and returns the opaque blob exactly as the agent produced it, and copies
only the safe `sessionView` fields (questionCount, daysAsked, scores, status) into the document for
telemetry/tests.

---

## 11. RAG ARCHITECTURE (AI Intelligence + Qdrant)

### 11.1 Pipeline

```
curriculum.json (source of truth)
   ↓ ingestion
Chunking (per day: module, title, type, objectives, tools, metadata)
   ↓
Embeddings (OpenAI-compatible embeddings endpoint)
   ↓
Qdrant collection: curriculum_days
   ↓
Semantic Retrieval (top-k, metadata filters: day/module/type)
   ↓
Retrieved Context
   ↓
LLM → Question / Follow-up / Evaluation / Feedback
```

### 11.2 Ingestion (`app/rag/ingestion.py`)

- Runs on AI Intelligence startup (idempotent: upsert by `day`-derived point id) and via a small
  CLI (`python -m app.rag.ingestion`).
- Each of the 31 curriculum days becomes one document chunk: `{module, day, title, type, tools,
  objectives, text_blob}` where `text_blob` is a normalized join of title + objectives + tools.
- Chunks are embedded and upserted into Qdrant with payload metadata (`day`, `module`, `type`,
  `title`) to support filtered retrieval.
- The dataset stays `curriculum.json`; ingestion is a derived index, not a new source of truth.

### 11.3 Retrieval (`app/rag/retriever.py`)

Query construction blends signals so questions/evaluations are grounded in the candidate's actual
situation:

- candidate profile (tier, role)
- current topic / current day
- question difficulty
- previous answer (for follow-ups)
- interview stage (plan index)

`retrieve(query, filters, top_k=3)` returns the most relevant day chunks with scores. Retrieval is
used by `generate-question`, `generate-followup`, `evaluate-answer`, and `generate-feedback` to
anchor the LLM in exact curriculum content.

### 11.4 Why RAG beats "just load curriculum.json"

1. **Semantic relevance, not fixed lookups.** A candidate's answer about "cosine similarity" can
   pull Day 7 (Embeddings) even when the current plan slot is Day 12 — enabling sharp cross-module
   follow-ups.
2. **Retrieval is queryable** — the same index serves question generation, evaluation grounding, and
   feedback recommendations from one source.
3. **Extensible.** New knowledge (day notes, candidate FAQs, sample answers) can be ingested without
   code changes — the interview improves by adding documents, not logic.
4. **Grounding for evaluation.** The evaluator checks the answer against *retrieved* objectives and
   tools, which reduces hallucinated praise/gaps and makes feedback auditable.

### 11.5 Vector DB choice

Use **Qdrant** (single vector DB). It runs easily in Docker, has a clean Python client, supports
metadata filtering, and needs no external service. No other vector database is introduced.
`QDRANT_URL` and `QDRANT_COLLECTION` configure it. A **minimal fallback** is defined for Qdrant
outage (§16.4): retrieval returns the directly-matching day's objectives read from an in-memory
copy of `curriculum.json` and marks `source: "fallback"`.

---

## 12. LLM ARCHITECTURE (AI Intelligence)

### 12.1 Provider abstraction

```python
class ChatProvider(Protocol):
    def complete(self, messages: list[dict], *, json_mode: bool = False, temperature: float = 0.3) -> str: ...
    def embed(self, texts: list[str]) -> list[list[float]]: ...
    def available(self) -> bool: ...
```

- `OpenAICompatibleProvider` — the only shipped implementation; speaks the OpenAI-compatible API so
  **OpenAI, Azure OpenAI, Groq, and local Ollama are interchangeable via env vars** (`LLM_API_KEY`,
  `LLM_MODEL`, `LLM_BASE_URL`). No service rewrite is needed to change providers.
- `FakeLLMProvider` — deterministic double used by tests and by the Agent's offline mode.
- Provider chosen by `LLM_PROVIDER=openai|fake`.

### 12.2 Prompt management (`app/llm/prompts/`)

- `system_interviewer.py` — persona + rules (conversational, no grade leakage).
- `system_evaluator.py` — rubric instructions (§13).
- `system_feedback.py` — synthesis instructions.
- Builder functions that render candidate context, curriculum context, retrieved context, and the
  conversation into messages. All prompts live here; none are scattered in handlers.

### 12.3 Structured output & reliability

- Generation endpoints request JSON (`response_format={"type":"json_object"}` or function calling)
  and validate with Pydantic. On parse/validation failure → one retry → deterministic fallback.
- **Bounded retries** for transient LLM errors (default 2 retries, exponential backoff with jitter,
  capped total time). **Never infinite retries.**
- On provider failure, the AI service degrades to its deterministic modes (heuristic evaluator,
  template-based questions/feedback) and reports the degradation in its response envelope, so the
  Interview Agent's state machine still progresses.

---

## 13. EVALUATION ARCHITECTURE (AI Intelligence)

### 13.1 Inputs & output

Evaluation consumes: `CandidateContext` + `Question` (+`expectedConcepts`) + `RetrievedContext` +
`CandidateAnswer` → structured evaluation:

```json
{
  "score": 7.5,
  "conceptCoverage": 0.8,
  "technicalAccuracy": 0.75,
  "depth": 0.7,
  "strengths": [],
  "gaps": [],
  "followUpRequired": true
}
```

The **structure is deterministic**: every evaluation, LLM-backed or heuristic, is validated into
this exact Pydantic shape before leaving the service.

### 13.2 Rubric (preserved from the previous plan)

- **Concept coverage** — fraction of `expected_concepts` evidenced in the answer.
- **Keyword/tool evidence** — presence of day-specific tools/concepts (e.g. "Chroma", "cosine
  similarity", "prompt injection", "MCP", "LoRA").
- **Precision signal (0..1)** — heuristic: answer length in a sane band, signal-to-filler ratio,
  low off-topic/repetition.
- **Depth tier bonus** — expert-tier candidates must show architecture-level detail (trade-offs,
  alternatives, failure modes) to score ≥ 8.
- `score` is a weighted combination (e.g. `0.4·conceptCoverage + 0.3·technicalAccuracy +
  0.3·depth`), clamped to 0..10, with `followUpRequired = score < 6.0`.

### 13.3 Heuristic fallback

With `LLM_PROVIDER=fake` (or after bounded LLM retries fail), `evaluator.py` computes the rubric
deterministically from `expectedConcepts` + tool keywords + precision heuristics — identical schema,
no network. This is what makes CI and scenario tests deterministic.

---

## 14. FEEDBACK ARCHITECTURE (AI Intelligence)

### 14.1 Inputs

`all evaluations` + `candidate profile` + `curriculum coverage` + `strengths` + `weaknesses` +
`missed concepts` + `topic scores` (internal `TopicScore[]`).

### 14.2 Output (contract-compatible)

```json
{ "summary": "...", "strengths": [], "gaps": [], "next": [] }
```

Generation rules (preserved):
- **strengths** — modules/days with `coverage >= 0.75`, consistently met concepts, first-try
  mastery, role-aligned depth. 2–5 concise items.
- **gaps** — failed/skipped days that were assessed and scored low, missed concepts, days below
  threshold. 2–5 concise items, each mapped to a concrete curriculum day.
- **next** — actionable remediation referencing curriculum days/tools/objectives (e.g. "Re-do Day 8
  (Vector Databases): practice building a Chroma collection with metadata filtering"). 2–4 items.
- **summary** — one paragraph synthesized from the result: overall tier, strongest module, weakest
  module, overall sense.

The richer `InterviewResult` (topicScores, overall score) remains **internal** to AI Intelligence
for logging/tests; only the four contract fields are returned to the Gateway and the frontend.

---

## 15. REPOSITORY STRUCTURE

```
backend/
│
├── services/
│   ├── gateway/
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app factory, CORS, router mount, /health
│   │   │   ├── api/
│   │   │   │   └── interview.py     # POST /api/interview handler
│   │   │   ├── sessions/
│   │   │   │   ├── redis_store.py   # TTL session store
│   │   │   │   └── lifecycle.py     # create/update/complete/expire
│   │   │   ├── clients/
│   │   │   │   ├── base.py          # HTTP client with timeouts/retries
│   │   │   │   └── agent_client.py  # calls interview-agent
│   │   │   ├── schemas/
│   │   │   │   ├── api.py           # public request/response (contract)
│   │   │   │   └── internal.py      # agent/ai payload models
│   │   │   └── core/
│   │   │       ├── config.py        # env settings
│   │   │       └── errors.py        # error mapping, structured responses
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   ├── interview-agent/
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app, internal routes, /health
│   │   │   ├── api/
│   │   │   │   ├── start.py         # POST /internal/interview/start
│   │   │   │   ├── turn.py          # POST /internal/interview/next (+ follow-up)
│   │   │   │   └── complete.py      # POST /internal/interview/complete
│   │   │   ├── candidates/
│   │   │   │   └── context.py       # tier, strong/weak/failed/skipped analysis
│   │   │   ├── curriculum/
│   │   │   │   ├── loader.py        # curriculum parsing/validation
│   │   │   │   └── planner.py       # assessment days, plan, interleaving
│   │   │   ├── agent/
│   │   │   │   ├── state.py         # agentState transitions
│   │   │   │   ├── interviewer.py   # turn loop, follow-up/next/finish decisions
│   │   │   │   └── strategy.py      # QuestionStrategy emission, difficulty
│   │   │   ├── clients/
│   │   │   │   └── ai_client.py     # calls ai-intelligence
│   │   │   └── schemas/
│   │   │       └── contracts.py     # internal payload models
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── ai-intelligence/
│       ├── app/
│       │   ├── main.py              # FastAPI app, internal routes, /health
│       │   ├── api/
│       │   │   ├── generation.py    # generate-question, generate-followup
│       │   │   ├── evaluation.py    # evaluate-answer
│       │   │   ├── feedback.py      # generate-feedback
│       │   │   └── rag.py           # retrieve-context, ingestion trigger
│       │   ├── llm/
│       │   │   ├── provider.py      # ChatProvider protocol
│       │   │   ├── client.py        # OpenAI-compatible impl + retry
│       │   │   └── prompts/
│       │   │       ├── system_interviewer.py
│       │   │       ├── system_evaluator.py
│       │   │       └── system_feedback.py
│       │   ├── rag/
│       │   │   ├── embeddings.py
│       │   │   ├── retriever.py
│       │   │   ├── ingestion.py
│       │   │   └── vector_store.py  # Qdrant wrapper
│       │   ├── evaluation/
│       │   │   ├── rubric.py        # scoring weights, concept/keyword matching
│       │   │   ├── evaluator.py     # LLM + heuristic paths → structured output
│       │   │   └── feedback.py      # synthesis + generator
│       │   └── schemas/
│       │       └── contracts.py     # internal payload models
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── .env.example
│
├── shared/
│   ├── schemas/                     # JSON-Schema copies of every internal contract
│   │   ├── session.json
│   │   ├── agent_api.json
│   │   └── ai_api.json
│   └── contracts/                   # versioned contract notes + change log
│       └── CONTRACTS.md
│
├── data/
│   ├── candidates.json
│   └── curriculum.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

**`shared/` contains no business logic** — only stable contract documents (JSON Schemas + a change
log) that every service mirrors in its own Pydantic models. Services do **not** import Python code
from `shared/`; that would couple their deploys. Contract drift is caught by contract tests (§22.4).

---

## 16. FAILURE HANDLING

### 16.1 Principles
- **Bounded everything:** connection timeouts, request timeouts, and bounded retries are configured
  per service via env vars. No infinite retries, no unbounded waits.
- **Fail closed, degrade gracefully:** the public API always returns a controlled JSON body; internal
  failures are mapped to clean HTTP statuses by the Gateway.
- **Health endpoints everywhere** so Docker Compose and deployment platforms can probe readiness.

### 16.2 Failure matrix

| Failure | Detected at | Behavior |
|---|---|---|
| Interview Agent unavailable | Gateway (connect/read timeout, 5xx) | Bounded retry (1) → controlled `503 {"detail":"interview service unavailable"}`. Session state untouched in Redis. |
| AI Intelligence unavailable | Agent (client timeout, 5xx) | Agent returns a controlled internal error; Gateway maps to `503`. Agent state preserved for retry. |
| LLM provider fails | AI Intelligence | Bounded retries (default 2, backoff+jitter) → fallback to deterministic evaluator/template generation → marks response `degraded: true`. Never blocks the flow. |
| Qdrant unavailable | AI Intelligence | Bounded retry → **minimal fallback**: retrieval reads the matching day's objectives from the in-memory `curriculum.json` copy, `source: "fallback"`. Clearly justified: curriculum is small, static, and always available. |
| Redis unavailable | Gateway | `503` on public API; no session can be created. Startup health check fails fast. |
| Invalid public request | Gateway | `422` (validation). |
| Unknown sessionId | Gateway | `404` with sessionId echoed in detail. |
| Turn on completed session | Gateway | `409` (start a new sessionId). |

### 16.3 Timeouts & retries (defaults, env-tunable)
- Gateway → agent: connect 2 s, read 25 s, retries 1 (start/turn/complete are non-idempotent-safe
  enough that we retry only on connect errors, not on processed responses).
- Agent → AI: connect 2 s, read 30 s, retries 1.
- AI → LLM: timeout 30 s, retries 2 with exponential backoff + jitter.
- AI → Qdrant: timeout 3 s, retries 1.

### 16.4 Structured errors
All non-2xx responses (public and internal) use the shape:
```json
{ "error": { "code": "SESSION_NOT_FOUND", "message": "session not found: abc-123", "detail": {} } }
```
Gateway maps internal errors to public `{detail: ...}` for the single public endpoint.

---

## 17. SECURITY CONSIDERATIONS

- **Public surface minimized:** only `interview-gateway` is exposed; `interview-agent`,
  `ai-intelligence`, Redis, and Qdrant are on a private network (Compose internal network / private
  subnets in cloud deployments).
- **No browser-exposed internal routes:** internal paths are prefixed `/internal/*` and must never
  be published on public hosts.
- **Optional shared internal token:** if `INTERNAL_API_TOKEN` is set, internal services require
  `X-Internal-Token: <token>` on `/internal/*` routes (middleware check). Default: disabled for the
  hackathon. No user auth is added — the public contract specifies none.
- **Secrets:** `.env` is git-ignored; only `.env.example` is committed. `LLM_API_KEY` etc. are
  injected by the platform/Compose at runtime. Never log keys.
- **CORS:** allow-list from `FRONTEND_ORIGINS`; no wildcard in production.
- **No PII persistence:** candidate payloads exist only inside ephemeral, TTL'd sessions; logs log
  `sessionId` (and optionally the candidate id), never mission/answer content.
- **Input validation** on every service boundary (Pydantic), preventing malformed payloads from
  propagating.

---

## 18. ENVIRONMENT VARIABLES

### 18.1 `interview-gateway`
| Var | Default | Purpose |
|---|---|---|
| `BACKEND_PORT` | `8000` | uvicorn port |
| `REDIS_URL` | `redis://redis:6379/0` | session store |
| `SESSION_TTL_SECONDS` | `3600` | per-session TTL (refreshed each turn) |
| `AGENT_SERVICE_URL` | `http://interview-agent:8001` | interview-agent base URL |
| `AI_SERVICE_URL` | `http://ai-intelligence:8002` | ai-intelligence base URL (health + feedback recovery) |
| `FRONTEND_ORIGINS` | `http://localhost:5173` | CORS allow-list (comma-separated) |
| `MIN_QUESTIONS` | `8` | hard floor — never below 8 |
| `MIN_CURRICULUM_DAYS` | `4` | hard floor — never below 4 |
| `INTERNAL_API_TOKEN` | *(empty)* | if set, required on `/internal/*` calls |
| `LOG_LEVEL` | `INFO` | logging level |

### 18.2 `interview-agent`
| Var | Default | Purpose |
|---|---|---|
| `BACKEND_PORT` | `8001` | uvicorn port |
| `AI_SERVICE_URL` | `http://ai-intelligence:8002` | ai-intelligence base URL |
| `AI_TIMEOUT_SECONDS` | `30` | upstream timeout |
| `AI_RETRIES` | `1` | bounded upstream retries |
| `MIN_QUESTIONS` | `8` | plan/completion floor (mirrors Gateway) |
| `MIN_CURRICULUM_DAYS` | `4` | plan floor |
| `FOLLOWUP_BUDGET` | `4` | follow-ups allowed per interview |
| `FOLLOWUP_MAX_PER_QUESTION` | `2` | follow-ups per single question |
| `INTERNAL_API_TOKEN` | *(empty)* | internal auth |
| `LOG_LEVEL` | `INFO` | logging level |

### 18.3 `ai-intelligence`
| Var | Default | Purpose |
|---|---|---|
| `BACKEND_PORT` | `8002` | uvicorn port |
| `LLM_PROVIDER` | `openai` | `openai` (SDK/HTTP) or `fake` (deterministic) |
| `LLM_API_KEY` | *(empty)* | provider key (OpenAI/Azure/Groq); empty → `fake` |
| `LLM_MODEL` | `gpt-4o-mini` | chat model |
| `LLM_BASE_URL` | *(empty)* | Azure/Groq/Ollama (`http://localhost:11434/v1`) |
| `LLM_TEMPERATURE` | `0.3` | sampling temperature |
| `LLM_TIMEOUT_SECONDS` | `30` | provider call timeout |
| `LLM_RETRIES` | `2` | bounded retries with backoff+jitter |
| `EMBEDDINGS_MODEL` | `text-embedding-3-small` | embeddings model (OpenAI-compatible) |
| `QDRANT_URL` | `http://qdrant:6333` | vector DB |
| `QDRANT_COLLECTION` | `curriculum_days` | collection name |
| `RETRIEVAL_TOP_K` | `3` | default retrieval depth |
| `INTERNAL_API_TOKEN` | *(empty)* | internal auth |
| `LOG_LEVEL` | `INFO` | logging level |

### 18.4 Infra
| Var | Default | Purpose |
|---|---|---|
| `REDIS_PASSWORD` | *(empty)* | optional Redis auth (private net) |
| `QDRANT_API_KEY` | *(empty)* | optional Qdrant auth (private net) |

Root `.env.example` lists all of the above with safe defaults; **no secrets committed.**

---

## 19. DOCKER / LOCAL DEVELOPMENT

### 19.1 Topology

```
frontend (npm run dev, :5173)          ← browser; talks ONLY to gateway
   ↓
gateway :8000   (public, CORS-allowed for :5173)
   ↓  services network
interview-agent :8001   (internal only)
   ↓
ai-intelligence :8002   (internal only)
   ↓
redis :6379   qdrant :6333/:6334   (internal only)
```

### 19.2 `docker-compose.yml` (services)

| Service | Image | Exposed ports | Depends on | Env highlights |
|---|---|---|---|---|
| `gateway` | build `./services/gateway` | **8000** (host) | redis, interview-agent | REDIS_URL, AGENT_SERVICE_URL, AI_SERVICE_URL, FRONTEND_ORIGINS |
| `interview-agent` | build `./services/interview-agent` | — (internal) | ai-intelligence | AI_SERVICE_URL |
| `ai-intelligence` | build `./services/ai-intelligence` | — (internal) | qdrant | QDRANT_URL, LLM_* |
| `redis` | `redis:7-alpine` | — (internal) | — | appendonly no (ephemeral) |
| `qdrant` | `qdrant/qdrant` | — (internal) | — | — |

- **Networking:** one default bridge network; only `gateway` publishes a host port. Internal
  services discover each other by **DNS hostname** (Compose service names): `redis`,
  `qdrant`, `interview-agent`, `ai-intelligence`.
- **Ports:** `8000` (public), `8001`/`8002` internal-only, Redis `6379` and Qdrant `6333` never
  published to the host.
- **Healthchecks:** each service exposes `GET /health`; Compose `healthcheck` gates
  `depends_on` (gateway waits for redis + agent; agent waits for ai; ai waits for qdrant).
- **Data volume:** a named volume for Qdrant snapshots (optional; sessions are ephemeral).
- **Env:** root `.env` loaded by Compose; per-service `.env.example` documents service-specific vars.

### 19.3 Run

```bash
cd backend
cp .env.example .env
docker compose up --build
# gateway:   http://localhost:8000/api/interview   (POST)
# health:    http://localhost:8000/health
```

Local single-service development (no Docker) is supported too: each service runs `uvicorn
app.main:app --port <port>` with its env vars pointing at real neighbors (e.g. `AGENT_SERVICE_URL=http://localhost:8001`),
so an individual developer can iterate on their service against real or faked neighbors.

---

## 20. DEPLOYMENT ARCHITECTURE

Services deploy **independently**; they need not share a machine.

| Component | Deployment model | Notes |
|---|---|---|
| **gateway** | **Public** deployment (Render/Railway/Fly/Vercel-served backend, or a small VPS) | The only host that binds a public port; CORS allow-listed frontend origin; env: `REDIS_URL`, `AGENT_SERVICE_URL`, `AI_SERVICE_URL`, `FRONTEND_ORIGINS`, `INTERNAL_API_TOKEN` |
| **interview-agent** | **Private/internal** deployment (same platform, non-public port/network) | Env: `AI_SERVICE_URL` (private), `INTERNAL_API_TOKEN` |
| **ai-intelligence** | **Private/internal** deployment | Env: `QDRANT_URL` (private), `LLM_*`, `EMBEDDINGS_MODEL` |
| **redis** | **Managed/private** service (Upstash/Railway Redis, or private container) | TTL sessions only; internal network ACL; optional password |
| **qdrant** | **Managed/private** service (Qdrant Cloud or private container) | Internal network ACL; API key if enabled |

- **Service URLs are pure configuration:** each deployment sets the upstream URL env vars
  (`AGENT_SERVICE_URL`, `AI_SERVICE_URL`, `QDRANT_URL`, `REDIS_URL`). Nothing is hard-coded, so
  staging can point services at each other without rebuilds.
- **No Kubernetes, no service mesh** — the deployment model is "N independent processes on private
  networking", which is exactly what these platforms give us with zero extra infra.
- **Secrets:** injected per platform, never committed.
- **Scaling:** since only the Gateway holds state (in Redis), any service can be scaled or
  redeployed without losing active interviews.

---

## 21. TESTING STRATEGY

### 21.1 Per-service unit tests (CI, network-free)

**Gateway (`tests/unit/`)**
- Public request validation (missing sessionId, both `candidate`+`message`, neither, bad candidate schema) → 422.
- Response assembly is contract-exact (start / turn / final with feedback).
- Session lifecycle with a fake Redis (or in-memory store): create, update, TTL refresh, complete, unknown → 404, completed+turn → 409.
- Client behavior: timeout → mapped 503; bounded retries on connect errors; no retry on processed responses.
- Health endpoint.

**Interview Agent (`tests/unit/`)**
- Candidate context: tier calculation for CAND-003 (expert), CAND-006 (developing), CAND-008 (skipped fine-tuning), CAND-010 (failed days), CAND-011 (novice).
- Curriculum planner: always ≥ 4 distinct days, ≥ 8 plan slots; SETUP days excluded unless novice; failed → skipped → weak → strong ordering; role-keyword boosts.
- Strategy/difficulty: starting difficulty from tier; step-up after 2×≥8; step-down after 2×<5.
- Follow-up decisions: score<6 + budget + <2/question → follow-up quoting previous answer; otherwise next/finish.
- Completion rule: never `done` before 8 questions and 4 days.
- agentState transitions and versioning.
- Uses a **fake AI client** (no real calls).

**AI Intelligence (`tests/unit/`)**
- `ChatProvider` contract; `FakeLLMProvider` determinism.
- Prompt builders produce valid messages given context.
- Retry logic: bounded retries on provider errors; backoff; falls back after exhaustion.
- Evaluator: rubric weights, concept/keyword matching, precision heuristic; structured output always valid; LLM JSON parse failure → heuristic path.
- Feedback generator: strengths/gaps/next rules, curriculum-grounded `next` items, contract schema.
- RAG: ingestion idempotence, retrieval ranking with a fake/in-memory vector store, metadata filters, fallback path.

### 21.2 Integration tests (per link)

| Link | Test | Technique |
|---|---|---|
| Gateway → Interview Agent | start → next → complete against a real agent process or an in-process agent with a fake AI client | fastapi `TestClient` + stub/fake upstream |
| Interview Agent → AI Intelligence | strategy → question/follow-up/evaluation/feedback against real AI service with `FakeLLMProvider` | agent `TestClient` + real AI logic |
| AI Intelligence → Vector DB | ingestion + retrieval against a real Qdrant container (or in-memory fake for CI) | pytest + testcontainers (optional) / fake store |
| AI Intelligence → LLM provider | provider retry + fallback behavior against `FakeLLMProvider` that raises/returns bad JSON | unit + integration |

### 21.3 Contract tests (drift prevention)
Each service ships tests that validate its request/response models against the JSON Schemas in
`shared/schemas/`. Producer and consumer both test against the same schema, so a contract change
fails CI on both sides before integration.

### 21.4 Full end-to-end (Docker Compose, `LLM_PROVIDER=fake`)
```
Frontend (or curl) → Gateway → Interview Agent → AI Intelligence → RAG(Qdrant) → LLM(Fake) → Evaluation → Feedback → Gateway → Frontend
```
- Start a session for CAND-003 → several turns → completion; assert reply/done/feedback contract.
- **Scenario matrix** (network-free): full 8+ question interviews for CAND-003 (expect expert
  strengths), CAND-006 (expect gaps in security/deployment, skipped-day probing), CAND-008
  (fine-tuning probing), CAND-010 (vector-DB/agents re-assessment), CAND-011 (novice scaffolding).
- Assert minimums: ≥ 8 questions, ≥ 4 distinct days, ≥ 1 genuine follow-up, context retained
  across turns, final feedback non-empty in all four fields.
- Failure drills: stop the agent → gateway returns controlled 503; stop AI → graceful error;
  `FakeLLMProvider` forced to fail → AI degrades, interview still completes.

**CI rule: normal tests never require real API keys.** `LLM_PROVIDER=fake` and in-memory fakes for
Redis/Qdrant keep the whole suite hermetic. Real-LLM smoke tests are opt-in (`pytest -m real`).

---

## 22. GIT / BRANCH STRATEGY

Monorepo, branch base `master`.

1. **Phase 1 branch `phase1/contracts`** (Pranav, reviewed by all): `backend/` skeleton,
   `shared/schemas/**`, `shared/contracts/**`, per-service scaffolding, root `.env.example`,
   `docker-compose.yml` skeleton. Merge → `master` (contracts now frozen).
2. **Three parallel branches** cut from `master`:
   - `feature/gateway` (Pranav)
   - `feature/interview-agent` (Shezan)
   - `feature/ai-intelligence` (Meraj)
3. Each branch touches **only its own service directory** (and its own tests). No two owners edit
   the same path; `shared/` is read-only after Phase 1.
4. **Integration branch `feature/integration`:** merge order = `ai-intelligence` → `interview-agent`
   → `gateway`. Gateway merges last because it wires the network and its fake upstream stubs get
   swapped for the real clients.
5. Contract change process: propose in `shared/contracts/CONTRACTS.md` + update JSON Schemas →
   team review → bump version → both consumers update in the same integration PR. Contract tests
   enforce it.
6. Merge `feature/integration` → `master` only when the full test suite + Compose E2E passes.

---

## 23. DEVELOPMENT PHASES

| Phase | Work | Owner | Exit criteria |
|---|---|---|---|
| **PHASE 1 — Architecture + contracts** | `shared/` JSON Schemas for all internal APIs, session schema, service scaffolding, compose skeleton, `.env.example` | Pranav (all review) | Contract tests for empty scaffolds pass; schemas frozen |
| **PHASE 2 — Gateway + Redis** | Public API, validation, Redis session store + TTL, agent client with timeouts/retries, error mapping, `/health`, CORS | Pranav | Gateway unit + contract tests green against **fake agent upstream** |
| **PHASE 3 — Interview Agent** | Candidate context, tier calc, curriculum planner, plan, strategies, follow-up logic, difficulty, agentState; fake AI client | Shezan | Agent unit tests green (fake AI) |
| **PHASE 4 — AI Intelligence + LLM** | ChatProvider, OpenAI-compatible client, prompts, structured output, retries, FakeLLMProvider | Meraj | AI unit tests green (FakeLLM) |
| **PHASE 5 — RAG + Vector DB** | Ingestion, embeddings, Qdrant store, retriever, fallback | Meraj | Ingestion + retrieval tests green |
| **PHASE 6 — Evaluation + Feedback** | Rubric, evaluator (LLM + heuristic), coverage, feedback synthesis | Meraj | Evaluator/feedback unit tests green; contract schema tests |
| **PHASE 7 — Service integration** | Real HTTP wiring, contract tests all three, `feature/integration` merge, failure drills | All three | Full unit + integration suite green |
| **PHASE 8 — Docker Compose + deployment** | Compose healthchecks/network, per-service Dockerfiles, deployment envs, README | Pranav leads, all contribute | `docker compose up --build` E2E green with `LLM_PROVIDER=fake` |
| **PHASE 9 — End-to-end testing** | Scenario matrix (CAND-003/006/008/010/011), real-LLM smoke (`pytest -m real`), failure drills, frontend hand-off note | All three | DoD (§25) met |

---

## 24. INTEGRATION STRATEGY

- **Interface-first:** every service's contract is fixed in Phase 1 JSON Schemas before anyone
  writes business logic. Each developer builds against the schemas, not against a teammate's in-flight
  code.
- **Fake upstreams for parallelism:** Gateway tests ship a `FakeAgentClient`; Agent tests ship a
  `FakeAIClient`; AI tests ship `FakeLLMProvider` + an in-memory vector store. Nobody blocks on a
  teammate.
- **Isolation:** file ownership (§6) is enforced by directory; git merge conflicts across service
  directories are impossible by construction.
- **Integration sequence:** PHASE 7 merges in the order AI → Agent → Gateway, swapping fakes for
  real clients one link at a time and running that link's integration tests after each swap.
- **Contract drift control:** every service re-validates its models against `shared/schemas/` in CI.
- **End-to-end gate:** Compose E2E + scenario matrix must pass before `feature/integration` merges
  to `master`.

---

## 25. DEFINITION OF DONE

1. `POST /api/interview` behaves exactly per `technical-spec.md`, verified by Gateway contract tests.
2. A full interview produces ≥ 8 questions across ≥ 4 distinct curriculum days with at least one
   genuine, previous-answer-anchored follow-up, then returns `done:true` with non-empty `summary`,
   `strengths`, `gaps`, `next`.
3. Candidate personalization is observable: CAND-003, CAND-006, CAND-008, CAND-010, CAND-011 yield
   visibly different plans and feedback.
4. RAG actively grounds question generation, evaluation, and feedback (Qdrant primary; documented
   curriculum fallback when Qdrant is down).
5. All three services build and run independently (`uvicorn` per service, no shared state), each
   with its own Dockerfile and env; `docker compose up --build` E2E passes with `LLM_PROVIDER=fake`.
6. Failure drills pass: agent/AI down → controlled 503; LLM failing → deterministic degradation;
   Qdrant down → fallback retrieval; no infinite retries anywhere.
7. Full test suite green in CI with **no real API keys** (fake providers); optional real-LLM smoke.
8. `frontend/` diff is empty — no frontend files modified.

---

## 26. FINAL CHECKLIST — MAPPING TO `technical-spec.md`

| # | Requirement (spec + brief) | Where implemented | Verified by |
|---|---|---|---|
| 1 | Expose `POST /api/interview` | Gateway `api/interview.py` | Gateway contract tests |
| 2 | No authentication required | public route has no auth (internal token optional) | Gateway tests |
| 3 | State maintained via `sessionId` | Gateway Redis store, TTL sessions | session lifecycle tests |
| 4 | Start request `{sessionId, candidate}` | Gateway `InterviewRequest` schema | contract tests |
| 5 | Start response `{reply, done:false}` | Gateway response assembly | contract tests |
| 6 | Turn request `{sessionId, message}` | Gateway schema | contract tests |
| 7 | Turn response `{reply, done:false}` | Gateway assembly | contract tests |
| 8 | Completion `done:true` + `feedback` | Agent completion → AI generate-feedback → Gateway | E2E + completion tests |
| 9 | `feedback.summary` (string) | AI `feedback.py` | feedback tests |
| 10 | `feedback.strengths` (string[]) | AI synthesis | feedback tests |
| 11 | `feedback.gaps` (string[]) | AI synthesis | feedback tests |
| 12 | `feedback.next` (string[]) | AI synthesis (curriculum-grounded) | feedback tests |
| 13 | Conversational across requests | conversation transcript passed each turn; agent + AI both see it | turn integration tests |
| 14 | Candidate follows `candidate.json` schema | shared schema + per-service validation | contract tests |
| 15 | **≥ 8 questions** (minimum) | Agent planner + completion rule (env floor) | agent + E2E tests |
| 16 | **≥ 4 curriculum days** (minimum) | Agent planner (env floor) | agent + E2E tests |
| 17 | Follow-ups based on previous responses | Agent follow-up strategy + AI follow-up generation | agent + turn tests |
| 18 | Context maintained throughout | Redis session + agentState + conversation | E2E |
| 19 | Structured final feedback | AI feedback generator, contract shape | feedback + E2E tests |
| 20 | Candidate personalization | Agent candidate context (tier, failed/skipped/weak) | scenario tests |
| 21 | Curriculum-aware assessment | Agent planner + AI RAG retrieval | curriculum + RAG tests |
| 22 | No out-of-scope features (voice/auth/accounts/history/mobile) | scope guards in §10.1, §17 | code review |
| 23 | Frontend untouched | no edits under `frontend/` | `git diff --stat` at end |
| 24 | Real microservices over HTTP | three processes, REST contracts, own Dockerfiles/envs/tests | compose + deploy docs |
| 25 | RAG-ready | Qdrant ingestion + retrieval + fallback | RAG tests |

---

## 27. FINAL NOTES FOR THE TEAM

- **Preserved from the original plan:** the public contract, the 8-question / 4-day hard floors,
  the tier model, the assessment-day priority (failed → skipped → weak → strong), SETUP-day rules,
  the follow-up budget, the difficulty-stepping rules, the evaluation rubric (concept coverage /
  tool evidence / precision / depth tier bonus), the feedback synthesis rules, the scenario test
  matrix, and the "frontend untouched" guarantee.
- **Changed:** everything now runs as three independently deployable services; sessions live in
  Redis with TTL; LLM/RAG live only in `ai-intelligence`; the Interview Agent is a stateless
  decision engine calling an AI service for language and judgment; a real Qdrant-backed RAG grounds
  the interview in curriculum content.
- **Keep it hackathon-sized:** exactly three services, one public route, one vector DB, no queues,
  no orchestrators, no auth beyond an optional internal token, no permanent history. If a teammate
  proposes adding infra that isn't in this document, question it — this architecture is designed to
  be finished.
