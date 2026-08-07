/*
========================================================

File:
pages/SettingsPage.tsx

Purpose:
Settings and environment parameters management page.

Responsibilities:
- Controls theme, API mode (Mock vs Live Backend), and agent evaluation profiles
- Provides toggle switches for interview audio/typing indicators

Connected Files:
- src/app/router.tsx (route: /settings)

Depends On:
- react
- lucide-react
- src/components/ui/ (Card, Button, Input)

Notes:
Allows seamless transition between mock frontend testing and future live backend APIs.

========================================================
*/

import { useState } from "react";
import { Settings, Server, Save } from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
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
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Settings className="h-7 w-7 text-brand-400" /> System Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Configure application runtime settings, backend integrations, and evaluation behaviors.
          </p>
        </div>

        <Card variant="glass" className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Server className="h-5 w-5 text-blue-400" /> Backend API Configuration
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-sm font-semibold text-zinc-200 block">Use Mock Services</span>
                <span className="text-xs text-zinc-400">Simulate backend response latency and agent responses locally</span>
              </div>
              <input
                type="checkbox"
                checked={useMockService}
                onChange={(e) => setUseMockService(e.target.checked)}
                className="h-5 w-5 accent-brand-500 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 block">HTTP Target Endpoint</label>
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
