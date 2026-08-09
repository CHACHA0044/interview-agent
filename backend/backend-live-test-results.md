# Backend Live Test Results (Phase 2)

_Generated 2026-08-09 20:35:27 by the live-provider interview task._

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
| 1 | 20:30:35 | Groq key 1 | Cerebras | rate_limit | None |
| 2 | 20:30:36 | Groq key 2 | Groq key 3 | rate_limit | None |
| 3 | 20:30:36 | Groq key 3 | Groq key 4 | rate_limit | None |
| 4 | 20:30:36 | Groq key 4 | Groq key 5 | rate_limit | None |
| 5 | 20:30:36 | Groq key 5 | Groq key 6 | rate_limit | None |
| 6 | 20:30:41 | Groq key 6 | Groq key 7 | rate_limit | None |
| 7 | 20:30:41 | Groq key 7 | Groq key 8 | rate_limit | None |
| 8 | 20:30:42 | Groq key 8 | Groq key 9 | rate_limit | None |
| 9 | 20:30:42 | Groq key 9 | FakeLLM | rate_limit | None |

## 3. Per-persona results

### 3.1 expert - Sarah Johnson (Senior Data Engineer)

**Expected:** all-strong answers -> no follow-ups, top average, top clamp (real-LLM grading is stricter than the fake 10.0 heuristic).

**Outcome:** **PASS**  -  `live-expert-21d920ab`

| | |
|---|---|
| Tier / start difficulty | expert / hard |
| Questions asked | 8 (distinct days: 5) |
| Follow-ups | 0 |
| Avg score | 8.2 |
| Feedback | `True` - Sarah Johnson performed well, averaging 8.2/10 across 8 questions. Coverage is strong; the |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| exactly 8 questions | PASS | questionCount=8 |
| no follow-ups | PASS | follow-ups=0 |
| all scores >= 6 (follow-up floor) | PASS | score range 6.0-10.0 |
| avg score >= 8 | PASS | avg=8.25 |
| difficulty hard throughout | PASS | difficulties=['hard'] |
| floors met | PASS | q=8 days=5 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 8 | Vector Databases Overv | hard | Compare the trade-offs between using a l | 8.0 | ok | NEXT_QUESTION | Groq | fallback |
| 1 |  | 12 | Prompt Engineering Fun | hard | Design a system prompt for a chatbot to  | 6.0 | ok | NEXT_QUESTION | Groq | fallback |
| 2 |  | 28 | Docker & Kubernetes De | hard | Containerize the chatbot backend and fro | 6.0 | ok | NEXT_QUESTION | Groq | fallback |
| 3 |  | 29 | Monitoring, Logging &  | hard | Describe a logging strategy for the chat | 6.0 | ok | NEXT_QUESTION | Groq | fallback |
| 4 |  | 10 | The Retrieval & Matchi | hard | As a Senior Data Engineer, explain The R | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 5 |  | 12 | Prompt Engineering Fun | hard | As a Senior Data Engineer, explain Promp | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 6 |  | 28 | Docker & Kubernetes De | hard | As a Senior Data Engineer, explain Docke | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 7 |  | 29 | Monitoring, Logging &  | hard | As a Senior Data Engineer, explain Monit | 10.0 | ok | FINISH | Groq | fallback |

**Log correlation:** 8 transcript turns, 8 [AGENT] turn blocks, 8 question-generation events, 8 evaluation events.

**Served by (key/model usage):**

- `groq` / `llama-3.1-8b-instant`: groq_key_1x7, groq_key_6x1

**Rotation/failover log lines:**
- `provider_rotation from=Groq key 1 to=Cerebras reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 2 to=Groq key 3 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 3 to=Groq key 4 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 4 to=Groq key 5 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 5 to=Groq key 6 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 6 to=Groq key 7 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 7 to=Groq key 8 reason=rate_limit retry_after=None`
- `provider_rotation from=Groq key 8 to=Groq key 9 reason=rate_limit retry_after=None`

**Rate-limit / API-error lines:** 45

### 3.2 novice - Tyler Brooks (Junior Developer)

**Expected:** all-weak answers -> follow-up budget consumed, bottom clamp.

**Outcome:** **PASS**  -  `live-novice-3011f8eb`

| | |
|---|---|
| Tier / start difficulty | novice / easy |
| Questions asked | 14 (distinct days: 10) |
| Follow-ups | 4 |
| Avg score | 1.3 |
| Feedback | `True` - Tyler Brooks is still building fundamentals, averaging 1.3/10 across 14 questions. Several |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| all scores < 5 | PASS | score range 1.3-1.3 |
| follow-ups consumed | PASS | follow-ups=4 |
| per-question follow-up cap <= 2 | PASS | max run=0 |
| difficulty stayed easy | PASS | difficulties=['easy'] |
| follow-ups quote the answer | PASS | quoted=4/4 |
| floors met | PASS | q=14 days=10 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 1 | VS Code & Python Envir | easy | As a Junior Developer, explain VS Code & | 1.3 | yes_no | FOLLOW_UP | Groq | fallback |
| 1 | Y | 1 | VS Code & Python Envir | easy | Let's go deeper on VS Code, Python, Pyth | 1.3 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 2 | Y | 1 | VS Code & Python Envir | easy | You said: "I have not worked with this t | 1.3 | yes_no | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 3 |  | 7 | Embeddings Explained | easy | As a Junior Developer, explain Embedding | 1.3 | yes_no | FOLLOW_UP | Groq | fallback |
| 4 | Y | 7 | Embeddings Explained | easy | Let's go deeper on Sentence Transformers | 1.3 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 5 | Y | 7 | Embeddings Explained | easy | You said: "I have not worked with this t | 1.3 | yes_no | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 6 |  | 12 | Prompt Engineering Fun | easy | As a Junior Developer, explain Prompt En | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 7 |  | 16 | Chatbot Backend & API  | easy | As a Junior Developer, explain Chatbot B | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 8 |  | 22 | Multi-Agent Orchestrat | easy | As a Junior Developer, explain Multi-Age | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 9 |  | 28 | Docker & Kubernetes De | easy | As a Junior Developer, explain Docker &  | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 10 |  | 31 | Capstone Project & Fin | easy | As a Junior Developer, explain Capstone  | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 11 |  | 3 | First AI Project, Reac | easy | As a Junior Developer, explain First AI  | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 12 |  | 8 | Vector Databases Overv | easy | As a Junior Developer, explain Vector Da | 1.3 | yes_no | NEXT_QUESTION | Groq | fallback |
| 13 |  | 10 | The Retrieval & Matchi | easy | As a Junior Developer, explain The Retri | 1.3 | yes_no | FINISH | Groq | fallback |

**Log correlation:** 14 transcript turns, 14 [AGENT] turn blocks, 10 question-generation events, 14 evaluation events.

**Served by (key/model usage):**


**Rotation/failover log lines:**
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`

**Rate-limit / API-error lines:** 29

### 3.3 mixed - Ravi Patel (Software Engineer)

**Expected:** strong until hard appears, then weak once, then strong -> difficulty rises and falls.

**Outcome:** **PASS**  -  `live-mixed-60fb6726`

| | |
|---|---|
| Tier / start difficulty | strong / medium |
| Questions asked | 12 (distinct days: 5) |
| Follow-ups | 4 |
| Avg score | 5.6 |
| Feedback | `True` - Ravi Patel demonstrated a developing understanding, averaging 5.6/10 across 12 questions.  |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| difficulty rose to hard | PASS | state-up events=3 |
| difficulty fell after weak streak | PASS | state-down events=4 |
| floors met | PASS | q=12 days=5 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 1 | VS Code & Python Envir | medium | As a Software Engineer, explain VS Code  | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 1 |  | 7 | Embeddings Explained | medium | As a Software Engineer, explain Embeddin | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 2 |  | 12 | Prompt Engineering Fun | hard | As a Software Engineer, explain Prompt E | 1.3 | yes_no | FOLLOW_UP | Groq | fallback |
| 3 | Y | 12 | Prompt Engineering Fun | hard | Let's go deeper on LLMs, Prompt Template | 1.3 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 4 | Y | 12 | Prompt Engineering Fun | hard | You said: "I have not worked with this t | 1.3 | yes_no | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 5 |  | 28 | Docker & Kubernetes De | medium | As a Software Engineer, explain Docker & | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 6 |  | 31 | Capstone Project & Fin | medium | As a Software Engineer, explain Capstone | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 7 |  | 1 | VS Code & Python Envir | hard | To build on what we discussed: describe  | 1.3 | yes_no | FOLLOW_UP | Groq | fallback |
| 8 | Y | 1 | VS Code & Python Envir | hard | Let's go deeper on VS Code, Python, Pyth | 1.3 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 9 | Y | 1 | VS Code & Python Envir | hard | You said: "I have not worked with this t | 1.3 | yes_no | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 10 |  | 7 | Embeddings Explained | medium | To build on what we discussed: describe  | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 11 |  | 12 | Prompt Engineering Fun | medium | Putting it together: how would you appro | 10.0 | ok | FINISH | Groq | fallback |

**Events:** difficulty medium->hard (turn 1); difficulty hard->medium (turn 3); difficulty hard->medium (turn 4); difficulty medium->hard (turn 6); difficulty hard->medium (turn 8); difficulty hard->medium (turn 9); difficulty medium->hard (turn 11)

**Log correlation:** 12 transcript turns, 12 [AGENT] turn blocks, 8 question-generation events, 12 evaluation events.

**Served by (key/model usage):**


**Rotation/failover log lines:**
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`

**Rate-limit / API-error lines:** 25

### 3.4 clarifying - Emily Chen (AI Engineer)

**Expected:** asks a clarifying question on turn 0 (no slot/budget consumed), then strong.

**Outcome:** **PASS**  -  `live-clarifying-1d54c3ea`

| | |
|---|---|
| Tier / start difficulty | strong / medium |
| Questions asked | 8 (distinct days: 4) |
| Follow-ups | 0 |
| Avg score | 10.0 |
| Feedback | `True` - Emily Chen performed well, averaging 10.0/10 across 8 questions. Coverage is strong; the n |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| clarifying question detected | PASS | clarification events=1 |
| clarification did not consume a slot | PASS | questionCount=8 |
| no moderation false-positive | PASS | clean |
| floors met | PASS | q=8 days=4 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 23 | Model Context Protocol | medium | As a AI Engineer, explain Model Context  |  |  |  | n/a (clarification re-ask) | n/a (clari |
| 1 |  | 23 | Model Context Protocol | medium | Good question. To clarify: I'm asking ab | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 2 |  | 31 | Capstone Project & Fin | medium | As a AI Engineer, explain Capstone Proje | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 3 |  | 23 | Model Context Protocol | hard | Putting it together: how would you appro | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 4 |  | 31 | Capstone Project & Fin | hard | Let's look at this from another angle: e | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 5 |  | 22 | Multi-Agent Orchestrat | hard | As a AI Engineer, explain Multi-Agent Or | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 6 |  | 22 | Multi-Agent Orchestrat | hard | Putting it together: how would you appro | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 7 |  | 21 | Agentic Frameworks: La | hard | As a AI Engineer, explain Agentic Framew | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 8 |  | 21 | Agentic Frameworks: La | hard | To build on what we discussed: describe  | 10.0 | ok | FINISH | Groq | fallback |

**Events:** clarification (turn 0); difficulty medium->hard (turn 2)

**Log correlation:** 9 transcript turns, 9 [AGENT] turn blocks, 8 question-generation events, 8 evaluation events.

**Served by (key/model usage):**


**Rotation/failover log lines:**
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`

**Rate-limit / API-error lines:** 17

### 3.5 moderation - Michael Brown (DevOps Engineer)

**Expected:** one abusive answer -> server-side moderation terminates the interview.

**Outcome:** **PASS**  -  `live-moderation-e351a2ab`

| | |
|---|---|
| Tier / start difficulty | expert / hard |
| Questions asked | 2 (distinct days: 2) |
| Follow-ups | 0 |
| Avg score | 5.0 |
| Feedback | `True` - Michael Brown's interview was terminated early because a response was flagged for abuse: ' |

#### Checks

| Check | Result | Detail |
|---|---|---|
| interview terminated by moderation | PASS | flagged reason=["abuse: 'stupid'"] |
| finished (terminated) | PASS | completed via moderation |
| short session | PASS | questionCount=2 |
| feedback flags policy violation | PASS | Michael Brown's interview was terminated early because a response was flagged for abuse: 'stupid'. The assessment was st |
| flagged turn scored 0 | PASS | flagged scores=[0.0] |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 12 | Prompt Engineering Fun | hard | As a DevOps Engineer, explain Prompt Eng | 10.0 | ok | NEXT_QUESTION | Groq | fallback |
| 1 |  | 23 | Model Context Protocol | hard | As a DevOps Engineer, explain Model Cont | 0.0 |  |  | Groq | fallback |

**Events:** moderation=abuse: 'stupid' (turn 1)

**Log correlation:** 2 transcript turns, 2 [AGENT] turn blocks, 2 question-generation events, 1 evaluation events.

**Served by (key/model usage):**


**Rotation/failover log lines:**
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`

**Rate-limit / API-error lines:** 3

### 3.6 low_effort - Wendy Foster (Marketing Manager)

**Expected:** low-effort + empty answers -> low scores, follow-ups, empty-answer handling.

**Outcome:** **PASS**  -  `live-low_effort-d0455985`

| | |
|---|---|
| Tier / start difficulty | strong / medium |
| Questions asked | 14 (distinct days: 10) |
| Follow-ups | 4 |
| Avg score | 0.6 |
| Feedback | `True` - Wendy Foster is still building fundamentals, averaging 0.6/10 across 14 questions. Several |

#### Checks

| Check | Result | Detail |
|---|---|---|
| finished | PASS | interview completed |
| low average score | PASS | avg=0.6 |
| empty answers handled | PASS | empty-answer turns=4 |
| follow-ups triggered | PASS | follow-ups=4 |
| floors met | PASS | q=14 days=10 |

#### Turn evidence

| # | FU | Day | Topic | Diff | Q | Score | Kind | Decision | Provider | RAG |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 |  | 1 | VS Code & Python Envir | medium | As a Marketing Manager, explain VS Code  | 0.9 | yes_no | FOLLOW_UP | Groq | fallback |
| 1 | Y | 1 | VS Code & Python Envir | medium | Let's go deeper on VS Code, Python, Pyth | 0.9 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 2 | Y | 1 | VS Code & Python Envir | medium | You said: "I don't know, I'm not really  | 0.0 | empty | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 3 |  | 7 | Embeddings Explained | easy | As a Marketing Manager, explain Embeddin | 0.9 | yes_no | FOLLOW_UP | Groq | fallback |
| 4 | Y | 7 | Embeddings Explained | easy | Let's go deeper on Sentence Transformers | 0.9 | yes_no | FOLLOW_UP | n/a (follow-up generated via followup_generator) | n/a (follo |
| 5 | Y | 7 | Embeddings Explained | easy | You said: "I don't know, I'm not really  | 0.0 | empty | NEXT_QUESTION | n/a (follow-up generated via followup_generator) | n/a (follo |
| 6 |  | 12 | Prompt Engineering Fun | easy | As a Marketing Manager, explain Prompt E | 0.9 | yes_no | NEXT_QUESTION | Groq | fallback |
| 7 |  | 16 | Chatbot Backend & API  | easy | As a Marketing Manager, explain Chatbot  | 0.9 | yes_no | NEXT_QUESTION | Groq | fallback |
| 8 |  | 22 | Multi-Agent Orchestrat | easy | As a Marketing Manager, explain Multi-Ag | 0.0 | empty | NEXT_QUESTION | Groq | fallback |
| 9 |  | 27 | Security, Privacy & Gu | easy | As a Marketing Manager, explain Security | 0.9 | yes_no | NEXT_QUESTION | Groq | fallback |
| 10 |  | 31 | Capstone Project & Fin | easy | As a Marketing Manager, explain Capstone | 0.9 | yes_no | NEXT_QUESTION | Groq | fallback |
| 11 |  | 8 | Vector Databases Overv | easy | As a Marketing Manager, explain Vector D | 0.0 | empty | NEXT_QUESTION | Groq | fallback |
| 12 |  | 17 | Chatbot Frontend Devel | easy | As a Marketing Manager, explain Chatbot  | 0.9 | yes_no | NEXT_QUESTION | Groq | fallback |
| 13 |  | 28 | Docker & Kubernetes De | easy | As a Marketing Manager, explain Docker & | 0.9 | yes_no | FINISH | Groq | fallback |

**Events:** difficulty medium->easy (turn 1); difficulty medium->easy (turn 2)

**Log correlation:** 14 transcript turns, 14 [AGENT] turn blocks, 10 question-generation events, 14 evaluation events.

**Served by (key/model usage):**


**Rotation/failover log lines:**
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`
- `provider_failover to=FakeLLMProvider reason=all_providers_failed - all providers exhausted, using fallback`

**Rate-limit / API-error lines:** 25

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
| Sarah Johnson | all-strong answers -> no follow-ups, top average, top clamp (real-LLM grading is stricter than the fake 10.0 heuristic) | PASS |
| Tyler Brooks | all-weak answers -> follow-up budget consumed, bottom clamp | PASS |
| Ravi Patel | strong until hard appears, then weak once, then strong -> difficulty rises and falls | PASS |
| Emily Chen | asks a clarifying question on turn 0 (no slot/budget consumed), then strong | PASS |
| Michael Brown | one abusive answer -> server-side moderation terminates the interview | PASS |
| Wendy Foster | low-effort + empty answers -> low scores, follow-ups, empty-answer handling | PASS |

**6/6 personas passed.**

_Raw logs and session JSON: `backend/tests_e2e/transcripts/live-*/`._
