/*
========================================================

File:
hooks/use-gateway-health.ts

Purpose:
Shared, polling gateway health indicator — the visual home for
the keepalive/self-ping status.

Responsibilities:
- Polls the gateway /health endpoint on a cadence
- Derives online / degraded / offline / unknown state
- Exposes the session store kind (redis vs in-memory) and gateway session TTL
- Distinguishes client-side extension blockers (ERR_BLOCKED_BY_CLIENT / Brave Shields) from CORS or network timeouts
- Falls back to alternate endpoints / no-cors probes so a client-side block of the
  /health path is reported honestly (green "online" when verified via another endpoint,
  amber "unknown" when it cannot be verified) instead of a red "offline" badge

========================================================
*/

import { useEffect, useState } from "react";
import { GATEWAY_HEALTH_POLL_MS } from "@/constants";
import { useSettingsStore } from "@/stores/settings.store";

export type GatewayHealthStatus = "checking" | "online" | "degraded" | "offline" | "unknown";
export type GatewayStoreKind = "redis" | "in-memory" | "unknown";
/** Outcome of the fallback probe when the primary /health fetch is blocked or ambiguous. */
export type GatewayHealthProbe = "readable" | "reachable" | "none";

export interface GatewayHealth {
  status: GatewayHealthStatus;
  storeType: GatewayStoreKind;
  ttlSeconds: number | null;
  lastChecked: string | null;
  lastError?: string | null;
  isBlockedByClient?: boolean;
  probe?: GatewayHealthProbe;
}

interface HealthCheck {
  status?: string;
  checks?: Record<string, string>;
}

const HEALTH_REQUEST_TIMEOUT_MS = 6000;
const HEALTH_PROBE_TIMEOUT_MS = 5000;

function gatewayBaseUrl(endpoint: string): string {
  return endpoint.replace(/\/api\/interview\/?$/, "");
}

/** True when the request was sent but produced no response within the timeout. */
function isTimeoutError(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err);
  return name === "TimeoutError" || /abort/i.test(msg);
}

/** Explicit client-side block signal (e.g. net::ERR_BLOCKED_BY_CLIENT). */
function hasClientBlockSignal(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /BLOCKED_BY_CLIENT|blocked by/i.test(msg);
}

/**
 * Explicit network-level failure markers — the request reached the network layer
 * and failed for a real reason (connection refused / DNS / TLS / offline).
 * Intentionally does NOT include "Failed to fetch" / TypeError / ERR_BLOCKED_*,
 * which are ambiguous between a genuine outage and a client-side blocker.
 */
function hasRealNetworkFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /ERR_CONNECTION|ERR_NAME_NOT_RESOLVED|ERR_ADDRESS|ERR_NETWORK_CHANGED|ERR_INTERNET|ERR_SSL|ERR_CERT|ERR_HTTP2|ERR_QUIC|connection refused|connection reset|network unreachable|network is unreachable/i.test(
    msg
  );
}

/**
 * Fallback probes used when the primary /health fetch is blocked or ambiguous.
 *
 * Returns:
 * - "readable": an alternate gateway endpoint returned a readable response — the
 *   gateway process is genuinely up (only the /health path is being blocked).
 * - "reachable": an opaque no-cors request (or image load) got a response from the
 *   gateway — it is up, but the health payload itself cannot be read.
 * - "none": nothing got through; we cannot distinguish a block from an outage.
 */
async function probeGateway(baseUrl: string): Promise<GatewayHealthProbe> {
  const altEndpoints = [`${baseUrl}/api/llm/status`, `${baseUrl}/`];
  for (const url of altEndpoints) {
    try {
      await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
      });
      // Any HTTP response — including 404/5xx — proves the gateway answered.
      return "readable";
    } catch {
      // blocked or unreachable — try the next probe
    }
  }

  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
    });
    // An opaque response resolves only when the server actually responded.
    if (res.type === "opaque") return "reachable";
  } catch {
    // blocked or unreachable
  }

  // Some extensions let image subresources through when they block fetch().
  try {
    const imageOk = await new Promise<boolean>((resolve) => {
      const img = new Image();
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        img.onload = null;
        img.onerror = null;
        resolve(ok);
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
      window.setTimeout(() => done(false), HEALTH_PROBE_TIMEOUT_MS);
      img.src = `${baseUrl}/favicon.ico`;
    });
    if (imageOk) return "reachable";
  } catch {
    // ignore
  }

  return "none";
}

export function useGatewayHealth(pollMs: number = GATEWAY_HEALTH_POLL_MS): GatewayHealth {
  const apiEndpoint = useSettingsStore((state) => state.apiEndpoint);
  const [health, setHealth] = useState<GatewayHealth>({
    status: "checking",
    storeType: "unknown",
    ttlSeconds: null,
    lastChecked: null,
    lastError: null,
    isBlockedByClient: false,
    probe: "none",
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
            isBlockedByClient: false,
            probe: "none",
          }));
        }
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS),
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
            isBlockedByClient: false,
            probe: "none",
          });
        } else {
          // Reachable but degraded — e.g. 503 when Redis is down and gateway uses in-memory store.
          setHealth({
            status: "degraded",
            storeType,
            ttlSeconds,
            lastChecked: new Date().toISOString(),
            lastError: `Gateway returned status ${response.status} (store: ${storeType})`,
            isBlockedByClient: false,
            probe: "none",
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorName = err instanceof Error ? err.name : "";

        console.warn("[Gateway Health Probe Failed]:", err);
        if (cancelled) return;

        // 1) Request was sent but produced no response — real network failure.
        if (isTimeoutError(err)) {
          setHealth((h) => ({
            ...h,
            status: "offline",
            lastChecked: new Date().toISOString(),
            isBlockedByClient: false,
            probe: "none",
            lastError: "Health request timed out (6s)",
          }));
          return;
        }

        // 2) Explicit network-level failure (connection refused / DNS / TLS …).
        if (hasRealNetworkFailure(err)) {
          setHealth((h) => ({
            ...h,
            status: "offline",
            lastChecked: new Date().toISOString(),
            isBlockedByClient: false,
            probe: "none",
            lastError: `Network error: ${errorMsg}`,
          }));
          return;
        }

        // 3) Client-side block (Brave Shields / ad blockers) or an ambiguous
        //    "Failed to fetch" that could be a block or a genuine network error.
        const clearBlockSignal = hasClientBlockSignal(err);
        const ambiguous =
          !clearBlockSignal &&
          (errorMsg.includes("Failed to fetch") ||
            errorMsg.includes("NetworkError when attempting to fetch resource") ||
            errorMsg.includes("Network request failed") ||
            errorMsg.includes("Load failed") ||
            errorName === "TypeError");

        if (clearBlockSignal || ambiguous) {
          const probe = await probeGateway(baseUrl);
          if (cancelled) return;

          if (probe === "readable") {
            // An alternate endpoint answered — the gateway is genuinely up;
            // only the /health path itself is being blocked.
            setHealth((h) => ({
              ...h,
              status: "online",
              storeType: "unknown",
              ttlSeconds: null,
              lastChecked: new Date().toISOString(),
              isBlockedByClient: true,
              probe,
              lastError:
                "Health probe blocked by browser extension; gateway verified reachable via alternate endpoint.",
            }));
            return;
          }

          if (probe === "reachable") {
            setHealth((h) => ({
              ...h,
              status: "unknown",
              lastChecked: new Date().toISOString(),
              isBlockedByClient: true,
              probe,
              lastError: clearBlockSignal
                ? "Health probe blocked by browser extension; backend reachable via fallback probe."
                : "Health check could not be read; backend reachable via fallback probe.",
            }));
            return;
          }

          // Nothing got through — we cannot distinguish a block from an outage.
          setHealth((h) => ({
            ...h,
            status: "unknown",
            lastChecked: new Date().toISOString(),
            isBlockedByClient: clearBlockSignal,
            probe: "none",
            lastError: clearBlockSignal
              ? "Health probe blocked by browser extension (status unknown from this browser)."
              : "Could not verify backend status from this browser.",
          }));
          return;
        }

        // 4) Unclassified failure — stay honest rather than claiming a definite outage.
        setHealth((h) => ({
          ...h,
          status: "unknown",
          lastChecked: new Date().toISOString(),
          isBlockedByClient: false,
          probe: "none",
          lastError: `Health check failed: ${errorMsg}`,
        }));
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
