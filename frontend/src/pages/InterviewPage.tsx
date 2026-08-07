/*
========================================================

File:
pages/InterviewPage.tsx

Purpose:
3-column luxury workspace powering live AI assessment dialogue.

Responsibilities:
- Left Column: Curriculum progress, session telemetry, question navigator
- Middle Column: Live chat stream with Markdown formatting and typing indicator
- Right Column: Candidate profile summary, live evaluation skills breakdown, timeline
- Bottom Bar: Premium text input with keyboard shortcuts (`⌘ + Enter`), voice trigger placeholder (disabled)

Connected Files:
- src/app/router.tsx
- src/stores/interview.store.ts
- src/hooks/use-timer.ts

Depends On:
- react
- react-router (useNavigate, useParams)
- react-markdown
- lucide-react
- motion

Notes:
Adheres strictly to the Black & Gold palette (#0A0A0A bg, #111111 cards, #D4AF37 accents).

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
  const { sessionId } = useParams();

  const {
    session,
    messages,
    isAgentTyping,
    feedback,
    sendMessage,
    endInterview,
  } = useInterviewStore();

  const { formattedTime, start: startTimer, stop: stopTimer } = useTimer();

  const [inputMessage, setInputMessage] = useState("");
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isAgentTyping) return;
    const msg = inputMessage;
    setInputMessage("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConfirmEndSession = async () => {
    setIsSubmitting(true);
    await endInterview();
    setIsSubmitting(false);
    setIsEndModalOpen(false);
    navigate(`/interview/${sessionId}/feedback`);
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <p className="text-[#A3A3A3] text-sm">No active interview session found.</p>
        <Button onClick={() => navigate("/interview/setup")}>Configure Assessment Session</Button>
      </div>
    );
  }

  const { candidate } = session;
  const currentQ = session.currentQuestionIndex + 1;
  const totalQ = session.questionCount;
  const questionProgress = (currentQ / totalQ) * 100;

  return (
    <PageTransition>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col h-[calc(100vh-7.5rem)] gap-4">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-[#111111] border border-[#262626] rounded-2xl px-6 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <Badge variant="gold" className="py-1 px-3">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              Live AI Dialogue Assessment
            </Badge>
            <span className="text-xs font-mono text-[#737373]">
              SESSION: <span className="text-[#FFFFFF]">{session.sessionId}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#A3A3A3] bg-[#171717] px-3 py-1.5 rounded-xl border border-[#262626]">
              <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{formattedTime}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFeedbackDrawerOpen(true)}
              icon={<BarChart2 className="h-3.5 w-3.5" />}
            >
              Live Telemetry
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

        {/* 3-Column Assessment Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
          {/* Left Column: Curriculum & Session Telemetry */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 overflow-y-auto">
            {/* Session Progress Card */}
            <Card variant="default" className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <span className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-[#D4AF37]" /> Session Telemetry
                </span>
                <span className="text-xs font-mono text-[#D4AF37]">
                  {currentQ} / {totalQ}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#737373]">
                  <span>Question Navigator</span>
                  <span>{Math.round(questionProgress)}%</span>
                </div>
                <Progress value={questionProgress} size="sm" color="gold" />
              </div>

              {/* Question Navigator Pills */}
              <div className="grid grid-cols-5 gap-1.5 pt-2">
                {Array.from({ length: totalQ }).map((_, i) => {
                  const isPast = i < currentQ - 1;
                  const isCurrent = i === currentQ - 1;

                  return (
                    <div
                      key={i}
                      className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold transition-all ${
                        isCurrent
                          ? "bg-[#D4AF37] text-[#0A0A0A] shadow-sm"
                          : isPast
                          ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                          : "bg-[#171717] text-[#737373] border border-[#262626]"
                      }`}
                    >
                      Q{i + 1}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Curriculum Alignment Card */}
            <Card variant="default" className="p-5 space-y-4 flex-1">
              <div className="border-b border-[#262626] pb-3">
                <span className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-[#D4AF37]" /> Curriculum Coverage
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#171717] border border-[#262626] space-y-1">
                  <span className="text-[10px] text-[#737373] uppercase font-mono">Cohort Milestone</span>
                  <p className="font-semibold text-[#FFFFFF]">Day 7–10: Embeddings & Vector DBs</p>
                </div>

                <div className="p-3 rounded-xl bg-[#171717] border border-[#262626] space-y-1">
                  <span className="text-[10px] text-[#737373] uppercase font-mono">Active Target</span>
                  <p className="font-semibold text-[#D4AF37]">RAG Retrieval & Matching Engines</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle Column: Live Conversation Stream */}
          <div className="lg:col-span-6 flex flex-col bg-[#111111] border border-[#262626] rounded-2xl overflow-hidden">
            {/* Dialogue Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => {
                if (msg.role === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-[11px] font-mono text-[#737373] bg-[#171717] px-3 py-1 rounded-full border border-[#262626]">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isAgent = msg.role === "agent";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-start gap-3.5 ${isAgent ? "" : "flex-row-reverse"}`}
                  >
                    {/* Role Avatar */}
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAgent
                          ? "bg-[#171717] text-[#D4AF37] border-[#D4AF37]/30"
                          : "bg-[#171717] text-[#FFFFFF] border-[#262626]"
                      }`}
                    >
                      {isAgent ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-xl rounded-2xl p-5 text-sm ${
                        isAgent
                          ? "bg-[#171717] border border-[#262626] text-[#FFFFFF]"
                          : "bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#FFFFFF]"
                      }`}
                    >
                      <div className="prose-interview">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {isAgentTyping && <TypingIndicator />}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Text Input Bar */}
            <div className="p-4 border-t border-[#262626] bg-[#0A0A0A]/60">
              <div className="relative flex items-center gap-3">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response... (Press Enter or ⌘+Enter to submit)"
                  className="pr-28 min-h-[70px] text-sm"
                />

                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    disabled
                    className="p-2 rounded-xl bg-[#171717] border border-[#262626] text-[#737373] cursor-not-allowed"
                    title="Voice input disabled"
                  >
                    <MicOff className="h-4 w-4" />
                  </button>

                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || isAgentTyping}
                    icon={<Send className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Candidate Profile & Live Evaluation */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 overflow-y-auto">
            {/* Candidate Profile Summary Card */}
            <Card variant="default" className="p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[#262626] pb-3">
                <div className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] font-semibold text-sm">
                  {candidate.member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">{candidate.member.name}</h3>
                  <p className="text-xs text-[#A3A3A3]">{candidate.member.jobRole}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#171717] p-2 rounded-lg border border-[#262626]">
                  <span className="text-[#737373] block text-[10px]">Experience</span>
                  <span className="text-[#FFFFFF] font-semibold">{candidate.member.yearsExperience} Yrs</span>
                </div>
                <div className="bg-[#171717] p-2 rounded-lg border border-[#262626]">
                  <span className="text-[#737373] block text-[10px]">Missions</span>
                  <span className="text-[#D4AF37] font-mono font-semibold">{candidate.signals.missionsCompleted}/31</span>
                </div>
              </div>
            </Card>

            {/* Live Evaluation Telemetry */}
            <Card variant="default" className="p-5 space-y-4 flex-1">
              <div className="border-b border-[#262626] pb-3">
                <span className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#D4AF37]" /> Live Mastery Meters
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3A3A3]">Embeddings & Vector Search</span>
                    <span className="text-[#D4AF37] font-mono">90%</span>
                  </div>
                  <Progress value={90} size="sm" color="gold" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3A3A3]">Prompt Tuning & Guardrails</span>
                    <span className="text-[#D4AF37] font-mono">85%</span>
                  </div>
                  <Progress value={85} size="sm" color="gold" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3A3A3]">Agentic Tools & MCP</span>
                    <span className="text-[#D4AF37] font-mono">80%</span>
                  </div>
                  <Progress value={80} size="sm" color="gold" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Popups */}
        <FeedbackDrawer
          isOpen={isFeedbackDrawerOpen}
          onClose={() => setIsFeedbackDrawerOpen(false)}
          feedback={feedback}
          onViewFullReport={() => navigate(`/interview/${sessionId}/feedback`)}
        />

        <EndInterviewModal
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onConfirm={handleConfirmEndSession}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageTransition>
  );
}
