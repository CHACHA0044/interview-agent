/*
========================================================

File:
pages/FeedbackPage.tsx

Purpose:
Executive-grade post-interview evaluation report in a 2-column dashboard layout.

Responsibilities:
- Header: Session details & PDF export actions
- Top Hero: Mastery Rating gauge card
- Middle 2-Column Dashboard:
  - Left: Demonstrated Strengths & Growth Opportunities
  - Right: Topic-by-Topic Mastery Meters
- Bottom: Actionable Next Steps

Connected Files:
- src/app/router.tsx
- src/stores/interview.store.ts

Depends On:
- react, react-router
- lucide-react

Notes:
Uses global max-w-[1440px] px-6 sm:px-10 lg:px-12 container system.

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
  FileText,
  ArrowRight,
  Target,
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
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F1F1F] pb-8">
          <div className="space-y-2">
            <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              Assessment Concluded
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              Performance Evaluation Report
            </h1>
            <p className="text-sm text-[#A3A3A3] max-w-xl">
              Synthesized assessment results with topic-by-topic mastery breakdown and actionable growth recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/candidates")}
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              New Assessment
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<FileText className="h-3.5 w-3.5" />}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Top Hero Score Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0F0F0F] border border-[#1F1F1F] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left max-w-2xl">
            <h2 className="text-2xl font-bold text-[#FFFFFF]">Overall Mastery Rating</h2>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              {feedback.summary}
            </p>
          </div>

          <div className="flex flex-col items-center p-8 rounded-2xl bg-[#141414] border border-[#222222] shrink-0 min-w-[200px]">
            <span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest mb-2">
              Composite Score
            </span>
            <span className="text-6xl font-extrabold text-[#D4AF37] leading-none">
              {feedback.overallScore}
            </span>
            <span className="text-xs font-mono text-[#737373] mt-1">/ 100</span>
            <div className="w-full mt-4">
              <Progress value={feedback.overallScore} size="md" color="gold" />
            </div>
          </div>
        </div>

        {/* 2-Column Executive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Strengths & Growth Areas (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            {/* Strengths */}
            <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-5">
              <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
                <CheckCircle2 className="h-5 w-5 text-[#22C55E]" /> Demonstrated Strengths
              </h3>
              <ul className="space-y-3">
                {feedback.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-[#FFFFFF]"
                  >
                    <span className="h-5 w-5 rounded-md bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-5">
              <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
                <AlertCircle className="h-5 w-5 text-[#F59E0B]" /> Growth Opportunities
              </h3>
              <ul className="space-y-3">
                {feedback.gaps.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-[#FFFFFF]"
                  >
                    <span className="h-5 w-5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Topic Mastery Meters (6 cols) */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-6 h-full">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2.5">
                  <Award className="h-5 w-5 text-[#D4AF37]" /> Topic Mastery Breakdown
                </h3>
                <span className="text-xs font-mono text-[#737373]">
                  {feedback.topicScores.length} Topics Assessed
                </span>
              </div>

              <div className="space-y-5">
                {feedback.topicScores.map((ts) => (
                  <div key={ts.topic} className="space-y-2 p-4 rounded-xl bg-[#141414] border border-[#222222]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#FFFFFF]">{ts.topic}</span>
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">
                        {ts.score} / {ts.maxScore}
                      </span>
                    </div>
                    <Progress value={(ts.score / ts.maxScore) * 100} size="sm" color="gold" />
                    <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">{ts.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Next Steps */}
        {feedback.next && feedback.next.length > 0 && (
          <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-[#1F1F1F] space-y-5">
            <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
              <Target className="h-5 w-5 text-[#D4AF37]" /> Actionable Growth Trajectory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.next.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-[#FFFFFF]"
                >
                  <ArrowRight className="h-4 w-4 text-[#D4AF37] shrink-0" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
