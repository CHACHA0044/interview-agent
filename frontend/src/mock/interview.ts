/*
========================================================

File:
mock/interview.ts

Purpose:
Mock interview session data and conversation messages.

Responsibilities:
- Provides mock interview session state
- Simulates conversation messages between agent and candidate
- Provides mock interview questions
- Used by interview services and components

Connected Files:
- src/services/interview.service.ts
- src/types/index.ts
- src/stores/interview.store.ts

Depends On:
- src/types/index.ts
- dayjs

Notes:
All timestamps use ISO 8601 format.
Replace with real API responses when backend is ready.

========================================================
*/

import type { InterviewMessage, InterviewQuestion } from "@/types";
import dayjs from "dayjs";

const baseTime = dayjs().subtract(15, "minute").toISOString();

export const MOCK_MESSAGES: InterviewMessage[] = [
  {
    id: "msg-001",
    role: "system",
    content: "Interview session started. The AI interviewer will now begin the technical assessment.",
    timestamp: baseTime,
  },
  {
    id: "msg-002",
    role: "agent",
    content:
      "Welcome! I'm your AI interviewer for the Enterprise AI Cohort assessment. I'll be asking you a series of questions about the topics you covered during the program. Let's start with something fundamental.\n\n**Can you explain what vector embeddings are and why they're important in modern AI applications?**",
    timestamp: dayjs(baseTime).add(1, "second").toISOString(),
    questionIndex: 0,
    topic: "Embeddings & Vector Search",
  },
  {
    id: "msg-003",
    role: "candidate",
    content:
      "Vector embeddings are dense numerical representations of data — like text, images, or other objects — in a high-dimensional space. Each piece of content gets mapped to a vector where similar items end up close together and dissimilar items are far apart. They're important because they allow us to perform semantic search instead of just keyword matching. In RAG applications, we embed both our knowledge base chunks and user queries, then find the most relevant content by computing cosine similarity between vectors.",
    timestamp: dayjs(baseTime).add(2, "minute").toISOString(),
  },
  {
    id: "msg-004",
    role: "agent",
    content:
      "Excellent explanation! You've clearly demonstrated a solid understanding of embeddings and their role in semantic search. Your mention of cosine similarity shows practical knowledge.\n\nLet's go deeper. **When building a RAG pipeline, how do you decide the optimal chunk size for your documents, and what are the trade-offs involved?**",
    timestamp: dayjs(baseTime).add(2, "minute").add(30, "second").toISOString(),
    questionIndex: 1,
    topic: "Embeddings & Vector Search",
  },
  {
    id: "msg-005",
    role: "candidate",
    content:
      "Chunk size is a critical decision in RAG systems. Too small and you lose context — the retrieved chunk might not contain enough information to generate a good answer. Too large and you waste token budget and might include irrelevant information that confuses the LLM.\n\nTypically, I start with 500-1000 tokens per chunk with 100-200 token overlap. The overlap ensures we don't lose important context at chunk boundaries. I also consider the nature of the content — technical documentation might need larger chunks to preserve code examples, while FAQ-style content works better with smaller chunks.\n\nThe best approach is to test empirically with your actual queries and measure retrieval quality.",
    timestamp: dayjs(baseTime).add(5, "minute").toISOString(),
  },
  {
    id: "msg-006",
    role: "agent",
    content:
      "Great practical insight! You've covered the key trade-offs well. Now let's shift to a different topic.\n\n**Can you describe the difference between zero-shot, few-shot, and chain-of-thought prompting? When would you choose each approach?**",
    timestamp: dayjs(baseTime).add(5, "minute").add(30, "second").toISOString(),
    questionIndex: 2,
    topic: "LLM Core, Prompting & Fine-Tuning",
  },
];

export const MOCK_QUESTIONS: InterviewQuestion[] = [
  {
    id: "q-001",
    question: "Can you explain what vector embeddings are and why they're important in modern AI applications?",
    topic: "Embeddings & Vector Search",
    difficulty: "easy",
    moduleRef: 3,
    expectedTopics: ["dense representations", "semantic search", "similarity", "high-dimensional space"],
  },
  {
    id: "q-002",
    question:
      "When building a RAG pipeline, how do you decide the optimal chunk size for your documents, and what are the trade-offs involved?",
    topic: "Embeddings & Vector Search",
    difficulty: "medium",
    moduleRef: 3,
    expectedTopics: ["chunk size", "overlap", "token budget", "retrieval quality"],
  },
  {
    id: "q-003",
    question:
      "Can you describe the difference between zero-shot, few-shot, and chain-of-thought prompting? When would you choose each approach?",
    topic: "LLM Core, Prompting & Fine-Tuning",
    difficulty: "medium",
    moduleRef: 4,
    expectedTopics: ["zero-shot", "few-shot", "chain-of-thought", "reasoning"],
  },
  {
    id: "q-004",
    question: "How would you implement a multi-agent system where each agent has a specialized domain?",
    topic: "Agentic AI & MCP",
    difficulty: "hard",
    moduleRef: 6,
    expectedTopics: ["router agent", "specialized agents", "orchestration", "delegation"],
  },
  {
    id: "q-005",
    question: "What security considerations should you address when deploying an LLM-powered application?",
    topic: "Evaluation, Security & Deployment",
    difficulty: "medium",
    moduleRef: 7,
    expectedTopics: ["prompt injection", "input validation", "data privacy", "guardrails"],
  },
];

export const MOCK_INTERVIEW_TOPICS = [
  "Embeddings & Vector Search",
  "LLM Core, Prompting & Fine-Tuning",
  "Chatbot Application Build",
  "Agentic AI & MCP",
  "Evaluation, Security & Deployment",
  "Production & Capstone",
];
