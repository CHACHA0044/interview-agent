/*
========================================================

File:
pages/LandingPage.tsx

Purpose:
Executive landing page implementing a 2-column wide desktop layout.

Responsibilities:
- Displays high-impact hero split (Left: CTA & Value Prop, Right: Metric Card)
- Shows workflow pipeline sequence in a wide 4-column container
- Renders 3-column feature grid with matching card heights and spacing rhythm

Connected Files:
- src/app/router.tsx
- src/components/ui/

Depends On:
- react-router (useNavigate)
- motion
- lucide-react

Notes:
Uses global max-w-[1440px] px-6 sm:px-10 lg:px-12 container system.

========================================================
*/

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Brain,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  Layers,
  ChevronRight,
  Cpu,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { APP_NAME } from "@/constants";

const FEATURES = [
  {
    icon: Brain,
    title: "Adaptive Question Engine",
    description: "Dynamic dialogue trees that automatically calibrate question difficulty based on candidate response depth.",
  },
  {
    icon: Layers,
    title: "31-Day Curriculum Aligned",
    description: "Covers vector search, RAG pipelines, fine-tuning, multi-agent orchestration, MCP, and K8s deployment.",
  },
  {
    icon: BarChart3,
    title: "Executive Synthesis",
    description: "Generates multi-dimensional radar breakdown, technical strengths, weakness vectors, and actionable next steps.",
  },
  {
    icon: ShieldCheck,
    title: "Objective Guardrails",
    description: "Grounded prompt structures preventing hallucinated scores and enforcing uniform scoring rubrics.",
  },
  {
    icon: Target,
    title: "Real-time Telemetry",
    description: "Live monitoring of elapsed time, topic coverage percentages, and active candidate mission streak data.",
  },
  {
    icon: Zap,
    title: "Instant API Readiness",
    description: "Built on decoupled service interfaces for seamless migration from mock data to production HTTP endpoints.",
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 space-y-24 lg:space-y-32">
        {/* ========================================================
           Hero 2-Column Desktop Grid
           ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pt-4 lg:pt-8">
          {/* Left Column: Title & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Badge variant="gold" className="px-4 py-1.5 text-xs font-mono tracking-wider uppercase shadow-lg shadow-[#D4AF37]/5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#D4AF37]" />
                ABTalks Vibe Coding Hackathon Edition
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#FFFFFF] leading-[1.12]"
            >
              Precision Assessment for <br />
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent">
                Enterprise AI Engineers
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed max-w-2xl font-normal"
            >
              An adaptive AI interviewer engineered to conduct high-rigor technical evaluations across the complete 31-day Enterprise AI Cohort curriculum.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <Button
                size="lg"
                onClick={() => navigate("/candidates")}
                icon={<ArrowRight className="h-4 w-4" />}
                className="min-w-[220px] shadow-xl shadow-[#D4AF37]/10"
              >
                Select Candidate
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/about")}
                className="min-w-[220px]"
              >
                Explore Architecture
              </Button>
            </motion.div>
          </div>

          {/* Right Column: Interactive Architecture Preview Card (5 cols) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="p-8 rounded-3xl bg-[#0F0F0F] border border-[#1F1F1F] shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4 text-xs font-mono text-[#737373]">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-[#FFFFFF] font-semibold">COHORT ASSESSOR v1.0</span>
                </span>
                <span>ONLINE</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#D4AF37]">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#FFFFFF] block">Graduation Candidates</span>
                      <span className="text-[10px] text-[#737373]">Enterprise AI Cohort Roster</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#D4AF37]">6 Active</span>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#D4AF37]">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#FFFFFF] block">Curriculum Depth</span>
                      <span className="text-[10px] text-[#737373]">Vectors, RAG, Agents, MCP, K8s</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-[#D4AF37]">31 Modules</span>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#22C55E]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#FFFFFF] block">Evaluation Mode</span>
                      <span className="text-[10px] text-[#737373]">Mock Services Operational</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#22C55E]">Ready</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================================================
           Wide 4-Column Pipeline Step Sequence
           ======================================================== */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F1F1F] pb-6">
            <div>
              <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest block mb-1">
                Multi-Agent Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FFFFFF]">
                Adaptive Assessment Pipeline
              </h2>
            </div>
            <p className="text-xs text-[#A3A3A3] max-w-md">
              From context intake to targeted evaluation and executive feedback synthesis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-3 hover:border-[#D4AF37]/30 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#D4AF37] font-bold block">STEP 01</span>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Candidate Context Intake</h3>
                <p className="text-xs text-[#737373] leading-relaxed">Loads mission streak, repo history, and background signals.</p>
              </div>
              <span className="text-[10px] font-mono text-[#525252]">Input: Candidate ID</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-3 hover:border-[#D4AF37]/30 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#D4AF37] font-bold block">STEP 02</span>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Adaptive Questioning</h3>
                <p className="text-xs text-[#737373] leading-relaxed">Generates dynamic follow-ups based on response depth.</p>
              </div>
              <span className="text-[10px] font-mono text-[#525252]">Engine: RAG + Curriculum</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-3 hover:border-[#D4AF37]/30 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#D4AF37] font-bold block">STEP 03</span>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Rubric Evaluation</h3>
                <p className="text-xs text-[#737373] leading-relaxed">Scores response precision, grounding, and skill mastery.</p>
              </div>
              <span className="text-[10px] font-mono text-[#525252]">Guardrail: Zero Hallucinations</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-3 hover:border-[#D4AF37]/30 transition-colors flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#D4AF37] font-bold block">STEP 04</span>
                <h3 className="text-sm font-semibold text-[#FFFFFF]">Executive Synthesis</h3>
                <p className="text-xs text-[#737373] leading-relaxed">Outputs topic radar metrics and targeted next steps.</p>
              </div>
              <span className="text-[10px] font-mono text-[#525252]">Output: PDF & Dashboard</span>
            </div>
          </div>
        </section>

        {/* ========================================================
           3-Column Feature Matrix
           ======================================================== */}
        <section className="space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FFFFFF]">
              Engineered for Rigorous Assessment
            </h2>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              Every system component designed to deliver unbiased, highly detailed technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#D4AF37]/40 transition-all duration-300 hover:-translate-y-1 p-8 rounded-2xl flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/5 group h-full"
                >
                  <div className="space-y-4">
                    <div className="h-11 w-11 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-colors shadow-inner">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors flex items-center justify-between">
                      <span>{feature.title}</span>
                      <ChevronRight className="h-4 w-4 text-[#737373] group-hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1F1F1F] pt-12 pb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373]">
            <p>© 2026 {APP_NAME}. Enterprise AI Cohort Evaluation System.</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <span>Frontend Mock Services Operational</span>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
