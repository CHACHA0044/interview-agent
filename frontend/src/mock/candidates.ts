/*
========================================================

File:
mock/candidates.ts

Purpose:
Mock candidate data for development and testing.

Responsibilities:
- Provides realistic candidate data from the hackathon dataset
- Simulates backend /candidates API response
- Used by candidate-related services and components

Connected Files:
- src/services/candidate.service.ts (consumes this data)
- src/types/index.ts (Candidate type)
- candidates.json (source data)

Depends On:
- src/types/index.ts

Notes:
This data is sourced from the provided candidates.json.
Replace with API calls when backend is ready.

========================================================
*/

import type { Candidate } from "@/types";

export const MOCK_CANDIDATES: Candidate[] = [
  {
    member: {
      id: "CAND-001",
      name: "Sarah Johnson",
      jobRole: "Senior Data Engineer",
      yearsExperience: 9,
      education: "MS Computer Science",
      status: "COMPLETED",
    },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
      { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 2 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 4 },
      { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
      { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 2 },
      { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 3 },
      { day: 29, title: "Monitoring, Logging & Observability", skipped: true },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 },
    ],
    signals: { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 },
  },
  {
    member: {
      id: "CAND-003",
      name: "Emily Chen",
      jobRole: "AI Engineer",
      yearsExperience: 6,
      education: "MS Artificial Intelligence",
      status: "COMPLETED",
    },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
      { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 1 },
      { day: 11, title: "RAG End-to-End & LLM API Basics", passed: true, attempts: 1 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 1 },
      { day: 13, title: "Function Calling & Structured Outputs", passed: true, attempts: 1 },
      { day: 21, title: "LangChain Agents", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 1 },
      { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 1 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 },
    ],
    signals: { commitDays: 31, missionsCompleted: 31, missionsFirstTry: 30 },
  },
  {
    member: {
      id: "CAND-005",
      name: "Michael Brown",
      jobRole: "DevOps Engineer",
      yearsExperience: 10,
      education: "B.Tech Information Technology",
      status: "COMPLETED",
    },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 2 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 2 },
      { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 2 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 4 },
      { day: 18, title: "Streaming Responses", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
      { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 3 },
      { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 1 },
      { day: 29, title: "Monitoring, Logging & Observability", passed: true, attempts: 1 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 },
    ],
    signals: { commitDays: 30, missionsCompleted: 31, missionsFirstTry: 22 },
  },
  {
    member: {
      id: "CAND-007",
      name: "Ethan Brooks",
      jobRole: "Computer Science Intern",
      yearsExperience: 0,
      education: "BS Computer Science (in progress)",
      status: "COMPLETED",
    },
    missions: [
      { day: 1, title: "VS Code & Python Environment Setup", passed: true, attempts: 1 },
      { day: 3, title: "First AI Project, React Frontend & GitHub", passed: true, attempts: 1 },
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 2 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 1 },
      { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 1 },
      { day: 27, title: "Security, Privacy & Guardrails", skipped: true },
      { day: 28, title: "Docker & Kubernetes Deployment", skipped: true },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 2 },
    ],
    signals: { commitDays: 26, missionsCompleted: 27, missionsFirstTry: 22 },
  },
  {
    member: {
      id: "CAND-009",
      name: "Zara Ahmadi",
      jobRole: "AI Engineer",
      yearsExperience: 1,
      education: "BS Computer Science",
      status: "COMPLETED",
    },
    missions: [
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 1 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 1 },
      { day: 10, title: "Retrieval & Matching Engine", passed: true, attempts: 1 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 1 },
      { day: 13, title: "Function Calling & Structured Outputs", passed: true, attempts: 1 },
      { day: 21, title: "LangChain Agents", passed: true, attempts: 1 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 1 },
      { day: 23, title: "Model Context Protocol (MCP)", passed: true, attempts: 1 },
      { day: 27, title: "Security, Privacy & Guardrails", passed: true, attempts: 1 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 },
    ],
    signals: { commitDays: 31, missionsCompleted: 31, missionsFirstTry: 29 },
  },
  {
    member: {
      id: "CAND-013",
      name: "Ravi Patel",
      jobRole: "Software Engineer",
      yearsExperience: 15,
      education: "MS Computer Science",
      status: "COMPLETED",
    },
    missions: [
      { day: 1, title: "VS Code & Python Environment Setup", passed: true, attempts: 3 },
      { day: 4, title: "Reading & Processing Structured Data", passed: true, attempts: 2 },
      { day: 7, title: "Embeddings Explained", passed: true, attempts: 3 },
      { day: 8, title: "Vector Databases Overview", passed: true, attempts: 2 },
      { day: 12, title: "Prompt Engineering Fundamentals", passed: true, attempts: 3 },
      { day: 16, title: "Chatbot Backend & API Integration", passed: true, attempts: 2 },
      { day: 22, title: "Multi-Agent Orchestration", passed: true, attempts: 2 },
      { day: 27, title: "Security, Privacy & Guardrails", passed: true, attempts: 1 },
      { day: 28, title: "Docker & Kubernetes Deployment", passed: true, attempts: 1 },
      { day: 31, title: "Capstone Project & Final Demo", passed: true, attempts: 1 },
    ],
    signals: { commitDays: 27, missionsCompleted: 30, missionsFirstTry: 13 },
  },
];
