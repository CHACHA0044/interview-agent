/*
========================================================

File:
pages/InterviewPage.tsx

Purpose:
3-Column Live Assessment Dashboard layout.

Responsibilities:
- Left Column: Candidate profile identity & topic coverage progress
- Center Column: Scrollable chat dialogue stream & fixed bottom answer bar
- Right Column: Live telemetry (Timer, Active Signals, Assessment Controls)

Connected Files:
- src/app/router.tsx
- src/stores/interview.store.ts

Depends On:
- react, react-router
- react-markdown, motion, lucide-react

Notes:
Uses fixed-height 3-column desktop layout utilizing max-w-[1440px] bounds.

========================================================
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import {
  Send,
  Square,
  Bot,
  User,
  Clock,
  Sparkles,
  BarChart2,
  MicOff,
  BookOpen,
  Award,
  Terminal,
} from "lucide-react";
import { Button, Textarea, Card, Badge, Progress } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useInterviewStore } from "@/stores/interview.store";
import { useTimer } from "@/hooks/use-timer";
import { TypingIndicator } from "@/components/features/interview/TypingIndicator";
import { FeedbackDrawer } from "@/components/features/interview/FeedbackDrawer";
import { EndInterviewModal } from "@/components/features/interview/EndInterviewModal";

export function InterviewPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const {
    activeSession,
    messages,
    candidate,
    isGenerating,
    feedback,
    sendMessage,
    endSession,
  } = useInterviewStore();

  const [inputAnswer, setInputAnswer] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const durationMinutes = activeSession?.config.durationMinutes || 30;
  const { formattedTime, percentRemaining } = useTimer({
    initialSeconds: durationMinutes * 60,
    isActive: !!activeSession && activeSession.status === "in_progress",
  });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!inputAnswer.trim() || isGenerating) return;
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
      await endSession();
      setIsEndModalOpen(false);
      navigate(`/interview/${sessionId}/feedback`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConcluding(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 h-[calc(100vh-140px)] flex flex-col space-y-4">
        {/* Top Minimal Workspace Bar */}
        <div className="flex items-center justify-between bg-[#0F0F0F] px-6 py-3 rounded-2xl border border-[#1F1F1F] shrink-0">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#FFFFFF]">SESSION ID: {sessionId}</span>
            <Badge variant="gold" className="text-[10px]">ADAPTIVE EVALUATION</Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-xl border border-[#222222] font-mono text-xs text-[#D4AF37]">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedTime}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFeedbackOpen(true)}
              icon={<BarChart2 className="h-3.5 w-3.5" />}
            >
              Telemetry
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsEndModalOpen(true)}
              icon={<Square className="h-3.5 w-3.5" />}
            >
              Conclude
            </Button>
          </div>
        </div>

        {/* 3-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* ========================================================
             Left Column: Candidate Context & Topics (3 cols / 280px)
             ======================================================== */}
          <div className="lg:col-span-3 bg-[#0F0F0F] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col justify-between space-y-6 overflow-y-auto hidden lg:flex">
            <div className="space-y-5">
              <div className="flex items-center gap-3 border-b border-[#1F1F1F] pb-4">
                <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">{candidate?.member.name || "Candidate"}</h3>
                  <span className="text-[11px] text-[#A3A3A3] block">{candidate?.member.jobRole}</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">
                  Cohort Signals
                </span>
                <div className="bg-[#141414] p-3 rounded-xl border border-[#222222] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Missions Completed</span>
                    <span className="text-[#FFFFFF] font-mono font-semibold">{candidate?.signals.missionsCompleted} / 31</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Commit Days</span>
                    <span className="text-[#D4AF37] font-mono font-semibold">{candidate?.signals.commitDays} Days</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">
                  Target Curriculum Scope
                </span>
                <div className="space-y-2">
                  {activeSession?.config.topics.map((t) => (
                    <div key={t} className="flex items-center gap-2 text-xs text-[#FFFFFF] bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                      <BookOpen className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1F1F1F] text-[10px] font-mono text-[#525252] text-center">
              GROUNDED RUBRIC v1.0
            </div>
          </div>

          {/* ========================================================
             Center Column: Fixed Chat Stream (6 cols / Main Viewport)
             ======================================================== */}
          <div className="lg:col-span-6 bg-[#0F0F0F] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col justify-between min-h-0 shadow-2xl">
            {/* Scrollable Message History */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                      className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed border ${
                        isAgent
                          ? "bg-[#141414] border-[#222222] text-[#FFFFFF]"
                          : "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#FFFFFF]"
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                );
              })}

              {isGenerating && <TypingIndicator />}
            </div>

            {/* Fixed Bottom Input Bar */}
            <div className="pt-4 border-t border-[#1F1F1F] space-y-2">
              <div className="flex items-end gap-3">
                <Textarea
                  placeholder="Formulate technical response... (Press Enter to send, Shift+Enter for newline)"
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[50px] max-h-[100px] py-3 text-xs bg-[#141414] border-[#222222]"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputAnswer.trim() || isGenerating}
                  icon={<Send className="h-4 w-4" />}
                  className="h-[50px] px-5"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* ========================================================
             Right Column: Interim Telemetry (3 cols / 320px)
             ======================================================== */}
          <div className="lg:col-span-3 bg-[#0F0F0F] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col justify-between space-y-6 overflow-y-auto hidden lg:flex">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                <h3 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#D4AF37]" /> Session Telemetry
                </h3>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">
                  Time Remaining Gauge
                </span>
                <Progress value={percentRemaining} size="md" color="gold" showLabel />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider block">
                  Real-time Signal Status
                </span>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                    <span className="text-[#A3A3A3]">Response Precision</span>
                    <span className="font-mono text-[#22C55E]">High</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
                    <span className="text-[#A3A3A3]">Grounding Rubric</span>
                    <span className="font-mono text-[#D4AF37]">94%</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => setIsFeedbackOpen(true)}
              icon={<Award className="h-3.5 w-3.5" />}
            >
              View Interim Metrics
            </Button>
          </div>
        </div>

        {/* Drawers & Modals */}
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
      </div>
    </PageTransition>
  );
}
