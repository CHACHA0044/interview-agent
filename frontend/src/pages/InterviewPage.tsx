import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Send, Square, Bot, User, Clock, TimerReset, BarChart2, BookOpen, Award, AlertTriangle, X, Plus } from "lucide-react";
import { Button, Textarea, Badge, Progress, ProviderStatusBadge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useInterviewStore } from "@/stores/interview.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useTimer } from "@/hooks/use-timer";
import { useCountdown, formatCountdown } from "@/hooks/use-countdown";
import { useGatewayHealth } from "@/hooks/use-gateway-health";
import { TypingIndicator } from "@/components/features/interview/TypingIndicator";
import { FeedbackDrawer } from "@/components/features/interview/FeedbackDrawer";
import { EndInterviewModal } from "@/components/features/interview/EndInterviewModal";
import { INTERVIEW_CONFIG, SESSION_EXTEND_SECONDS } from "@/constants";
import { LayoutContainer, Section, LayoutGrid, Surface, Stack, Cluster } from "@/components/layout/system";

export function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const {
    session,
    messages,
    isAgentTyping,
    feedback,
    error,
    liveMeta,
    sessionDeadline,
    sendMessage,
    endInterview,
    clearError,
    extendSessionDeadline,
    setTtlSeconds,
  } = useInterviewStore();

  const showInternalMetadata = useSettingsStore((state) => state.showInternalMetadata);
  const health = useGatewayHealth();

  useEffect(() => {
    if (health.ttlSeconds) {
      setTtlSeconds(health.ttlSeconds);
    }
  }, [health.ttlSeconds, setTtlSeconds]);

  const [inputAnswer, setInputAnswer] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { elapsedSeconds, isRunning, start } = useTimer();

  useEffect(() => {
    if (!isRunning) {
      start();
    }
  }, [isRunning, start]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAgentTyping]);

  const remainingSeconds = Math.max(0, INTERVIEW_CONFIG.INTERVIEW_MAX_SECONDS - elapsedSeconds);
  const remainingFormatted = formatCountdown(remainingSeconds);
  const isTimeWarning = remainingSeconds <= 5 * 60;
  const isCompleted = session?.status === "COMPLETED";
  const ttlRemaining = useCountdown(isCompleted ? sessionDeadline : null);
  const ttlFormatted = formatCountdown(ttlRemaining);
  const ttlExpired = ttlRemaining === 0;
  const lastScore = liveMeta?.session?.scores?.length
    ? liveMeta.session.scores[liveMeta.session.scores.length - 1]
    : undefined;

  const handleSend = async () => {
    if (!inputAnswer.trim() || isAgentTyping) return;
    const text = inputAnswer;
    setInputAnswer("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmEndSession = async () => {
    setIsConcluding(true);
    try {
      await endInterview();
      setIsEndModalOpen(false);
      navigate(`/interview/${sessionId}/feedback`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConcluding(false);
    }
  };

  const activeCandidate = session?.candidate;

  return (
    <PageTransition>
      <Section density="tight">
        <LayoutContainer size="chat" className="stack stack-md">
          <Surface padding="sm" className="sticky top-[calc(var(--nav-height)+0.75rem)] z-20">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Cluster gap="sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-xs font-mono font-bold text-white">SESSION ID: {sessionId}</span>
                <Badge variant="gold" className="text-[10px]">ADAPTIVE EVALUATION</Badge>
                <ProviderStatusBadge />
              </Cluster>

              <Cluster gap="sm">
                <div
                  className={`flex items-center gap-2 bg-[#141414] px-3 py-2 rounded-xl border font-mono text-xs ${
                    isTimeWarning ? "border-[#F59E0B]/40 text-[#F59E0B]" : "border-[#222222] text-[#D4AF37]"
                  }`}
                  title="Time remaining for this interview turn session"
                >
                  <TimerReset className="h-3.5 w-3.5" />
                  <span>{remainingFormatted}</span>
                </div>

                {isCompleted && sessionDeadline ? (
                  <div
                    className={`flex items-center gap-2 bg-[#141414] px-3 py-2 rounded-xl border font-mono text-xs ${
                      ttlExpired ? "border-[#EF4444]/40 text-[#EF4444]" : "border-[#222222] text-[#22C55E]"
                    }`}
                    title="Gateway session TTL — data is cleared after this window"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{ttlExpired ? "SESSION EXPIRED" : `EXPIRES IN ${ttlFormatted}`}</span>
                    {!ttlExpired ? (
                      <button
                        type="button"
                        onClick={() => extendSessionDeadline(SESSION_EXTEND_SECONDS)}
                        aria-label="Extend session by 10 minutes"
                        className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/30 px-1.5 py-0.5 text-[10px] text-[#22C55E] hover:bg-[#22C55E]/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        +10m
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <Button variant="outline" size="sm" onClick={() => setIsFeedbackOpen(true)} icon={<BarChart2 className="h-3.5 w-3.5" />}>
                  Telemetry
                </Button>
                <Button variant="danger" size="sm" onClick={() => setIsEndModalOpen(true)} icon={<Square className="h-3.5 w-3.5" />}>
                  Conclude
                </Button>
              </Cluster>
            </div>
          </Surface>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30"
            >
              <AlertTriangle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
              <p className="text-xs text-[#F87171] leading-relaxed flex-1">{error}</p>
              <button
                type="button"
                onClick={clearError}
                aria-label="Dismiss error"
                className="text-[#F87171] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <LayoutGrid gap="md" className="items-stretch">
            <aside className="col-span-4 md:col-span-4 xl:col-span-3 order-2 xl:order-1">
              <Surface padding="md" className="h-full stack stack-md">
                <div className="flex items-center gap-3 border-b border-[#1F1F1F] pb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{activeCandidate?.member.name || "Cohort Graduate"}</h2>
                    <span className="text-[11px] text-[#A3A3A3] block">{activeCandidate?.member.jobRole || "AI Engineer"}</span>
                  </div>
                </div>

                <Stack gap="sm">
                  <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">Cohort Signals</span>
                  <div className="surface surface-padding-sm stack stack-xs text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Missions Completed</span>
                      <span className="text-white font-mono font-semibold">{activeCandidate?.signals?.missionsCompleted ?? 31} / 31</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Commit Days</span>
                      <span className="text-[#D4AF37] font-mono font-semibold">{activeCandidate?.signals?.commitDays ?? 28} Days</span>
                    </div>
                  </div>
                </Stack>

                <Stack gap="sm">
                  <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">Target Curriculum Scope</span>
                  <div className="stack stack-xs">
                    {(session?.topicsCovered || ["Vector Search & Indexing", "RAG Architecture & HyDE"]).map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs text-white bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                        <BookOpen className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                  </div>
                </Stack>
              </Surface>
            </aside>

            <section className="col-span-4 md:col-span-8 xl:col-span-6 min-h-0 order-1 xl:order-2">
              <Surface padding="md" className="h-full flex flex-col min-h-[28rem] md:min-h-[34rem] xl:min-h-[calc(100dvh-var(--nav-height)-17rem)]">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {messages.map((msg) => {
                    const isAgent = msg.role === "agent";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 ${isAgent ? "" : "flex-row-reverse"}`}
                      >
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isAgent
                              ? "bg-[#171717] border border-[#D4AF37]/30 text-[#D4AF37]"
                              : "bg-[#D4AF37] text-[#0A0A0A]"
                          }`}
                        >
                          {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>

                        <div
                          className={`p-4 rounded-2xl max-w-[min(100%,38rem)] text-xs leading-relaxed border prose-interview ${
                            isAgent
                              ? "bg-[#141414] border-[#222222] text-white"
                              : "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-white"
                          }`}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </motion.div>
                    );
                  })}

                  {isAgentTyping ? <TypingIndicator /> : null}
                </div>

                <div className="pt-4 border-t border-[#1F1F1F] space-y-2">
                  <div className="flex items-end gap-3">
                    <Textarea
                      placeholder="Formulate technical response... (Enter to send, Shift+Enter for newline)"
                      value={inputAnswer}
                      onChange={(e) => setInputAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[52px] max-h-[108px] py-3 text-xs bg-[#141414] border-[#222222]"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!inputAnswer.trim() || isAgentTyping}
                      icon={<Send className="h-4 w-4" />}
                      className="h-[52px] px-5"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </Surface>
            </section>

            <aside className="col-span-4 md:col-span-4 xl:col-span-3 order-3">
              <Surface padding="md" className="h-full stack stack-md">
                <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-[#D4AF37]" /> Session Telemetry
                  </h2>
                </div>

                <Stack gap="sm">
                  <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">Elapsed Duration Progress</span>
                  <Progress value={Math.min(100, Math.round((elapsedSeconds / 1800) * 100))} size="md" color="gold" showLabel />
                </Stack>

                <Stack gap="sm">
                  <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">Real-time Signal Status</span>
                  <div className="stack stack-xs text-xs">
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                      <span className="text-[#A3A3A3]">Response Precision</span>
                      <span className="font-mono text-[#22C55E]">High</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                      <span className="text-[#A3A3A3]">Grounding Rubric</span>
                      <span className="font-mono text-[#D4AF37]">94%</span>
                    </div>
                  </div>
                </Stack>

                {showInternalMetadata ? (
                  <Stack gap="sm">
                    <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">
                      Live Agent Metadata
                    </span>
                    <div className="stack stack-xs text-[11px] font-mono">
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Question Day</span>
                        <span className="text-white font-semibold">{liveMeta?.question?.day ?? "—"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Difficulty</span>
                        <span className="text-white font-semibold">
                          {liveMeta?.session?.currentDifficulty ?? liveMeta?.question?.difficulty ?? "—"}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Topic</span>
                        <span className="text-white font-semibold truncate max-w-[120px]">
                          {liveMeta?.question?.topic ?? "—"}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Questions Asked</span>
                        <span className="text-white font-semibold">{liveMeta?.session?.questionCount ?? "—"}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Follow-up Budget Left</span>
                        <span className="text-white font-semibold">
                          {liveMeta?.session?.followUpBudgetRemaining ?? "—"}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                        <span className="text-[#A3A3A3]">Last Score</span>
                        <span className="text-[#D4AF37] font-semibold">
                          {lastScore !== undefined ? lastScore.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                  </Stack>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center mt-auto"
                  onClick={() => setIsFeedbackOpen(true)}
                  icon={<Award className="h-3.5 w-3.5" />}
                >
                  View Interim Metrics
                </Button>
              </Surface>
            </aside>
          </LayoutGrid>

          <FeedbackDrawer
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            feedback={feedback}
            onViewFullReport={() => navigate(`/interview/${sessionId}/feedback`)}
          />

          <EndInterviewModal
            isOpen={isEndModalOpen}
            onClose={() => setIsEndModalOpen(false)}
            onConfirm={handleConfirmEndSession}
            isSubmitting={isConcluding}
          />
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
