import { useEffect, useRef, useState } from "react";
import { Settings, Server, Save, Activity, AlertTriangle, Trash2, Bug, Sliders, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useGatewayHealth, type GatewayHealth } from "@/hooks/use-gateway-health";
import { clearSessionCache } from "@/services/interview.service";
import { clearSessionSchedule } from "@/services/session.schedule";
import { LayoutContainer, Section, PageHeading, Surface, Stack, Cluster } from "@/components/layout/system";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

interface HealthVisual {
  dot: string;
  label: string;
  text: string;
}

function resolveHealthVisual(health: GatewayHealth): HealthVisual {
  const { status, storeType } = health;
  const isRedis = storeType === "redis";

  if (status === "checking") {
    return {
      dot: "bg-[#D4AF37]",
      label: "Checking Gateway Health",
      text: "Probing the gateway /health endpoint…",
    };
  }

  if (status === "offline") {
    return {
      dot: "bg-[#EF4444]",
      label: "Offline / Unreachable",
      text: "The gateway could not be reached from the browser.",
    };
  }

  if (status === "unknown") {
    return {
      dot: "bg-[#F59E0B]",
      label: "Status Unknown · Probe Blocked",
      text: health.isBlockedByClient
        ? "The health probe was blocked client-side by a browser extension or Brave Shield. The gateway may be reachable, but its live status cannot be verified from this browser."
        : "Could not verify gateway status from this browser — it may be blocked or unreachable.",
    };
  }

  const storeLabel = isRedis ? " · Redis" : storeType === "in-memory" ? " · In-Memory Store" : "";

  if (status === "online") {
    return {
      dot: "bg-[#22C55E]",
      label: `Online${storeLabel}`,
      text: isRedis
        ? "Healthy keepalive — sessions are durable in Redis."
        : "Healthy keepalive — sessions live in the in-memory store and reset when the gateway restarts.",
    };
  }

  return {
    dot: "bg-[#F59E0B]",
    label: `Degraded${storeLabel}`,
    text: isRedis
      ? "Reachable, but Redis is down — sessions fall back to the in-memory store until it recovers."
      : "Reachable, but the session store is degraded — sessions survive only until the gateway restarts.",
  };
}

export function SettingsPage() {
  const settings = useSettingsStore();
  const [apiEndpoint, setApiEndpoint] = useState(settings.apiEndpoint);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(settings.requestTimeoutMs);
  const [maxRetries, setMaxRetries] = useState(settings.maxRetries);

  // Tunable Interview Floors
  const [minQuestions, setMinQuestions] = useState(settings.minQuestions);
  const [minCurriculumDays, setMinCurriculumDays] = useState(settings.minCurriculumDays);
  const [followupBudget, setFollowupBudget] = useState(settings.followupBudget);
  const [followupMaxPerQuestion, setFollowupMaxPerQuestion] = useState(settings.followupMaxPerQuestion);

  const showInternalMetadata = settings.showInternalMetadata;
  const health = useGatewayHealth();

  const handleSave = () => {
    settings.saveConfig({
      apiEndpoint,
      requestTimeoutMs,
      maxRetries,
      minQuestions: Math.max(8, Math.min(12, minQuestions)),
      minCurriculumDays: Math.max(3, Math.min(5, minCurriculumDays)),
      followupBudget: Math.max(2, Math.min(6, followupBudget)),
      followupMaxPerQuestion: Math.max(1, Math.min(3, followupMaxPerQuestion)),
    });
    toast.success("Settings updated successfully");
  };

  const handleClearInterviewData = () => {
    useInterviewStore.getState().reset();
    clearSessionCache();
    clearSessionSchedule();
    toast.success("Interview data cleared");
  };

  const handleToggleDebug = (show: boolean) => {
    settings.setShowInternalMetadata(show);
  };

  const visual = resolveHealthVisual(health);

  const prefersReducedMotion = useReducedMotion();

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyEndpoint = () => {
    if (copied) return;
    navigator.clipboard
      .writeText(apiEndpoint)
      .then(() => {
        setCopied(true);
        toast.success("Endpoint copied to clipboard");
        if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Could not copy endpoint");
      });
  };

  return (
    <PageTransition>
      <Section density="tight">
        <LayoutContainer size="form" className="stack stack-lg">
          <PageHeading
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Settings className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                Runtime Configuration
              </Badge>
            }
            title="System Settings"
            description="Configure runtime behavior, interview execution floors, and backend integration endpoints."
          />

          <Surface padding="lg" className="stack stack-md">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Activity className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Gateway Health & Keepalive</h2>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#171717] border border-[#262626]">
              <span className={cn("mt-1 h-3 w-3 rounded-full shrink-0", visual.dot)} aria-hidden="true" />
              <Stack gap="xs" className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{visual.label}</span>
                  <Badge
                    variant={health.status === "online" ? "success" : health.status === "offline" ? "danger" : health.status === "unknown" || health.status === "degraded" ? "warning" : "gold"}
                    className="text-[10px]"
                  >
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">{visual.text}</p>
                {health.lastError ? (
                  health.isBlockedByClient ? (
                    <div className="p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] text-[#F3E5AB] leading-relaxed">
                      <span className="font-semibold block text-[#D4AF37] mb-0.5">
                        Client Blocker Detected (AdBlock / Brave Shield):
                      </span>
                      The health probe was blocked client-side by a browser extension or Brave Shield.
                      Try disabling shields for this domain if you want live status polling.
                      <span className="block text-[10px] text-[#A3A3A3] mt-1 font-mono">
                        Interview functionality (start, turns, evaluation) operates on API endpoints and remains fully functional.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 p-2.5 rounded-lg font-mono leading-relaxed">
                      Diagnostic: {health.lastError}
                      {health.status === "offline" && (
                        <span className="block text-[10px] text-[#F87171] mt-1 font-sans">
                          Note: If the backend is running on Render, ensure FRONTEND_ORIGINS on Render includes your Vercel frontend URL.
                        </span>
                      )}
                    </p>
                  )
                ) : null}
                <p className="text-[10px] font-mono text-[#525252]">
                  session store: {health.storeType}
                  {health.ttlSeconds ? ` · session TTL: ${Math.round(health.ttlSeconds / 60)}m` : ""}
                  {" · keepalive self-ping: active"}
                </p>
              </Stack>
            </div>
          </Surface>

          <Surface padding="lg" className="stack stack-md">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Server className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Backend API Configuration</h2>
            </div>

            <Stack gap="md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-xl bg-[#171717] border border-[#262626]">
                <div>
                  <span className="text-sm font-semibold text-white block">Backend Mode</span>
                  <span className="text-xs text-[#737373]">Mock services removed — the app talks directly to the live gateway.</span>
                </div>
                <Badge variant="gold" className="text-[10px] font-mono w-fit">
                  LIVE ONLY
                </Badge>
              </div>

              <div className="space-y-2">
                <label htmlFor="endpoint" className="text-xs font-medium text-[#A3A3A3] block">
                  HTTP Target Endpoint
                </label>
                <div className="relative">
                  <Input
                    id="endpoint"
                    className="pr-12"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                  />
                  <motion.button
                    type="button"
                    onClick={handleCopyEndpoint}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.12 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    aria-label={copied ? "Endpoint copied" : "Copy endpoint"}
                    title="Copy endpoint"
                    className={cn(
                      "absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-200",
                      copied
                        ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]"
                        : "border-[#262626] bg-[#171717] text-[#D4AF37] hover:border-[#D4AF37]/50 hover:bg-[#1F1F1F]"
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.4, rotate: 30 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                          className="flex"
                        >
                          <Check className="h-4 w-4" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, scale: 0.4, rotate: 30 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.4, rotate: -30 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                          className="flex"
                        >
                          <Copy className="h-4 w-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                <p className="text-[10px] text-[#737373]">
                  Base URL of the Interview Agent Gateway (POST /api/interview).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="timeout" className="text-xs font-medium text-[#A3A3A3] block">
                    Request Timeout (ms)
                  </label>
                  <Input
                    id="timeout"
                    type="number"
                    min={1000}
                    step={500}
                    value={requestTimeoutMs}
                    onChange={(e) => setRequestTimeoutMs(Math.max(1000, Number(e.target.value) || 0))}
                  />
                  <p className="text-[10px] text-[#737373]">Abort live gateway calls that exceed this window.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="retries" className="text-xs font-medium text-[#A3A3A3] block">
                    Max Request Retries
                  </label>
                  <Input
                    id="retries"
                    type="number"
                    min={0}
                    max={5}
                    step={1}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Math.max(0, Math.min(5, Math.round(Number(e.target.value) || 0))))}
                  />
                  <p className="text-[10px] text-[#737373]">
                    Automatic retries for transient failures (network, 5xx, 429).
                  </p>
                </div>
              </div>
            </Stack>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Configuration
              </Button>
            </div>
          </Surface>

          <Surface padding="lg" className="stack stack-md">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Sliders className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Configurable Interview Floors</h2>
            </div>
            <p className="text-xs text-[#A3A3A3]">
              Tune execution parameters within verified bounds. Defaults match production standards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="min-q" className="text-xs font-semibold text-white block">
                    Minimum Questions
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">{minQuestions}</span>
                </div>
                <Input
                  id="min-q"
                  type="number"
                  min={8}
                  max={12}
                  value={minQuestions}
                  onChange={(e) => setMinQuestions(Number(e.target.value))}
                />
                <p className="text-[10px] text-[#737373]">Range: 8–12. Hard minimum floor before interview completion.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="min-days" className="text-xs font-semibold text-white block">
                    Minimum Curriculum Days
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">{minCurriculumDays}</span>
                </div>
                <Input
                  id="min-days"
                  type="number"
                  min={3}
                  max={5}
                  value={minCurriculumDays}
                  onChange={(e) => setMinCurriculumDays(Number(e.target.value))}
                />
                <p className="text-[10px] text-[#737373]">Range: 3–5. Minimum distinct curriculum days required.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="followup-budget" className="text-xs font-semibold text-white block">
                    Follow-up Budget
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">{followupBudget}</span>
                </div>
                <Input
                  id="followup-budget"
                  type="number"
                  min={2}
                  max={6}
                  value={followupBudget}
                  onChange={(e) => setFollowupBudget(Number(e.target.value))}
                />
                <p className="text-[10px] text-[#737373]">Range: 2–6. Maximum total follow-ups allowed across session.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="max-per-q" className="text-xs font-semibold text-white block">
                    Max Follow-ups per Question
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">{followupMaxPerQuestion}</span>
                </div>
                <Input
                  id="max-per-q"
                  type="number"
                  min={1}
                  max={3}
                  value={followupMaxPerQuestion}
                  onChange={(e) => setFollowupMaxPerQuestion(Number(e.target.value))}
                />
                <p className="text-[10px] text-[#737373]">Range: 1–3. Max probing attempts on a single primary question.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Floors
              </Button>
            </div>
          </Surface>

          <Surface padding="lg" className="stack stack-md">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Bug className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Debug Metadata Panel</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#171717] border border-[#262626]">
              <div className="flex items-start gap-3">
                <span className="text-xs text-[#737373]">
                  Show live agent metadata (question day, difficulty, follow-up budget, scores) in the interview view.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer touch-target">
                <input
                  type="checkbox"
                  checked={showInternalMetadata}
                  onChange={(e) => handleToggleDebug(e.target.checked)}
                  aria-label="Debug metadata panel"
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-[#262626] rounded-full peer-checked:bg-[#D4AF37]/80 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0A0A0A] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </Surface>

          <Surface padding="lg" className="stack stack-md border-[#EF4444]/30">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
              <h2 className="text-base font-bold text-white">Danger Zone</h2>
            </div>

            <Cluster gap="md" className="items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-white block">Clear Interview Data</span>
                <p className="text-[11px] text-[#737373]">
                  Reset the in-memory session, cached feedback, and any saved session schedule. Does not touch configuration.
                </p>
              </div>
              <Button variant="danger" onClick={handleClearInterviewData} icon={<Trash2 className="h-4 w-4" />}>
                Clear Data
              </Button>
            </Cluster>
          </Surface>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
