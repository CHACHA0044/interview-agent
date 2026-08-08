"""Realistic sample payloads for contract tests.

These fixtures mirror the examples in backend.md §8.1/§8.2 and the real
candidates.json / curriculum.json data. No LLM or Qdrant calls are made.
"""

from __future__ import annotations

CANDIDATE_001 = {
    "member": {
        "id": "CAND-001",
        "name": "Sarah Johnson",
        "jobRole": "Senior Data Engineer",
        "yearsExperience": 9,
        "education": "MS Computer Science",
        "status": "COMPLETED",
    },
    "missions": [
        {"day": 7, "title": "Embeddings Explained", "passed": True, "attempts": 1},
        {"day": 8, "title": "Vector Databases Overview", "passed": True, "attempts": 1},
        {"day": 12, "title": "Prompt Engineering Fundamentals", "passed": True, "attempts": 4},
        {"day": 29, "title": "Monitoring, Logging & Observability", "skipped": True},
    ],
    "signals": {"commitDays": 28, "missionsCompleted": 30, "missionsFirstTry": 20},
}

CANDIDATE_CONTEXT = {
    "candidateId": "CAND-001",
    "name": "Sarah Johnson",
    "role": "Senior Data Engineer",
    "tier": "strong",
    "strongDays": [7, 8, 10, 16, 22],
    "weakDays": [28],
    "failedDays": [],
    "skippedDays": [29],
}

CURRICULUM_CONTEXT = {
    "modules": [
        {"n": 3, "title": "Embeddings & Vector Search", "days": [7, 10]},
        {"n": 4, "title": "LLM Core, Prompting & Fine-Tuning", "days": [11, 15]},
    ],
    "days": {
        "7": {
            "day": 7,
            "title": "Embeddings Explained",
            "type": "CONCEPT",
            "tools": ["Chroma", "OpenAI"],
            "objectives": ["Explain dense embeddings", "Compare cosine similarity"],
        },
        "12": {
            "day": 12,
            "title": "Prompt Engineering Fundamentals",
            "type": "CONCEPT",
            "tools": [],
            "objectives": ["zero-shot", "few-shot", "chain-of-thought"],
        },
    },
    "plannedDays": [12, 7, 22, 27],
}

CONVERSATION = [
    {"role": "agent", "content": "Welcome Sarah. Let's begin your interview."},
    {"role": "candidate", "content": "Vector embeddings are dense numerical representations."},
]

QUESTION_STRATEGY = {
    "day": 12,
    "module": 4,
    "topic": "LLM Core, Prompting & Fine-Tuning",
    "difficulty": "medium",
    "concepts": ["zero-shot", "few-shot", "chain-of-thought"],
    "isFollowUp": False,
    "followUpOf": None,
}

FOLLOWUP_STRATEGY = {
    "day": 12,
    "difficulty": "hard",
    "previousAnswer": "Vector embeddings are dense numerical representations...",
    "weakConcepts": ["chain-of-thought"],
    "questionStrategy": QUESTION_STRATEGY,
}

RETRIEVED_CONTEXT = [
    {
        "day": 12,
        "title": "Prompt Engineering Fundamentals",
        "objectives": ["zero-shot", "few-shot", "chain-of-thought"],
        "tools": [],
        "score": 0.93,
    }
]

GENERATED_QUESTION = {
    "question": "Can you describe the difference between zero-shot, few-shot, and "
    "chain-of-thought prompting, and when you would choose each?",
    "type": "technical",
    "difficulty": "medium",
    "topic": "LLM Core, Prompting & Fine-Tuning",
    "day": 12,
    "expectedConcepts": ["zero-shot", "few-shot", "chain-of-thought", "reasoning"],
    "retrievedContext": RETRIEVED_CONTEXT,
}


# ---- Session fixtures -------------------------------------------------

SESSION_START = {
    "sessionId": "abc-123",
    "status": "active",
    "createdAt": "2026-08-08T10:00:00Z",
    "updatedAt": "2026-08-08T10:00:00Z",
    "candidate": CANDIDATE_001,
    "agentState": {"version": 1, "plan": [], "planIndex": 0, "followUpBudget": 4, "lastScores": []},
    "currentQuestion": {
        "questionId": "q-1",
        "type": "technical",
        "difficulty": "medium",
        "topic": "LLM Core, Prompting & Fine-Tuning",
        "day": 12,
        "followUpOf": None,
        "expectedConcepts": ["zero-shot", "few-shot", "chain-of-thought"],
    },
    "questionCount": 1,
    "daysAsked": [12],
    "conversation": [{"role": "agent", "content": "Welcome. Let's begin..."}],
    "scores": [],
    "topicScores": [],
    "finalFeedback": None,
}

SESSION_MID = {
    **SESSION_START,
    "updatedAt": "2026-08-08T10:12:00Z",
    "agentState": {"version": 1, "plan": [], "planIndex": 3, "followUpBudget": 2, "lastScores": [7.5, 8.0]},
    "currentQuestion": {
        "questionId": "q-3",
        "type": "technical",
        "difficulty": "medium",
        "topic": "Embeddings & Vector Search",
        "day": 7,
        "followUpOf": None,
        "expectedConcepts": ["cosine similarity", "semantic search"],
    },
    "questionCount": 3,
    "daysAsked": [12, 7],
    "conversation": CONVERSATION,
    "scores": [7.5, 8.0],
}

SESSION_COMPLETED = {
    **SESSION_MID,
    "status": "completed",
    "updatedAt": "2026-08-08T10:30:00Z",
    "agentState": {"version": 1, "status": "completed"},
    "questionCount": 8,
    "daysAsked": [7, 12, 22, 27],
    "scores": [8.0, 7.5, 9.0, 6.0],
    "finalFeedback": {
        "summary": "Demonstrated deep mastery in RAG and embeddings.",
        "strengths": ["Vector search", "Prompt tuning"],
        "gaps": ["Observability"],
        "next": ["Practice Prometheus setup"],
    },
}

# ---- Gateway → Agent fixtures -----------------------------------------

AGENT_START_REQUEST = {
    "sessionId": "abc-123",
    "candidate": CANDIDATE_001,
}

AGENT_START_RESPONSE = {
    "agentState": {"version": 1, "plan": [], "planIndex": 0, "followUpBudget": 4, "lastScores": []},
    "sessionView": {"questionCount": 1, "daysAsked": [12], "scores": [], "status": "active"},
    "reply": "Welcome, Sarah. Let's begin your technical interview...",
    "done": False,
    "question": {
        "questionId": "q-1",
        "type": "technical",
        "difficulty": "medium",
        "topic": "LLM Core, Prompting & Fine-Tuning",
        "day": 12,
        "followUpOf": None,
        "expectedConcepts": ["zero-shot", "few-shot", "chain-of-thought"],
    },
    "feedback": None,
}

AGENT_NEXT_REQUEST = {
    "sessionId": "abc-123",
    "candidate": CANDIDATE_001,
    "agentState": {"version": 1, "plan": [], "planIndex": 1, "followUpBudget": 4, "lastScores": []},
    "conversation": CONVERSATION,
    "currentQuestion": AGENT_START_RESPONSE["question"],
    "message": "Vector embeddings represent dense numerical representations...",
}

AGENT_NEXT_RESPONSE = {
    "agentState": {"version": 1, "plan": [], "planIndex": 2, "followUpBudget": 3, "lastScores": [7.5]},
    "sessionView": {"questionCount": 2, "daysAsked": [12], "scores": [7.5], "status": "active"},
    "reply": "Good, and when would you choose...?",
    "done": False,
    "question": {
        "questionId": "q-2",
        "type": "technical",
        "difficulty": "hard",
        "topic": "LLM Core, Prompting & Fine-Tuning",
        "day": 12,
        "followUpOf": "q-1",
        "expectedConcepts": ["reasoning"],
    },
    "feedback": None,
}

AGENT_FOLLOWUP_REQUEST = AGENT_NEXT_REQUEST
AGENT_FOLLOWUP_RESPONSE = AGENT_NEXT_RESPONSE

AGENT_NEXT_RESPONSE_LATE = {
    "agentState": {
        "version": 1,
        "plan": [],
        "planIndex": 9,
        "followUpBudget": 1,
        "lastScores": [8.0, 7.5, 9.0, 6.0, 7.0, 8.5, 6.5, 9.0, 8.0],
        "coverage": {"7": 0.8, "12": 0.75, "22": 0.9, "27": 0.5, "29": 0.4},
    },
    "sessionView": {
        "questionCount": 9,
        "daysAsked": [7, 12, 22, 27, 29],
        "scores": [8.0, 7.5, 9.0, 6.0, 7.0, 8.5, 6.5, 9.0, 8.0],
        "status": "active",
    },
    "reply": "Thanks — a few more questions to finish the assessment.",
    "done": False,
    "question": {
        "questionId": "q-9",
        "type": "technical",
        "difficulty": "hard",
        "topic": "Monitoring, Logging & Observability",
        "day": 29,
        "followUpOf": "q-8",
        "expectedConcepts": ["structured logging", "Prometheus", "Grafana"],
    },
    "feedback": None,
}

SESSION_DEEP_MID = {
    **SESSION_MID,
    "updatedAt": "2026-08-08T10:40:00Z",
    "agentState": AGENT_NEXT_RESPONSE_LATE["agentState"],
    "currentQuestion": AGENT_NEXT_RESPONSE_LATE["question"],
    "questionCount": 9,
    "daysAsked": [7, 12, 22, 27, 29],
    "scores": AGENT_NEXT_RESPONSE_LATE["sessionView"]["scores"],
}

AGENT_COMPLETE_REQUEST = {
    "sessionId": "abc-123",
    "agentState": {
        "version": 1,
        "plan": [],
        "planIndex": 8,
        "followUpBudget": 1,
        "lastScores": [8.0, 7.5, 9.0, 6.0],
        "coverage": {"7": 0.8, "12": 0.75, "22": 0.9, "27": 0.5},
    },
}

AGENT_COMPLETE_RESPONSE = {
    "agentState": {"version": 1, "status": "completed"},
    "sessionView": {
        "questionCount": 8,
        "daysAsked": [7, 12, 22, 27],
        "scores": [8.0, 7.5, 9.0, 6.0],
        "status": "completed",
    },
    "reply": "Interview completed.",
    "done": True,
    "feedback": SESSION_COMPLETED["finalFeedback"],
}

HEALTH_RESPONSE = {"status": "ok", "service": "interview-gateway"}

# ---- Agent → AI fixtures ----------------------------------------------

GENERATE_QUESTION_REQUEST = {
    "candidateContext": CANDIDATE_CONTEXT,
    "curriculumContext": CURRICULUM_CONTEXT,
    "conversation": CONVERSATION,
    "questionStrategy": QUESTION_STRATEGY,
    "retrievalQuery": "prompt engineering zero-shot few-shot chain-of-thought",
}

GENERATE_FOLLOWUP_REQUEST = {
    "candidateContext": CANDIDATE_CONTEXT,
    "curriculumContext": CURRICULUM_CONTEXT,
    "conversation": CONVERSATION,
    "followUpStrategy": FOLLOWUP_STRATEGY,
}

EVALUATION = {
    "score": 7.5,
    "conceptCoverage": 0.8,
    "technicalAccuracy": 0.75,
    "depth": 0.7,
    "strengths": ["zero-shot", "few-shot"],
    "gaps": ["chain-of-thought"],
    "followUpRequired": True,
    "notes": "Strong on zero-shot/few-shot; chain-of-thought reasoning only implied.",
}

EVALUATE_ANSWER_REQUEST = {
    "question": GENERATED_QUESTION,
    "candidateContext": CANDIDATE_CONTEXT,
    "retrievedContext": RETRIEVED_CONTEXT,
    "candidateAnswer": "Vector embeddings are dense numerical representations...",
}

GENERATE_FEEDBACK_REQUEST = {
    "candidate": CANDIDATE_001,
    "candidateContext": CANDIDATE_CONTEXT,
    "evaluations": [
        {"questionId": "q-1", "score": 8.0, "day": 12, "gaps": [], "strengths": ["Vector search"]},
        {"questionId": "q-4", "score": 5.0, "day": 29, "gaps": ["Observability"], "strengths": []},
    ],
    "coverage": {"7": 0.8, "12": 0.75, "22": 0.9, "27": 0.5},
    "missedConcepts": {"12": ["chain-of-thought"], "29": ["Prometheus"]},
    "topicScores": [
        {"module": 4, "topic": "LLM Core, Prompting & Fine-Tuning", "score": 7.5, "maxScore": 10, "notes": "..."}
    ],
}

RETRIEVE_CONTEXT_REQUEST = {
    "query": "vector embeddings semantic search cosine similarity",
    "day": 7,
    "module": None,
    "topic": "Embeddings & Vector Search",
    "candidateContext": CANDIDATE_CONTEXT,
    "topK": 3,
}

RETRIEVE_CONTEXT_RESPONSE = {
    "context": [
        {
            "day": 7,
            "title": "Embeddings Explained",
            "objectives": ["Explain dense embeddings"],
            "tools": ["Chroma"],
            "score": 0.93,
        }
    ],
    "source": "qdrant",
}
