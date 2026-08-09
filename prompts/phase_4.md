You are continuing work on PRANAV'S backend responsibilities for "The Interview Agent".

IMPORTANT:
The Gateway service is already implemented and tested successfully.

Current status:
- Gateway implemented
- 24 Gateway tests passing
- POST /api/interview implemented
- Redis session lifecycle implemented
- Interview Agent HTTP client implemented
- Error handling implemented
- Timeouts/retries implemented
- Gateway health endpoint implemented

DO NOT rewrite or unnecessarily modify the Gateway.

Your task now is to implement the SHARED CONTRACT + LOCAL INFRASTRUCTURE layer that allows Pranav, Shezan, and Meraj to work independently.

============================================================
SCOPE — ONLY THESE TASKS
============================================================

Implement:

1. shared/schemas/
2. shared/contracts/CONTRACTS.md
3. Contract tests
4. Root .env.example
5. docker-compose.yml
6. Minimal supporting files required for the above

DO NOT implement:

- Interview Agent business logic
- Candidate tier calculation
- Curriculum planning
- Interview strategy
- Question generation
- Follow-up logic
- LLM integration
- RAG
- Embeddings
- Qdrant business logic
- Answer evaluation
- Feedback generation
- Frontend changes

Those belong to Shezan and Meraj.

============================================================
STEP 1 — READ EVERYTHING FIRST
============================================================

Before making changes, inspect:

- BACKEND.md
- technical-spec.md
- existing services/gateway/**
- candidates.json
- curriculum.json
- existing tests
- existing .env files
- package/project configuration
- Git status

Do not guess contracts.

BACKEND.md and technical-spec.md are the source of truth.

The public API contract MUST NOT change.

============================================================
STEP 2 — CREATE SHARED CONTRACTS
============================================================

Create:

backend/shared/

    schemas/
        session.json
        agent_api.json
        ai_api.json

    contracts/
        CONTRACTS.md

IMPORTANT:

shared/ must contain NO business logic.

Do not create shared Python classes that services import.

The purpose of shared/ is contract documentation and JSON Schemas only.

Each service will maintain its own local Pydantic models.

============================================================
STEP 3 — SESSION SCHEMA
============================================================

Create:

shared/schemas/session.json

Define the canonical active interview session structure.

It must support the information already used by the Gateway:

- sessionId
- status
- createdAt
- updatedAt
- candidate
- agentState
- currentQuestion
- questionCount
- daysAsked
- conversation
- scores
- topicScores
- finalFeedback

Do not invent unnecessary fields.

agentState must remain opaque to the Gateway.

The Interview Agent owns the meaning of agentState.

Use JSON Schema Draft 2020-12 unless the existing project already specifies another compatible version.

============================================================
STEP 4 — INTERVIEW AGENT CONTRACT
============================================================

Create:

shared/schemas/agent_api.json

Define the internal Gateway → Interview Agent contracts.

The contract must cover:

POST /internal/interview/start

POST /internal/interview/next

POST /internal/interview/follow-up

POST /internal/interview/complete

GET /health

Define request and response schemas.

The Agent must be able to receive the information it needs without requiring Gateway business logic.

The Gateway should provide:

- session information
- candidate information where required
- conversation/context
- current agentState
- current question
- candidate answer/message
- question count
- relevant interview state

The Agent should return structured results such as:

- reply/question
- done
- agentState
- question metadata
- evaluation/feedback references where applicable
- final feedback when interview completes

IMPORTANT:

Do not put LLM-generated language rules into the schema.

The schema defines DATA CONTRACTS, not business logic.

============================================================
STEP 5 — AI INTELLIGENCE CONTRACT
============================================================

Create:

shared/schemas/ai_api.json

Define contracts for:

POST /internal/ai/generate-question

POST /internal/ai/generate-followup

POST /internal/ai/evaluate-answer

POST /internal/ai/generate-feedback

POST /internal/ai/retrieve-context

GET /health

Meraj will implement these later.

Make the contracts explicit enough that Meraj can implement the AI service without guessing.

Include appropriate fields for:

Question generation:
- candidate context
- curriculum context
- question strategy
- conversation context
- difficulty
- topic/day

Follow-up generation:
- previous question
- previous answer
- evaluation
- curriculum context
- follow-up strategy

Evaluation:
- question
- expected concepts
- candidate answer
- curriculum context

Feedback:
- candidate context
- interview evaluations
- curriculum coverage
- strengths
- gaps
- missed concepts

Retrieval:
- query
- day/topic/module filters
- topK
- retrieved chunks
- metadata

Do NOT implement RAG here.

Only define the contract.

============================================================
STEP 6 — CONTRACTS.md
============================================================

Create:

shared/contracts/CONTRACTS.md

This is the human-readable source explaining the contracts.

Include:

1. Contract version
2. Ownership
3. Public API relationship
4. Gateway → Agent
5. Agent → AI
6. Session structure
7. Error format
8. Health endpoints
9. Versioning rules
10. Change approval process

Clearly state:

Gateway:
Pranav

Interview Agent:
Shezan

AI Intelligence:
Meraj

Shared contracts:
All three review; Pranav maintains the files.

============================================================
STEP 7 — CONTRACT VERSIONING
============================================================

Define a simple versioning strategy.

Example:

v1

Do NOT over-engineer versioning.

Any breaking contract change requires:

1. Proposal
2. Team review
3. Schema update
4. CONTRACTS.md update
5. Contract tests update
6. Both producer and consumer updated

No developer should silently modify a shared contract.

============================================================
STEP 8 — CONTRACT TESTS
============================================================

Add tests proving that the Gateway's existing Pydantic models remain compatible with:

shared/schemas/session.json

shared/schemas/agent_api.json

shared/schemas/ai_api.json

Do NOT modify Gateway business logic just to make tests pass.

If there is a genuine mismatch:

- identify it
- determine whether BACKEND.md or the current Gateway implementation is authoritative
- make the smallest necessary change
- document the change

Contract tests should detect:

- missing required fields
- incorrect field types
- incorrect response structures
- invalid enum values
- incompatible nested structures

Use real sample payloads.

Create fixtures for:

- interview start
- interview turn
- interview completion
- agent start response
- agent next response
- follow-up response
- AI question generation
- AI follow-up
- evaluation
- feedback
- retrieval

No real LLM calls.

No real Qdrant calls.

============================================================
STEP 9 — ROOT ENVIRONMENT
============================================================

Create/update:

backend/.env.example

Use the variables defined in BACKEND.md.

At minimum include:

BACKEND_PORT=8000

REDIS_URL=redis://redis:6379/0
SESSION_TTL_SECONDS=3600

AGENT_SERVICE_URL=http://interview-agent:8001
AI_SERVICE_URL=http://ai-intelligence:8002

FRONTEND_ORIGINS=http://localhost:5173

INTERNAL_API_TOKEN=

MIN_QUESTIONS=8
MIN_CURRICULUM_DAYS=4

LOG_LEVEL=INFO

Also include placeholders for AI/Qdrant variables required by the complete Compose environment, but DO NOT add real secrets.

Examples may include:

QDRANT_URL=http://qdrant:6333
LLM_PROVIDER=fake

Do not commit .env.

============================================================
STEP 10 — DOCKER COMPOSE
============================================================

Create:

backend/docker-compose.yml

The architecture must be:

frontend
   ↓
gateway :8000
   ↓
interview-agent :8001
   ↓
ai-intelligence :8002
   ↓
qdrant

Redis is used by Gateway.

Services:

gateway
interview-agent
ai-intelligence
redis
qdrant

Only Gateway exposes a host port:

8000:8000

Do NOT expose:

8001
8002
6379
6333

Services communicate using Docker Compose service names.

Examples:

http://interview-agent:8001

http://ai-intelligence:8002

redis://redis:6379/0

http://qdrant:6333

============================================================
STEP 11 — DO NOT IMPLEMENT OTHER SERVICES
============================================================

At this stage, Shezan and Meraj may not have implemented their services yet.

DO NOT implement their actual services.

If Docker Compose requires something to start successfully before their work exists, use MINIMAL temporary placeholders only.

A placeholder may:

- start
- expose /health
- return a clearly marked stub response

It must NOT contain:

- interview logic
- LLM code
- RAG
- evaluation
- feedback

Clearly mark temporary placeholders as:

TODO — REPLACE WITH SHEZAN'S IMPLEMENTATION

or

TODO — REPLACE WITH MERAJ'S IMPLEMENTATION

Do not overwrite their future directory structure.

============================================================
STEP 12 — DOCKER NETWORK
============================================================

Use a single internal Compose network.

Expected topology:

gateway
  |
  +--> redis
  |
  +--> interview-agent
          |
          +--> ai-intelligence
                    |
                    +--> qdrant

Only Gateway is externally reachable.

Internal services should communicate through Docker DNS.

============================================================
STEP 13 — HEALTHCHECKS
============================================================

Every application service should expose:

GET /health

Compose healthchecks should use these endpoints.

Expected:

gateway → /health
interview-agent → /health
ai-intelligence → /health

Redis and Qdrant should use appropriate container health checks.

Gateway should wait for Redis and Interview Agent readiness.

Interview Agent should wait for AI Intelligence readiness.

AI Intelligence should wait for Qdrant readiness.

Do not make health checks depend on real LLM API calls.

============================================================
STEP 14 — QDRANT
============================================================

Add Qdrant to Compose.

Use the official Qdrant container.

Keep it internal.

Add a named volume so local development does not unnecessarily lose the vector database between restarts.

Do NOT implement:

- embeddings
- ingestion
- retrieval
- collections
- RAG

Meraj owns those.

============================================================
STEP 15 — REDIS
============================================================

Add Redis 7 Alpine.

Redis sessions are ephemeral.

Do not add unnecessary persistence.

The Gateway must continue using:

REDIS_URL=redis://redis:6379/0

Do not modify the existing session implementation unless required for Compose compatibility.

============================================================
STEP 16 — CONTRACT TESTING WITH COMPOSE
============================================================

Do not require real LLM credentials.

The architecture must support:

LLM_PROVIDER=fake

for local testing.

The initial Compose setup should allow:

docker compose up --build

without requiring real API keys.

The fake/stub services are only temporary infrastructure for parallel development.

============================================================
STEP 17 — VERIFY THE GATEWAY
============================================================

After completing the shared contracts and Compose:

Run the existing Gateway tests.

Expected:

24 tests remain passing.

Do not reduce test coverage.

Then run:

docker compose config

and validate that the Compose configuration is syntactically correct.

If possible:

docker compose build

Do not claim E2E success unless the actual dependent services are available.

============================================================
STEP 18 — GIT RULE
============================================================

DO NOT PUSH ANYTHING in this task.

The BACKEND.md architecture has already been pushed.

Do NOT create a commit unless explicitly requested.

At the end run:

git status
git diff --stat

Report:

- files created
- files modified
- contract decisions
- Gateway changes, if any
- tests passed
- Docker validation result
- anything Shezan needs to know
- anything Meraj needs to know
- anything that remains blocked

============================================================
STRICT OWNERSHIP
============================================================

YOUR WORK:

✓ shared/schemas
✓ shared/contracts
✓ contract tests
✓ root .env.example
✓ docker-compose.yml
✓ minimal infrastructure
✓ Gateway compatibility

NOT YOUR WORK:

✗ Interview Agent logic
✗ Candidate intelligence
✗ Curriculum planning
✗ Question strategy
✗ Follow-up strategy
✗ LLM
✗ RAG
✗ Embeddings
✗ Qdrant implementation
✗ Evaluation
✗ Feedback
✗ Frontend

Do not expand scope.

============================================================
FINAL SUCCESS CONDITION
============================================================

At the end we should have:

SHARED:

✓ session.json
✓ agent_api.json
✓ ai_api.json
✓ CONTRACTS.md
✓ contract tests

INFRASTRUCTURE:

✓ root .env.example
✓ docker-compose.yml
✓ Redis
✓ Qdrant
✓ service networking
✓ health checks
✓ temporary service placeholders if required

GATEWAY:

✓ Existing Gateway remains functional
✓ 24 existing tests still pass
✓ Contract compatibility verified

TEAM:

✓ Shezan can start implementing Interview Agent against frozen contracts.
✓ Meraj can start implementing AI Intelligence/RAG/LLM against frozen contracts.
✓ No developer needs to guess another developer's API.

DO NOT modify the frontend.
DO NOT implement the other two services.
DO NOT push code.

Finish with a concise status report and exact git status.

You are continuing PRANAV'S backend work for "The Interview Agent".

CURRENT STATUS:

- Gateway implemented
- 24 Gateway tests passing
- Shared contract layer implemented
- 50 contract tests passing
- Total: 74 tests green
- docker-compose.yml created
- Redis + Qdrant infrastructure defined
- Minimal Interview Agent and AI Intelligence placeholders exist
- Nothing has been committed/pushed yet
- Docker cannot currently be executed because Docker is not installed on this machine

IMPORTANT:

DO NOT build the real Interview Agent.
DO NOT build the real AI Intelligence service.
DO NOT implement LLM.
DO NOT implement RAG.
DO NOT implement evaluation.
DO NOT implement feedback generation.
DO NOT modify the frontend.

Your task is now a FINAL ARCHITECTURE + CONTRACT AUDIT of the work completed so far.

============================================================
1. READ THE AUTHORITATIVE SOURCES
============================================================

Before changing anything, read:

- BACKEND.md
- technical-spec.md
- candidates.json
- curriculum.json
- existing Gateway implementation
- shared/schemas/**
- shared/contracts/CONTRACTS.md
- shared/tests/**
- docker-compose.yml
- root .env.example

Understand the actual project rather than relying on assumptions.

============================================================
2. CRITICAL HACKATHON REQUIREMENT
============================================================

There is currently a potentially serious contradiction in the contracts:

The current contract notes say:

"interview is 4 questions total"

This MUST be investigated.

The hackathon requires:

- minimum 8 questions
- at least 4 different curriculum days
- adaptive follow-up questions
- conversation context
- structured final feedback

The backend architecture/Definition of Done also requires:

- ≥8 questions
- ≥4 distinct curriculum days
- ≥1 genuine previous-answer-anchored follow-up

Therefore:

DO NOT allow any contract, schema, fixture, or documentation to imply that the interview may legally complete after 4 questions.

Change the contract to support the actual hackathon requirement.

The correct conceptual rule is:

minimumQuestions >= 8
minimumCurriculumDays >= 4

The Agent should own the actual progression logic.

The Gateway should NOT implement question-count business logic beyond storing/transporting session state.

Do not hard-code "8" into unrelated schemas if it does not belong there.

Instead clearly document that the Interview Agent is responsible for enforcing the interview completion requirements.

============================================================
3. AUDIT PUBLIC API
============================================================

Verify that:

POST /api/interview

still exactly follows technical-spec.md.

Verify:

START:

{
  "sessionId": "...",
  "candidate": {...}
}

TURN:

{
  "sessionId": "...",
  "message": "..."
}

FINAL:

{
  "reply": "...",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": [],
    "gaps": [],
    "next": []
  }
}

Do NOT change the public API unless technical-spec.md explicitly requires it.

The frontend must remain unaffected.

============================================================
4. AUDIT INTERNAL AGENT CONTRACT
============================================================

Review:

shared/schemas/agent_api.json

Make sure Shezan can implement the Interview Agent without guessing.

The contract must support:

- interview start
- next turn
- follow-up
- completion
- agentState
- current question
- candidate context
- conversation context
- question count
- curriculum-day tracking
- question metadata
- final feedback

agentState must remain opaque to Gateway.

The Gateway stores and forwards it.

The Interview Agent owns its meaning.

Most importantly:

The contract must NOT force the Interview Agent to finish after 4 questions.

The Interview Agent must be able to continue until:

- at least 8 questions
- at least 4 curriculum days
- appropriate follow-up behavior
- interview completion criteria satisfied

============================================================
5. AUDIT AI INTELLIGENCE CONTRACT
============================================================

Review:

shared/schemas/ai_api.json

Ensure Meraj can independently implement:

POST /internal/ai/generate-question
POST /internal/ai/generate-followup
POST /internal/ai/evaluate-answer
POST /internal/ai/generate-feedback
POST /internal/ai/retrieve-context

The contracts should provide enough information for:

Question generation:
- candidate context
- curriculum context
- strategy
- difficulty
- topic
- day
- conversation context

Follow-up:
- previous question
- previous answer
- evaluation
- curriculum context
- follow-up strategy

Evaluation:
- question
- answer
- expected concepts
- curriculum context

Feedback:
- candidate
- evaluations
- curriculum coverage
- strengths
- gaps
- missed concepts

Retrieval:
- query
- day/topic/module filters
- topK
- metadata

Do NOT implement any AI logic.

============================================================
6. AUDIT SESSION CONTRACT
============================================================

Review:

shared/schemas/session.json

Verify it accurately represents the Gateway's current SessionDoc.

Do not unnecessarily change the Gateway implementation.

Verify these concepts are supported:

- sessionId
- status
- timestamps
- candidate
- agentState
- currentQuestion
- questionCount
- daysAsked
- conversation
- scores
- topicScores
- finalFeedback

Make sure the schema does not incorrectly constrain Agent-owned state.

============================================================
7. AUDIT CONTRACT TESTS
============================================================

Run the existing contract tests.

Expected:

74 total tests or more.

Do not reduce test coverage.

Add/update tests specifically covering the corrected interview contract.

At minimum verify:

- no contract permits completion after 4 questions
- Agent response can represent question 8+
- multiple curriculum days can be represented
- follow-up can occur
- final feedback remains valid
- Gateway SessionDoc remains compatible
- AI contracts remain valid

Use realistic fixtures.

Do not call real LLM APIs.

Do not require Qdrant.

============================================================
8. AUDIT CONTRACT DOCUMENTATION
============================================================

Review:

shared/contracts/CONTRACTS.md

Correct any statements that conflict with:

- technical-spec.md
- BACKEND.md
- hackathon requirements

Clearly document:

Gateway:
Pranav

Interview Agent:
Shezan

AI Intelligence:
Meraj

Shared contracts:
All three review.

Add a clear rule:

"The Interview Agent owns interview completion logic. The interview must not complete before satisfying the hackathon minimum of 8 questions across at least 4 curriculum days."

Do not put this business logic inside the Gateway.

============================================================
9. AUDIT DOCKER COMPOSE
============================================================

Review docker-compose.yml.

Expected topology:

gateway :8000
interview-agent :8001
ai-intelligence :8002
redis :6379
qdrant :6333

Only gateway exposes a host port.

Internal services remain internal.

Verify:

- service names
- environment variables
- networking
- healthchecks
- depends_on
- Redis URL
- Qdrant URL
- Agent URL
- AI URL
- volume configuration

Docker is NOT installed on this machine.

Therefore:

DO NOT claim docker compose up/build succeeded.

You may perform static/YAML validation and explain that runtime Docker validation remains pending.

============================================================
10. AUDIT ENVIRONMENT VARIABLES
============================================================

Review:

backend/.env.example

Ensure variables are consistent with:

- Gateway implementation
- BACKEND.md
- docker-compose.yml
- internal service URLs
- Redis
- Qdrant
- LLM provider configuration

No real secrets.

No hardcoded API keys.

============================================================
11. AUDIT PLACEHOLDER SERVICES
============================================================

The current:

services/interview-agent/

services/ai-intelligence/

contain minimal placeholders.

Keep them minimal.

Do NOT turn them into real implementations.

Only verify:

- Dockerfile exists
- /health exists
- service names/ports are correct
- they do not conflict with Shezan/Meraj's future work

Do not add business logic.

============================================================
12. CHECK DATA PATHS
============================================================

The contract tests currently locate:

candidates.json
curriculum.json

Verify their actual repository location.

Do NOT move the data files unless required.

If BACKEND.md says:

backend/data/

but the actual files currently live elsewhere:

DO NOT blindly move them.

Instead:

- document the mismatch
- choose the least disruptive approach
- update references consistently if necessary
- do not duplicate the same dataset unnecessarily

The data files are read-only inputs.

============================================================
13. GATEWAY REGRESSION
============================================================

After any contract corrections:

Run the complete Gateway test suite.

Expected:

24 Gateway tests remain green.

Then run all shared contract tests.

Expected:

all contract tests green.

Do not alter Gateway behavior unnecessarily.

If a change is required because of the contract correction, explain exactly why.

============================================================
14. DO NOT TOUCH THESE
============================================================

STRICTLY DO NOT MODIFY:

frontend/**
src/**
components/**
pages/**
styles/**

Do not modify frontend files.

Do not implement:

services/interview-agent/** business logic

services/ai-intelligence/** business logic

Do not implement:

- LLM
- RAG
- Qdrant retrieval
- embeddings
- prompts
- evaluation
- feedback
- candidate intelligence
- curriculum planning
- interview strategy

============================================================
15. GIT
============================================================

DO NOT COMMIT.

DO NOT PUSH.

At the end show:

git status
git diff --stat

Everything must remain local.

============================================================
16. FINAL REPORT
============================================================

At the end provide:

1. Contract issues found
2. What was corrected
3. Whether the 4-question contradiction was fully removed
4. Gateway tests result
5. Contract tests result
6. Docker static validation result
7. Files modified
8. Files created
9. Any remaining architectural concerns
10. Exact information Shezan needs before starting Interview Agent
11. Exact information Meraj needs before starting AI Intelligence

IMPORTANT:

Do not start implementing their services.

The goal of this task is to leave behind a clean, frozen, internally consistent contract foundation so that:

PRANAV → Gateway
SHEZAN → Interview Agent
MERAJ → AI Intelligence / LLM / RAG / Evaluation

can now work independently without guessing each other's APIs.

STOP after the audit and corrections.

Redesign the current Sign Up / Create Account page shown in the reference image.

Do NOT simply adjust individual margins or colors. Rework the entire page layout and visual hierarchy so it feels like a polished, modern production SaaS authentication page.

GOAL:
Create a premium, minimal, professional authentication experience that matches the overall Interview Agent product design.

DESIGN DIRECTION:
- Use the project's existing BLACK + WHITE + GOLD visual system.
- No purple, blue, gradients, or random accent colors.
- Gold should be used sparingly for important interactive/focus states.
- Background should be near-black.
- Primary text should be white/off-white.
- Secondary text should use muted gray.
- Gold should communicate emphasis, focus, active states, and important actions.
- Keep the design sophisticated and restrained rather than flashy.

LAYOUT:
The current page wastes a lot of horizontal and vertical space and looks like a generic authentication form.

Replace it with a proper responsive authentication layout.

DESKTOP:
- Use a centered authentication composition with a sensible max-width.
- Consider a two-column layout:
  LEFT: strong Interview Agent branding/product identity.
  RIGHT: signup form.
- The branding section should communicate the product clearly without becoming a marketing landing page.
- Keep the form compact and visually focused.
- Establish a clear visual hierarchy:
  Logo → heading → supporting text → OAuth → divider → form → terms → CTA → login link.

If a two-column layout makes the existing application structure unnecessarily complicated, use a centered card instead, but it must still feel intentionally designed.

FORM:
Create