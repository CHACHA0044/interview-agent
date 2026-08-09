/*
========================================================

File:
services/provider.service.ts

Purpose:
Service layer for the LLM provider failover status endpoint.

Responsibilities:
- Derives the gateway /api/llm/status URL from the configured interview endpoint
- Fetches and validates the provider failover snapshot (active slot, rotations)

Connected Files:
- src/stores/settings.store.ts (endpoint + timeout config)
- src/hooks/use-provider-status.ts
- src/types/index.ts

Notes:
The status route is proxied by the gateway from ai-intelligence, so no internal
service address is ever exposed to the browser.

========================================================
*/

import type { ProviderStatus } from "@/types";
import { useSettingsStore } from "@/stores/settings.store";

export const PROVIDER_STATUS_POLL_MS = 4000;
const PROVIDER_STATUS_TIMEOUT_MS = 5000;

/** Derive the status endpoint from the configured /api/interview endpoint. */
function providerStatusEndpoint(): string {
  const endpoint = useSettingsStore.getState().apiEndpoint.trim();
  if (!endpoint) {
    throw new Error("API endpoint is not configured. Set it in the Settings page.");
  }
  const base = endpoint.replace(/\/api\/interview\/?$/, "").replace(/\/+$/, "");
  return `${base}/api/llm/status`;
}

/** Fetch the current provider failover snapshot from the gateway. */
export async function fetchProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch(providerStatusEndpoint(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(PROVIDER_STATUS_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Provider status request failed (HTTP ${response.status})`);
  }
  return (await response.json()) as ProviderStatus;
}
