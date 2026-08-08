import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronDown,
  Activity,
  WifiOff,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { APP_NAME } from "@/constants";
import { useCandidates } from "@/hooks/use-candidates";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useSettingsStore } from "@/stores/settings.store";
import {
  LayoutContainer,
  Section,
  LayoutGrid,
  PageHeading,
  Surface,
  Stack,
} from "@/components/layout/system";
import { cn } from "@/lib/cn";

const FEATURES = [
  {
    icon: Brain,
    title: "Adaptive Question Engine",
    description: "Dynamic dialogue trees that calibrate question difficulty based on candidate response depth.",
    details: [
      "Calibrates difficulty from the candidate's mission history before the first question",
      "Branches into follow-up probes when a response misses expected concepts",
      "Adapts question count and depth to the selected assessment plan",
    ],
  },
  {
    icon: Layers,
    title: "31-Day Curriculum Aligned",
    description: "Covers vector search, RAG pipelines, fine-tuning, multi-agent orchestration, MCP, and K8s deployment.",
    details: [
      "8 modules spanning the full 31-day Enterprise AI Cohort",
      "Questions grounded in the real curriculum day objectives",
      "Ensures assessments stay anchored to cohort ground truth",
    ],
  },
  {
    icon: BarChart3,
    title: "Executive Synthesis",
    description: "Generates radar breakdowns, technical strengths, weakness vectors, and actionable next steps.",
    details: [
      "Composite mastery rating derived from graded responses",
      "Topic-level score breakdowns against expected concepts",
      "Actionable growth trajectory with concrete next steps",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Objective Guardrails",
    description: "Grounded prompt structures prevent hallucinated scores and enforce uniform rubrics.",
    details: [
      "Zero-hallucination scoring enforced by grounded rubric prompts",
      "Uniform evaluation criteria across every candidate session",
      "Auditable per-question concept coverage tracking",
    ],
  },
  {
    icon: Target,
    title: "Real-time Telemetry",
    description: "Live monitoring of elapsed time, topic coverage percentages, and active mission signals.",
    details: [
      "Elapsed session timer with live duration tracking",
      "Topic coverage indicators update as questions are answered",
      "Candidate mission and commit-streak context shown inline",
    ],
  },
  {
    icon: Zap,
    title: "Instant API Readiness",
    description: "Decoupled service interfaces simplify migration from mock data to production endpoints.",
    details: [
      "Mock/live toggle in Settings switches data source without code changes",
      "Gateway contract supports candidate intake and message turns",
      "Service layer isolates backend wiring from UI components",
    ],
  },
] as const;

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = feature.icon;

  return (
    <Surface
      className={cn(
        "col-span-4 md:col-span-4 xl:col-span-4 h-full cursor-pointer transition-all duration-300",
        isExpanded ? "border-[#D4AF37]/40" : "hover:border-[#D4AF37]/25"
      )}
      padding="lg"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        aria-expanded={isExpanded}
        className="w-full h-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 rounded-lg"
      >
        <div className="stack stack-md h-full justify-between">
          <div className="stack stack-sm">
            <motion.span
              className="h-11 w-11 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37]"
              whileHover={{ scale: 1.08, rotate: 6 }}
              whileTap={{ scale: 0.95 }}
              animate={
                isExpanded
                  ? { scale: [1, 1.12, 1], rotate: [0, -8, 0], transition: { duration: 0.6 } }
                  : undefined
              }
            >
              <Icon className="h-5 w-5" />
            </motion.span>
            <h3 className="text-base font-semibold text-white flex items-center justify-between gap-3">
              <span>{feature.title}</span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 text-[#737373]"
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </h3>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">{feature.description}</p>
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ul className="stack stack-xs pt-1 border-t border-[#1F1F1F]">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-[11px] text-[#B5B5B5] leading-relaxed">
                      <span className="mt-1 h-1 w-1 rounded-full bg-[#D4AF37] shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </Surface>
  );
}

function useGatewayStatus() {
  const { useMockService, apiEndpoint } = useSettingsStore();
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    if (useMockService) {
      setStatus("checking");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    const baseUrl = apiEndpoint.replace(/\/api\/interview\/?$/, "");
    fetch(`${baseUrl}/health`, { method: "GET", signal: AbortSignal.timeout(5000) })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? "online" : "offline");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, [useMockService, apiEndpoint]);

  return { useMockService, status };
}

export function LandingPage() {
  const navigate = useNavigate();
  const { data: candidates } = useCandidates();
  const { data: curriculum } = useCurriculum();
  const { useMockService, status } = useGatewayStatus();

  const candidateCount = candidates?.length ?? 0;
  const moduleCount = curriculum?.modules.length ?? 8;
  const dayCount = curriculum?.days.length ?? 31;

  const isLive = !useMockService;
  const isOnline = isLive && status === "online";
  const isOffline = isLive && status === "offline";
  const isChecking = isLive && status === "checking";

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
                    <motion.span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        isOnline ? "bg-[#22C55E]" : isOffline ? "bg-[#EF4444]" : "bg-[#D4AF37]"
                      )}
                      animate={isChecking || (useMockService && status === "checking") ? { opacity: [1, 0.4, 1] } : undefined}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="text-white font-semibold">COHORT ASSESSOR v1.0</span>
                  </span>
                  <span
                    className={cn(
                      isOnline ? "text-[#22C55E]" : isOffline ? "text-[#EF4444]" : "text-[#D4AF37]"
                    )}
                  >
                    {useMockService ? "SIMULATED" : isOnline ? "ONLINE" : isOffline ? "OFFLINE" : "CONNECTING"}
                  </span>
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
                    <span className="text-sm font-mono font-bold text-[#D4AF37]">{candidateCount} Eligible</span>
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
                    <span className="text-sm font-mono font-bold text-[#D4AF37]">{moduleCount} Modules · {dayCount} Days</span>
                  </div>
                  <div className="surface surface-padding-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        isOnline ? "bg-[#22C55E]/10 text-[#22C55E]" : isOffline ? "bg-[#EF4444]/10 text-[#EF4444]" : "bg-[#1D1D1D] text-[#D4AF37]"
                      )}>
                        {isOnline ? <Activity className="h-4 w-4" /> : isOffline ? <WifiOff className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">Evaluation Mode</span>
                        <span className="text-[10px] text-[#737373]">
                          {useMockService
                            ? "Mock Services Operational"
                            : isOnline
                              ? "Live Gateway Connected"
                              : isOffline
                                ? "Gateway Unreachable"
                                : "Checking Gateway Health"}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={isOnline ? "success" : isOffline ? "danger" : useMockService ? "warning" : "gold"}
                      className="text-[10px]"
                    >
                      {useMockService ? "Simulated" : isOnline ? "Online" : isOffline ? "Offline" : "Checking"}
                    </Badge>
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
            align="center"
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
        <LayoutContainer size="dashboard" className="stack stack-lg">
          <PageHeading
            align="center"
            title="Engineered for Rigorous Assessment"
            description="Every system component is designed to deliver unbiased, highly detailed technical evaluations. Click a card to expand its engineering detail."
          />

          <LayoutGrid gap="md">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </LayoutGrid>

          <p className="text-xs text-[#737373]">{APP_NAME} preserves application behavior while rebuilding layout architecture for responsive intent.</p>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
