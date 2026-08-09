/*
========================================================

File:
hooks/use-gateway-health.ts

Purpose:
Shared, polling gateway health indicator — the visual home for
the keepalive/self-ping status.

Responsibilities:
- Polls the gateway /health endpoint on a cadence
- Derives online / degraded / offline state
- Exposes the session store kind (redis vs in-memory) and the
  gateway session TTL so UI can explain a degraded deployment

Connected Files:
- src/components/layout/AppFooter.tsx
- src/pages/SettingsPage.tsx
- src/pages/LandingPage.tsx
- src/pages/InterviewPage.tsx (TTL sync)

Depends On:
- react (useEffect, useState)
- src/stores/settings.store.ts (apiEndpoint)
- src/constants (GATEWAY_HEALTH_POLL_MS)

Notes:
"degraded" means the gateway is reachable but serving from the
in-memory session store (Redis is down). In that mode the gateway's
keepalive self-ping keeps a single container awake, but sessions are
not durable across gateway restarts.

========================================================
*/

import { useEffect, useState } from "react";
import { GATEWAY_HEALTH_POLL_MS } from "@/constants";
import { useSettingsStore } from "@/stores/settings.store";

export type GatewayHealthStatus = "checking" | "online" | "degraded" | "offline";
export type GatewayStoreKind = "redis" | "in-memory" | "unknown";

export interface GatewayHealth {
  status: GatewayHealthStatus;
  storeType: GatewayStoreKind;
  ttlSeconds: number | null;
  lastChecked: string | null;
}

interface HealthCheck {
  status?: string;
  checks?: Record<string, string>;
}

function gatewayBaseUrl(endpoint: string): string {
  return endpoint.replace(/\/api\/interview\/?$/, "");
}

export function useGatewayHealth(pollMs: number = GATEWAY_HEALTH_POLL_MS): GatewayHealth {
  const apiEndpoint = useSettingsStore((state) => state.apiEndpoint);
  const [health, setHealth] = useState<GatewayHealth>({
    status: "checking",
    storeType: "unknown",
    ttlSeconds: null,
    lastChecked: null,
  });

  useEffect(() => {
    let cancelled = false;
    const baseUrl = gatewayBaseUrl(apiEndpoint);

    const check = async () => {
      if (!baseUrl) {
        if (!cancelled) setHealth((h) => ({ ...h, status: "offline", storeType: "unknown" }));
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (cancelled) return;
        const body = (await response.json().catch(() => ({}))) as HealthCheck;
        const checks = body.checks ?? {};
        const storeType: GatewayStoreKind =
          checks.store === "redis" ? "redis" : checks.store === "in-memory" ? "in-memory" : "unknown";
        const ttlSeconds = Number(checks.ttl) > 0 ? Number(checks.ttl) : null;
        if (response.ok && body.status === "ok") {
          setHealth({ status: "online", storeType, ttlSeconds, lastChecked: new Date().toISOString() });
        } else {
          // Reachable but not healthy — e.g. 503 when Redis is down and the
          // gateway has fallen back to the in-memory session store.
          setHealth({ status: "degraded", storeType, ttlSeconds, lastChecked: new Date().toISOString() });
        }
      } catch {
        if (!cancelled) {
          setHealth((h) => ({ ...h, status: "offline", lastChecked: new Date().toISOString() }));
        }
      }
    };

    setHealth((h) => ({ ...h, status: "checking" }));
    void check();
    const id = window.setInterval(() => void check(), pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [apiEndpoint, pollMs]);

  return health;
}
