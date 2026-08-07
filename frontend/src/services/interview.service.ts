/*
========================================================

File:
services/interview.service.ts

Purpose:
Service layer for interview session operations.

Responsibilities:
- Starts new interview sessions (mock)
- Sends candidate messages and receives agent responses
- Ends interviews and retrieves feedback
- Simulates realistic agent response delays

Connected Files:
- src/mock/interview.ts (data source)
- src/mock/feedback.ts (feedback data)
- src/types/index.ts
- src/stores/interview.store.ts
- src/hooks/use-interview.ts

Depends On:
- src/mock/interview.ts
- src/mock/feedback.ts
- src/types/index.ts
- dayjs

Notes:
The sendMessage function simulates agent "thinking" with a delay.
Replace with POST /api/interview calls when backend is ready.

========================================================
*/

import type {
  ApiInterviewRequest,
  ApiInterviewResponse,
  Candidate,
  InterviewFeedback,
  InterviewSession,
} from "@/types";
import { MOCK_FEEDBACK, MOCK_QUESTIONS } from "@/mock";
import { INTERVIEW_CONFIG } from "@/constants";
import dayjs from "dayjs";

const SIMULATED_DELAY = 1200;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let questionIndex = 0;

export async function startInterview(
  candidate: Candidate,
  _config?: { questionCount?: number; focusTopics?: string[] }
): Promise<{ session: InterviewSession; response: ApiInterviewResponse }> {
  await delay(SIMULATED_DELAY);
  questionIndex = 0;

  const sessionId = `session-${Date.now()}`;

  const session: InterviewSession = {
    sessionId,
    candidateId: candidate.member.id,
    candidate,
    status: "IN_PROGRESS",
    startedAt: dayjs().toISOString(),
    questionCount: INTERVIEW_CONFIG.MAX_QUESTIONS,
    currentQuestionIndex: 0,
    topicsCovered: [],
    duration: 0,
  };

  const response: ApiInterviewResponse = {
    reply: `Welcome, ${candidate.member.name}! I'm your AI interviewer for the Enterprise AI Cohort assessment. I'll be asking you a series of technical questions based on the curriculum you completed.\n\nLet me start with your first question:\n\n**${MOCK_QUESTIONS[0]?.question ?? "Tell me about your experience with the cohort."}**`,
    done: false,
  };

  return { session, response };
}

export async function sendMessage(
  _request: ApiInterviewRequest
): Promise<ApiInterviewResponse> {
  await delay(SIMULATED_DELAY + Math.random() * 1000);
  questionIndex++;

  if (questionIndex >= MOCK_QUESTIONS.length) {
    return {
      reply:
        "Thank you for completing the interview! You've demonstrated a strong understanding across the assessed topics. I'm now generating your detailed feedback report.",
      done: true,
      feedback: {
        summary: MOCK_FEEDBACK.summary,
        strengths: MOCK_FEEDBACK.strengths,
        gaps: MOCK_FEEDBACK.gaps,
        next: MOCK_FEEDBACK.next,
      },
    };
  }

  const nextQuestion = MOCK_QUESTIONS[questionIndex];
  const responses = [
    `Great answer! Your understanding of the topic is solid. Let me ask you about a related concept.\n\n**${nextQuestion?.question}**`,
    `Interesting perspective. I can see you've applied this in practice. Let's move on.\n\n**${nextQuestion?.question}**`,
    `Thank you for that detailed response. Now let's explore a different area.\n\n**${nextQuestion?.question}**`,
    `Well explained! Your practical experience clearly shows. Next question:\n\n**${nextQuestion?.question}**`,
  ];

  return {
    reply: responses[questionIndex % responses.length] ?? responses[0]!,
    done: false,
  };
}

export async function getInterviewFeedback(
  _sessionId: string
): Promise<InterviewFeedback> {
  await delay(SIMULATED_DELAY);
  return MOCK_FEEDBACK;
}

export async function endInterview(
  _sessionId: string
): Promise<InterviewFeedback> {
  await delay(SIMULATED_DELAY);
  return MOCK_FEEDBACK;
}
