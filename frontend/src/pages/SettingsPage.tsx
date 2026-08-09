import { useState } from "react";
import { Settings, Server, Save, Activity, AlertTriangle, Trash2, Bug, Sliders } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings.store";
import { useInterviewStore } from "@/stores/interview.store";
import { useGatewayHealth } from "@/hooks/use-gateway-health";
import { clearSessionCache } from "@/services/interview.service";
import { clearSessionSchedule } from "@/services/session.schedule";
import { LayoutContainer, Section, PageHeading, Surface, Stack, Cluster } from "@/components/layout/system";
import { cn } from "@/lib/cn";

const healthVisual = {
  checking: { dot: "bg-[#D4AF37]", label: "Checking Gateway Health", text: "Probing the gateway /health endpoint…" },
  online: { dot: "bg-[#22C55E]", label: "Online · Redis", text: "Healthy keepalive — sessions are durable in Redis." },
  degraded: { dot: "bg-[#F59E0B]", label: "Degraded · In-Memory Store", text: "Reachable, but Redis is down. Sessions survive only until the gateway restarts." },
  offline: { dot: "bg-[#EF4444]", label: "Offline / Unreachable", text: "The gateway could not be reached from the browser." },
} as const;

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

  const visual = healthVisual[health.status];

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
              <Server className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Backend API Configuration</h2>
            </div>

            <Stack gap="md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#171717] border border-[#262626]">
                <div>
                  <span className="text-sm font-semibold text-white block">Use Mock Services</span>
                  <span className="text-xs text-[#737373]">Mock services removed — using live backend only.</span>
                </div>
                <label
                  title="Mock services removed — using live backend only."
                  className="relative inline-flex items-center cursor-not-allowed touch-target"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    aria-label="Mock services (removed)"
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-[#262626] rounded-full peer-disabled:opacity-40 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0A0A0A] after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              <div className="space-y-2">
                <label htmlFor="endpoint" className="text-xs font-medium text-[#A3A3A3] block">
                  HTTP Target Endpoint
                </label>
                <Input
                  id="endpoint"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                />
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
              <Activity className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">Gateway Health & Keepalive</h2>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#171717] border border-[#262626]">
              <span className={cn("mt-1 h-3 w-3 rounded-full shrink-0", visual.dot)} aria-hidden="true" />
              <Stack gap="xs" className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{visual.label}</span>
                  <Badge
                    variant={health.status === "online" ? "success" : health.status === "degraded" ? "warning" : health.status === "offline" ? "danger" : "gold"}
                    className="text-[10px]"
                  >
                    {health.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#737373] leading-relaxed">{visual.text}</p>
                {health.lastError ? (
                  <p className="text-[11px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 p-2.5 rounded-lg font-mono leading-relaxed">
                    Diagnostic: {health.lastError}
                    {health.status === "offline" && (
                      <span className="block text-[10px] text-[#F87171] mt-1 font-sans">
                        Note: If the backend is running on Render, ensure FRONTEND_ORIGINS on Render includes your Vercel frontend URL to allow cross-origin health checks.
                      </span>
                    )}
                  </p>
                ) : null}
                <p className="text-[10px] font-mono text-[#525252]">
                  session store: {health.storeType}
                  {health.ttlSeconds ? ` · session TTL: ${Math.round(health.ttlSeconds / 60)}m` : ""}
                  {" · keepalive self-ping: active"}
                </p>
              </Stack>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#171717] border border-[#262626]">
              <div className="flex items-start gap-3">
                <Bug className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-white block">Debug Metadata Panel</span>
                  <span className="text-xs text-[#737373]">
                    Show live agent metadata (question day, difficulty, follow-up budget, scores) in the interview view.
                  </span>
                </div>
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
