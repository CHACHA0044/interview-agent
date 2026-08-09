/*
========================================================

File:
hooks/use-provider-status.ts

Purpose:
Poll the gateway LLM provider status and surface failover rotations.

Responsibilities:
- Polls /api/llm/status on a fixed interval while mounted
- Tracks the highest rotation seq already toasted (dedup across polls)
- Fires sonner toasts when the failover chain rotates or reaches FakeLLM

Connected Files:
- src/services/provider.service.ts
- src/types/index.ts

Notes:
Only the *latest* rotations are diffed via `seq`, so a fast chain like
"Groq key 1 -> Cerebras -> FakeLLM" surfaces as two toasts, not a flood.

========================================================
*/

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProviderRotation, ProviderStatus } from "@/types";
import { fetchProviderStatus, PROVIDER_STATUS_POLL_MS } from "@/services/provider.service";

function formatRetryAfter(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? ` · retry ~${m}m ${s}s` : ` · retry ~${m}m`;
  }
  return ` · retry ~${Math.round(seconds)}s`;
}

function notifyRotation(rotation: ProviderRotation): void {
  const isFake = rotation.to === "FakeLLM";
  const exhausted = rotation.reason === "all_providers_exhausted";

  if (isFake || exhausted) {
    toast.error("All providers exhausted", {
      description: "Every Groq key and Cerebras are rate-limited. Deterministic fallback is now serving responses.",
      duration: 6000,
    });
    return;
  }

  const reasonLabel =
    rotation.reason === "rate_limit" ? "rate limited" : rotation.reason ?? "error";
  toast.warning(`Provider switched: ${rotation.from} → ${rotation.to}`, {
    description: `${rotation.to} is now handling requests (${reasonLabel}${formatRetryAfter(rotation.retry_after_seconds)}).`,
    duration: 5000,
  });
}

export function useProviderStatus(): {
  status: ProviderStatus | null;
  isDegraded: boolean;
  activeSlot: string | null;
} {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const seenSeq = useRef(0);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;

    async function poll(): Promise<void> {
      try {
        const data = await fetchProviderStatus();
        if (disposed) return;
        setStatus(data);

        for (const rotation of data.rotations ?? []) {
          if (rotation.seq > seenSeq.current) {
            seenSeq.current = rotation.seq;
            notifyRotation(rotation);
          }
        }
      } catch {
        // Gateway unreachable or status not proxied — stay silent; the badge
        // simply shows nothing rather than spamming connection errors.
      }
    }

    void poll();
    timer = window.setInterval(() => void poll(), PROVIDER_STATUS_POLL_MS);

    return () => {
      disposed = true;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  const isDegraded =
    status?.fake_active === true ||
    status?.all_exhausted === true ||
    status?.active_slot === "FakeLLM";

  return {
    status,
    isDegraded,
    activeSlot: status?.active_slot ?? null,
  };
}
