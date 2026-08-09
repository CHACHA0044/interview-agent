import { APP_NAME } from "@/constants";
import { LayoutContainer } from "@/components/layout/system";
import { useGatewayHealth } from "@/hooks/use-gateway-health";
import { cn } from "@/lib/cn";

export function AppFooter() {
  const { status, storeType } = useGatewayHealth();

  const indicator =
    status === "online"
      ? { dot: "bg-[#22C55E]", label: "Gateway online · Redis" }
      : status === "degraded"
        ? { dot: "bg-[#F59E0B]", label: "Gateway degraded · in-memory store" }
        : status === "offline"
          ? { dot: "bg-[#EF4444]", label: "Gateway unreachable" }
          : status === "unknown"
            ? { dot: "bg-[#F59E0B]", label: "Gateway status unknown · probe blocked" }
            : { dot: "bg-[#D4AF37]", label: "Checking gateway…" };

  return (
    <footer className="border-t border-[#1F1F1F] mt-16">
      <LayoutContainer size="dashboard" className="py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#737373]">
          <p>© 2026 {APP_NAME}. Enterprise AI Cohort Evaluation System.</p>
          <p className="flex items-center gap-2" title={`Keepalive self-ping active · session store: ${storeType}`}>
            <span className={cn("h-2 w-2 rounded-full", indicator.dot)} aria-hidden="true" />
            {indicator.label}
          </p>
        </div>
      </LayoutContainer>
    </footer>
  );
}
