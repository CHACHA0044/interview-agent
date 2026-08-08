/*
========================================================

File:
stores/settings.store.ts

Purpose:
Zustand store for runtime configuration (mock vs. live backend).

Responsibilities:
- Persists the "Use Mock Services" toggle and the gateway endpoint
- Provides the default gateway endpoint from VITE_API_BASE_URL
- Consumed by the Settings page and the interview service layer

Connected Files:
- src/pages/SettingsPage.tsx (consumer)
- src/services/interview.service.ts (branching consumer)
- src/types/index.ts

Depends On:
- zustand (persist middleware -> localStorage)

Notes:
Values are hydrated from localStorage on store creation, so saved
configuration is honored immediately on reload. Saving is explicit:
nothing is persisted until SettingsPage calls saveConfig.

========================================================
*/

import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://interview-agent-gateway.onrender.com";

export const DEFAULT_API_ENDPOINT = `${DEFAULT_API_BASE_URL}/api/interview`;

interface SettingsState {
  /** Use canned mock data instead of the real gateway. */
  useMockService: boolean;
  /** Full URL of the gateway /api/interview endpoint. */
  apiEndpoint: string;
  /** Persist a new configuration (called from the Settings page Save button). */
  saveConfig: (config: { useMockService: boolean; apiEndpoint: string }) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useMockService: true,
      apiEndpoint: DEFAULT_API_ENDPOINT,
      saveConfig: (config) => set(config),
    }),
    {
      name: "interview-agent-settings",
    }
  )
);
