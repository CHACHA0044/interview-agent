/*
========================================================

File:
stores/settings.store.ts

Purpose:
Zustand store for runtime backend configuration and interview floors.

Responsibilities:
- Persists the live gateway endpoint, request timeout, and retries
- Persists tunable interview floors (minQuestions, minCurriculumDays, followupBudget, followupMaxPerQuestion)
- Provides default values from env and technical spec
- Consumed by the Settings page and the interview service layer

Connected Files:
- src/pages/SettingsPage.tsx (consumer)
- src/services/interview.service.ts (consumer)
- src/types/index.ts

========================================================
*/

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://interview-agent-gateway.onrender.com";

export const DEFAULT_API_ENDPOINT = `${DEFAULT_API_BASE_URL}/api/interview`;

export const DEFAULT_MIN_QUESTIONS = 8;
export const DEFAULT_MIN_CURRICULUM_DAYS = 4;
export const DEFAULT_FOLLOWUP_BUDGET = 4;
export const DEFAULT_FOLLOWUP_MAX_PER_QUESTION = 2;

export interface InterviewFloorSettings {
  minQuestions: number;
  minCurriculumDays: number;
  followupBudget: number;
  followupMaxPerQuestion: number;
}

interface SettingsState extends InterviewFloorSettings {
  /** Full URL of the gateway /api/interview endpoint. */
  apiEndpoint: string;
  /** Timeout (ms) for live gateway requests. */
  requestTimeoutMs: number;
  /** Automatic retries for transient gateway failures (network / 5xx / 429). */
  maxRetries: number;
  /** Show live agent metadata in the interview debug panel. */
  showInternalMetadata: boolean;
  /** Persist a new configuration (called from the Settings page Save button). */
  saveConfig: (config: {
    apiEndpoint: string;
    requestTimeoutMs: number;
    maxRetries: number;
    minQuestions: number;
    minCurriculumDays: number;
    followupBudget: number;
    followupMaxPerQuestion: number;
  }) => void;
  /** Toggle the interview debug metadata panel. */
  setShowInternalMetadata: (show: boolean) => void;
}

export const DEFAULT_REQUEST_TIMEOUT_MS = 25000;
export const DEFAULT_MAX_RETRIES = 2;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiEndpoint: DEFAULT_API_ENDPOINT,
      requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
      maxRetries: DEFAULT_MAX_RETRIES,
      showInternalMetadata: false,
      minQuestions: DEFAULT_MIN_QUESTIONS,
      minCurriculumDays: DEFAULT_MIN_CURRICULUM_DAYS,
      followupBudget: DEFAULT_FOLLOWUP_BUDGET,
      followupMaxPerQuestion: DEFAULT_FOLLOWUP_MAX_PER_QUESTION,
      saveConfig: (config) => set(config),
      setShowInternalMetadata: (show) => set({ showInternalMetadata: show }),
    }),
    {
      name: "interview-agent-settings",
      version: 4,
      migrate: (persistedState) => {
        const raw = persistedState as Record<string, unknown>;
        const { useMockService: _useMockService, simulatedLatencyMs: _simulatedLatencyMs, ...rest } = raw;
        return {
          ...rest,
          apiEndpoint: (rest.apiEndpoint as string | undefined) ?? DEFAULT_API_ENDPOINT,
          requestTimeoutMs: (rest.requestTimeoutMs as number | undefined) ?? DEFAULT_REQUEST_TIMEOUT_MS,
          maxRetries: (rest.maxRetries as number | undefined) ?? DEFAULT_MAX_RETRIES,
          showInternalMetadata: (rest.showInternalMetadata as boolean | undefined) ?? false,
          minQuestions: (rest.minQuestions as number | undefined) ?? DEFAULT_MIN_QUESTIONS,
          minCurriculumDays: (rest.minCurriculumDays as number | undefined) ?? DEFAULT_MIN_CURRICULUM_DAYS,
          followupBudget: (rest.followupBudget as number | undefined) ?? DEFAULT_FOLLOWUP_BUDGET,
          followupMaxPerQuestion: (rest.followupMaxPerQuestion as number | undefined) ?? DEFAULT_FOLLOWUP_MAX_PER_QUESTION,
        } as unknown as SettingsState;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);
