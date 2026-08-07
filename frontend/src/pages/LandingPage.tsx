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
  Cpu,
  Users,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { APP_NAME } from "@/constants";
import {
  LayoutContainer,
  Section,
  LayoutGrid,
  PageHeading,
  Surface,
  Stack,
} from "@/components/layout/system";

const FEATURES = [
  {
    icon: Brain,
    title: "Adaptive Question Engine",
    description: "Dynamic dialogue trees that calibrate question difficulty based on candidate response depth.",
  },
  {
    icon: Layers,
    title: "31-Day Curriculum Aligned",
    description: "Covers vector search, RAG pipelines, fine-tuning, multi-agent orchestration, MCP, and K8s deployment.",
  },
  {
    icon: BarChart3,
    title: "Executive Synthesis",
    description: "Generates radar breakdowns, technical strengths, weakness vectors, and actionable next steps.",
  },
  {
    icon: ShieldCheck,
    title: "Objective Guardrails",
    description: "Grounded prompt structures prevent hallucinated scores and enforce uniform rubrics.",
  },
  {
    icon: Target,
    title: "Real-time Telemetry",
    description: "Live monitoring of elapsed time, topic coverage percentages, and active mission signals.",
  },
  {
    icon: Zap,
    title: "Instant API Readiness",
    description: "Decoupled service interfaces simplify migration from mock data to production endpoints.",
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <Section density="relaxed">
        <LayoutContainer size="hero" className="stack stack-lg">
          <LayoutGrid gap="lg" className="items-center">
            <div className="col-span-4 md:col-span-8 xl:col-span-7 stack stack-md">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Badge variant="gold" className="px-4 py-1.5 text-xs font-mono tracking-wider uppercase w-fit">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#D4AF37]" />
                  ABTalks Vibe Coding Hackathon Edition
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="heading-display"
              >
                Precision Assessment for
                <span className="block bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] bg-clip-text text-transparent">
                  Enterprise AI Engineers
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="text-body max-w-reading text-[#A3A3A3]"
              >
                An adaptive AI interviewer engineered to run high-rigor technical evaluations across the complete 31-day Enterprise AI Cohort curriculum.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button size="lg" onClick={() => navigate("/candidates")} icon={<ArrowRight className="h-4 w-4" />}>
                  Select Candidate
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate("/about")}>
                  Explore Architecture
                </Button>
              </motion.div>
            </div>

            <div className="col-span-4 md:col-span-8 xl:col-span-5">
              <Surface padding="lg" elevated className="stack stack-md">
                <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4 text-xs font-mono text-[#737373]">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="text-white font-semibold">COHORT ASSESSOR v1.0</span>
                  </span>
                  <span>ONLINE</span>
                </div>

                <Stack gap="sm">
                  <div className="surface surface-padding-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#D4AF37]">
                        <Users className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Graduation Candidates</span>
                        <span className="text-[10px] text-[#737373]">Enterprise AI Cohort Roster</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#D4AF37]">6 Active</span>
                  </div>
                  <div className="surface surface-padding-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#D4AF37]">
                        <Cpu className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Curriculum Depth</span>
                        <span className="text-[10px] text-[#737373]">Vectors, RAG, Agents, MCP, K8s</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-[#D4AF37]">31 Modules</span>
                  </div>
                  <div className="surface surface-padding-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-lg bg-[#1D1D1D] flex items-center justify-center text-[#22C55E]">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Evaluation Mode</span>
                        <span className="text-[10px] text-[#737373]">Mock Services Operational</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#22C55E]">Ready</span>
                  </div>
                </Stack>
              </Surface>
            </div>
          </LayoutGrid>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="dashboard" className="stack stack-lg">
          <PageHeading
            eyebrow={<span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest">Multi-Agent Workflow</span>}
            title="Adaptive Assessment Pipeline"
            description="From context intake to targeted evaluation and executive feedback synthesis."
          />

          <LayoutGrid gap="md">
            {[
              ["STEP 01", "Candidate Context Intake", "Loads mission streak, repo history, and baseline signals.", "Input: Candidate ID"],
              ["STEP 02", "Adaptive Questioning", "Generates dynamic follow-ups based on response depth.", "Engine: RAG + Curriculum"],
              ["STEP 03", "Rubric Evaluation", "Scores response precision, grounding, and skill mastery.", "Guardrail: Zero Hallucinations"],
              ["STEP 04", "Executive Synthesis", "Outputs topic radar metrics and targeted next steps.", "Output: PDF & Dashboard"],
            ].map(([step, title, description, meta]) => (
              <Surface key={step} className="col-span-4 md:col-span-4 xl:col-span-3 h-full flex flex-col justify-between" padding="md">
                <div className="stack stack-sm">
                  <span className="text-xs font-mono text-[#D4AF37] font-bold">{step}</span>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">{description}</p>
                </div>
                <span className="text-[10px] font-mono text-[#525252] mt-6">{meta}</span>
              </Surface>
            ))}
          </LayoutGrid>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="content" className="stack stack-lg">
          <PageHeading
            align="center"
            title="Engineered for Rigorous Assessment"
            description="Every system component is designed to deliver unbiased, highly detailed technical evaluations."
          />

          <LayoutGrid gap="md">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Surface key={feature.title} className="col-span-4 md:col-span-4 xl:col-span-4 h-full group" padding="lg">
                  <div className="stack stack-md h-full justify-between">
                    <div className="stack stack-sm">
                      <span className="h-11 w-11 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="text-base font-semibold text-white group-hover:text-[#D4AF37] transition-colors flex items-center justify-between gap-3">
                        <span>{feature.title}</span>
                        <ChevronRight className="h-4 w-4 text-[#737373] group-hover:text-[#D4AF37]" />
                      </h3>
                      <p className="text-xs text-[#A3A3A3] leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </LayoutGrid>

          <p className="text-xs text-[#737373]">{APP_NAME} preserves application behavior while rebuilding layout architecture for responsive intent.</p>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
