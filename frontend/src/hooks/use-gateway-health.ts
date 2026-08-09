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
- Surfaces underlying network / CORS errors for live debugging

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
  lastError?: string | null;
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
    lastError: null,
  });

  useEffect(() => {
    let cancelled = false;
    const baseUrl = gatewayBaseUrl(apiEndpoint);

    const check = async () => {
      if (!baseUrl) {
        if (!cancelled) {
          setHealth((h) => ({
            ...h,
            status: "offline",
            storeType: "unknown",
            lastError: "Base URL is empty",
          }));
        }
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(6000),
        });
        if (cancelled) return;
        const body = (await response.json().catch(() => ({}))) as HealthCheck;
        const checks = body.checks ?? {};
        const storeType: GatewayStoreKind =
          checks.store === "redis" ? "redis" : checks.store === "in-memory" ? "in-memory" : "unknown";
        const ttlSeconds = Number(checks.ttl) > 0 ? Number(checks.ttl) : null;

        if (response.ok && body.status === "ok") {
          setHealth({
            status: "online",
            storeType,
            ttlSeconds,
            lastChecked: new Date().toISOString(),
            lastError: null,
          });
        } else {
          // Reachable but degraded — e.g. 503 when Redis is down and gateway uses in-memory store.
          setHealth({
            status: "degraded",
            storeType,
            ttlSeconds,
            lastChecked: new Date().toISOString(),
            lastError: `Gateway returned status ${response.status} (store: ${storeType})`,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn("[Gateway Health Probe Failed]:", err);
        if (!cancelled) {
          setHealth((h) => ({
            ...h,
            status: "offline",
            lastChecked: new Date().toISOString(),
            lastError: errorMsg.includes("abort")
              ? "Health request timed out (6s)"
              : `Network/CORS error: ${errorMsg}`,
          }));
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
