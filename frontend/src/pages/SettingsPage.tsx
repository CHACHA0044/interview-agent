import { useState } from "react";
import { Settings, Server, Save } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settings.store";
import { LayoutContainer, Section, PageHeading, Surface, Stack, LayoutGrid } from "@/components/layout/system";

export function SettingsPage() {
  const settings = useSettingsStore();
  const [apiEndpoint, setApiEndpoint] = useState(settings.apiEndpoint);
  const [useMockService, setUseMockService] = useState(settings.useMockService);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState(settings.requestTimeoutMs);
  const [simulatedLatencyMs, setSimulatedLatencyMs] = useState(settings.simulatedLatencyMs);

  const handleSave = () => {
    settings.saveConfig({ useMockService, apiEndpoint, requestTimeoutMs, simulatedLatencyMs });
    toast.success("Settings updated successfully");
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
            description="Configure runtime behavior, backend integration mode, and interview execution endpoints."
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
                  <span className="text-xs text-[#737373]">Simulate backend responses and latency locally.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer touch-target">
                  <input
                    type="checkbox"
                    checked={useMockService}
                    onChange={(e) => setUseMockService(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#262626] rounded-full peer peer-checked:bg-[#D4AF37] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0A0A0A] after:rounded-full after:h-5 after:w-5 after:transition-all" />
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
                  disabled={useMockService}
                />
              </div>

              <LayoutGrid gap="md">
                <div className="col-span-4 md:col-span-4 xl:col-span-4 space-y-2">
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
                    disabled={useMockService}
                  />
                  <p className="text-[10px] text-[#737373]">Abort live gateway calls that exceed this window.</p>
                </div>

                <div className="col-span-4 md:col-span-4 xl:col-span-4 space-y-2">
                  <label htmlFor="latency" className="text-xs font-medium text-[#A3A3A3] block">
                    Simulated Latency (ms)
                  </label>
                  <Input
                    id="latency"
                    type="number"
                    min={0}
                    step={100}
                    value={simulatedLatencyMs}
                    onChange={(e) => setSimulatedLatencyMs(Math.max(0, Number(e.target.value) || 0))}
                    disabled={!useMockService}
                  />
                  <p className="text-[10px] text-[#737373]">Per-response delay applied in mock mode.</p>
                </div>
              </LayoutGrid>
            </Stack>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Configuration
              </Button>
            </div>
          </Surface>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
