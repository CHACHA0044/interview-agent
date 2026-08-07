/*
========================================================

File:
mock/feedback.ts

Purpose:
Mock feedback data for interview results display.

Responsibilities:
- Provides mock interview feedback with scores and recommendations
- Simulates the backend feedback generation response
- Used by the feedback page and feedback drawer

Connected Files:
- src/services/interview.service.ts
- src/types/index.ts (InterviewFeedback type)
- src/pages/FeedbackPage.tsx

Depends On:
- src/types/index.ts
- dayjs

Notes:
Feedback is generated at the end of an interview.
Replace with real API response when backend is ready.

========================================================
*/

import type { InterviewFeedback } from "@/types";
import dayjs from "dayjs";

export const MOCK_FEEDBACK: InterviewFeedback = {
  sessionId: "session-mock-001",
  candidateId: "CAND-003",
  summary:
    "Emily demonstrated exceptional understanding across all assessed topics. Her responses showed depth of knowledge in embeddings, RAG architecture, and prompt engineering. She provided practical, well-structured answers with real-world examples. Areas for growth include deeper exploration of security considerations and production deployment strategies.",
  overallScore: 87,
  strengths: [
    "Deep understanding of vector embeddings and semantic search fundamentals",
    "Excellent practical knowledge of RAG pipeline design and optimization",
    "Strong grasp of prompt engineering techniques with clear examples",
    "Good understanding of multi-agent orchestration patterns",
    "Clear, structured communication style with technical precision",
  ],
  gaps: [
    "Could explore security and prompt injection mitigation in more depth",
    "Limited discussion of production monitoring and observability strategies",
    "Fine-tuning trade-offs could be explained with more nuance",
  ],
  next: [
    "Deep dive into LLM security: prompt injection attacks and guardrails",
    "Explore production observability with Prometheus and Grafana",
    "Practice designing fine-tuning pipelines for domain-specific tasks",
    "Study advanced MCP patterns for tool orchestration",
  ],
  topicScores: [
    {
      topic: "Embeddings & Vector Search",
      score: 9,
      maxScore: 10,
      notes: "Excellent understanding of embeddings, similarity metrics, and chunking strategies",
    },
    {
      topic: "LLM Core, Prompting & Fine-Tuning",
      score: 8,
      maxScore: 10,
      notes: "Strong prompting knowledge. Fine-tuning concepts could use more depth",
    },
    {
      topic: "Chatbot Application Build",
      score: 9,
      maxScore: 10,
      notes: "Great practical knowledge of API integration and conversation management",
    },
    {
      topic: "Agentic AI & MCP",
      score: 8,
      maxScore: 10,
      notes: "Good understanding of agent patterns. MCP knowledge is solid",
    },
    {
      topic: "Evaluation, Security & Deployment",
      score: 7,
      maxScore: 10,
      notes: "Adequate but could explore security and deployment in more depth",
    },
  ],
  generatedAt: dayjs().toISOString(),
};
