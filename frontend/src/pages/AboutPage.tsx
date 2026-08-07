/*
========================================================

File:
pages/AboutPage.tsx

Purpose:
Provides overview and documentation of the Interview Agent architecture and hackathon goals.

Responsibilities:
- Explains the purpose of the AI Interview Agent
- Displays technical stack and architectural design decisions
- Showcases curriculum integration details
- Links to repository and backend roadmap

Connected Files:
- src/app/router.tsx (route: /about)
- src/components/ui/ (Card, Badge)
- src/components/layout/PageTransition.tsx

Depends On:
- react
- lucide-react

Notes:
Maintains documentation consistency and informs developers/evaluators about the project's vision.

========================================================
*/

import { Brain, Cpu, Database, Layers, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";

export function AboutPage() {
  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center space-y-4">
          <Badge variant="purple" className="mb-2">
            <Sparkles className="h-3 w-3 mr-1" /> Hackathon Project Architecture
          </Badge>
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
            About Interview Agent
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            An adaptive technical evaluation platform engineered for Enterprise AI Cohort graduates, powered by state-of-the-art multi-agent orchestration and precision assessment models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">Adaptive Dialogue</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Dynamically tailors follow-up questions based on candidate responses, curriculum progress, and identified skill gaps.
            </p>
          </Card>

          <Card variant="glass" className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">Curriculum Grounded</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Evaluates candidates across 31 intensive modules covering vector databases, RAG, agentic tools, MCP, and K8s deployment.
            </p>
          </Card>

          <Card variant="glass" className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">Objective Scoring</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Generates holistic evaluation reports with strengths, weakness vector analysis, and customized growth trajectories.
            </p>
          </Card>
        </div>

        <Card variant="elevated" className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <Terminal className="h-6 w-6 text-brand-400" />
            <h2 className="text-xl font-bold text-zinc-100">Frontend Foundation Specs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-300 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" /> Core Engine
              </h4>
              <p className="text-zinc-400">
                Built with React 19, TypeScript, and Vite. Implements clean feature-based architecture with full decoupled mock service state handlers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-300 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-400" /> State & Data Flow
              </h4>
              <p className="text-zinc-400">
                Powered by Zustand for global UI and active interview telemetry, with TanStack Query managing async mock requests.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
