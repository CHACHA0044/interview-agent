/*
========================================================

File:
services/interview.service.ts

Purpose:
Service layer for interview session operations against the live gateway.

Responsibilities:
- Starts new interview sessions via the gateway /api/interview endpoint
- Sends candidate messages and receives agent responses
- Caches the real feedback returned by the gateway per session

Connected Files:
- src/stores/settings.store.ts (endpoint + timeout config)
- src/types/index.ts
- src/stores/interview.store.ts

Depends On:
- src/stores/settings.store.ts
- src/types/index.ts
- dayjs

Notes:
Implements the contract from technical-spec.md / agent_api.json:
- startInterview sends  { sessionId, candidate }
- sendMessage sends    { sessionId, message }
Both parse the real { reply, done, feedback } response. No mock fallbacks:
request failures throw and surface as real error states.

========================================================
*/

import type {
  ApiInterviewRequest,
  ApiInterviewResponse,
  Candidate,
  InterviewFeedback,
  InterviewSession,
} from "@/types";
import { INTERVIEW_CONFIG } from "@/constants";
import { useSettingsStore } from "@/stores/settings.store";
import dayjs from "dayjs";

/** Real feedback received from the gateway, keyed by sessionId. */
const liveFeedbackBySession = new Map<string, InterviewFeedback>();

/** Candidate id per session, captured at start for feedback mapping. */
const liveCandidateBySession = new Map<string, string>();

const FEEDBACK_STORAGE_KEY = "interview-agent-feedback";

/** Drop cached live feedback and candidate mappings (danger-zone reset). */
export function clearSessionCache(): void {
  liveFeedbackBySession.clear();
  liveCandidateBySession.clear();
  try {
    window.localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  } catch {
    // Ignore storage failures on reset.
  }
}

/**
 * Hydrate the last completed feedback across reloads so the session expiry /
 * resume affordances survive a refresh within the gateway TTL window.
 */
export function readPersistedFeedback(sessionId?: string): InterviewFeedback | null {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InterviewFeedback | null;
    if (!parsed || (sessionId && parsed.sessionId !== sessionId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistFeedback(feedback: InterviewFeedback): void {
  try {
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
  } catch {
    // Non-fatal: storage unavailable (private mode / quota).
  }
}

function requestTimeoutMs(): number {
  return useSettingsStore.getState().requestTimeoutMs;
}

function maxRetries(): number {
  return useSettingsStore.getState().maxRetries;
}

function liveEndpoint(): string {
  const endpoint = useSettingsStore.getState().apiEndpoint.trim();
  if (!endpoint) {
    throw new Error("API endpoint is not configured. Set it in the Settings page.");
  }
  return endpoint;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function postTurn(body: {
  sessionId: string;
  candidate?: Candidate;
  message?: string;
  interviewConfig?: {
    minQuestions?: number;
    minCurriculumDays?: number;
    followupBudget?: number;
    followupMaxPerQuestion?: number;
  };
}): Promise<ApiInterviewResponse> {
  const timeoutMs = requestTimeoutMs();
  const retries = Math.max(0, maxRetries());
  const endpoint = liveEndpoint();

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Network / timeout failures are transient; retry with a small backoff.
      if (attempt < retries) {
        await delay(250 * (attempt + 1));
        continue;
      }
      throw err instanceof Error
        ? err
        : new Error("Interview service request failed");
    }

    if (response.ok) {
      return (await response.json()) as ApiInterviewResponse;
    }

    const message = await describeHttpError(response);
    // Client errors are deterministic — never retry them. Server pressure and
    // rate limiting get another chance.
    const retryable = response.status >= 500 || response.status === 429;
    if (retryable && attempt < retries) {
      await delay(250 * (attempt + 1));
      continue;
    }
    throw new Error(message);
  }
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
  const sessionId = `session-${Date.now()}`;
  const settingsState = useSettingsStore.getState();

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

  const response = await postTurn({
    sessionId,
    candidate,
    interviewConfig: {
      minQuestions: settingsState.minQuestions,
      minCurriculumDays: settingsState.minCurriculumDays,
      followupBudget: settingsState.followupBudget,
      followupMaxPerQuestion: settingsState.followupMaxPerQuestion,
    },
  });
  liveCandidateBySession.set(sessionId, candidate.member.id);
  return { session, response };
}

export async function sendMessage(
  request: ApiInterviewRequest
): Promise<ApiInterviewResponse> {
  const response = await postTurn({
    sessionId: request.sessionId,
    message: request.message,
  });

  if (response.done && response.feedback) {
    const feedback = toInterviewFeedback(
      response.feedback,
      request.sessionId,
      liveCandidateBySession.get(request.sessionId) ?? ""
    );
    liveFeedbackBySession.set(request.sessionId, feedback);
    persistFeedback(feedback);
  }

  return response;
}

export async function getInterviewFeedback(
  sessionId: string
): Promise<InterviewFeedback | null> {
  return liveFeedbackBySession.get(sessionId) ?? null;
}

export async function endInterview(
  sessionId: string
): Promise<InterviewFeedback | null> {
  return liveFeedbackBySession.get(sessionId) ?? null;
}
