/*
========================================================

File:
pages/SettingsPage.tsx

Purpose:
System settings and environment configuration page.

Responsibilities:
- Toggle between mock services and live backend API endpoints
- Configure HTTP target endpoint for interview agent
- Save settings with toast confirmation

Connected Files:
- src/app/router.tsx (route: /settings)

Depends On:
- react
- lucide-react
- sonner

Notes:
Adheres to Black & Gold design system. All controls use dark surfaces.

========================================================
*/

import { useState } from "react";
import { Settings, Server, Save } from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { toast } from "sonner";

export function SettingsPage() {
  const [apiEndpoint, setApiEndpoint] = useState("/api/interview");
  const [useMockService, setUseMockService] = useState(true);

  const handleSave = () => {
    toast.success("Settings updated successfully");
  };

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-10">
        <div className="border-b border-[#262626] pb-8 space-y-2">
          <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
            <Settings className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
            Runtime Configuration
          </Badge>
          <h1 className="text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            System Settings
          </h1>
          <p className="text-sm text-[#A3A3A3]">
            Configure application runtime settings, backend integrations, and evaluation behaviors.
          </p>
        </div>

        <Card variant="default" className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
            <Server className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="text-base font-bold text-[#FFFFFF]">Backend API Configuration</h3>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#171717] border border-[#262626]">
              <div>
                <span className="text-sm font-semibold text-[#FFFFFF] block">Use Mock Services</span>
                <span className="text-xs text-[#737373]">Simulate backend response latency and agent responses locally</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMockService}
                  onChange={(e) => setUseMockService(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#262626] rounded-full peer peer-checked:bg-[#D4AF37] peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0A0A0A] after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#A3A3A3] block">HTTP Target Endpoint</label>
              <Input
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                disabled={useMockService}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} icon={<Save className="h-4 w-4" />}>
            Save Configuration
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
