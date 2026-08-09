/*
========================================================

File:
services/session.schedule.ts

Purpose:
Durable record of the most recent interview session so the TTL
countdown and Resume affordance survive a page reload within the
gateway's session window.

Responsibilities:
- Persist sessionId / candidateId / deadline / status to localStorage
- Read the record back on boot
- Clear the record on reset

Connected Files:
- src/stores/interview.store.ts
- src/pages/InterviewPage.tsx (TTL chip)
- src/pages/FeedbackPage.tsx (expiry card)

Depends On:
- src/constants (SESSION_SCHEDULE_STORAGE_KEY)

========================================================
*/

import { SESSION_SCHEDULE_STORAGE_KEY } from "@/constants";

export type SessionScheduleStatus = "IN_PROGRESS" | "COMPLETED";

export interface SessionSchedule {
  sessionId: string;
  candidateId: string;
  /** ISO timestamp when the gateway session expires. */
  deadline: string;
  status: SessionScheduleStatus;
}

export function readSessionSchedule(): SessionSchedule | null {
  try {
    const raw = window.localStorage.getItem(SESSION_SCHEDULE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionSchedule>;
    if (
      typeof parsed.sessionId === "string" &&
      typeof parsed.candidateId === "string" &&
      typeof parsed.deadline === "string"
    ) {
      return {
        sessionId: parsed.sessionId,
        candidateId: parsed.candidateId,
        deadline: parsed.deadline,
        status: parsed.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeSessionSchedule(schedule: SessionSchedule): void {
  try {
    window.localStorage.setItem(SESSION_SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch {
    // Storage unavailable (private mode / quota); the feature degrades to
    // session-only behavior.
  }
}

export function clearSessionSchedule(): void {
  try {
    window.localStorage.removeItem(SESSION_SCHEDULE_STORAGE_KEY);
  } catch {
    // Ignore storage failures on reset.
  }
}
