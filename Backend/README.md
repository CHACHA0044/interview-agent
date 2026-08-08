# Backend Flow & Architecture Documentation

This document explains the pure backend architecture for the Interview Agent project. It breaks down the microservices, the exact request lifecycle, and details what each file does.

## 🏗️ Architecture Overview

The backend is composed of two primary microservices working together to orchestrate technical interviews without keeping any long-term conversational memory in the process itself. State is managed entirely via the Gateway and passed on each request.

1. **interview-agent**: The stateless "brain" of the operation. It plans the interview, selects topics, adjusts difficulty, and enforces completion rules. It does **not** call LLMs directly.
2. **ai-intelligence**: The Generative AI layer. It takes structured strategies from the `interview-agent`, performs RAG (Retrieval-Augmented Generation) against the curriculum, and generates natural language questions and evaluations.

---

## 📂 File Directory Structure & Responsibilities

Below is the complete file tree for the `interview-agent` microservice (`Backend/services/interview-agent/app`), which is the core orchestrator.

### `app/main.py`
**Purpose**: The FastAPI application entry point.
**What it does**: Initializes the web server, mounts the API routes, and injects global dependencies (like the `CurriculumLoader`) into the application state so they are only loaded once on startup.

### `app/api/router.py`
**Purpose**: The HTTP Controller.
**What it does**: Exposes the actual endpoints (`/start`, `/next`, `/follow-up`, `/complete`). It receives HTTP requests, strips away network concerns, and passes raw Python objects to the Orchestrator. It also catches domain errors (like finishing too early) and converts them into `400 Bad Request` responses.

---

### Schemas (Data Transfer Objects)
*(Located in `app/schemas/`)*

- **`domain.py`**: Defines the core building blocks like `Difficulty`, `ProgressionState`, `CandidateContext`, `QuestionStrategy`, and `FollowUpStrategy`.
- **`state.py`**: Defines the almighty `AgentState`. This is the single source of truth passed back and forth to Redis. It tracks total questions asked, the exact plan, distinct days covered, and the candidate's history.
- **`orchestration.py`**: Defines the strict HTTP request/response payloads like `StartInterviewRequest`, preventing garbage data from entering the agent.

---

### Services (The Business Logic)
*(Located in `app/services/`)*

- **`orchestrator.py`**: The conductor. It wires together all the other services. When a request hits the API, the orchestrator delegates tasks (e.g., "build the plan", "adapt the difficulty") and returns the final mutated state.
- **`calibration.py`**: Analyzes the candidate's GitHub profile. It calculates their "Tier" (Novice to Expert) and sets their starting difficulty based on their past mission failures and successes.
- **`curriculum_loader.py`**: Safely loads the `curriculum.json` file into memory so the agent knows what topics exist.
- **`curriculum_selection.py`**: Filters the curriculum based on the candidate's profile, prioritizing days they previously failed or struggled with.
- **`planner.py`**: Generates a strict, 8-question interleaved assessment plan. It guarantees that topics are spread out and no single module is grouped together.
- **`strategy_builder.py`**: Converts a generic planned question slot into a highly detailed `QuestionStrategy` that can be sent to the AI service.
- **`decision_engine.py`**: Evaluates the AI's grading of a candidate's answer. It decides exactly what happens next: Do we ask a follow-up to dig deeper, move to the next question, or finish the interview?
- **`progression.py`**: Safely mutates the `AgentState`. It pulls the next question from the plan, tracks how many distinct days have been covered, and mathematically prevents the interview from finishing before the minimum floors (8 questions, 4 days) are met.
- **`difficulty_adapter.py`**: Tracks rolling scores. If a candidate gets two 8.0+ scores in a row, it steps the difficulty up. Two <5.0 scores step it down.
- **`ai_client.py`**: A mock interface representing the boundary where the `interview-agent` talks to the `ai-intelligence` module.

---

## 🔄 The Request Flow (How it all connects)

### 1. Starting the Interview
1. Frontend calls `/start` on the Gateway.
2. Gateway hits `POST /internal/interview/start` on `interview-agent`.
3. `orchestrator.py` uses `calibration.py` to analyze the candidate.
4. `planner.py` generates the 8-question plan.
5. The agent yields an initial `AgentState` and the first `QuestionStrategy`.
6. Gateway saves the state in Redis and passes the strategy to `ai-intelligence` to generate the natural language text.

### 2. Answering a Question
1. Candidate submits an answer.
2. Gateway sends the answer to `ai-intelligence` to be evaluated against the rubric.
3. Gateway takes the evaluation and calls `POST /internal/interview/next` on `interview-agent`.
4. `difficulty_adapter.py` adjusts the difficulty based on the score.
5. `decision_engine.py` decides if the candidate needs a follow-up question because they missed a concept.
6. `progression.py` advances the state, checking if the 8-question limit is hit.
7. Agent returns the mutated `AgentState` and the next Strategy back to the Gateway.

### 3. Finishing the Interview
1. If the plan is exhausted, the Orchestrator checks the hard floors (must have asked 8 questions across 4 distinct days).
2. If met, the state is marked as `COMPLETED`.
3. Gateway takes this signal and calls `ai-intelligence` to generate the final Markdown feedback report for the candidate.
