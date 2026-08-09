/*
========================================================

File:
stores/settings.store.ts

Purpose:
Zustand store for runtime backend configuration.

Responsibilities:
- Persists the live gateway endpoint and request timeout
- Provides the default gateway endpoint from VITE_API_BASE_URL
- Consumed by the Settings page and the interview service layer

Connected Files:
- src/pages/SettingsPage.tsx (consumer)
- src/services/interview.service.ts (consumer)
- src/types/index.ts

Depends On:
- zustand (persist middleware -> localStorage)

Notes:
Values are hydrated from localStorage on store creation, so saved
configuration is honored immediately on reload. Saving is explicit:
nothing is persisted until SettingsPage calls saveConfig.

Mock services were removed — the backend gateway is the only data source,
so this store no longer exposes a mock toggle or simulated latency.

========================================================
*/

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://interview-agent-gateway.onrender.com";

export const DEFAULT_API_ENDPOINT = `${DEFAULT_API_BASE_URL}/api/interview`;

interface SettingsState {
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
      saveConfig: (config) => set(config),
      setShowInternalMetadata: (show) => set({ showInternalMetadata: show }),
    }),
    {
      name: "interview-agent-settings",
      version: 3,
      migrate: (persistedState) => {
        const raw = persistedState as Record<string, unknown>;
        // v1 persisted mock-era fields (useMockService, simulatedLatencyMs)
        // that no longer exist; drop them so the store re-seeds live defaults.
        const { useMockService: _useMockService, simulatedLatencyMs: _simulatedLatencyMs, ...rest } = raw;
        // v2 -> v3 seeds the newly added runtime fields with their defaults.
        return {
          ...rest,
          apiEndpoint: (rest.apiEndpoint as string | undefined) ?? DEFAULT_API_ENDPOINT,
          requestTimeoutMs: (rest.requestTimeoutMs as number | undefined) ?? DEFAULT_REQUEST_TIMEOUT_MS,
          maxRetries: (rest.maxRetries as number | undefined) ?? DEFAULT_MAX_RETRIES,
          showInternalMetadata: (rest.showInternalMetadata as boolean | undefined) ?? false,
        } as unknown as SettingsState;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);
