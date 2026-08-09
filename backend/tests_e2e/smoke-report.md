# Backend Live Test Results (Phase 2)

_Generated 2026-08-09 20:06:28 by the live-provider interview task._

## 1. Environment under test

- Public API: `POST /api/interview` on the real gateway (`:8010`).
- LLM provider: **Groq multi-key failover chain with Cerebras fallback** (`LLM_PROVIDER=groq`, real keys from `backend/.env`).
- Qdrant: **not running** in this environment - every retrieval exercises the in-memory curriculum fallback (`source='fallback'`).
- Redis: unreachable by design - gateway runs its documented in-memory session store.
- Recording proxy (`:8013`) between gateway and interview-agent for observability only (mocks nothing).

## 2. Provider failover snapshot

- Active slot at end of run: `Cerebras`; all providers exhausted: `False`; fake fallback active: `True`.
- Rotation count reported by the chain: **9**

| seq | at | from | to | reason | retry_after |
|---|---|---|---|---|---|
| 1 | 20:06:03 | Groq key 1 | Cerebras | rate_limit | None |
| 2 | 20:06:04 | Groq key 2 | Groq key 3 | rate_limit | None |
| 3 | 20:06:04 | Groq key 3 | Groq key 4 | rate_limit | None |
| 4 | 20:06:04 | Groq key 4 | Groq key 5 | rate_limit | None |
| 5 | 20:06:04 | Groq key 5 | Groq key 6 | rate_limit | None |
| 6 | 20:06:05 | Groq key 6 | Groq key 7 | rate_limit | None |
| 7 | 20:06:05 | Groq key 7 | Groq key 8 | rate_limit | None |
| 8 | 20:06:05 | Groq key 8 | Groq key 9 | rate_limit | None |
| 9 | 20:06:05 | Groq key 9 | FakeLLM | rate_limit | None |

## 3. Per-persona results

### 3.1 expert - Sarah Johnson (Senior Data Engineer)

**Expected:** all-strong answers -> top scores, no follow-ups, top clamp.

**Outcome:** **PASS**  -  `live-expert-21373304`

| | |
|---|---|
| Tier / start difficulty | expert / hard |
| Questions asked | 8 (distinct days: 5) |
| Follow-ups | 0 |
| Avg score | 9.2 |
| Feedback | `True` - Sarah Johnson performed well, averaging 9.2/10 across 8 questions. Coverage is strong; the |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| exactly 8 questions | PASS | questionCount=8 |
| no follow-ups | PASS | follow-ups=0 |
| all scores >= 8 | PASS | score range 8.0-10.0 |
| difficulty hard throughout | PASS | difficulties=['hard'] |
| floors met | PASS | q=8 days=5 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 8 | Vector Databases Overv | hard | Compare and contrast the performance of  | 8.0 | ok | NEXT_QUESTION | Groq | fallback |
| 1 |  | 12 | Prompt Engineering Fun | hard | Design a system prompt for a chatbot tha | 8.0 | ok | NEXT_QUESTION | Groq | fallback |
| 2 |  | 28 | Docker & Kubernetes De | hard | Containerize the chatbot backend and fro | 8.0 | ok | NEXT_QUESTION | Groq | fallback |
| 3 |  | 29 | Monitoring, Logging &  | hard | As a Senior Data Engineer, explain Monit | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 4 |  | 10 | The Retrieval & Matchi | hard | As a Senior Data Engineer, explain The R | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 5 |  | 12 | Prompt Engineering Fun | hard | As a Senior Data Engineer, explain Promp | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 6 |  | 28 | Docker & Kubernetes De | hard | As a Senior Data Engineer, explain Docke | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 7 |  | 29 | Monitoring, Logging &  | hard | To build on what we discussed: describe  | 10.0 | ok | FINISH | Groq | fallback |

**Log correlation:** 8 transcript turns, 8 [AGENT] turn blocks, 8 question-generation events, 8 evaluation events.

**Served by (key/model usage):**

- `groq` / `llama-3.3-70b-versatile`: groq_key_1x1
- `groq` / `llama-3.1-8b-instant`: groq_key_1x5

**Rotation/failover log lines:**
- `provider_rotation from=Groq key 1 to=Cerebras reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 2 to=Groq key 3 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 3 to=Groq key 4 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 4 to=Groq key 5 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 5 to=Groq key 6 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 6 to=Groq key 7 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 7 to=Groq key 8 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 8 to=Groq key 9 reason=rate_limit retry_after=None`

**Rate-limit / API-error lines:** 43

## 4. Cross-cutting invariants

| Invariant | Result |
|---|---|
| all completed sessions meet floors (>=8 q, >=4 days) | PASS |
| every non-follow-up question grounded by RAG (source recorded) | PASS |
| every initial question has a provider attribution | PASS |
| every evaluated turn has an evaluation provider | PASS |
| feedback shape = {summary, strengths, gaps, next} | PASS |
| public API replies non-empty until done | PASS |
| structured [AGENT] logs present | PASS |
| structured [AI] logs present | PASS |
| LLM status endpoint reachable | PASS |

## 5. Summary

| Persona | Scenario | Result |
|---|---|---|
| Sarah Johnson | all-strong answers -> top scores, no follow-ups, top clamp | PASS |

**1/1 personas passed.**

_Raw logs and session JSON: `backend/tests_e2e/transcripts/live-*/`._
