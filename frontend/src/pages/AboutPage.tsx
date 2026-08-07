/*
========================================================

File:
pages/AboutPage.tsx

Purpose:
Architecture overview and project documentation page.

Responsibilities:
- Explains the Interview Agent system design and hackathon context
- Displays technical architecture pillar cards
- Shows frontend technology stack breakdown

Connected Files:
- src/app/router.tsx (route: /about)
- src/components/ui/

Depends On:
- react
- lucide-react

Notes:
Adheres to Black & Gold design system with clean information hierarchy.

========================================================
*/

import { Brain, Cpu, Database, Layers, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";

export function AboutPage() {
  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-12">
        {/* Header */}
        <div className="border-b border-[#262626] pb-8 space-y-2">
          <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
            System Architecture
          </Badge>
          <h1 className="text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            About Interview Agent
          </h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl leading-relaxed">
            An adaptive technical evaluation platform engineered for Enterprise AI Cohort graduates,
            powered by multi-agent orchestration and precision assessment models.
          </p>
        </div>

        {/* Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="default" hover className="space-y-4 p-8 group">
            <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/40 transition-colors">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
              Adaptive Dialogue Engine
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Dynamically tailors follow-up questions based on candidate responses, curriculum progress, and identified skill gaps in real-time.
            </p>
          </Card>

          <Card variant="default" hover className="space-y-4 p-8 group">
            <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/40 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
              Curriculum Grounded Assessment
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Evaluates candidates across 31 intensive modules covering vector databases, RAG, agentic tools, MCP, and K8s deployment.
            </p>
          </Card>

          <Card variant="default" hover className="space-y-4 p-8 group">
            <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/40 transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
              Objective Scoring Guardrails
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Generates holistic evaluation reports with strengths, weakness vector analysis, and customized growth trajectories.
            </p>
          </Card>
        </div>

        {/* Technical Stack */}
        <Card variant="elevated" className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
            <Terminal className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-[#FFFFFF]">Frontend Foundation Specs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-[#FFFFFF] flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#D4AF37]" /> Core Engine
              </h4>
              <p className="text-[#A3A3A3] leading-relaxed">
                Built with React 19, TypeScript, and Vite. Implements clean feature-based architecture with full decoupled mock service state handlers.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-[#FFFFFF] flex items-center gap-2">
                <Database className="h-4 w-4 text-[#D4AF37]" /> State & Data Flow
              </h4>
              <p className="text-[#A3A3A3] leading-relaxed">
                Powered by Zustand for global UI and active interview telemetry, with TanStack Query managing async mock requests.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
