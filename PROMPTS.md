# Interview Agent — Development Prompts

## Table of Contents

- [Phase 0 — Initial Frontend](#phase-0--initial-frontend)
- [Phase 1 — Backend Audit & Deployment Preparation](#phase-1--backend-audit--deployment-preparation)
- [Phase 2 — Backend Verification & Bug Fixes](#phase-2--backend-verification--bug-fixes)
- [Phase 3 — Frontend Data Wiring](#phase-3--frontend-data-wiring)
- [Phase 4 — Agent Quality & Multi-Provider Resilience](#phase-4--agent-quality--multi-provider-resilience)
- [Phase 5 — Live Testing & Bug Discovery](#phase-5--live-testing--bug-discovery)
- [Phase 6 — Frontend Polish](#phase-6--frontend-polish)
- [Overall Development Timeline](#overall-development-timeline)
- [Final Project Architecture](#final-project-architecture)
- [Phase Summary](#phase-summary)

## Phase 0 — Initial Frontend

### Goal

Build the initial frontend foundation for The Interview Agent and establish the overall product experience before implementing the real backend.

The frontend needed to represent an enterprise technical assessment platform rather than a generic AI chatbot.

The interface needed to support the eventual flow:

```text
Candidate Selection
        ↓
Interview Configuration
        ↓
Technical Interview
        ↓
Adaptive Questions
        ↓
Evaluation
        ↓
Final Feedback
```

### Problem Context

The application needed to support the hackathon's core concept:

Build the interviewer, not the interview.

The AI Interview Agent needed to eventually assess candidates based on their learning journey through the 31-day AI Cohort.

The frontend therefore needed concepts for:

- candidates
- curriculum
- assessment topics
- interview configuration
- interview progress
- evaluation
- feedback
- architecture

The supplied resources included:

- `curriculum.json`
- `candidates.json`
- `technical-spec.md`

### Prompts Used

**Initial frontend foundation prompt**

The AI coding agent was instructed to:

- inspect the repository
- understand the problem statement
- inspect the provided JSON data
- inspect the technical specification
- connect the project to the existing GitHub repository
- build the frontend first
- use React and TypeScript
- use Vite
- use Tailwind CSS
- use Motion/Framer Motion
- use Lucide icons
- use shadcn/ui
- maintain a dark enterprise interface
- keep the code modular
- follow DRY principles
- avoid unnecessary complexity
- prepare the frontend for later backend integration

A specific requirement was added for source-file documentation.

Every applicable `.ts`, `.tsx`, and other source file needed a header/comment section explaining:

- what the file does
- its objective
- why it exists
- what page/component/service it represents
- how it connects to other parts of the project

Configuration/data files such as JSON and environment files were excluded where comments were not appropriate.

### Frontend Structure

The main frontend flow became:

```text
Overview
   ↓
Candidates
   ↓
Interview Setup
   ↓
Interview
   ↓
Evaluation / Feedback
```

Supporting sections included:

- Architecture
- Settings
- Visual Direction

The first version used a dark AI-dashboard design.

It included:

- dark backgrounds
- feature cards
- animated elements
- large typography
- candidate cards
- navigation
- assessment controls
- architecture information

### Visual Redesign

The initial purple-heavy interface was later considered too generic.

A subsequent prompt instructed the AI agent to redesign the visual system around:

- Black
- White
- Gold

The agent was instructed to:

- remove the purple visual identity
- use the provided font files
- scan the project for available fonts/assets
- improve typography
- improve spacing
- improve hierarchy
- reduce excessive decorative effects
- make the application look like an enterprise assessment platform

### Responsive Design

The frontend was then repeatedly refined to work properly across:

- desktop
- laptop
- tablet
- mobile

The agent was explicitly instructed to avoid:

- fixed desktop widths
- horizontal overflow
- clipped content
- overlapping cards
- oversized headings
- navigation collisions
- desktop-only layouts

The design needed to transition naturally between multi-column desktop layouts and single-column mobile layouts.

### Phase 0 Outcome

The phase established the frontend product shell and visual identity.

The result was:

```text
Problem Statement
       ↓
UX Definition
       ↓
React/TypeScript Foundation
       ↓
Candidate Flow
       ↓
Interview Configuration
       ↓
Enterprise UI
       ↓
Black/White/Gold Design
       ↓
Responsive Layout
```

The frontend was intentionally designed so that backend intelligence could later be connected without rewriting the entire UI.

## Phase 1 — Backend Audit & Deployment Preparation

### Goal

Analyze the backend requirements and establish a clean architecture capable of supporting the Interview Agent.

The backend needed to support:

- multi-turn interviews
- candidate context
- curriculum context
- adaptive questions
- follow-ups
- evaluation
- feedback
- session state
- required API contracts

It also needed to be practical to deploy during the hackathon.

### Initial Backend Architecture

The architecture was separated into:

```text
Frontend
   ↓
Gateway
   ↓
Interview Agent
   ↓
AI Intelligence
```

Supporting infrastructure included:

- Redis
- Qdrant
- LLM

### Prompt Used

**Backend architecture prompt**

The AI agent was instructed to analyze:

- problem statement
- `backend.md`
- `backend-requirements.md`
- `technical-spec.md`
- `candidates.json`
- `curriculum.json`
- existing frontend

It was asked to:

- identify backend responsibilities
- divide the backend into services
- define service boundaries
- create shared contracts
- avoid duplicated logic
- follow DRY principles
- keep the architecture modular
- make services independently testable
- avoid unnecessary complexity

### Service Responsibilities

#### Gateway

Responsible for:

- public API
- session lifecycle
- request validation
- response validation
- CORS
- error mapping
- communication with internal services

#### Interview Agent

Responsible for:

- interview state
- question progression
- difficulty
- follow-up decisions
- curriculum coverage
- completion rules

#### AI Intelligence

Responsible for:

- question generation
- follow-up generation
- answer evaluation
- feedback generation
- curriculum retrieval
- LLM integration

### Shared Contracts

A shared contract layer was created:

```text
backend/shared/schemas/
├── session.json
├── agent_api.json
└── ai_api.json
```

JSON Schema Draft 2020-12 was used.

This prevented the Gateway, Interview Agent, and AI Intelligence services from independently defining incompatible payloads.

### Gateway

The Gateway implemented the public API and session lifecycle.

Important responsibilities included:

- starting interviews
- processing turns
- completing sessions
- storing session state
- communicating with the Interview Agent
- mapping internal errors to public HTTP responses

The Gateway was deliberately kept unaware of interview strategy.

### Contract Testing

Shared contract tests were introduced to verify:

- API schemas
- session compatibility
- Agent API compatibility
- AI API compatibility
- Gateway compatibility

### Docker Architecture

A Docker Compose setup was created around:

- gateway
- interview-agent
- ai-intelligence
- redis
- qdrant

Only the Gateway was externally exposed.

### Render Deployment Decision

Because running three independent backend services on Render's free tier was not practical, the deployment architecture was later changed to a single Docker container.

The container would run:

```text
Gateway             :8000
Interview Agent     :8001
AI Intelligence     :8002
```

Only port 8000 would be externally accessible.

### Deployment Files

The deployment preparation introduced:

- `backend/Dockerfile`
- `backend/start.sh`
- `backend/.dockerignore`
- `backend/.env.example`
- `render.yaml`

`start.sh` was responsible for:

- starting AI Intelligence
- starting Interview Agent
- waiting for health checks
- starting Gateway in the foreground

### Phase 1 Outcome

The backend moved from a conceptual design to a contract-driven architecture.

The resulting architecture was:

```text
                Frontend
                   │
                   ▼
               Gateway
                   │
          ┌────────┴────────┐
          ▼                 ▼
 Interview Agent     AI Intelligence
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                 Qdrant          LLM
```

The architecture was also prepared for single-service Render deployment.

## Phase 2 — Backend Verification & Bug Fixes

### Goal

Verify that the implemented backend actually satisfied the hackathon's mandatory interview requirements rather than only passing generic API tests.

The key requirements being verified were:

- minimum 8 questions
- minimum 4 curriculum days
- adaptive follow-up questions
- conversation context
- structured feedback
- Agent-owned completion

### Initial Verification

The backend had reached approximately 168 tests across:

- Gateway
- Interview Agent
- AI Intelligence
- Shared contracts

The verification process involved auditing:

- implementation
- schemas
- fixtures
- tests
- curriculum parsing
- completion logic

### Prompt Used

**Backend verification prompt**

The AI agent was instructed to:

- audit the entire backend against the problem statement
- inspect `technical-spec.md`
- inspect `backend.md`
- inspect all shared contracts
- inspect Agent implementation
- inspect AI implementation
- inspect test coverage
- specifically verify the 8-question / 4-day requirement
- identify places where completion could happen prematurely
- verify that the Gateway does not incorrectly enforce interview strategy
- verify curriculum-day calculation
- add tests for uncovered requirements
- fix actual bugs rather than only changing tests

### Important Finding

A curriculum day-range parsing issue was discovered.

Some curriculum entries represented ranges such as:

```text
[1, 5]
```

The implementation incorrectly handled the range and could omit interior days.

This could cause the system to believe that fewer curriculum days had been covered than were actually present.

### Fix

The curriculum range parsing was corrected so that ranges were expanded correctly.

For example:

```text
[1, 5]
```

was interpreted as:

```text
1
2
3
4
5
```

rather than only treating the boundary values as available.

The fix was recorded as:

`commit 63cc7fd`

### Completion Ownership

The audit also reinforced an important architecture rule:

The Interview Agent owns interview completion.

The Gateway should not decide when an interview has reached the required question count or curriculum coverage.

The Agent must ensure:

```text
questionCount >= 8
AND
distinctCurriculumDays >= 4
```

before returning:

```text
done = true
```

### Contract Tests

Additional tests were introduced to verify that:

- 8+ questions are representable
- 4+ curriculum days are representable
- schemas do not hard-code a maximum below the requirement
- the Agent cannot complete early
- follow-ups can reference previous answers
- completion requires valid feedback
- Agent completion remains the source of truth

### Phase 2 Outcome

The backend was no longer merely "passing tests."

It was explicitly tested against the actual hackathon acceptance criteria.

The phase established confidence that the backend architecture could represent the required interview length and curriculum coverage.

## Phase 3 — Frontend Data Wiring

### Goal

Replace the frontend's mock/canned data with real communication with the backend.

This phase addressed a major issue discovered during the audit:

The frontend was still effectively a mock application.

The UI could display candidates and interview flows, but the real backend services were not yet driving the experience.

### Prompt Used

**Frontend integration prompt**

The AI agent was instructed to:

- audit all frontend data sources
- identify mock candidate data
- identify mock interview responses
- identify fake service handlers
- identify hard-coded evaluation data
- inspect backend API contracts
- create a proper frontend service layer
- connect the UI to the Gateway
- preserve the existing UI
- avoid moving backend logic into React
- use typed API responses
- handle loading/error states
- keep API logic separate from components

### Interview Service

A real `interview.service.ts` was introduced.

The service became responsible for communicating with the backend rather than individual React components making ad-hoc requests.

This preserved separation between:

```text
UI
 ↓
Service
 ↓
API
```

### Candidate Data

Candidate selection was updated to use the actual candidate dataset/backend flow instead of relying entirely on static mock objects.

Candidate context could now be used as the basis for the interview.

### Interview Flow

The frontend was wired around the backend session lifecycle:

```text
Start
 ↓
Receive Question
 ↓
Submit Answer
 ↓
Receive Next Question / Follow-up
 ↓
Continue
 ↓
Complete
 ↓
Display Feedback
```

### Settings

Settings were also connected to the application's actual configuration rather than remaining purely visual controls.

### Important Architecture Principle

The frontend was not allowed to implement interview intelligence.

It only:

- sends user input
- displays Agent responses
- displays state
- displays evaluation
- handles UI state

The backend remains responsible for:

- question selection
- follow-up logic
- evaluation
- curriculum reasoning
- completion

### Phase 3 Outcome

The frontend transitioned from:

```text
UI + Mock Data
```

to:

```text
UI
 ↓
Frontend Service Layer
 ↓
Gateway
 ↓
Real Backend
```

This was a major step toward a genuine end-to-end application.

## Phase 4 — Agent Quality & Multi-Provider Resilience

### Goal

Improve the quality and reliability of the AI interview system after the initial end-to-end implementation.

The first real interview behavior revealed that technically valid responses could still produce poor interview experiences.

The focus became:

- better question generation
- avoiding repetitive/generic questions
- better follow-ups
- provider resilience
- structured logging
- handling API failures
- avoiding interview interruption when an AI provider fails

### Prompt Used

**AI quality and resilience prompt**

The AI agent was instructed to:

- inspect the existing Interview Agent and AI Intelligence implementations
- analyze question-generation behavior
- identify generic or repetitive questions
- ensure questions are grounded in candidate context
- use curriculum context when generating questions
- make follow-ups reference the previous answer
- maintain interview state across turns
- preserve the 8-question / 4-day requirement
- implement resilient provider handling
- avoid making the entire interview dependent on one external model provider
- add structured logs
- maintain deterministic fallbacks

### Provider Rotation

A provider rotation/failover mechanism was introduced.

The intended flow became conceptually:

```text
Primary Provider
      ↓
Failure?
      ↓
Next Provider
      ↓
Failure?
      ↓
Fallback
```

The system was prepared to support multiple AI providers rather than depending on a single API.

### Groq Multi-Key Rotation

Multiple Groq API keys could be rotated to reduce the impact of individual quota/rate-limit failures.

The provider layer became responsible for selecting another available key when appropriate.

### Cerebras Failover

Cerebras was introduced as an additional fallback provider.

The goal was not to change the interview architecture but to make the AI layer more resilient.

### Deterministic Fallback

The system retained the fake/heuristic path.

This was important because:

```text
AI provider failure
        ≠
Interview failure
```

The interview system should still be able to produce a deterministic response when an external model is unavailable.

### Structured Logging

Logging was improved so that provider failures and fallback decisions could be diagnosed more easily.

This was particularly useful for live testing.

### Keepalive / Reliability

Additional reliability handling was introduced to reduce unnecessary provider/service failures during longer interview sessions.

### Phase 4 Outcome

The AI layer evolved from a single-provider implementation into a more resilient architecture:

```text
                AI Request
                    │
                    ▼
              Provider Layer
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        Groq     Cerebras   Fallback
          │         │         │
          └─────────┴─────────┘
                    │
                    ▼
             Deterministic
               Response
```

This improved the reliability of the interview experience without changing the core service architecture.

## Phase 5 — Live Testing & Bug Discovery

### Goal

Move beyond unit tests and test the application using real end-to-end interviews and real AI APIs.

The purpose of this phase was to discover problems that unit tests could not reveal.

### Testing Approach

The system was tested as a real user would interact with it:

```text
Browser
  ↓
Vercel Frontend
  ↓
Render Backend
  ↓
Gateway
  ↓
Interview Agent
  ↓
AI Intelligence
  ↓
External AI Provider
```

The focus was specifically on real API behavior, not mocked responses.

### Prompt Used

**Live testing prompt**

The AI agent was instructed to:

- run real interview sessions
- use real backend services
- avoid relying on mocks
- test candidate selection
- start an interview
- submit multiple answers
- test follow-ups
- test question progression
- test completion
- verify feedback
- inspect backend logs
- identify failures that unit tests did not catch
- fix actual integration problems
- retest after each fix

### Issue 1 — Cerebras Model 404

A real API request exposed a model configuration problem.

The configured Cerebras model returned:

```text
404
```

This demonstrated why unit tests alone were insufficient.

The provider configuration had to be verified against the actual provider/API behavior.

### Issue 2 — Fake Fallback Schema Validation

Another issue appeared when the AI system fell back to the fake provider.

The fallback response did not always satisfy the exact schema expected by the downstream service.

This resulted in schema validation problems.

The fallback needed to produce exactly the same structural contract as the real provider path.

### Important Finding

The phase demonstrated that:

```text
Unit tests passing

does not necessarily mean:

Real system working
```

The integration layer between:

- frontend
- Render
- Gateway
- Agent
- AI service
- external providers

had to be tested separately.

### Phase 5 Outcome

The system was tested as a genuine end-to-end application.

This phase identified provider configuration and fallback-contract problems that were not obvious from isolated service tests.

Those issues became inputs for the subsequent fixes and final validation.

## Phase 6 — Frontend Polish

### Goal

Perform the final frontend refinement required to make the project presentable for hackathon judging and usable across different devices.

The focus was not on adding large new features.

Instead, it was on:

- visual consistency
- responsiveness
- spacing
- navigation
- animations
- readability
- interview UX
- mobile/tablet behavior
- final interaction quality

### Prompt Used

**Final frontend polish prompt**

The AI agent was instructed to:

- audit the entire frontend
- test every major route
- preserve the black/white/gold design
- improve responsive behavior
- test desktop
- test tablet
- test mobile
- fix layout overflow
- fix navigation issues
- improve spacing
- improve typography
- improve button sizing
- improve cards
- improve interview interaction
- keep animations purposeful
- avoid excessive visual effects
- avoid changing backend behavior
- avoid adding unnecessary features
- maintain the existing architecture
- preserve reusable components
- follow DRY principles

### Responsive Testing

The final frontend was explicitly treated as a cross-platform interface.

#### Desktop

The interface should use the full available width without creating oversized empty regions.

#### Tablet

Cards and navigation should transition naturally into smaller layouts.

#### Mobile

The interface should:

- stack content
- provide accessible controls
- prevent horizontal scrolling
- keep buttons usable
- maintain readable typography
- preserve the interview flow

### Visual System

The final visual identity remained:

- Black
- White
- Gold

The interface was kept intentionally restrained rather than returning to the earlier purple-heavy AI aesthetic.

### Interview Experience

The final polish also focused on making the actual interview screen feel like the core product rather than another dashboard page.

The expected flow became:

```text
Candidate Context
       ↓
Current Question
       ↓
Candidate Answer
       ↓
AI Evaluation
       ↓
Next Question / Follow-up
       ↓
Progress
       ↓
Final Assessment
```

### Phase 6 Outcome

The frontend was refined from a functional dashboard into the final presentation layer of the Interview Agent.

The overall product became:

```text
                INTERVIEW AGENT
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
     Candidate                Curriculum
     Context                    Context
          │                       │
          └───────────┬───────────┘
                      ▼
              Interview Agent
                      │
                      ▼
             Adaptive Questions
                      │
                      ▼
              Candidate Answers
                      │
                      ▼
                Evaluation
                      │
                      ▼
              Structured Feedback
```

The frontend polish phase focused on ensuring that this flow was understandable and usable to a judge or evaluator immediately after opening the live demo.

## Overall Development Timeline

The complete development progression can be represented as:

```text
PHASE 0
Frontend Foundation
        │
        ▼
PHASE 1
Backend Architecture
        │
        ▼
PHASE 2
Backend Verification
        │
        ▼
PHASE 3
Frontend ↔ Backend Integration
        │
        ▼
PHASE 4
AI Quality + Provider Resilience
        │
        ▼
PHASE 5
Real End-to-End Testing
        │
        ▼
PHASE 6
Frontend Polish
```

## Final Project Architecture

By the end of these phases, the intended system architecture was:

```text
                         ┌──────────────────────┐
                         │      Vercel          │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS
                                    ▼
                    ┌──────────────────────────────┐
                    │      Render Backend          │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │       Gateway          │  │
                    │  │        :8000           │  │
                    │  └───────────┬────────────┘  │
                    │              │               │
                    │       ┌──────┴───────┐       │
                    │       ▼              ▼       │
                    │ ┌───────────┐ ┌────────────┐ │
                    │ │ Interview │ │     AI     │ │
                    │ │   Agent   │ │Intelligence │ │
                    │ │   :8001   │ │   :8002    │ │
                    │ └───────────┘ └─────┬──────┘ │
                    │                     │        │
                    │              ┌──────┴─────┐  │
                    │              ▼            ▼  │
                    │           Qdrant         LLM │
                    │                              │
                    └──────────────────────────────┘
```

The core responsibility separation remained:

| Component | Responsibility |
| --- | --- |
| Frontend | User experience and presentation |
| Gateway | Public API and session lifecycle |
| Interview Agent | Interview reasoning, state and progression |
| AI Intelligence | RAG, LLM, evaluation and feedback |
| Qdrant | Curriculum retrieval |
| LLM Providers | Question/follow-up/evaluation intelligence |
| Shared Contracts | Service compatibility |

## Phase Summary

| Phase | Main Objective | Result |
| --- | --- | --- |
| 0 | Frontend foundation | Initial enterprise UI and product flow |
| 1 | Backend architecture & deployment | Gateway + Agent + AI architecture and Render preparation |
| 2 | Backend verification | Hackathon floors and curriculum coverage verified/fixed |
| 3 | Frontend data wiring | Mock frontend connected to real backend |
| 4 | AI quality/resilience | Provider rotation, fallback and improved interview behavior |
| 5 | Live testing | Real API/integration issues discovered and addressed |
| 6 | Frontend polish | Responsive, cross-platform and presentation-ready UI |
