/*
========================================================

File:
services/interview.service.ts

Purpose:
Service layer for interview session operations.

Responsibilities:
- Starts new interview sessions (mock or live gateway)
- Sends candidate messages and receives agent responses
- Ends interviews and retrieves feedback
- Branches on runtime settings: mock mode uses canned data, live
  mode POSTs to the gateway /api/interview endpoint.

Connected Files:
- src/mock/interview.ts (mock mode data source)
- src/mock/feedback.ts (mock mode feedback data)
- src/stores/settings.store.ts (mock/live toggle + endpoint)
- src/types/index.ts
- src/stores/interview.store.ts

Depends On:
- src/mock/interview.ts
- src/mock/feedback.ts
- src/stores/settings.store.ts
- src/types/index.ts
- dayjs

Notes:
Live mode implements the contract from technical-spec.md / agent_api.json:
- startInterview sends  { sessionId, candidate }
- sendMessage sends    { sessionId, message }
Both parse the real { reply, done, feedback } response. Mock mode keeps
the original simulated latency and canned responses.

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
import { useSettingsStore } from "@/stores/settings.store";
import dayjs from "dayjs";

/** Real feedback received from the gateway, keyed by sessionId (live mode). */
const liveFeedbackBySession = new Map<string, InterviewFeedback>();

/** Candidate id per live session, captured at start for feedback mapping. */
const liveCandidateBySession = new Map<string, string>();

let questionIndex = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMockMode(): boolean {
  return useSettingsStore.getState().useMockService;
}

function mockLatency(): number {
  return useSettingsStore.getState().simulatedLatencyMs;
}

function requestTimeoutMs(): number {
  return useSettingsStore.getState().requestTimeoutMs;
}

function liveEndpoint(): string {
  const endpoint = useSettingsStore.getState().apiEndpoint.trim();
  if (!endpoint) {
    throw new Error("API endpoint is not configured. Set it in the Settings page.");
  }
  return endpoint;
}

async function postTurn(body: {
  sessionId: string;
  candidate?: Candidate;
  message?: string;
}): Promise<ApiInterviewResponse> {
  const response = await fetch(liveEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(requestTimeoutMs()),
  });

  if (!response.ok) {
    throw new Error(await describeHttpError(response));
  }

  return (await response.json()) as ApiInterviewResponse;
}

async function describeHttpError(response: Response): Promise<string> {
  let detail = `HTTP ${response.status}`;
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      const bodyDetail = record.detail;
      if (typeof bodyDetail === "string" && bodyDetail) {
        detail = bodyDetail;
      } else if (bodyDetail) {
        detail = JSON.stringify(bodyDetail);
      } else {
        const error = record.error as Record<string, unknown> | undefined;
        if (error && typeof error.message === "string") {
          detail = error.message;
        }
      }
    }
  } catch {
    // Non-JSON error body; keep the status-only detail.
  }
  return `Interview service request failed (${detail})`;
}

function toInterviewFeedback(
  feedback: NonNullable<ApiInterviewResponse["feedback"]>,
  sessionId: string,
  candidateId: string
): InterviewFeedback {
  // The public gateway contract exposes summary/strengths/gaps/next only.
  // Derive the composite score from the backend's own summary (e.g. "averaging
  // 7.4/10") when available; otherwise fall back to 0.
  const scoreMatch = feedback.summary.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  const rawScore = scoreMatch?.[1];
  const derivedScore = rawScore ? Math.round(Number(rawScore) * 10) : 0;

  return {
    sessionId,
    candidateId,
    summary: feedback.summary,
    overallScore: Math.min(100, Math.max(0, derivedScore)),
    strengths: feedback.strengths ?? [],
    gaps: feedback.gaps ?? [],
    next: feedback.next ?? [],
    topicScores: [],
    generatedAt: dayjs().toISOString(),
  };
}

export async function startInterview(
  candidate: Candidate,
  _config?: { questionCount?: number; focusTopics?: string[] }
): Promise<{ session: InterviewSession; response: ApiInterviewResponse }> {
  if (isMockMode()) {
    await delay(mockLatency());
    questionIndex = 0;
  }

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

  if (isMockMode()) {
    const response: ApiInterviewResponse = {
      reply: `Welcome, ${candidate.member.name}! I'm your AI interviewer for the Enterprise AI Cohort assessment. I'll be asking you a series of technical questions based on the curriculum you completed.\n\nLet me start with your first question:\n\n**${MOCK_QUESTIONS[0]?.question ?? "Tell me about your experience with the cohort."}**`,
      done: false,
    };

    return { session, response };
  }

  const response = await postTurn({ sessionId, candidate });
  liveCandidateBySession.set(sessionId, candidate.member.id);
  return { session, response };
}

export async function sendMessage(
  request: ApiInterviewRequest
): Promise<ApiInterviewResponse> {
  if (isMockMode()) {
    await delay(mockLatency() + Math.random() * 1000);
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

  const response = await postTurn({
    sessionId: request.sessionId,
    message: request.message,
  });

  if (response.done && response.feedback) {
    liveFeedbackBySession.set(
      request.sessionId,
      toInterviewFeedback(
        response.feedback,
        request.sessionId,
        liveCandidateBySession.get(request.sessionId) ?? ""
      )
    );
  }

  return response;
}

export async function getInterviewFeedback(
  sessionId: string
): Promise<InterviewFeedback | null> {
  if (isMockMode()) {
    await delay(mockLatency());
    return MOCK_FEEDBACK;
  }
  return liveFeedbackBySession.get(sessionId) ?? null;
}

export async function endInterview(
  sessionId: string
): Promise<InterviewFeedback | null> {
  if (isMockMode()) {
    await delay(mockLatency());
    return MOCK_FEEDBACK;
  }
  return liveFeedbackBySession.get(sessionId) ?? null;
}
