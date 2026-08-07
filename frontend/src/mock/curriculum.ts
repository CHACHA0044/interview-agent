/*
========================================================

File:
mock/curriculum.ts

Purpose:
Mock curriculum data for the Enterprise AI Cohort.

Responsibilities:
- Provides curriculum modules and day-by-day content
- Simulates backend /curriculum API response
- Used by interview setup and topic selection

Connected Files:
- src/services/curriculum.service.ts
- src/types/index.ts (Curriculum type)
- curriculum.json (source data)

Depends On:
- src/types/index.ts

Notes:
Sourced from curriculum.json. Replace with API calls when backend is ready.

========================================================
*/

import type { Curriculum } from "@/types";

export const MOCK_CURRICULUM: Curriculum = {
  cohort: "AI Cohort · 31 days · 8 modules",
  modules: [
    { n: 1, title: "Environment & Tooling", days: [1, 3] },
    { n: 2, title: "Data Foundations", days: [4, 6] },
    { n: 3, title: "Embeddings & Vector Search", days: [7, 10] },
    { n: 4, title: "LLM Core, Prompting & Fine-Tuning", days: [11, 15] },
    { n: 5, title: "Chatbot Application Build", days: [16, 20] },
    { n: 6, title: "Agentic AI & MCP", days: [21, 24] },
    { n: 7, title: "Evaluation, Security & Deployment", days: [25, 28] },
    { n: 8, title: "Production & Capstone", days: [29, 31] },
  ],
  days: [
    {
      day: 7,
      title: "Embeddings Explained",
      type: "AI_CORE",
      tools: ["Sentence Transformers", "OpenAI Embeddings", "Scikit-learn", "Matplotlib"],
      objectives: [
        "Understand how text is converted into vector embeddings",
        "Generate embeddings for every knowledge base chunk",
        "Store embeddings alongside the original documents",
        "Visualize embedding clusters using PCA",
        "Analyze whether similar concepts cluster together",
      ],
    },
    {
      day: 8,
      title: "Vector Databases Overview",
      type: "BUILD",
      tools: ["ChromaDB", "Pinecone"],
      objectives: [
        "Learn the role of vector databases in RAG applications",
        "Set up a local Chroma vector database",
        "Create a cloud-based Pinecone index for comparison",
        "Compare local and managed vector database solutions",
        "Select the most suitable database for the chatbot project",
      ],
    },
    {
      day: 10,
      title: "The Retrieval & Matching Engine",
      type: "SHIP_IT",
      tools: ["SQLite", "ChromaDB", "Python"],
      objectives: [
        "Build a query router that decides between SQL, vector search, or hybrid retrieval",
        "Implement structured data lookup",
        "Implement semantic retrieval from the vector database",
        "Merge and deduplicate results from multiple retrieval sources",
        "Evaluate retrieval accuracy",
      ],
    },
    {
      day: 12,
      title: "Prompt Engineering Fundamentals",
      type: "LEARN",
      tools: ["LLMs", "Prompt Templates"],
      objectives: [
        "Understand zero-shot, few-shot, and chain-of-thought prompting",
        "Design multiple system prompt variations",
        "Compare prompts based on accuracy, compliance, and tone",
        "Evaluate prompt performance using a fixed question set",
        "Finalize the production-ready system prompt",
      ],
    },
    {
      day: 16,
      title: "Chatbot Backend & API Integration",
      type: "BUILD",
      tools: ["FastAPI", "SQLite", "Python"],
      objectives: [
        "Create a /chat API endpoint",
        "Integrate retrieval, function calling, and LLM response generation",
        "Implement session-based conversation management",
        "Build a conversation history endpoint",
        "Test the complete backend API",
      ],
    },
    {
      day: 22,
      title: "Multi-Agent Orchestration",
      type: "BUILD",
      tools: ["CrewAI", "LangGraph", "Python"],
      objectives: [
        "Create specialized agents for different domains",
        "Build a router agent that delegates requests",
        "Implement a complete multi-agent workflow",
        "Compare multi-agent performance with single-agent architecture",
        "Identify scenarios where multiple agents provide benefits",
      ],
    },
    {
      day: 23,
      title: "Model Context Protocol (MCP)",
      type: "BUILD",
      tools: ["MCP Python SDK", "Claude Desktop", "Cline", "Python"],
      objectives: [
        "Understand the purpose of the Model Context Protocol",
        "Build an MCP server exposing chatbot tools",
        "Connect the MCP server to an MCP-compatible client",
        "Expose multiple capabilities through standardized MCP tools",
        "Verify successful tool execution through live MCP interactions",
      ],
    },
    {
      day: 28,
      title: "Docker & Kubernetes Deployment",
      type: "SHIP_IT",
      tools: ["Docker", "Kubernetes", "FastAPI", "React"],
      objectives: [
        "Containerize the backend and frontend using Docker",
        "Deploy the application to a Kubernetes cluster",
        "Configure health checks and environment variables",
        "Verify the deployed application functions correctly",
        "Prepare the application for production hosting",
      ],
    },
    {
      day: 31,
      title: "Capstone Project & Final Demo",
      type: "CAPSTONE",
      tools: ["FastAPI", "React", "LangChain", "MCP", "Docker", "Kubernetes"],
      objectives: [
        "Demonstrate the complete enterprise chatbot",
        "Showcase retrieval, RAG, agents, MCP, and conversation memory",
        "Present the deployed application with production architecture",
        "Evaluate using real-world scenarios",
        "Publish the final project with source code and documentation",
      ],
    },
  ],
};
