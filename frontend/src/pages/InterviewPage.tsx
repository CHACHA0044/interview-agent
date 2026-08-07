/*
========================================================

File:
pages/InterviewPage.tsx

Purpose:
Main interactive interview screen powering the live dialogue assessment.

Responsibilities:
- Displays live chat stream with Markdown message formatting
- Renders Candidate Profile Sidebar and active interview progress
- Houses session timer and question counter telemetry
- Provides user answer text input and voice submission mock trigger
- Controls Feedback Drawer and End Interview Modal popups

Connected Files:
- src/app/router.tsx (route: /interview/:sessionId)
- src/stores/interview.store.ts
- src/hooks/use-timer.ts
- src/components/features/interview/*

Depends On:
- react
- react-router (useNavigate, useParams)
- react-markdown
- lucide-react
- motion

Notes:
All conversation state and mock AI responses flow through Zustand interview.store.ts.

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
} from "lucide-react";
import { Button, Textarea, Card, Badge, Progress } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useInterviewStore } from "@/stores/interview.store";
import { useTimer } from "@/hooks/use-timer";
import { CandidateProfileSidebar } from "@/components/features/interview/CandidateProfileSidebar";
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
    if (e.key === "Enter" && !e.shiftKey) {
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
        <p className="text-zinc-400">No active interview session found.</p>
        <Button onClick={() => navigate("/interview/setup")}>Configure New Session</Button>
      </div>
    );
  }

  const questionProgress = ((session.currentQuestionIndex + 1) / session.questionCount) * 100;

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)] gap-4">
        <Card variant="glass" className="p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Badge variant="purple" className="py-1 px-3">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Live Interview
            </Badge>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span className="font-mono text-zinc-200">{formattedTime}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
              <span>Question {session.currentQuestionIndex + 1} of {session.questionCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFeedbackDrawerOpen(true)}
              icon={<BarChart2 className="h-3.5 w-3.5" />}
            >
              Metrics
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsEndModalOpen(true)}
              icon={<Square className="h-3.5 w-3.5" />}
            >
              End Interview
            </Button>
          </div>
        </Card>

        <Progress value={questionProgress} size="sm" className="shrink-0" />

        <div className="flex-1 flex gap-6 overflow-hidden">
          <CandidateProfileSidebar
            candidate={session.candidate}
            currentQuestionIndex={session.currentQuestionIndex}
            totalQuestions={session.questionCount}
            elapsedFormatted={formattedTime}
          />

          <Card variant="glass" className="flex-1 flex flex-col justify-between overflow-hidden p-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => {
                if (msg.role === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-xs text-zinc-500 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800">
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
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-3.5 ${isAgent ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAgent
                          ? "bg-brand-500/10 border border-brand-500/20 text-brand-400"
                          : "bg-accent-500/10 border border-accent-500/20 text-accent-400"
                      }`}
                    >
                      {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>

                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-sm ${
                        isAgent
                          ? "bg-zinc-900/80 border border-zinc-800 text-zinc-200"
                          : "bg-brand-600/20 border border-brand-500/30 text-zinc-100"
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

            <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40">
              <div className="relative flex items-center gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response... (Press Enter to submit, Shift+Enter for new line)"
                  className="pr-12 min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isAgentTyping}
                  className="absolute right-3 bottom-3"
                  icon={<Send className="h-4 w-4" />}
                />
              </div>
            </div>
          </Card>
        </div>

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
