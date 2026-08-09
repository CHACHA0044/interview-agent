import { useProviderStatus } from "@/hooks/use-provider-status";
import { cn } from "@/lib/cn";

/**
 * Live LLM provider failover indicator.
 *
 * Green  - primary Groq key serving
 * Amber  - rotated slot serving (Cerebras or an alternate Groq key)
 * Red    - every provider exhausted, FakeLLM fallback is active
 * Gray   - status not yet available
 */
export function ProviderStatusBadge({
  className,
}: {
  className?: string;
}) {
  const { status, isDegraded, activeSlot } = useProviderStatus();

  const state = !status?.active_slot
    ? "idle"
    : isDegraded
      ? "degraded"
      : activeSlot === "Groq key 1"
        ? "healthy"
        : "rotated";

  const dotColor =
    state === "degraded"
      ? "bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.7)]"
      : state === "rotated"
        ? "bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.7)]"
        : state === "healthy"
          ? "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.7)]"
          : "bg-[#525252]";

  const label =
    state === "degraded"
      ? "FakeLLM fallback"
      : state === "idle"
        ? status
          ? `LLM (${status.provider})`
          : "LLM status…"
        : activeSlot;

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-[#141414] px-3 py-2 rounded-xl border font-mono text-[11px]",
        state === "degraded" ? "border-[#EF4444]/40 text-[#F87171]" : "border-[#222222] text-[#D4AF37]",
        className
      )}
      title={
        state === "degraded"
          ? "All Groq keys and Cerebras are rate-limited — deterministic fallback is serving responses"
          : state === "rotated"
            ? `Serving from ${activeSlot} after a provider rotation`
            : `Serving from ${activeSlot}`
      }
    >
      <span className={cn("h-2 w-2 rounded-full", dotColor, state !== "idle" && "animate-pulse")} />
      <span className="truncate">{label}</span>
    </div>
  );
}
