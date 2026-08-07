/*
========================================================

File:
pages/FeedbackPage.tsx

Purpose:
Displays the post-interview evaluation report and performance breakdown.

Responsibilities:
- Renders overall score, strengths, growth areas, and recommended next steps
- Breaks down scores topic-by-topic
- Allows exporting or launching new interview session

Connected Files:
- src/app/router.tsx (route: /interview/:sessionId/feedback)
- src/stores/interview.store.ts
- src/mock/feedback.ts

Depends On:
- react
- react-router (useNavigate)
- lucide-react
- src/components/ui/ (Card, Badge, Progress, Button)

Notes:
Displays final evaluation metrics synthesized by the AI agent.

========================================================
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, Badge, Progress, Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useInterviewStore } from "@/stores/interview.store";
import { MOCK_FEEDBACK } from "@/mock";
import type { InterviewFeedback } from "@/types";

export function FeedbackPage() {
  const navigate = useNavigate();
  const { feedback: storeFeedback } = useInterviewStore();
  const [feedback, setFeedback] = useState<InterviewFeedback>(storeFeedback || MOCK_FEEDBACK);

  useEffect(() => {
    if (storeFeedback) {
      setFeedback(storeFeedback);
    }
  }, [storeFeedback]);

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Badge variant="purple" className="mb-2">
              <Sparkles className="h-3 w-3 mr-1" /> Evaluation Complete
            </Badge>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Interview Performance Report</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Synthesized evaluation for candidate assessment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/interview/setup")}
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              New Interview
            </Button>
          </div>
        </div>

        <Card variant="glass" className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold text-zinc-100">Overall Mastery Rating</h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              {feedback.summary}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shrink-0 min-w-[160px]">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Score
            </span>
            <span className="text-5xl font-extrabold text-brand-400">{feedback.overallScore}%</span>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="space-y-4 p-6">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Technical Strengths
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="glass" className="space-y-4 p-6">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" /> Growth Areas
            </h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              {feedback.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card variant="glass" className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-400" /> Topic Breakdown
          </h3>

          <div className="space-y-4">
            {feedback.topicScores.map((ts) => (
              <div key={ts.topic} className="space-y-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-zinc-200">{ts.topic}</span>
                  <span className="font-mono text-brand-400">{ts.score} / {ts.maxScore}</span>
                </div>
                <Progress value={(ts.score / ts.maxScore) * 100} size="sm" />
                <p className="text-xs text-zinc-400 mt-1">{ts.notes}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
