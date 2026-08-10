import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CalendarRange,
  ChevronRight,
  Cpu,
  Database,
  FileChartColumn,
  GitBranch,
  Layers,
  MessagesSquare,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { LayoutContainer, Section, LayoutGrid, PageHeading, Surface, Stack } from "@/components/layout/system";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

interface FlowStepData {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FLOW_STEPS: FlowStepData[] = [
  {
    title: "Candidate Context",
    description:
      "Builds a candidate profile from cohort mission history — failed, skipped, weak, and strong days — plus job role, experience, and difficulty tier.",
    icon: UserRound,
  },
  {
    title: "Curriculum Planning",
    description:
      "Selects assessment days across at least four distinct curriculum modules and allocates an adaptive multi-question interview plan.",
    icon: CalendarRange,
  },
  {
    title: "Adaptive Q&A + Follow-ups",
    description:
      "Grades every answer against expected concepts, adapts difficulty in real time, and branches into follow-up probes or the next planned question.",
    icon: MessagesSquare,
  },
  {
    title: "Evaluation & Feedback",
    description:
      "Aggregates scores, concept coverage, strengths, and gaps into a holistic report with tailored next-step growth paths.",
    icon: FileChartColumn,
  },
];

function FlowConnector() {
  return (
    <>
      {/* Desktop horizontal connector */}
      <div className="hidden xl:flex items-center justify-center shrink-0 w-14 xl:self-start xl:mt-[3.75rem]">
        <div className="relative flex items-center justify-center w-full h-10">
          <div className="absolute inset-x-0 h-px bg-[#262626] rounded-full" />
          <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-[#3F3F3F]" />
          <span className="relative text-[#3F3F3F]">
            <ChevronRight className="h-4 w-4 opacity-50" />
          </span>
        </div>
      </div>

      {/* Mobile vertical connector */}
      <div className="flex xl:hidden items-center justify-center w-full py-1">
        <div className="relative flex items-center justify-center h-10 w-6">
          <div className="absolute inset-y-0 w-px bg-[#262626] rounded-full" />
          <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-[#3F3F3F]" />
          <span className="relative text-[#3F3F3F] rotate-90">
            <ChevronRight className="h-4 w-4 opacity-50" />
          </span>
        </div>
      </div>
    </>
  );
}

function FlowStep({
  step,
  index,
  active = false,
  onActivate,
  onDeactivate,
}: {
  step: FlowStepData;
  index: number;
  active?: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = step.icon;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-expanded={active}
      onClick={onActivate}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      animate={{ height: active ? "auto" : "10rem" }}
      transition={
        prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
      }
      className={cn(
        "group relative flex-1 min-w-0 cursor-pointer rounded-2xl border bg-[#0F0F0F] p-5 outline-none overflow-hidden transition-colors duration-300",
        active
          ? "border-[#C9A227]/35 bg-[#121212] shadow-[0_0_28px_-14px_rgba(201,162,39,0.55)]"
          : "border-[#262626] hover:border-[#D4AF37]/25 hover:bg-[#111111]",
        "focus-visible:ring-1 focus-visible:ring-[#C9A227]/60"
      )}
      aria-label={`Step ${index + 1}: ${step.title}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl bg-[#171717] border flex items-center justify-center transition-colors duration-300",
            active
              ? "border-[#C9A227]/40 text-[#C9A227]"
              : "border-[#262626] text-[#D4AF37] group-hover:border-[#D4AF37]/40"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-sm font-semibold leading-snug transition-colors duration-300",
              active ? "text-white" : "text-white/75"
            )}
          >
            {step.title}
          </h3>
          <span
            className={cn(
              "text-[10px] font-mono tracking-widest transition-colors duration-300",
              active ? "text-[#C9A227]" : "text-[#737373]"
            )}
          >
            STEP {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Description lives inline inside the expanded box — nowhere else. */}
      <AnimatePresence initial={false}>
        {active && (
          <motion.p
            key="description"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={
              prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
            }
            className="mt-3 text-xs leading-relaxed text-[#B5B5B5]"
          >
            {step.description}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AgentFlow() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col xl:flex-row gap-4 xl:gap-0 xl:items-start">
      {FLOW_STEPS.map((step, index) => (
        <Fragment key={step.title}>
          {index > 0 && <FlowConnector />}
          <FlowStep
            step={step}
            index={index}
            active={index === activeIndex}
            onActivate={() => setActiveIndex(index)}
            onDeactivate={() => setActiveIndex(null)}
          />
        </Fragment>
      ))}
    </div>
  );
}

export function AboutPage() {
  return (
    <PageTransition>
      <section className="flex items-start md:items-center justify-center pt-24 pb-12 ">
        <LayoutContainer size="reading" className="stack stack-lg">
          <PageHeading
            align="center"
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                System Architecture
              </Badge>
            }
            title="Architecture Overview"
            description="An adaptive technical evaluation platform engineered for Enterprise AI Cohort graduates, powered by multi-agent orchestration and precision assessment models."
          />

          <p className="text-sm text-[#A3A3A3] leading-relaxed text-center mx-auto max-w-reading">
            This route preserves existing business behavior while documenting the architecture model, platform boundaries, and frontend foundation.
          </p>
        </LayoutContainer>
      </section>

      <Section>
        <LayoutContainer size="content">
          <LayoutGrid gap="md">
            {[
              {
                icon: Brain,
                title: "Adaptive Dialogue Engine",
                text: "Dynamically tailors follow-up questions based on candidate responses and identified skill gaps.",
              },
              {
                icon: Layers,
                title: "Curriculum Grounded Assessment",
                text: "Evaluates candidates across 31 modules spanning vector databases, RAG, agentic tools, MCP, and K8s.",
              },
              {
                icon: ShieldCheck,
                title: "Objective Scoring Guardrails",
                text: "Generates holistic evaluation reports with strengths, gaps, and customized growth trajectories.",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Surface
                  key={pillar.title}
                  padding="lg"
                  className="group relative overflow-hidden col-span-4 md:col-span-4 xl:col-span-4 h-full transition-all duration-300 hover:border-[#D4AF37]/35 hover:bg-[#131313] hover:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.65)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/0 to-transparent transition-all duration-500 group-hover:via-[#D4AF37]/60" />
                  <Stack gap="sm">
                    <span className="relative h-11 w-11 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] transition-all duration-300 group-hover:border-[#D4AF37]/40 group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(212,175,55,0.18)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-semibold text-white pt-1">{pillar.title}</h2>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed transition-colors duration-300 group-hover:text-[#B8B8B8]">
                      {pillar.text}
                    </p>
                  </Stack>
                </Surface>
              );
            })}
          </LayoutGrid>
        </LayoutContainer>
      </Section>

      <Section className="pt-20 pb-20">
        <LayoutContainer size="content">
          <Stack gap="lg">
            <div className="stack stack-sm items-center text-center">
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Workflow className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                End-to-End Pipeline
              </Badge>
              <h2 className="text-2xl font-bold text-white tracking-tight">Agent Interview Flow</h2>
              <p className="text-sm text-[#A3A3A3] max-w-2xl mx-auto">
                How a candidate moves through the multi-agent interview engine, from profile calibration to final
                feedback. Hover or tap a stage to expand its details.
              </p>
            </div>

            <AgentFlow />
          </Stack>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="reading">
          <Surface padding="lg" className="stack stack-md overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Terminal className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-white">Frontend Foundation Specs</h2>
            </div>

            <LayoutGrid gap="md">
              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#D4AF37]" /> Core Engine
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  Built with React 19, TypeScript, and Vite with feature-oriented frontend modules and decoupled API service handlers.
                </p>
              </div>

              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#D4AF37]" /> State & Data Flow
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  Powered by Zustand for global interview state and TanStack Query for async request orchestration.
                </p>
              </div>
            </LayoutGrid>
          </Surface>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="reading">
          <Surface padding="lg" className="stack stack-md overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Server className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-white">Backend Foundation Specs</h2>
            </div>

            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              The backend is a three-service microservice architecture speaking HTTP/REST, with Redis for ephemeral
              session state and Qdrant for curriculum retrieval — both reachable only inside the private network. The
              only service exposed to the frontend is the Gateway.
            </p>

            <LayoutGrid gap="md">
              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Network className="h-4 w-4 text-[#D4AF37]" /> Service Topology
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  interview-gateway (:8000) exposes the public POST /api/interview contract; interview-agent (:8001)
                  owns candidate context, planning, and adaptive question strategy; ai-intelligence (:8002) owns LLM
                  abstraction, RAG retrieval, evaluation, and feedback synthesis.
                </p>
              </div>

              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#D4AF37]" /> Session & Retrieval Stores
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  Redis holds TTL-backed ephemeral session documents (agent state, conversation, scores) so stateless
                  agent/AI services can scale freely. Qdrant indexes all 31 curriculum days as chunks for semantic,
                  curriculum-grounded retrieval during question generation and evaluation.
                </p>
              </div>

              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" /> Reliability & Guardrails
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  Bounded timeouts and retries, health endpoints on every service, deterministic heuristic fallbacks
                  when the LLM provider fails, and hard floors of at least 8 questions across 4 distinct curriculum
                  days — the interview never completes early.
                </p>
              </div>

              <div className="group col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm rounded-xl border border-[#1F1F1F] bg-[#131313] p-5 transition-all duration-300 hover:border-[#D4AF37]/30 hover:bg-[#161616]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#D4AF37]" /> Ownership & Delivery
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm transition-colors duration-300 group-hover:text-[#B8B8B8]">
                  Each service is independently deployable with its own Dockerfile, environment, and tests — so Pranav,
                  Shezan, and Meraj work in parallel without touching the same files. Shared contracts live in a
                  stable, code-free shared/ directory.
                </p>
              </div>
            </LayoutGrid>
          </Surface>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
