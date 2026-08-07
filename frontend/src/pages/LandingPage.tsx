/*
========================================================

File:
pages/LandingPage.tsx

Purpose:
Luxury landing page for the Interview Agent platform.

Responsibilities:
- Displays high-impact hero headline with Gold accents and proper spacing clearance
- Shows pure CSS workflow diagram in its own independent section container
- Features technical architecture highlights and curriculum module breakdown
- Implements smooth scrolling, hover interactions, and primary CTAs

Connected Files:
- src/app/router.tsx
- src/components/ui/

Depends On:
- react-router (useNavigate)
- motion
- lucide-react

Notes:
Adheres strictly to Black & Gold design system (#070707 bg, #D4AF37 accents).

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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-20 sm:space-y-28">
        {/* ========================================================
           Hero Section
           ======================================================== */}
        <section className="flex flex-col items-center justify-center text-center space-y-8 pt-4 sm:pt-8">
          {/* Hackathon Pill */}
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

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15]"
          >
            <span className="text-[#FFFFFF]">Precision Assessment for</span>
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent">
              Enterprise AI Engineers
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base sm:text-lg text-[#A3A3A3] max-w-2xl leading-relaxed font-normal"
          >
            An adaptive AI interviewer engineered to conduct high-rigor technical evaluations across the complete 31-day Enterprise AI Cohort curriculum.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-2"
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
        </section>

        {/* ========================================================
           Independent Pipeline Preview Block
           ======================================================== */}
        <section className="w-full max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#0F0F0F] border border-[#1F1F1F] shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F1F1F] pb-4 gap-2 text-xs text-[#737373] font-mono">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[#FFFFFF] font-semibold">MULTI-AGENT ASSESSMENT PIPELINE</span>
              </span>
              <span className="text-[11px]">STATE: MOCK PIPELINE ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-2 group hover:border-[#D4AF37]/30 transition-colors">
                <span className="text-[10px] font-mono text-[#D4AF37] block font-bold">01. INTAKE</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">Candidate Context</h4>
                <p className="text-[11px] text-[#737373] leading-relaxed">Loads mission streak & cohort background telemetry.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-2 group hover:border-[#D4AF37]/30 transition-colors">
                <span className="text-[10px] font-mono text-[#D4AF37] block font-bold">02. ADAPTIVE</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">Interviewer Agent</h4>
                <p className="text-[11px] text-[#737373] leading-relaxed">Generates dynamic questions targeted to skill gaps.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-2 group hover:border-[#D4AF37]/30 transition-colors">
                <span className="text-[10px] font-mono text-[#D4AF37] block font-bold">03. EVALUATION</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">Evaluator Agent</h4>
                <p className="text-[11px] text-[#737373] leading-relaxed">Scores response depth, architectural grounding, & precision.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-2 group hover:border-[#D4AF37]/30 transition-colors">
                <span className="text-[10px] font-mono text-[#D4AF37] block font-bold">04. REPORT</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">Feedback Synthesis</h4>
                <p className="text-[11px] text-[#737373] leading-relaxed">Outputs executive summary report with topic radar vectors.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ========================================================
           Feature Grid Section
           ======================================================== */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FFFFFF]">
              Engineered for Rigorous Assessment
            </h2>
            <p className="text-sm text-[#A3A3A3] max-w-xl mx-auto leading-relaxed">
              Every system component designed to deliver unbiased, highly detailed technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#D4AF37]/40 transition-all duration-300 hover:-translate-y-1 p-8 rounded-2xl flex flex-col space-y-4 shadow-xl hover:shadow-2xl hover:shadow-[#D4AF37]/5 group"
                >
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
              );
            })}
          </div>
        </section>

        {/* ========================================================
           Footer
           ======================================================== */}
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
