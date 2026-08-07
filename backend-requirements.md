<!--
========================================================

File:
backend-requirements.md

Purpose:
Comprehensive technical specification for future backend development of Interview Agent.

Responsibilities:
- Outlines multi-agent architecture and agent workflow
- Defines API endpoints, schema, and payload structures
- Documents database schemas, vector DB indexing, memory, and RAG pipelines

Connected Files:
- technical-spec.md
- candidates.json
- curriculum.json

Depends On:
- FastApi / Python 3.11+
- LangGraph / CrewAI
- ChromaDB / Qdrant / Pinecone
- PostgreSQL + PGVector

========================================================
-->

# Backend Requirements & Architectural Specification

This document defines the complete backend architecture, multi-agent evaluation pipeline, RAG infrastructure, database schemas, and API contracts for the **Interview Agent** platform.

---

## 1. System Architecture Overview

The backend is designed as an event-driven, multi-agent AI system built on Python 3.11+ and FastAPI.

```
                  ┌────────────────────────┐
                  │    React 19 Frontend   │
                  └───────────┬────────────┘
                              │ HTTP (JSON) / SSE
                              ▼
                  ┌────────────────────────┐
                  │    FastAPI Gateway     │
                  └───────────┬────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Session Engine  │ │  Agent Orchestr. │ │   RAG Engine     │
│   (Redis Store)  │ │   (LangGraph)    │ │ (Chroma/Qdrant)  │
└──────────────────┘ └────────┬─────────┘ └──────────────────┘
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
        ┌─────────────┐┌─────────────┐┌─────────────┐
        │ Interviewer ││ Evaluator   ││ Report Gen  │
        │ Agent       ││ Agent       ││ Agent       │
        └─────────────┘└─────────────┘└─────────────┘
```

---

## 2. Recommended Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── interview.py
│   │   │   │   ├── candidates.py
│   │   │   │   └── curriculum.py
│   │   │   └── router.py
│   │   └── dependencies.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   ├── db/
│   │   ├── session.py
│   │   └── models/
│   │       ├── candidate.py
│   │       ├── interview.py
│   │       └── feedback.py
│   ├── agents/
│   │   ├── state.py
│   │   ├── graph.py
│   │   ├── interviewer_agent.py
│   │   ├── evaluator_agent.py
│   │   └── report_agent.py
│   ├── rag/
│   │   ├── vector_store.py
│   │   ├── retriever.py
│   │   └── embeddings.py
│   ├── schemas/
│   │   ├── interview.py
│   │   ├── candidate.py
│   │   └── feedback.py
│   └── services/
│       ├── interview_service.py
│       └── candidate_service.py
├── tests/
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

---

## 3. HTTP Endpoints Spec (`POST /api/interview`)

### Primary Contract (as defined in `technical-spec.md`)

```
POST /api/interview
```

#### Request: Initialize Session
```json
{
  "sessionId": "abc-123",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9
    }
  }
}
```

#### Response: Initial Question
```json
{
  "reply": "Welcome Sarah. Let's begin your technical interview...",
  "done": false
}
```

#### Request: Candidate Response Turn
```json
{
  "sessionId": "abc-123",
  "message": "Vector embeddings represent dense numerical representations..."
}
```

#### Response: Next Turn
```json
{
  "reply": "Excellent explanation. Next, how do you handle chunking?",
  "done": false
}
```

#### Response: Final Turn with Feedback
```json
{
  "reply": "Interview completed successfully.",
  "done": true,
  "feedback": {
    "summary": "Demonstrated deep mastery in RAG and embeddings...",
    "strengths": ["Vector search", "Prompt tuning"],
    "gaps": ["Observability"],
    "next": ["Practice Prometheus setup"]
  }
}
```

---

## 4. Multi-Agent & RAG Architecture

1. **Interviewer Agent**: Formulates adaptive questions aligned with `curriculum.json`.
2. **Evaluator Agent**: Assesses answer accuracy, technical precision, and flags gaps.
3. **Report Generation Agent**: Synthesizes score metrics and actionable growth pathways into standardized feedback objects.

---

## 5. Database & Memory Strategy

- **Relational DB**: PostgreSQL for session records, candidate histories, and feedback logs.
- **Vector DB**: ChromaDB / PGVector storing embedded curriculum chunks.
- **Memory Buffer**: Redis persistent cache keyed by `sessionId` maintaining sliding window conversation memory.

---

## 6. Observability & Deployment

- Containerized via Docker & Kubernetes manifest.
- Structured logging with Prometheus metrics exposing evaluation latency and token usage.
