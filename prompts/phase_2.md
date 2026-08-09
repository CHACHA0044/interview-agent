# OpenCode prompt

You are acting as the lead backend architect for our ABTalks Vibe Coding Hackathon project.

PROJECT:
"The Interview Agent — Build the interviewer, not the interview."

IMPORTANT: DO NOT MODIFY THE FRONTEND AT THIS STAGE.

Your job in this task is to analyze the entire project, understand the backend requirements, and create a clear parallel implementation plan for 3 developers.

============================================================
1. FIRST: ANALYZE THE ENTIRE PROJECT
============================================================

Before assigning any work, inspect the ENTIRE repository/folder.

Do not assume the architecture.

Read and understand:

- Existing frontend structure
- Existing backend files, if any
- package.json files
- configuration files
- services
- stores
- types
- mock services
- API-related code
- README
- backend-requirements.md
- candidates.json
- curriculum.json
- technical-spec.md
- PROMPTS.md, if present
- Any other relevant documentation
- Environment/configuration files
- Existing Git configuration if useful

Also inspect the actual implementation rather than relying only on filenames.

============================================================
2. UNDERSTAND THE HACKATHON PROBLEM
============================================================

The project must solve:

THE INTERVIEW AGENT

"Build the interviewer, not the interview."

The AI Cohort is a 31-day enterprise AI engineering program covering:

- RAG
- Vector Databases
- Prompt Engineering
- Agentic AI
- MCP
- AI Deployment
- Production AI Systems

The system must conduct a realistic, personalized, multi-turn technical interview based on the candidate's learning journey.

The interviewer must:

- Assess the candidate's understanding
- Adapt questions based on responses
- Ask intelligent follow-up questions
- Maintain conversation context throughout the interview
- Cover multiple curriculum areas
- Produce actionable structured feedback at the end

Minimum requirements:

- At least 8 questions
- At least 4 different curriculum days
- Follow-up questions based on previous responses
- Conversation context maintained across requests
- Structured final feedback
- Required HTTP endpoint

============================================================
3. STUDY THE PROVIDED DATA
============================================================

Analyze candidates.json.

Understand:

- Candidate schema
- Candidate IDs
- Roles
- Experience
- Education
- Mission completion
- Passed missions
- Failed missions
- Skipped topics
- Attempts
- Learning signals
- Commit days
- Mission completion
- First-try performance

The backend must use this information to personalize interviews.

Analyze curriculum.json.

Understand:

- 31 days
- 8 modules
- Day titles
- Topics
- Objectives
- Tools
- Module relationships

The interview engine should use curriculum information to determine what the candidate should be assessed on.

Analyze technical-spec.md VERY CAREFULLY.

The required API contract is authoritative.

The backend MUST expose:

POST /api/interview

The endpoint must use sessionId to maintain interview state.

Start request:

{
  "sessionId": "abc-123",
  "candidate": { ...candidate.json }
}

Response:

{
  "reply": "...",
  "done": false
}

Subsequent request:

{
  "sessionId": "abc-123",
  "message": "..."
}

Final response:

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

Do not violate this contract.

============================================================
4. IMPORTANT SCOPE
============================================================

Do NOT build:

- Voice interaction
- User authentication
- Persistent user accounts
- Long-term conversation history
- Mobile applications

These are explicitly out of scope.

If future implementation requests ask for these features, they should NOT automatically be implemented.

Do not spend backend development time on unnecessary features.

Focus on the actual hackathon requirements.

============================================================
5. CREATE THE TEAM ASSIGNMENT PLAN
============================================================

We have 3 developers:

1. Pranav
2. Shezan
3. Meraj

Create a markdown file:

BACKEND_TEAM_PLAN.md

This file must contain the complete backend development plan.

DO NOT implement the backend in this task.

DO NOT modify frontend files.

The markdown file should explain:

- Backend architecture
- Technology recommendation
- Folder structure
- Service boundaries
- Data flow
- API flow
- Agent architecture
- Session architecture
- Candidate personalization
- Curriculum retrieval/selection
- Question generation
- Follow-up logic
- Evaluation
- Feedback generation
- Error handling
- Testing strategy
- Integration strategy
- Environment variables required
- Deployment considerations

============================================================
6. DIVIDE WORK FOR PARALLEL DEVELOPMENT
============================================================

Divide the backend into THREE largely independent workstreams.

Each developer should be able to work in parallel without constantly modifying the same files.

Give each person:

- Clear responsibility
- Exact files/folders they own
- Interfaces they expose
- Inputs
- Outputs
- Dependencies
- What they should NOT modify
- Testing responsibilities
- Integration requirements

Avoid assigning the same file to multiple developers.

Design interfaces between modules before implementation.

============================================================
7. SUGGESTED OWNERSHIP
============================================================

You may adjust this division after inspecting the existing repository, but aim for something similar to:

------------------------------------------------------------
PRANAV — BACKEND CORE + API + SESSION ORCHESTRATION
------------------------------------------------------------

Own:

- FastAPI/application entry point
- POST /api/interview
- Request/response schemas
- Session management
- Interview lifecycle
- API error handling
- Service interfaces
- Dependency wiring
- Environment configuration
- Backend integration layer

Responsible for ensuring the technical specification is followed exactly.

------------------------------------------------------------
SHEZAN — INTERVIEW AGENT + QUESTION GENERATION
------------------------------------------------------------

Own:

- Interview agent
- Candidate personalization
- Curriculum-aware question selection
- Adaptive questioning
- Follow-up question logic
- Difficulty adjustment
- Conversation context used during an active session
- Interview state transitions
- LLM integration
- Prompt templates

Responsible for making the interview conversational rather than a static questionnaire.

The agent must ensure:

- Minimum 8 questions
- Minimum 4 curriculum days
- Follow-ups depend on previous responses
- Questions reflect candidate progress
- Skipped/failed/weak areas can influence questioning

------------------------------------------------------------
MERAJ — EVALUATION + FEEDBACK + TESTING
------------------------------------------------------------

Own:

- Candidate answer evaluation
- Scoring/rubric logic
- Curriculum coverage tracking
- Strength detection
- Gap detection
- Actionable recommendations
- Final feedback generation
- Evaluation schemas
- Backend tests
- API contract tests
- Interview scenario tests

Responsible for producing the final:

summary
strengths
gaps
next

structure required by the technical specification.

============================================================
8. PARALLEL DEVELOPMENT RULE
============================================================

The three developers must be able to work simultaneously.

Design clean interfaces between modules.

For example:

API
 ↓
Interview Orchestrator
 ↓
Interview Agent
 ↓
Question Generator
 ↓
Evaluation
 ↓
Feedback

Candidate Data
 ↓
Candidate Context Builder
 ↓
Interview Agent

Curriculum
 ↓
Curriculum Context/Retrieval
 ↓
Question Generator

Session
 ↓
Conversation State
 ↓
Agent + Evaluation

Clearly document these boundaries in BACKEND_TEAM_PLAN.md.

============================================================
9. SHARED CONTRACTS
============================================================

Define shared contracts before implementation.

Document:

- InterviewRequest
- InterviewResponse
- Feedback
- CandidateContext
- CurriculumContext
- InterviewState
- Question
- AnswerEvaluation
- InterviewResult

Do not allow every developer to invent their own schemas.

Use shared typed models.

============================================================
10. BACKEND ARCHITECTURE
============================================================

Recommend a clean modular architecture.

Prefer something similar to:

backend/
    app/
        api/
        core/
        models/
        schemas/
        services/
        agents/
        prompts/
        evaluation/
        curriculum/
        candidates/
        sessions/
        utils/
        tests/

But FIRST inspect the existing repository and adapt the structure instead of blindly creating this exact structure.

Keep modules small.

Follow:

DRY
SOLID
KISS
Separation of concerns
Single responsibility
Dependency inversion
Clean architecture

Do not over-engineer.

============================================================
11. LLM / AI ARCHITECTURE
============================================================

Recommend the simplest architecture that satisfies the hackathon.

Do not introduce unnecessary AI frameworks just because they are available.

Explain:

- Model provider abstraction
- Prompt architecture
- Candidate context construction
- Curriculum context construction
- Interview state
- Question generation
- Follow-up generation
- Evaluation
- Feedback generation

The model provider should be replaceable without rewriting the entire application.

============================================================
12. SESSION STATE
============================================================

Because the technical specification requires sessionId:

sessionId
    ↓
Interview Session
    ↓
Candidate Context
    ↓
Curriculum Coverage
    ↓
Questions Asked
    ↓
Candidate Answers
    ↓
Evaluations
    ↓
Final Feedback

Clearly explain how state will be maintained during the active interview.

Do NOT implement long-term persistent user history because it is out of scope.

============================================================
13. TESTING
============================================================

The plan must include tests for:

- Starting an interview
- Continuing an interview
- sessionId handling
- Invalid requests
- Candidate personalization
- Curriculum coverage
- Minimum 8 questions
- Minimum 4 curriculum days
- Follow-up questions
- Context retention
- Interview completion
- Final feedback schema
- Error handling

Include realistic test scenarios using candidates from candidates.json.

============================================================
14. INTEGRATION STRATEGY
============================================================

Create a section explaining exactly how the three developers will integrate their work.

Include:

- Shared contracts
- Branch strategy
- Merge order
- Files that should remain isolated
- How to test each module independently
- Final end-to-end testing

Avoid a situation where everyone edits the same orchestrator file.

============================================================
15. ENVIRONMENT VARIABLES
============================================================

Identify all backend environment variables that will eventually be needed.

For example:

LLM API key
Model name
Backend port
Frontend URL if required
Other provider configuration

Do NOT expose actual secrets.

Document expected variables in the markdown plan.

============================================================
16. FINAL REQUIREMENT
============================================================

At the end of BACKEND_TEAM_PLAN.md include:

PHASE 1
Repository analysis

PHASE 2
Shared contracts

PHASE 3
Parallel development

PHASE 4
Integration

PHASE 5
End-to-end testing

PHASE 6
Deployment

Also include a final checklist mapping implementation back to EVERY requirement in technical-spec.md.

============================================================
CRITICAL RESTRICTION
============================================================

DO NOT MODIFY:

- Frontend components
- Frontend pages
- Frontend styles
- Frontend layouts
- Frontend routing
- Frontend state
- Existing UI

DO NOT "clean up" frontend files.

DO NOT change the frontend even if you notice problems.

For this task, ONLY:

1. Analyze the repository and provided resources.
2. Analyze the problem statement.
3. Design the backend architecture.
4. Divide backend work between Pranav, Shezan and Meraj.
5. Create/update BACKEND_TEAM_PLAN.md.

Nothing else.

The goal is to leave us with a clear backend blueprint that 3 developers can implement independently and then connect into one working backend without stepping on each other's work.

# Prompt — Rewrite Backend Plan as a Real Microservice Architecture

You are a senior backend architect.

I have an existing backend planning document named `backend.md` / `Pasted markdown.md` for our ABTalks Vibe Coding Hackathon project "The Interview Agent".

IMPORTANT:
Do NOT build the backend code.
Do NOT modify the frontend.
Your task is ONLY to completely rewrite the existing backend markdown plan into a realistic, production-style MICROservice architecture and save the rewritten plan as the new backend.md.

First, carefully analyze the existing markdown and preserve all important functional requirements, API contracts, interview behavior, candidate personalization requirements, evaluation requirements, testing requirements, and hackathon constraints.

The current document is a modular monolith. It has logical modules, but everything runs inside one FastAPI application.

We now want to convert the architecture into REAL independently deployable microservices.

==================================================
1. CORE ARCHITECTURAL GOAL
==================================================

Replace the current modular-monolith architecture with a small, practical microservice architecture.

DO NOT create excessive microservices.

Use exactly THREE main backend services:

1. API / Gateway Service
2. Interview Agent Service
3. AI Intelligence Service

The services must be independently runnable and independently deployable.

Each service must have:
- its own responsibility
- its own application entry point
- its own dependencies where practical
- its own Dockerfile
- its own environment variables
- its own tests
- a clearly defined API contract
- clear ownership by one team member

Use HTTP/REST communication between services.

The architecture should still remain simple enough to implement during a hackathon.

==================================================
2. PUBLIC API CONTRACT MUST REMAIN COMPATIBLE
==================================================

The existing authoritative contract in `technical-spec.md` MUST remain unchanged.

The public API must still expose:

POST /api/interview

Request:

{
  "sessionId": "string",
  "candidate": {...},
  "message": "..."
}

Response:

{
  "reply": "string",
  "done": false
}

and on completion:

{
  "reply": "string",
  "done": true,
  "feedback": {
    "summary": "string",
    "strengths": [],
    "gaps": [],
    "next": []
  }
}

The frontend must not need to know that microservices exist.

The API Gateway is the ONLY service directly exposed to the frontend.

Internal services must NOT be exposed publicly unless absolutely necessary.

==================================================
3. SERVICE 1 — API GATEWAY / CORE SERVICE
==================================================

OWNER:
Pranav

Service name:

interview-gateway

Primary responsibilities:

- Public FastAPI application
- POST /api/interview
- Request validation
- Response validation
- CORS
- Session lifecycle
- Session ID management
- Session storage
- Calling the Interview Agent Service
- Calling the AI Intelligence Service when required
- Service-to-service communication
- Error handling
- Timeouts
- Retry policy where appropriate
- Health checks
- Environment configuration
- API-level logging
- Docker/deployment configuration
- Final API response assembly

Pranav MUST own the complete request lifecycle.

The Gateway should NOT contain:
- LLM prompting logic
- RAG implementation
- evaluation algorithms
- feedback generation logic
- detailed interview question generation logic

Those responsibilities belong to the other services.

==================================================
4. SESSION MANAGEMENT
==================================================

Move session management into the Gateway/Core service.

Use Redis for session storage with TTL.

The architecture should support:

sessionId
    ↓
Redis
    ↓
InterviewState

The session should contain only the temporary information required for the active interview.

Do NOT introduce permanent user history.

Do NOT add authentication or user accounts unless required by the authoritative hackathon specification.

Explain clearly in the markdown:

- Redis is being used for ephemeral session state.
- Sessions expire using TTL.
- No long-term candidate history is stored.
- The architecture remains compliant with the hackathon restrictions.

Define the session schema clearly.

Example:

{
  "sessionId": "...",
  "candidate": {...},
  "plannedDays": [...],
  "currentQuestion": {...},
  "questionCount": 4,
  "conversation": [...],
  "scores": [...],
  "status": "active"
}

==================================================
5. SERVICE 2 — INTERVIEW AGENT SERVICE
==================================================

OWNER:
Shezan

Service name:

interview-agent

Responsibilities:

- Candidate context processing
- Candidate tier calculation
- Strong/weak/failed/skipped day analysis
- Curriculum selection
- Interview planning
- Question strategy
- Follow-up strategy
- Interview progression logic
- Difficulty calibration
- Deciding what should be asked next
- Maintaining interview reasoning/state supplied by the Gateway
- Producing structured question requests for the AI Intelligence Service

This service should contain the actual interview behavior.

It should understand:

Candidate
↓
Candidate Context
↓
Assessment Days
↓
Interview Plan
↓
Current Topic
↓
Question Strategy
↓
Follow-up Strategy
↓
Next Question

The Interview Agent MUST NOT directly contain provider-specific LLM code.

Instead, when it needs generated language, it calls the AI Intelligence Service.

Example:

POST /internal/ai/generate-question

Request:

{
  "candidateContext": {...},
  "curriculumContext": {...},
  "conversation": [...],
  "questionStrategy": {...}
}

Response:

{
  "question": "...",
  "type": "technical",
  "difficulty": "medium",
  "topic": "...",
  "day": 12
}

The Interview Agent decides WHAT should be asked.

The AI Intelligence Service decides HOW to generate the language.

This separation is critical.

==================================================
6. SERVICE 3 — AI INTELLIGENCE SERVICE
==================================================

OWNER:
Meraj

Service name:

ai-intelligence

This service owns ALL LLM AND RAG functionality.

Move the following responsibilities here:

- LLM provider abstraction
- OpenAI-compatible client
- Prompt management
- System prompts
- Question generation
- Follow-up generation
- Answer evaluation
- Feedback generation
- RAG
- Embeddings
- Vector search
- Curriculum retrieval
- Evaluation reasoning
- Final feedback synthesis

Meraj owns the AI layer end-to-end.

==================================================
7. RAG ARCHITECTURE
==================================================

Unlike the original modular-monolith plan, implement a real RAG-ready architecture.

Use:

AI Intelligence Service
        ↓
Embedding Model
        ↓
Vector Database
        ↓
Curriculum / Knowledge Documents

Recommended vector database:

Qdrant

OR another lightweight vector database if the existing project already uses a different one.

Do NOT introduce multiple vector databases.

The RAG pipeline should be:

Documents
   ↓
Chunking
   ↓
Embeddings
   ↓
Vector DB
   ↓
Semantic Retrieval
   ↓
Retrieved Context
   ↓
LLM
   ↓
Question / Evaluation / Feedback

The RAG system should retrieve relevant curriculum content based on:

- candidate profile
- job role
- current topic
- current interview day
- previous answer
- question difficulty
- interview stage

Explain how RAG improves the interview compared with simply loading curriculum.json.

Keep curriculum.json as the source dataset, but create an ingestion pipeline for the vector store.

==================================================
8. LLM ARCHITECTURE
==================================================

Meraj owns:

ChatProvider abstraction
LLM client
Prompt templates
Structured JSON output
Retry handling
Provider failures
Model configuration

The system should support an OpenAI-compatible interface so that providers can be changed without rewriting the service.

Structure it approximately as:

ai-intelligence/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── generation.py
│   │   ├── evaluation.py
│   │   └── rag.py
│   ├── llm/
│   │   ├── provider.py
│   │   ├── client.py
│   │   └── prompts/
│   ├── rag/
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   ├── ingestion.py
│   │   └── vector_store.py
│   ├── evaluation/
│   │   ├── rubric.py
│   │   ├── evaluator.py
│   │   └── feedback.py
│   └── schemas/
└── tests/

==================================================
9. EVALUATION
==================================================

Move evaluation completely into Meraj's AI Intelligence Service.

Evaluation should use:

Candidate context
+
Question
+
Expected concepts
+
Retrieved curriculum context
+
Candidate answer

↓

Evaluation

↓

Structured score

Example:

{
  "score": 7.5,
  "conceptCoverage": 0.8,
  "technicalAccuracy": 0.75,
  "depth": 0.7,
  "strengths": [],
  "gaps": [],
  "followUpRequired": true
}

The evaluator must be deterministic in structure even though the underlying reasoning uses an LLM.

Maintain the existing rubric from the original backend plan.

Do not throw away the existing evaluation requirements.

==================================================
10. FEEDBACK GENERATION
==================================================

Meraj also owns final feedback.

Input:

- all interview evaluations
- candidate profile
- curriculum coverage
- strengths
- weaknesses
- missed concepts
- topic scores

Output MUST remain compatible with the existing public API:

{
  "summary": "...",
  "strengths": [],
  "gaps": [],
  "next": []
}

The Gateway receives this result and returns it to the frontend.

==================================================
11. INTERNAL SERVICE COMMUNICATION
==================================================

Define explicit internal APIs.

Example architecture:

Frontend
   |
   | POST /api/interview
   ↓
API Gateway
   |
   | HTTP
   ↓
Interview Agent
   |
   | HTTP
   ↓
AI Intelligence
   |
   ├── LLM
   ├── RAG
   ├── Vector DB
   └── Evaluation
   |
   ↓
Interview Agent
   |
   ↓
API Gateway
   |
   ↓
Frontend

Define request/response schemas for every internal API.

Suggested endpoints:

INTERVIEW AGENT:

POST /internal/interview/start
POST /internal/interview/next
POST /internal/interview/follow-up
POST /internal/interview/complete
GET  /health

AI INTELLIGENCE:

POST /internal/ai/generate-question
POST /internal/ai/generate-followup
POST /internal/ai/evaluate-answer
POST /internal/ai/generate-feedback
POST /internal/ai/retrieve-context
GET  /health

GATEWAY:

POST /api/interview
GET /health

The public frontend should NEVER call internal endpoints.

==================================================
12. OWNERSHIP / TEAM DIVISION
==================================================

Create a very explicit ownership matrix.

PRANAV — PLATFORM / CORE / API

Own:
- API Gateway
- FastAPI public API
- Redis sessions
- Session lifecycle
- API schemas
- Service communication
- Internal authentication/shared service secret if needed
- CORS
- Error handling
- Timeouts
- Retry policy
- Docker Compose
- Deployment
- Environment configuration
- Gateway tests
- Integration tests
- Final system integration

SHEZAN — INTERVIEW ENGINE

Own:
- Candidate context
- Candidate tier calculation
- Curriculum planning
- Assessment day selection
- Interview plan
- Question strategy
- Difficulty calibration
- Follow-up decision logic
- Interview progression
- Agent service
- Agent tests

MERAJ — AI / RAG / LLM / EVALUATION

Own:
- LLM provider
- Prompt architecture
- RAG
- Embeddings
- Qdrant/vector DB
- Retrieval
- Question generation
- Follow-up generation
- Answer evaluation
- Rubric
- Feedback generation
- AI service
- AI tests
- LLM failure handling

Make sure workload is reasonably balanced.

==================================================
13. REPOSITORY STRUCTURE
==================================================

Rewrite the repository structure to reflect actual microservices.

Use something similar to:

backend/
│
├── services/
│   │
│   ├── gateway/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   ├── sessions/
│   │   │   ├── clients/
│   │   │   ├── schemas/
│   │   │   └── core/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   ├── interview-agent/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── api/
│   │   │   ├── candidates/
│   │   │   ├── curriculum/
│   │   │   ├── agent/
│   │   │   └── schemas/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── ai-intelligence/
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   ├── llm/
│       │   ├── rag/
│       │   ├── evaluation/
│       │   ├── feedback/
│       │   └── schemas/
│       ├── tests/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── .env.example
│
├── shared/
│   ├── schemas/
│   └── contracts/
│
├── data/
│   ├── candidates.json
│   └── curriculum.json
│
├── docker-compose.yml
├── README.md
└── .env.example

Do NOT put business logic into shared/.

Shared should contain only stable contracts/types that genuinely need to be shared.

==================================================
14. DOCKER / LOCAL DEVELOPMENT
==================================================

The rewritten markdown must define a complete local architecture:

docker-compose.yml

Services:

- gateway
- interview-agent
- ai-intelligence
- redis
- qdrant

Explain ports, networking, environment variables and service discovery.

Example:

frontend
   ↓
gateway:8000
   ↓
interview-agent:8001
   ↓
ai-intelligence:8002

Redis and Qdrant should only be accessible internally.

==================================================
15. DEPLOYMENT ARCHITECTURE
==================================================

Define how each service can be deployed independently.

Do NOT assume all services must run on the same machine.

Explain:

Gateway
→ public deployment

Interview Agent
→ private/internal deployment

AI Intelligence
→ private/internal deployment

Redis
→ managed/private service

Qdrant
→ managed/private service

The document should explain environment variables and how service URLs are configured.

==================================================
16. FAILURE HANDLING
==================================================

Add real microservice failure handling.

Examples:

If Interview Agent is unavailable:
→ Gateway returns controlled 503 response.

If AI Intelligence is unavailable:
→ Interview Agent/Gateway handles the failure gracefully.

If LLM provider fails:
→ AI Intelligence retries within a bounded limit.
→ Never create infinite retries.

If Qdrant is unavailable:
→ return a controlled service error.
→ optionally use a minimal fallback only if clearly justified.

Add:
- connection timeouts
- request timeouts
- bounded retries
- structured errors
- health endpoints

Do not add unnecessary infrastructure such as Kafka, Kubernetes, service mesh, or event buses.

==================================================
17. TESTING STRATEGY
==================================================

Rewrite testing around microservices.

Each service must have independent unit tests.

Additionally create integration tests for:

Gateway → Interview Agent

Interview Agent → AI Intelligence

AI Intelligence → Vector DB

AI Intelligence → LLM provider

And full end-to-end:

Frontend
→ Gateway
→ Interview Agent
→ AI Intelligence
→ RAG
→ LLM
→ Evaluation
→ Feedback
→ Gateway
→ Frontend

Use fake/mock LLM providers for CI.

Do not require real API calls for normal tests.

==================================================
18. DEVELOPMENT PHASES
==================================================

Rewrite the existing phases around the new architecture.

PHASE 1:
Architecture + contracts

PHASE 2:
Gateway + Redis

Owner: Pranav

PHASE 3:
Interview Agent

Owner: Shezan

PHASE 4:
AI Intelligence + LLM

Owner: Meraj

PHASE 5:
RAG + Vector DB

Owner: Meraj

PHASE 6:
Evaluation + Feedback

Owner: Meraj

PHASE 7:
Service integration

All three

PHASE 8:
Docker Compose + deployment

Pranav leads, all contribute

PHASE 9:
End-to-end testing

All three

==================================================
19. IMPORTANT — DO NOT OVERENGINEER
==================================================

This is still a hackathon.

Do NOT introduce:

- Kubernetes
- Kafka
- RabbitMQ
- service mesh
- event sourcing
- CQRS
- dozens of microservices
- complex authentication
- permanent user history
- unnecessary databases
- unnecessary cloud infrastructure

The goal is:

REAL microservices
+
clean boundaries
+
independent deployment
+
RAG
+
LLM
+
strong evaluation
+
simple enough to actually finish.

==================================================
20. FINAL DOCUMENT REQUIREMENTS
==================================================

The rewritten `backend.md` must contain:

1. Executive summary
2. Architecture overview
3. Why the original architecture was a modular monolith
4. New microservice architecture
5. Service responsibilities
6. Ownership matrix
7. Public API contract
8. Internal service contracts
9. Data flow
10. Session architecture
11. RAG architecture
12. LLM architecture
13. Evaluation architecture
14. Feedback architecture
15. Repository structure
16. Docker architecture
17. Environment variables
18. Local development
19. Deployment architecture
20. Failure handling
21. Security considerations
22. Testing strategy
23. Git/branch strategy
24. Development phases
25. Integration strategy
26. Definition of done
27. Final checklist against technical-spec.md

MOST IMPORTANT:

Do not merely rename folders.

The rewritten document must describe actual independently running services communicating over HTTP.

Maintain the existing hackathon API contract.

Keep the architecture practical.

Assign:
PRANAV → Gateway/Core/Redis/Deployment/Integration
SHEZAN → Interview Agent/Candidate/Curriculum/Interview Logic
MERAJ → LLM/RAG/Vector DB/Evaluation/Feedback

The final markdown should be detailed enough that three developers can start implementing directly from it without having to redesign the architecture themselves.

Again: ONLY rewrite the markdown architecture document. Do not write implementation code.

# OpenCode prompt:

You are implementing ONLY PRANAV'S assigned backend work for "The Interview Agent".

IMPORTANT:
Before writing implementation code, inspect the ENTIRE repository and understand the current backend, frontend, data files, existing APIs, technical-spec.md, candidates.json, curriculum.json, and the newly rewritten BACKEND.md.

Do not guess the existing structure.
Do not overwrite working functionality blindly.
Do not modify the frontend.

============================================================
STEP 1 — UNDERSTAND THE ARCHITECTURE
============================================================

The authoritative backend architecture is the NEW microservice BACKEND.md.

Read it completely before making changes.

The architecture has exactly three services:

1. services/gateway/          → PRANAV
2. services/interview-agent/  → SHEZAN
3. services/ai-intelligence/  → MERAJ

My responsibility is ONLY:

PRANAV
→ API Gateway
→ Public API
→ Redis session management
→ Gateway ↔ Interview Agent communication
→ Gateway-level validation
→ Error handling
→ Timeouts/retries
→ Environment configuration
→ Docker Compose
→ Integration infrastructure
→ Gateway tests
→ Final system integration

DO NOT implement Shezan's Interview Agent business logic.

DO NOT implement Meraj's LLM/RAG/evaluation logic.

Those services may need placeholder/mock endpoints or clients so that my Gateway can be tested, but do not implement their actual business logic.

============================================================
STEP 2 — BACKEND.MD MUST BE PUSHED FIRST
============================================================

Before implementing the Gateway:

1. Verify that the rewritten microservice architecture is represented in BACKEND.md.
2. If BACKEND.md is not present or is outdated, update/create it using the architecture already provided.
3. Make sure the document clearly reflects:
   - 3 microservices
   - ownership
   - public API
   - internal APIs
   - Redis
   - Qdrant
   - Docker Compose
   - service communication
   - failure handling
   - environment variables
   - repository structure
   - testing strategy
4. Do NOT modify the architecture casually.
5. Do NOT redesign the architecture unless you find a concrete contradiction with technical-spec.md or the existing project.
6. Preserve the public API contract.

IMPORTANT GIT REQUIREMENT:

Once BACKEND.md is correct:

- git status
- git diff
- commit ONLY the BACKEND.md architecture changes
- push that commit to the current working branch

The architecture document MUST be pushed BEFORE implementation begins.

Use a clear commit message such as:

docs: define microservice backend architecture

Do NOT push implementation code yet.

============================================================
STEP 3 — IMPLEMENT PRANAV'S GATEWAY SERVICE
============================================================

After BACKEND.md has been pushed, begin implementation.

Create:

backend/services/gateway/

following the structure defined in BACKEND.md.

Expected structure:

services/gateway/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── interview.py
│   ├── sessions/
│   │   ├── redis_store.py
│   │   └── lifecycle.py
│   ├── clients/
│   │   ├── base.py
│   │   └── agent_client.py
│   ├── schemas/
│   │   ├── api.py
│   │   └── internal.py
│   └── core/
│       ├── config.py
│       └── errors.py
├── tests/
│   ├── unit/
│   └── integration/
├── requirements.txt
├── Dockerfile
└── .env.example

Use the exact architecture in BACKEND.md as the source of truth.

============================================================
STEP 4 — PUBLIC API
============================================================

Implement:

POST /api/interview

This is the ONLY browser-facing backend endpoint.

The contract MUST remain:

START:

{
  "sessionId": "abc-123",
  "candidate": {...}
}

TURN:

{
  "sessionId": "abc-123",
  "message": "..."
}

FINAL:

{
  "reply": "Interview completed.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": [],
    "gaps": [],
    "next": []
  }
}

Do not change the frontend-facing request or response format.

Validate requests with Pydantic.

Rules:

- sessionId must be a non-empty string
- exactly ONE of candidate or message must be provided
- candidate must match candidates.json structure
- invalid request → 422
- unknown session → 404
- completed session receiving another turn → 409
- upstream service failure → controlled 503

Validate the outgoing response too.

The Gateway must never leak malformed internal service responses to the frontend.

============================================================
STEP 5 — REDIS SESSION MANAGEMENT
============================================================

Implement Redis-backed ephemeral sessions.

Do NOT use an in-memory Python dictionary.

Use:

REDIS_URL

Default:

redis://redis:6379/0

Session key:

session:{sessionId}

Session TTL:

SESSION_TTL_SECONDS=3600

The Gateway owns the complete lifecycle:

CREATE
→ UPDATE
→ COMPLETE
→ EXPIRE

Store:

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

The Gateway MUST NOT interpret or modify agentState business logic.

Treat agentState as an opaque object produced by Interview Agent.

The Gateway is responsible only for storing and passing it back.

Refresh TTL on every valid interview turn.

Do not create permanent candidate history.

Do not add authentication/user accounts.

============================================================
STEP 6 — INTERVIEW AGENT CLIENT
============================================================

Implement the HTTP client:

services/gateway/app/clients/agent_client.py

It must communicate with:

AGENT_SERVICE_URL=http://interview-agent:8001

Implement calls for:

POST /internal/interview/start

POST /internal/interview/next

POST /internal/interview/follow-up

POST /internal/interview/complete

GET /health

Use an HTTP client with:

- connection timeout
- request timeout
- bounded retry
- structured exception handling
- clear error types

DO NOT implement Interview Agent business logic inside the Gateway.

The Gateway should simply:

1. validate
2. load/create session
3. call Agent
4. persist Agent result
5. return the appropriate public response

============================================================
STEP 7 — SERVICE COMMUNICATION
============================================================

The architecture is:

Frontend
   ↓
Gateway :8000
   ↓
Interview Agent :8001
   ↓
AI Intelligence :8002

The frontend MUST NEVER call:

- interview-agent
- ai-intelligence
- Redis
- Qdrant

Only Gateway is publicly exposed.

The Gateway may call AI Intelligence only for the explicitly documented health/recovery path.

Do NOT duplicate AI logic inside Gateway.

============================================================
STEP 8 — INTERNAL CONTRACTS
============================================================

Create Pydantic schemas for the internal Agent requests/responses.

At minimum support:

InterviewStartRequest
InterviewStartResponse

InterviewNextRequest
InterviewNextResponse

InterviewCompleteRequest
InterviewCompleteResponse

Question
SessionView
AgentState

Keep these contracts aligned with BACKEND.md.

Do not invent incompatible schemas.

If a contract is unclear:

1. inspect BACKEND.md
2. inspect technical-spec.md
3. inspect existing implementation
4. use the least disruptive compatible structure

Do not silently alter the public API.

============================================================
STEP 9 — ERROR HANDLING
============================================================

Implement the failure behavior from BACKEND.md.

Interview Agent unavailable:

→ bounded retry
→ 503

Redis unavailable:

→ 503

Unknown session:

→ 404

Completed session:

→ 409

Invalid request:

→ 422

Use structured internal errors.

Internal error format:

{
  "error": {
    "code": "...",
    "message": "...",
    "detail": {}
  }
}

The Gateway should map internal errors into the public API's expected error format.

Never expose stack traces or secrets to the frontend.

============================================================
STEP 10 — TIMEOUTS AND RETRIES
============================================================

Implement environment-configurable values.

Gateway → Agent:

CONNECT_TIMEOUT_SECONDS=2
REQUEST_TIMEOUT_SECONDS=25
AGENT_RETRIES=1

Do NOT blindly retry non-idempotent requests after the server may already have processed them.

Prefer retrying connection failures before a request is successfully sent.

Never create infinite retry loops.

============================================================
STEP 11 — CORS
============================================================

Implement configurable CORS:

FRONTEND_ORIGINS

Default:

http://localhost:5173

Do not use wildcard CORS for production configuration.

============================================================
STEP 12 — HEALTH ENDPOINT
============================================================

Implement:

GET /health

Response:

{
  "status": "ok",
  "service": "interview-gateway"
}

Gateway readiness should also verify Redis connectivity.

Do not make the health endpoint depend on the LLM.

The Gateway should be able to distinguish:

- process alive
- Redis unavailable
- upstream Agent unavailable

where practical.

============================================================
STEP 13 — LOGGING
============================================================

Add structured logging.

Log useful operational information:

- HTTP method
- path
- sessionId
- status
- latency
- upstream service
- error code

NEVER log:

- LLM API keys
- Redis passwords
- candidate answers
- full candidate payloads
- sensitive interview content

Keep logs practical for a hackathon.

Do not introduce a huge observability stack.

============================================================
STEP 14 — DOCKERFILE
============================================================

Create:

services/gateway/Dockerfile

The Gateway must run independently.

It should start FastAPI/Uvicorn on:

0.0.0.0:8000

Make sure the container works independently from the other services when the required environment variables are supplied.

============================================================
STEP 15 — DOCKER COMPOSE
============================================================

Implement root:

docker-compose.yml

Services:

gateway
interview-agent
ai-intelligence
redis
qdrant

IMPORTANT:

You are responsible for the Compose infrastructure.

However, DO NOT implement Shezan's or Meraj's actual services.

For now, if their implementation does not exist yet, use minimal temporary service placeholders ONLY where necessary to validate Gateway networking.

Do not overwrite their future service structure.

Only Gateway is exposed to the host:

8000:8000

Do NOT publish:

8001
8002
6379
6333

Internal services communicate through Docker service names.

Examples:

http://interview-agent:8001
http://ai-intelligence:8002
redis://redis:6379/0
http://qdrant:6333

Add health checks according to BACKEND.md.

============================================================
STEP 16 — ENVIRONMENT CONFIGURATION
============================================================

Create/update:

services/gateway/.env.example

and root:

.env.example

Include at minimum:

BACKEND_PORT=8000
REDIS_URL=redis://redis:6379/0
SESSION_TTL_SECONDS=3600

AGENT_SERVICE_URL=http://interview-agent:8001
AI_SERVICE_URL=http://ai-intelligence:8002

FRONTEND_ORIGINS=http://localhost:5173

MIN_QUESTIONS=8
MIN_CURRICULUM_DAYS=4

INTERNAL_API_TOKEN=

LOG_LEVEL=INFO

Never commit real secrets.

============================================================
STEP 17 — TESTING
============================================================

Write tests for YOUR Gateway only.

Unit tests:

- request validation
- session creation
- session loading
- session update
- session completion
- TTL handling
- unknown session
- completed session
- Redis failure
- Agent client timeout
- Agent client failure
- response validation
- error mapping

Integration tests:

Gateway → mocked Interview Agent

Gateway → Redis

Full Gateway request lifecycle using mocked upstream Agent.

Do NOT require real LLM calls.

Do NOT require real Qdrant for Gateway tests.

The Gateway must be independently testable.

============================================================
STEP 18 — DO NOT TOUCH OTHER TEAM MEMBERS' WORK
============================================================

STRICT OWNERSHIP RULE:

DO NOT modify:

services/interview-agent/**
services/ai-intelligence/**

unless absolutely required only to create a minimal placeholder needed for local Compose testing.

Do not implement:

- candidate tier logic
- curriculum planning
- interview strategy
- question strategy
- difficulty algorithm
- follow-up decision logic
- LLM provider
- prompts
- embeddings
- Qdrant retrieval
- answer evaluation
- feedback generation

Those belong to Shezan and Meraj.

If you discover something they need, document it in a TODO or integration note instead of implementing it.

============================================================
STEP 19 — FRONTEND MUST NOT BE MODIFIED
============================================================

This is extremely important.

DO NOT modify:

frontend/**
src/**
components/**
pages/**
styles/**
package.json

or any frontend files.

The frontend is out of scope for this task.

The only requirement is that the existing frontend-facing API contract remains compatible.

============================================================
STEP 20 — VERIFY AGAINST EXISTING PROJECT
============================================================

Before declaring the work complete:

Inspect:

- technical-spec.md
- candidates.json
- curriculum.json
- existing backend code
- BACKEND.md
- any existing API implementation
- environment configuration

Verify that the Gateway works with the actual candidate and curriculum data structures.

Do not replace the project's actual data format with invented mock structures.

============================================================
STEP 21 — LOCAL VALIDATION
============================================================

Run:

- formatting
- linting if configured
- unit tests
- integration tests
- Python import checks
- Docker build
- docker compose config validation

If possible:

docker compose up --build

Then verify:

GET /health

and test:

POST /api/interview

using a real candidate from candidates.json.

For upstream services that are not yet implemented by Shezan/Meraj, use controlled mocks/stubs only for Gateway validation.

============================================================
STEP 22 — GIT RULES
============================================================

CRITICAL:

FIRST COMMIT + PUSH:

Only:

BACKEND.md

Commit:

docs: define microservice backend architecture

Push this commit.

THEN:

Implement my Gateway work locally.

After implementation:

DO NOT PUSH.

DO NOT commit the implementation unless specifically required by the current environment.

At the end, show:

git status

and clearly list:

1. What was pushed
2. What was implemented locally
3. Which files are currently modified/uncommitted
4. Tests that passed
5. Tests that could not run and why
6. Any blockers for Shezan or Meraj
7. Any integration assumptions

The final implementation must remain LOCAL.

============================================================
FINAL SUCCESS CONDITION
============================================================

I should end up with:

PUSHED:
✓ New microservice BACKEND.md

LOCAL ONLY:
✓ interview-gateway
✓ Redis session management
✓ Public POST /api/interview
✓ Agent HTTP client
✓ API schemas
✓ Error handling
✓ Timeouts/retries
✓ CORS
✓ Health endpoint
✓ Logging
✓ Dockerfile
✓ docker-compose.yml
✓ Environment configuration
✓ Gateway tests
✓ Integration test setup

NOT IMPLEMENTED:
✗ Interview Agent business logic
✗ LLM
✗ RAG
✗ Qdrant implementation
✗ Evaluation
✗ Feedback generation
✗ Frontend changes

Do not stop after creating folders.
Actually implement and test the Gateway service.

Do not push the implementation.

At the end, give me a concise implementation report and the exact git status.

# LLM Provider Abstraction

You are working on the ABTalks Vibe Coding Hackathon project
(Problem Statement 2 – Interview Agent).

TASK 1 — Implement the LLM Provider Abstraction for the ai-intelligence module.

Before writing code:
1. Inspect the existing repository structure.
2. Inspect the Technical Specification, Curriculum JSON, Candidate Profiles, existing backend architecture, dependencies, environment configuration, and existing AI-related code.
3. Do NOT blindly create duplicate files or replace existing architecture.
4. Reuse existing utilities and abstractions wherever possible.
5. First understand the current project and then implement only this task.

GOAL:

Create a clean LLM provider abstraction so the rest of the AI system does not directly depend on one specific LLM vendor.

The architecture should support OpenAI-compatible providers through configurable:

- base_url
- model
- api_key

The abstraction must allow providers such as:

- OpenAI
- Azure OpenAI
- Groq
- Local Ollama
- Other OpenAI-compatible APIs

The core interface/protocol should expose a ChatProvider-style abstraction.

REQUIREMENTS:

1. Create a provider interface/protocol such as ChatProvider.
2. Define the minimum operations required by the AI module.
3. Create an OpenAI-compatible implementation.
4. Read configuration from environment/settings instead of hardcoding credentials.
5. Support:
   - base_url
   - model
   - api_key
6. Make the default provider configurable.
7. Keep provider-specific code isolated.
8. The rest of the application should depend on the abstraction, not directly on the SDK.
9. Handle missing configuration cleanly.
10. Add useful error handling without hiding the original error.
11. Do not expose API keys in logs or error messages.
12. Keep the design compatible with future streaming/function-calling/JSON output support.
13. Use dependency injection where appropriate.
14. Add tests for provider configuration and basic provider behavior where the project testing setup supports it.

IMPORTANT:

Do NOT implement:
- RAG
- Question generation
- Follow-up generation
- Answer evaluation
- Feedback generation

Those will be implemented in later tasks.

PROJECT DEVELOPMENT GUIDELINES:

- Follow DRY, SOLID, KISS, and clean architecture principles.
- Write modular, reusable, maintainable, and scalable code.
- Keep files focused on a single responsibility.
- Avoid unnecessary complexity or over-engineering.
- Optimize for readability, performance, and future extensibility.
- Use strict typing and avoid `any` unless absolutely unavoidable.
- Separate UI, business logic, state management, utilities, and services properly.
- Reuse components, hooks, and utilities instead of duplicating logic.
- Follow consistent project structure and naming conventions.

CODE DOCUMENTATION:

Every source file (.ts, .tsx, Python files, hooks, services, utils, components, pages, layouts, stores, etc.) must begin with a concise comment block explaining:

- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

Documentation is NOT required for JSON, .env, lock files, generated files, or configuration-only files unless specifically requested.

HACKATHON FOCUS:

- Prioritize Technical Specification requirements.
- Stay aligned with Curriculum JSON and Candidate Profiles.
- Do not implement out-of-scope features.
- Do not implement Voice Interaction, Authentication, Persistent User Accounts, Long-Term Conversation History, or Mobile Application support.
- If such a feature is requested later, ask for confirmation before expanding scope.
- Assume provided data is synthetic and intended for the hackathon.

CODE QUALITY:

- Keep components/modules small and composable.
- Handle loading, error, and empty states where applicable.
- Avoid dead code, magic values, commented-out code, and unnecessary dependencies.
- Write production-quality code.
- Keep changes incremental and easy to review.

DELIVERABLE:

After implementation:
1. Show files created/modified.
2. Explain the architecture briefly.
3. Explain how provider configuration works.
4. Run available tests/type checks/linting.
5. Report any unresolved issue.
6. Do not modify unrelated parts of the project.

# TASK 2 — Implement the Prompt Architecture for the ai-intelligence module.

This task must be implemented AFTER TASK 1 (LLM Provider Abstraction).

Before coding:
- Inspect the implementation from Task 1.
- Inspect existing prompt-related files.
- Inspect Technical Specification, Curriculum JSON and Candidate Profiles.
- Reuse the existing ChatProvider abstraction.
- Do not duplicate existing functionality.

GOAL:

Create a centralized and maintainable prompt architecture for the Interview Agent.

All AI prompts should live under the project's designated prompt directory, preferably:

app/llm/prompts/

unless the existing repository uses another established structure.

Create separate prompt definitions/builders for:

1. Interviewer wording
2. Question generation
3. Follow-up generation
4. Answer evaluation
5. Feedback synthesis

REQUIREMENTS:

- Separate system prompts from dynamic user/context data.
- Do not hardcode candidate-specific information inside prompt templates.
- Create reusable prompt builder functions where appropriate.
- Prompts must accept structured input.
- Clearly define expected output format.
- Prompts must use retrieved curriculum context when required.
- Prompts must respect Candidate Profile information when relevant.
- Prevent prompts from inventing curriculum facts.
- Keep prompt construction separate from LLM provider code.
- Avoid giant prompt strings inside service/business logic.
- Make prompts easy to modify independently.

Create a consistent structure for:
- system instructions
- task instructions
- candidate context
- curriculum context
- previous answer/context
- output requirements

Do NOT implement the actual RAG pipeline in this task.

Do NOT implement final question generation service, evaluation service, or feedback service yet.

PROJECT DEVELOPMENT GUIDELINES:

[Apply the complete PROJECT DEVELOPMENT GUIDELINES provided for this project:
DRY, SOLID, KISS, clean architecture, modularity, strict typing, focused files, reusable components, no unnecessary dependencies, production-quality code, etc.]

CODE DOCUMENTATION:

Every source file must begin with a concise comment block explaining:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON FOCUS:

Stay strictly within the Interview Agent Technical Specification.
Do not implement:
- Voice Interaction
- Authentication
- Persistent User Accounts
- Long-Term Conversation History
- Mobile Application

DELIVERABLE:

- List created/modified files.
- Explain prompt architecture.
- Show how future AI services will consume these prompt builders.
- Run available tests/type checks/linting.
- Do not modify unrelated code.

# PROMPT 3 — Structured Output + Pydantic Validation

TASK 3 — Implement structured AI output handling with validation and retry-on-parse-failure.

This task comes AFTER:
- Task 1: LLM Provider Abstraction
- Task 2: Prompt Architecture

Before coding:
1. Inspect existing LLM provider abstraction.
2. Inspect existing prompt architecture.
3. Inspect installed dependencies.
4. Reuse existing validation infrastructure if available.

GOAL:

Create a reliable structured-output layer for AI responses.

The AI system must not blindly trust raw LLM text.

Implement JSON/function-calling compatible output handling with Pydantic validation.

REQUIREMENTS:

Create strongly typed schemas/models for the major AI outputs.

At minimum prepare schemas for:

1. Answer Evaluation
   - score
   - conceptCoverage
   - technicalAccuracy
   - depth
   - strengths
   - gaps
   - followUpRequired

2. Feedback
   - summary
   - strengths
   - gaps
   - next

Use the exact field naming/conventions required by the existing Technical Specification.

Implement:

- JSON parsing
- Pydantic validation
- validation error handling
- retry-on-parse-failure
- safe fallback behavior when the LLM repeatedly returns invalid output

Important:

The fallback must be deterministic and must never fabricate candidate performance data.

The system should distinguish between:
- valid response
- malformed JSON
- schema validation failure
- LLM/provider failure

Do not duplicate validation logic across services.

Create a reusable structured-output utility/service.

Do NOT implement:
- RAG
- question generation
- follow-up generation
- evaluation business logic
- feedback business logic

Only implement the reusable structured-output infrastructure.

PROJECT DEVELOPMENT GUIDELINES:

Follow the complete project guidelines:
- DRY
- SOLID
- KISS
- clean architecture
- modular reusable code
- strict typing
- no unnecessary complexity
- no `any` unless absolutely unavoidable
- focused files
- production-quality code
- proper error handling
- no dead code

DOCUMENTATION:

Every source file must begin with a concise comment block containing:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON SCOPE:

Do not implement Voice Interaction, Authentication, Persistent Accounts, Long-Term Conversation History, or Mobile Application support.

DELIVERABLE:

- List files created/modified.
- Explain validation flow.
- Explain retry behavior.
- Add tests for valid JSON, malformed JSON, validation failure, and fallback behavior.
- Run tests/type checking/linting.
- Report any issue clearly.

