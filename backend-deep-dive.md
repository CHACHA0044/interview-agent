# Backend Deep-Dive Report — Interview Agent

**Scope:** All of `backend/` (3 microservices + shared contracts + deployment).
**Method:** Static code reading only — nothing was executed or changed.
**Verification note:** Every claim below cites the exact file and line it was read from.
Items that are *inferred* (reasoned from code rather than literally stated) are flagged **[INFERRED]**.
Items that contradict the docs are flagged **[MISMATCH]**.

---

## 1. Architecture overview

Three FastAPI microservices behind one public route (see `backend.md` §2, `shared/contracts/CONTRACTS.md` §3):

| Service | Dir | Port | Role |
|---|---|---|---|
| `interview-gateway` | `backend/services/gateway` | 8000 | Public API, Redis sessions, lifecycle orchestration |
| `interview-agent` | `backend/services/interview-agent` | 8001 | Interview behavior: candidate context, planning, strategy, progression |
| `ai-intelligence` | `backend/services/ai-intelligence` | 8002 | LLM abstraction, prompts, RAG/Qdrant, question/eval/feedback |

Infrastructure: **Redis** (ephemeral session store, TTL) and **Qdrant** (curriculum vector DB).

Call chain:

```
frontend ──POST /api/interview──▶ gateway:8000 ──▶ redis (sessions)
                                     │
                                     └─ /internal/interview/{start,next,complete} ──▶ interview-agent:8001
                                                                                        │
                                                                                        └─ /internal/ai/{generate-question,generate-followup,evaluate-answer,generate-feedback} ──▶ ai-intelligence:8002
                                                                                                                    │
                                                                                                                    ├─▶ Qdrant (vector search)
                                                                                                                    └─▶ LLM (openai/groq/fake)
```

- Only the gateway is exposed to the frontend (`gateway/app/main.py:88-96`; only router mounted is `interview.router`).
- `agentState` is **opaque to the gateway** — stored verbatim in Redis, never interpreted (`gateway/app/schemas/internal.py:3-4,69-77`; `CONTRACTS.md` §4).

---

## 2. Gateway service (`services/gateway`)

### 2.1 App factory & startup
`gateway/app/main.py`:
- `create_app()` builds settings, logging, CORS (`main.py:88-94`), wires `AgentClient` over `InternalHttpClient` (`main.py:79-86`).
- Lifespan resolves the session store: tries Redis ping; on failure **falls back to in-memory** so a single-container deploy without Redis still works (`main.py:26-54,65-70`).
- Registers `POST /api/interview` (`main.py:96`) and `GET /health` (`main.py:104-122`; returns **503 with `checks`** when Redis is unreachable).
- Module-level `app = create_app()` (`main.py:127`) for uvicorn.

### 2.2 The only public route
`gateway/app/api/interview.py:22-32`:
- `POST /api/interview` accepts `InterviewRequest`; if `candidate` present → `lifecycle.start`, else `message` required → `lifecycle.next`.
- `InterviewRequest` enforces exactly-one-of via a `model_validator` (`gateway/app/schemas/api.py:43-56`).

### 2.3 Session lifecycle
`gateway/app/sessions/lifecycle.py`:
- `start` (`lifecycle.py:34-55`): rejects duplicate `sessionId` (409 `SessionExistsError`), creates `SessionDoc`, calls agent `/start`, applies the turn, saves.
- `next` (`lifecycle.py:57-97`): loads doc (404 if missing, 409 if `status=="completed"`), appends the candidate message, calls agent `/next`, applies turn; **on `done=true`** it fetches feedback from the agent's `/complete` endpoint if the turn didn't include feedback, then marks the doc completed and saves (`lifecycle.py:85-94`).
- `_apply_turn` copies only "safe" `sessionView` fields into the doc and stores `agentState` verbatim (`lifecycle.py:99-109`).

### 2.4 Session store
`gateway/app/sessions/redis_store.py`:
- `RedisSessionStore`: key `session:{sessionId}`, JSON value, **TTL refreshed on every save** (`redis_store.py:43-45`); `SessionDoc.model_validate_json` on read.
- `InMemorySessionStore`: mirror for tests/local/no-Redis runs (`redis_store.py:58-75`).
- `SessionStore` Protocol defines `get/save/delete/ping`.

### 2.5 Outbound client
`gateway/app/clients/base.py`:
- `InternalHttpClient` (httpx): bounded connect/read/write timeouts (`base.py:36-46`); sends `X-Internal-Token` header when a token is configured (`base.py:33-35`).
- Retry policy: **only transport/timeout errors are retried**; a processed 4xx raises `UpstreamError` (502) immediately; 5xx retries then raises `UpstreamUnavailableError` (503) (`base.py:49-88`).
`gateway/app/clients/agent_client.py:21-59` wraps `/internal/interview/{start,next,complete}`.

### 2.6 Error mapping
`gateway/app/core/errors.py`:
- `APIError` base (default 500 / `INTERNAL_ERROR`); `SessionNotFoundError` 404, `SessionExistsError`/`SessionCompletedError` 409, `UpstreamUnavailableError` 503, `UpstreamError` 502 (`errors.py:38-62`).
- `map_upstream_error` maps upstream 404→404, 409→409, ≥500→503, else→502 (`errors.py:65-72`).
- All non-2xx public responses use `{"detail": ...}` (`errors.py:34-35`; handler at `main.py:98-102`).

---

## 3. Interview Agent service (`services/interview-agent`)

### 3.1 Startup & config
- `main.py:30-44`: lifespan builds `CurriculumLoader`, `AIIntelligenceClient`, and `InterviewOrchestrator(followup_budget, followup_max_per_question)`.
- `core/config.py:21-32`: `ai_service_url` (default `http://ai-intelligence:8002`), `ai_timeout_seconds=30`, `ai_retries=2`, `followup_budget=4`, `followup_max_per_question=2`.
- `api/router.py:32-62`: `/start`, `/next`, `/complete` (prefix `/internal/interview` mounted in `main.py:54`); `ValueError`→400, any other `Exception`→500 with message leak (`router.py:40,51,62`).

### 3.2 Orchestrator (the heart)
`app/services/orchestrator.py` is a **stateless** state machine — all state travels in `agentState`, which it rehydrates via `AgentState.model_validate(request.agentState)` on every call (`orchestrator.py:128,184`).

**`start`** (`orchestrator.py:87-123`):
1. `build_candidate_context` → `(CandidateContext, starting_difficulty)`
2. `build_assessment_plan` → curriculum selection
3. `generate_interview_plan` → plan of ≥ 8 questions (one slot per assessed day, so longer when more than 8 days are prioritized)
4. `advance_to_next_question` pops slot 1
5. `build_question_strategy` + `_respond_question` (generates the first question text via AI)

**`next`** (`orchestrator.py:127-179`):
1. Resolve question id (`current_question.question_id` → request `currentQuestion.questionId` → fresh uuid4) (`orchestrator.py:136-141`)
2. `_evaluate_answer` → `EvaluationResult`, appended to `state.history`
3. `adapt_difficulty` from the score (`orchestrator.py:151`)
4. `evaluate_next_step` → `(FollowUpDecision, FollowUpStrategy?)` (`orchestrator.py:154-162`)
5. `process_evaluation_decision` applies the decision
6. Respond per new `progression_state`: COMPLETED → feedback; FOLLOW_UP_PENDING → follow-up; QUESTION_PENDING → next question (`orchestrator.py:168-177`)

**`complete`** (`orchestrator.py:183-194`): forces `FINISH`; **raises ValueError if the hard floor (≥8 questions, ≥4 days) is not met**; else `_respond_completed`.

**AI calls with deterministic fallbacks** — each of these catches `AIIntelligenceError` and falls back locally:
- `_generate_question` → `_fallback_question_text` (template listing concepts) (`orchestrator.py:257-274,364-371`)
- `_generate_follow_up` → `_fallback_followup_text` (`orchestrator.py:276-302,373-379`)
- `_evaluate_answer` → `_fallback_evaluation` (keyword matching against question concepts; score formula `2 + coverage*8`) (`orchestrator.py:304-339,381-416`)
- `_generate_feedback` → `_fallback_feedback` (aggregates history, avg score, day-based next steps) (`orchestrator.py:341-360,418-439`)

### 3.3 Candidate calibration
`app/services/calibration.py`:
- `classify_mission` (line 24): `skipped`→skipped; `passed=false`→failed; `attempts>=3`→weak; else strong.
- `determine_tier` (line 43): blends `yearsExperience`, role keywords, and first-try signal ratio → expert/strong/developing/novice.
- `calculate_starting_difficulty` (line 77): expert→HARD, strong/developing→MEDIUM, novice→EASY.

### 3.4 Curriculum selection & planning
- `app/services/curriculum_selection.py:45-131` `build_assessment_plan`: priority **Failed → Skipped → Weak → Strong (max 2, scored by job-role keyword relevance)** (`score_day_relevance` at line 31); **enforces ≥4 days** by pulling earliest remaining curriculum days (`curriculum_selection.py:97-103`).
- `app/services/planner.py:26-92` `generate_interview_plan`: a **floor of 8 slots** — 1 slot per selected day first, then the remainder padded round-robin by priority order to reach 8 (`planner.py:49-54`) **[VERIFIED: with more than 8 assessment days (e.g. Tyler CAND-017 → 10 days) the plan is simply longer — `remaining_slots` goes negative and each prioritized day gets exactly 1 slot; "exactly 8" is a floor, not a cap; verified up to 14 total turns (10 plan + 4 follow-ups) in e2e testing]**; questions grouped by module then **interleaved round-robin by sorted module id** (`planner.py:81-90`).
- `app/services/curriculum_loader.py:46-83`: loads `curriculum.json`, resolves path 4 dirs up from `app/services/` → `backend/curriculum.json`, or `CURRICULUM_PATH` override; expands module `[start,end]` day ranges into a `day→module` map (`curriculum_loader.py:68-78`).

### 3.5 Decision engine & progression (guardrails)
- `app/services/decision_engine.py:26-78` `evaluate_next_step`:
  - **FOLLOW_UP** if score < 6 AND global budget > 0 AND per-question limit not hit (`decision_engine.py:42-60`)
  - **FINISH** if plan slots exhausted AND hard floor met (`decision_engine.py:68-70`)
  - **NEXT_QUESTION** otherwise; if slots are exhausted without the floor, it forces NEXT_QUESTION as an "emergency replan" (`decision_engine.py:71-75`)
- `app/services/progression.py`:
  - `advance_to_next_question` (line 26): pops next plan slot, overwrites difficulty with the dynamic value, tracks distinct days (no double-count), resets per-question follow-up counter.
  - `process_evaluation_decision` (line 68): applies FOLLOW_UP (new `PlannedQuestion`, **burns global budget**, increments per-question counter), FINISH (guarded by `_meets_hard_floor`), else advance.
  - `_meets_hard_floor` = `total_questions_asked >= 8` AND `distinct_days_covered >= 4` (`progression.py:112-115`).
- `app/services/difficulty_adapter.py:31-70`: momentum counters; **2 consecutive scores ≥8 → bump up, <5 → drop down**; clamped EASY..HARD; counters reset on a tier change.

### 3.6 Strategy & contract mapping
- `app/services/strategy_builder.py:17-32`: `PlannedQuestion` + `CandidateContext` → `QuestionStrategy`.
- `app/services/contract_mappers.py`: snake_case domain → camelCase ai-intelligence payloads (`candidate_context_to_ai`, `build_curriculum_context`, `question_strategy_to_ai`, `followup_strategy_to_ai`, `conversation_to_ai`).

### 3.7 AI client
`app/services/ai_client.py`:
- `_post` (line 39): httpx with `timeout_seconds`; **retries connect/HTTP errors and 5xx**, backoff `0.2 * attempt` (`ai_client.py:53-65`); raises `AIIntelligenceError` after attempts.
- Typed methods: `generate_question`, `generate_followup`, `evaluate_answer`, `generate_feedback` (`ai_client.py:68-131`).

### 3.8 Schemas
- `app/schemas/state.py`: `AgentState` with `state_version` regex-pinned to `1.0.0` and **`extra="forbid"`** so no unknown data is persisted into Redis (`state.py:32-38,62-79`).
- `app/schemas/domain.py`: enums (`CandidateTier`, `Difficulty`, `ProgressionState`, `QuestionType`, `FollowUpDecision`) + domain models; all `extra="forbid"`.
- `app/schemas/orchestration.py`: wire payloads matching `agent_api.json` (camelCase).

---

## 4. AI Intelligence service (`services/ai-intelligence`)

### 4.1 Entry & config
- `main.py:20-38`: FastAPI app, **CORS `allow_origins=["*"]`**, mounts router at `/internal/ai`.
- `core/config.py:26-56`: `llm_provider` default **`"fake"`** (runs with no keys), `llm_model=gpt-4o-mini`, `llm_api_key`, `llm_base_url` (OpenAI-compatible), `llm_temperature=0.3`; Groq keys + models (`llama-3.3-70b-versatile` / fallback `llama-3.1-8b-instant`); Qdrant (`qdrant_url` default `http://localhost:6333`, `qdrant_collection=curriculum_days`); RAG (`embeddings_model=text-embedding-3-small`, `rag_top_k=3`, `rag_score_threshold=0.70`); `curriculum_path` for the in-memory fallback.

### 4.2 API layer
`api/endpoints.py`:
- 5 POST endpoints, all wired through dependencies and a thin service call: `generate-question`, `generate-followup`, `evaluate-answer`, `generate-feedback`, `retrieve-context` (`endpoints.py:63-172`).
- Every handler wraps the service call in `try/except Exception → HTTPException(500, "Internal server error during ...")` (`endpoints.py:79-81,100-102,120-122,141-143,170-172`). **[INFERRED: the service layer already returns deterministic fallbacks and almost never raises, so these 500 paths are effectively unreachable except for unexpected bugs.]**
- `api/dependencies.py`: module-global singletons `get_llm_provider` / `get_qdrant_client` (`dependencies.py:23-47`); Qdrant client falls back to `:memory:` when no URL (`dependencies.py:45-47`).

### 4.3 LLM providers
- `llm/factory.py:24-58`: `fake`/`openai`/`groq`; raises `ValueError` when required keys are missing.
- `llm/provider.py:22-66`: `ChatProvider` Protocol (`complete`, `embed`, `available`).
- `llm/openai_provider.py:26-107`: `OpenAICompatibleProvider` (any `base_url` → Azure/Ollama/Groq-compatible); `json_mode` sets `response_format={"type":"json_object"}` (`openai_provider.py:69-71`); maps SDK errors to generic `RuntimeError`s **without leaking keys** (`openai_provider.py:75-81`).
- `llm/groq_provider.py:27-126`: `GroqProvider` with **3-tier failover**: primary → fallback model → `FakeLLMProvider` (`groq_provider.py:59-92`); `embed` delegated to fake (Groq has no embeddings).
- `llm/fake_provider.py:23-65`: deterministic completions + **stable hash-based 16-dim embeddings** (`fake_provider.py:52-61`).

### 4.4 Structured output with retries
`llm/structured_output.py:31-95` `generate_structured_output`:
- Calls `provider.complete(json_mode=True)`, strips markdown fences, `json.loads`, validates against a Pydantic model.
- **Retries up to 2× on JSONDecodeError/ValidationError**; final fallback = `model_class.fallback()`.
- Requires the model class to implement a `fallback()` classmethod (`structured_output.py:51-52`).

### 4.5 Service layer (question / follow-up / evaluation / feedback)
Each service: retrieve RAG context → **short-circuit in fake mode** (`isinstance(llm_provider, FakeLLMProvider)`) with a deterministic generator → else build prompt → `generate_structured_output` → last-resort `Model.fallback()`.

- `services/question_generator.py:77-148` + `_fake_question` (line 36): difficulty-shaped question templates; `GeneratedQuestion.fallback` at the bottom.
- `services/followup_generator.py:65-139` + `_fake_followup` (line 35): probes `weakConcepts`, quotes the previous answer; empty answers normalized (`followup_generator.py:79-81`).
- `services/evaluator.py:79-148` + `_fake_evaluation` (line 36): **empty-answer fast-path returns a 0.0 fallback** (`evaluator.py:92-97`); heuristic score `10*(0.5*coverage + 0.3*depth + 0.2*wordiness)` (`evaluator.py:55`); `EvaluationOutput.fallback` (score 0.0, `followUpRequired=true`) as last resort.
- `services/feedback_generator.py:93-139` + `_fake_feedback` (line 30): empty-evaluations fast-path (`feedback_generator.py:108-112`); deterministic summary bands by average (≥7.5 / ≥5 / else); `FeedbackOutput.fallback`.

### 4.6 RAG layer
- `rag/retriever.py:82-151` `retrieve`: empty-query guard → **fake-mode always uses the in-memory fallback** (`retriever.py:101-109`) → real embedding via provider → Qdrant `search` with metadata filter + `score_threshold` → on any failure (embed or search) **degrades to fallback with a warning**. Returns `RetrievalResult(source="qdrant"|"fallback")`.
  - `build_metadata_filter` (line 33): supports `day`, `type`, `title`, and `tool` (singular, matched against the `tools` list).
  - `_qdrant_chunks` (line 65): **sets `objectives=[]`** because the ingested payload stores tools but not objectives **[GAP — see §9]**.
  - `assemble_context` (line 154): builds a `[Source N: Day D - Title]` grounded prompt block.
- `rag/vector_store.py:33-45`: `recreate_collection` with **1536-dim COSINE** vectors (matches `text-embedding-3-small`).
- `rag/ingestion.py:71-132`: loads/validates `curriculum.json`, formats day chunks, generates **stable uuid5 ids per day** (`ingestion.py:38-40`), batches of 10 embeddings, upserts with payload `{day,title,type,tools,text}`; `__main__` recreates the collection then ingests (`ingestion.py:135-154`).
- `rag/fallback.py:72-133` `fallback_retrieve`: thread-safe cached curriculum load (`fallback.py:26-58`); priority **explicit day filter → explicit module filter → keyword overlap**; last resort returns the first day ("least-bad grounding", `fallback.py:130-132`).

### 4.7 Prompts
- `llm/prompts/builders.py`: `build_question_prompt`/`build_followup_prompt`/`build_evaluation_prompt`/`build_feedback_prompt` inject candidate/curriculum/retrieved context as JSON into the user message; system role is the persona constant.
- System prompts: `system_interviewer.py` (no hint-leaking, strict JSON), `system_evaluator.py` (grading rubric; score ≥8 needs depth; <6 ⇒ `followUpRequired`), `system_feedback.py` (exactly `{summary, strengths, gaps, next}`).

---

## 5. End-to-end request flows

### 5.1 Start
1. `POST /api/interview {sessionId, candidate}` → gateway validates exactly-one-of (`schemas/api.py:48-56`).
2. `lifecycle.start` rejects duplicate session (409) (`lifecycle.py:37-42`), builds `SessionDoc`.
3. Gateway → agent `POST /internal/interview/start` (`agent_client.py:21-26`).
4. Agent: calibrate candidate → select curriculum → plan ≥ 8 questions → pop Q1 → generate question text (AI or fallback) → return `{agentState, sessionView, reply, done:false, question}`.
5. Gateway applies the turn, saves doc to Redis (TTL reset), returns `{reply, done:false, feedback:null}`.

### 5.2 Turn
1. `POST /api/interview {sessionId, message}` → `lifecycle.next` loads doc (404/409 guards).
2. Gateway appends candidate message to doc conversation, forwards `candidate + agentState + conversation + currentQuestion + message` to agent (`agent_client.py:28-48`).
3. Agent rehydrates `AgentState`, evaluates answer, adapts difficulty, decides next step, responds:
   - **follow-up** (`FOLLOW_UP_PENDING`): returns a follow-up question; gateway stores the follow-up as the current question.
   - **next question** (`QUESTION_PENDING`): advances the plan, returns the next question.
   - **completed** (`COMPLETED`): generates final feedback, sets `done:true`.
4. Gateway: if `done` and no feedback, calls agent `/complete` to fetch feedback (`lifecycle.py:86-89`), marks doc completed, saves, returns `{reply, done:true, feedback}`.

### 5.3 Completion floors
- The **agent** owns completion: `_meets_hard_floor` (≥8 questions, ≥4 distinct days) is enforced in both `advance_to_next_question` (`progression.py:33-42`) and `process_evaluation_decision` FINISH branch (`progression.py:100-105`), and re-checked in `orchestrator.complete` (`orchestrator.py:188-193`).
- The **gateway does not enforce floors** — `min_questions`/`min_curriculum_days` exist only as env surface (`gateway/core/config.py:20-21`) and are never read by code `[INFERRED: confirmed by grep — no usage]`.

---

## 6. Guardrails & failure handling (summary)

| Layer | Guardrail | Location |
|---|---|---|
| Gateway | Redis→in-memory store fallback | `main.py:26-54` |
| Gateway | bounded timeouts + retry only on transport | `base.py:17,36-46` |
| Gateway | upstream status mapping 404/409/5xx→502/503 | `errors.py:65-72` |
| Agent | stateless — state rehydrated each call, `extra="forbid"` | `state.py:67`, `orchestrator.py:128` |
| Agent | hard completion floor (8 q / 4 days) | `progression.py:112-115` |
| Agent | follow-up loop limits (global budget 4, ≤2/question) | `decision_engine.py:42-60`, `domain.py:137-143` |
| Agent | deterministic fallback for question/followup/eval/feedback | `orchestrator.py:257-439` |
| Agent | difficulty clamped EASY..HARD | `difficulty_adapter.py:61` |
| AI | structured output retry + `fallback()` | `structured_output.py:57-94` |
| AI | fake-mode short-circuits (no network/keys) | `question_generator.py:106-107`, `evaluator.py:100-101` |
| AI | RAG degrades to in-memory fallback | `retriever.py:111-144`, `fallback.py` |
| AI | Groq 3-tier model failover | `groq_provider.py:59-92` |
| AI | empty answer / empty evals fast-paths | `evaluator.py:92-97`, `feedback_generator.py:108-112` |

---

## 7. Error handling & status codes

Public contract (gateway): non-2xx bodies are `{"detail": "..."}`; 404 unknown session, 409 duplicate/completed session, 422 validation, 502 unexpected upstream, 503 upstream unavailable (`errors.py`, `CONTRACTS.md` §7).

**Notable mismatches:**
- `CONTRACTS.md` §7 documents an internal `{error:{code,message,detail}}` body. Neither `interview-agent/api/router.py:37-62` nor `ai-intelligence/api/endpoints.py` emit that shape — both use FastAPI `HTTPException` → `{"detail": "..."}` **[MISMATCH — doc only]**.
- The agent leaks `str(e)` inside 500 responses (`router.py:40,51,62`) while the gateway/AI services mask details **[MISMATCH: inconsistent with the "don't leak internals" posture elsewhere]**.
- `X-Internal-Token` is **sent** by the gateway (`base.py:33-35`) and configured via `INTERNAL_API_TOKEN` in compose, but **neither the agent nor ai-intelligence validates it** (no dependency/middleware reads the header) **[GAP — security]**.
- Public endpoint has **no authentication** — documented as intentional (`CONTRACTS.md` §3).

---

## 8. Config / environment variables

| Service | Env var | Default | Location |
|---|---|---|---|
| gateway | `PORT`/`BACKEND_PORT` | 8000 | `core/config.py:13-14` |
| gateway | `REDIS_URL` | `redis://redis:6379/0` | `config.py:15` |
| gateway | `SESSION_TTL_SECONDS` | 3600 | `config.py:16` |
| gateway | `AGENT_SERVICE_URL` | `http://interview-agent:8001` | `config.py:17` |
| gateway | `AI_SERVICE_URL` | `http://ai-intelligence:8002` | `config.py:18` |
| gateway | `FRONTEND_ORIGINS` (comma list) | `http://localhost:5173` | `config.py:19,28-30` |
| gateway | `INTERNAL_API_TOKEN` | "" | `config.py:22` |
| gateway | timeouts/retries | 2.0/25.0/1 | `config.py:24-26` |
| agent | `AI_SERVICE_URL` | `http://ai-intelligence:8002` | `interview-agent/core/config.py:22` |
| agent | `AI_TIMEOUT_SECONDS`/`AI_RETRIES` | 30/2 | `config.py:23-24` |
| agent | `FOLLOWUP_BUDGET`/`FOLLOWUP_MAX_PER_QUESTION` | 4/2 | `config.py:25-26` |
| ai | `LLM_PROVIDER` | `fake` | `ai-intelligence/core/config.py:28` |
| ai | `LLM_API_KEY`/`LLM_MODEL`/`LLM_BASE_URL`/`LLM_TEMPERATURE` | gpt-4o-mini/0.3 | `config.py:29-32` |
| ai | `GROQ_API_KEY`/`GROQ_MODEL`/`GROQ_FALLBACK_MODEL` | llama-3.3-70b-versatile / 8b-instant | `config.py:35-37` |
| ai | `QDRANT_URL`/`QDRANT_API_KEY`/`QDRANT_COLLECTION` | localhost:6333 / curriculum_days | `config.py:40-42` |
| ai | `EMBEDDINGS_MODEL`/`RETRIEVAL_TOP_K`/`RAG_SCORE_THRESHOLD` | text-embedding-3-small / 3 / 0.70 | `config.py:45-47` |
| ai | `CURRICULUM_PATH` | (none → fallback off) | `config.py:50` |

Note: `docker-compose.yml` passes `BACKEND_PORT` to agent/ai but their Dockerfiles hardcode the uvicorn port (`services/*/Dockerfile:15`) — `BACKEND_PORT` is inert there **[MISMATCH: config surface unused]**.

---

## 9. Deployment

**Two deployment targets:**

1. **docker-compose (local / full infra)** — `backend/docker-compose.yml`:
   - Services: gateway:8000 (only host-exposed port), interview-agent:8001, ai-intelligence:8002, redis:7-alpine (no persistence), qdrant. Health-gated `depends_on` chains.
   - `curriculum.json` mounted **read-only** into agent + ai; `CURRICULUM_PATH=/app/curriculum.json`.
   - Default `LLM_PROVIDER=fake` → runs with **no API keys**.
2. **Single container (Render)** — `backend/Dockerfile` + `backend/start.sh` + `render.yaml`:
   - One image installs all three `requirements.txt`; `PYTHONPATH=/app/shared:...:<each service>`.
   - `start.sh` launches ai (127.0.0.1:8002) and agent (127.0.0.1:8001) in the background, health-waits on each, then `exec`s the gateway on 0.0.0.0:8000; `trap` cleans up children on SIGTERM.
   - `render.yaml`: docker web service, `rootDir: backend`, plan starter, region oregon, `healthCheckPath: /health`, `LLM_PROVIDER=fake`, CORS includes the Vercel frontend origin.

**Deployment-related gaps:**
- Single-container mode has **no Redis** → gateway uses the in-memory store (fine for one process, loses sessions on restart) and **no Qdrant** → RAG uses the in-memory fallback (needs `CURRICULUM_PATH`, which the image sets).
- The Qdrant collection is **never seeded at deploy time** — `ingestion.py` is only run manually (`__main__`). So even in docker-compose, Qdrant starts empty until someone runs ingestion **[INFERRED: no compose init step exists]**.

---

## 10. Tests

**≈164 `test_*` functions across 4 suites** (counted via regex on `def test_`):

| Suite | Files | Count |
|---|---|---|
| gateway unit+integration | 6 | 18 |
| interview-agent | 10 | 39 |
| ai-intelligence | 11 | 47 |
| shared contract tests | 7 | 60 |

- **Gateway**: request validation, session lifecycle, store fallback, client behavior, health; integration `test_interview_flow.py` drives a full start→turns→complete flow against a fake agent (3 tests).
- **Agent**: calibration, curriculum selection, planner, decision engine, difficulty adapter, progression, strategy, state versioning, API wiring; uses `tests/fakes.py`.
- **AI**: structured output, providers (incl. Groq failover), prompts, retriever, ingestion, question/followup/evaluator/feedback generators, API.
- **Shared contracts** (`backend/shared/tests/`, run with `jsonschema`): validate that `agent_api.json`, `ai_api.json`, `session.json` can represent the real flows; `test_interview_floors.py` proves 8+ questions/4+ days are representable and no early completion; `test_gateway_compat.py` imports the gateway (`ensure_gateway_importable`) and checks settings/deployment defaults.

`shared/` deliberately contains **no importable Python** — tests resolve schemas from JSON and inject the gateway dir into `sys.path` (`shared/tests/conftest.py:36-38`).

---

## 11. Shared contracts (`backend/shared`)

- `shared/contracts/CONTRACTS.md` — **v1**, single source of truth; ownership table (gateway=Pranav, agent=Shezan, ai=Meraj); change-approval process (§10); completion-ownership ruling (§4.1); data-file location ruling (§6.1 — datasets live at **repo root**, not `backend/data/`).
- `shared/schemas/agent_api.json` — gateway↔agent contract (start/next/follow-up/complete/health); `done` is the agent's decision, no floor/cap encoded in schema.
- `shared/schemas/ai_api.json` — agent↔ai contract (5 POSTs + health); deterministic `evaluation` shape required across LLM/fallback paths.
- `shared/schemas/session.json` — Redis session document (gateway-owned fields + opaque `agentState`).

---

## 12. Known gaps & observations

1. **Qdrant payload drops objectives.** `ingestion.py:107-113` stores `{day,title,type,tools,text}` but `_qdrant_chunks` (`retriever.py:65-79`) rebuilds chunks with `objectives=[]`. Real-LLM grounding via Qdrant therefore omits objectives that the fallback path includes.
2. **Fake provider + Qdrant dimension mismatch [INFERRED].** The collection is created at 1536 dims (`vector_store.py:45`) while fake embeddings are 16-dim (`fake_provider.py:26,58`). This is inert today because fake mode bypasses Qdrant entirely (`retriever.py:101-109`), but running `ingestion.py` with `LLM_PROVIDER=fake` would try to upsert 16-dim vectors into a 1536-dim collection.
3. **Internal auth is one-way.** The gateway sends `X-Internal-Token`, but neither downstream service checks it (see §7). Any container on the private network can call the internal endpoints.
4. **Doc-vs-code error-shape drift** (`{error:{...}}` documented, `{"detail":...}` implemented) and the agent's 500 message leak (§7).
5. **`complete` recovery path is near-dead code.** `_respond_completed` always returns `feedback` (`orchestrator.py:244-253`), so the gateway's fallback branch (`lifecycle.py:86-89`) rarely triggers.
6. **No runtime provider swapping.** LLM/Qdrant singletons are cached at first use (`api/dependencies.py:28-47`); changing env requires a restart.
7. **In-memory session store is single-process** — no horizontal gateway scaling without Redis.
8. **Qdrant never seeded by compose/deploy** (manual ingestion only, §9).
9. **Plan distribution comment drift:** `planner.py:48` says "heavily favoring" but the loop is round-robin (flag in §3.4).
10. **Broad CORS on internal services** (`ai-intelligence/main.py:27-33` allows `*`); acceptable for loopback-only topology but worth knowing.
11. **Synchronous LLM calls** — `openai`/`groq` SDKs used synchronously inside `def` (threadpool) endpoints; no async/streaming.

---

## 13. File inventory (backend)

```
backend/
├── Dockerfile                      single-container Render image
├── docker-compose.yml              local 5-service topology
├── start.sh                        single-container supervisor (ai→agent→gateway)
├── curriculum.json, candidates.json  read-only datasets (repo root per CONTRACTS.md §6.1)
├── shared/
│   ├── contracts/CONTRACTS.md
│   ├── schemas/{agent_api,ai_api,session}.json
│   └── tests/                      contract tests (60)
├── services/gateway/app/{main,api/interview,api/__init__}.py
│   ├── core/{config,errors}.py
│   ├── schemas/{api,internal}.py
│   ├── sessions/{lifecycle,redis_store}.py
│   ├── clients/{base,agent_client}.py
│   └── tests/{unit,integration}/
├── services/interview-agent/app/{main,api/router}.py
│   ├── core/config.py
│   ├── schemas/{domain,state,orchestration}.py
│   ├── services/{calibration,curriculum_loader,curriculum_selection,planner,
│   │              strategy_builder,decision_engine,difficulty_adapter,
│   │              progression,contract_mappers,ai_client,orchestrator}.py
│   └── tests/ (10 files)
└── services/ai-intelligence/app/{main,api/{endpoints,dependencies}}.py
    ├── core/config.py
    ├── llm/{provider,factory,openai_provider,groq_provider,fake_provider,
    │        structured_output}.py
    ├── llm/prompts/{builders,system_interviewer,system_evaluator,system_feedback}.py
    ├── rag/{vector_store,ingestion,retriever,fallback}.py
    ├── schemas/{contract,question,api_requests,ai_output,curriculum,retrieval}.py
    ├── services/{question_generator,followup_generator,evaluator,feedback_generator}.py
    └── tests/ (11 files)
```
