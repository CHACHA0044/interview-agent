/*
========================================================

File:
pages/LandingPage.tsx

Purpose:
Luxury landing page for the Interview Agent platform.

Responsibilities:
- Displays high-impact hero headline with Gold accents
- Shows pure CSS workflow diagram illustrating multi-agent adaptive evaluation
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
Adheres strictly to Black & Gold design system (#0A0A0A bg, #D4AF37 accents).

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
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-24">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center pt-8 pb-12 text-center">
          {/* Hackathon Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Badge variant="gold" className="px-4 py-1.5 text-xs font-mono tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              ABTalks Vibe Coding Hackathon Edition
            </Badge>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-8"
          >
            <span className="text-[#FFFFFF]">Precision Assessment for</span>
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#E6C76B] to-[#F0D878] bg-clip-text text-transparent">
              Enterprise AI Engineers
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg sm:text-xl text-[#A3A3A3] max-w-2xl leading-relaxed mb-10 font-normal"
          >
            An adaptive AI interviewer engineered to conduct high-rigor technical evaluations across the complete 31-day Enterprise AI Cohort curriculum.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/candidates")}
              icon={<ArrowRight className="h-4 w-4" />}
              className="min-w-[220px]"
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

          {/* Pure CSS Pipeline Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full max-w-4xl mt-16 p-6 rounded-3xl bg-[#111111] border border-[#262626] shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#262626] pb-4 mb-6 text-xs text-[#737373] font-mono">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
                ORCHESTRATION PIPELINE PREVIEW
              </span>
              <span>STATE: IDLE / READY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <span className="text-[10px] font-mono text-[#D4AF37] block">01. INTAKE</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF]">Candidate Context</h4>
                <p className="text-[11px] text-[#737373]">Loads mission streak & cohort background data.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <span className="text-[10px] font-mono text-[#D4AF37] block">02. ADAPTIVE</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF]">Interviewer Agent</h4>
                <p className="text-[11px] text-[#737373]">Generates targeted questions aligned to curriculum.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <span className="text-[10px] font-mono text-[#D4AF37] block">03. EVALUATION</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF]">Evaluator Agent</h4>
                <p className="text-[11px] text-[#737373]">Scores response depth, grounding, & precision.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#171717] border border-[#262626] space-y-2">
                <span className="text-[10px] font-mono text-[#D4AF37] block">04. REPORT</span>
                <h4 className="text-xs font-semibold text-[#FFFFFF]">Feedback Synthesis</h4>
                <p className="text-[11px] text-[#737373]">Outputs executive assessment report.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Matrix */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-[#FFFFFF]">
              Engineered for Rigorous Assessment
            </h2>
            <p className="text-sm text-[#A3A3A3] max-w-xl mx-auto">
              Every system component designed to deliver unbiased, highly detailed technical evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  variant="default"
                  hover
                  className="space-y-4 p-8 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/40 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#262626] py-12">
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
