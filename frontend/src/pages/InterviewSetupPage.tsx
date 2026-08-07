/*
========================================================

File:
pages/InterviewSetupPage.tsx

Purpose:
Guided 2-column interview configuration workflow page.

Responsibilities:
- Left Column: Sticky candidate identity card and quick launch action
- Right Column: Grouped step-by-step form controls (Topics, Duration, Rigor, Guardrails)
- Form validation via React Hook Form & Zod schema

Connected Files:
- src/app/router.tsx
- src/stores/interview.store.ts
- src/hooks/use-candidates.ts

Depends On:
- react, react-router
- react-hook-form, zod
- lucide-react

Notes:
Uses global max-w-[1440px] px-6 sm:px-10 lg:px-12 2-column split layout.

========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Settings2, ShieldCheck, Check, UserCheck, Layers, Clock, Sparkles } from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCandidates } from "@/hooks/use-candidates";
import { useInterviewStore } from "@/stores/interview.store";
import { MOCK_INTERVIEW_TOPICS } from "@/mock";
import type { InterviewSetupFormData } from "@/types";

const setupSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  durationMinutes: z.number().min(5).max(60),
  difficulty: z.enum(["easy", "medium", "hard", "adaptive"]),
  topics: z.array(z.string()).min(1, "Select at least one curriculum topic"),
});

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: candidates } = useCandidates();
  const { startSession, isInitializing } = useInterviewStore();

  const preselectedCandidateId = (location.state as { candidateId?: string })?.candidateId;

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    preselectedCandidateId || candidates?.[0]?.member.id || "cand_01"
  );

  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Vector Search & Indexing",
    "RAG Architecture & HyDE",
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InterviewSetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      candidateId: selectedCandidateId,
      durationMinutes: 30,
      difficulty: "adaptive",
      topics: selectedTopics,
    },
  });

  const selectedCandidate = candidates?.find((c) => c.member.id === selectedCandidateId) || candidates?.[0];

  useEffect(() => {
    if (candidates && candidates.length > 0 && !selectedCandidateId) {
      setSelectedCandidateId(candidates[0].member.id);
      setValue("candidateId", candidates[0].member.id);
    }
  }, [candidates, selectedCandidateId, setValue]);

  const toggleTopic = (topicName: string) => {
    const updated = selectedTopics.includes(topicName)
      ? selectedTopics.filter((t) => t !== topicName)
      : [...selectedTopics, topicName];

    setSelectedTopics(updated);
    setValue("topics", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: InterviewSetupFormData) => {
    try {
      const session = await startSession(data);
      navigate(`/interview/${session.sessionId}`);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 space-y-10">
        {/* Header */}
        <div className="border-b border-[#1F1F1F] pb-8 space-y-2">
          <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
            <Settings2 className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
            Assessment Calibration Wizard
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            Configure Interview Parameters
          </h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl">
            Select curriculum topics, duration, difficulty calibration, and evaluation rubrics before starting.
          </p>
        </div>

        {/* Guided 2-Column Split Layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Candidate Context & Quick Launch (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-6 rounded-2xl space-y-6 sticky top-28 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                <h3 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#D4AF37]" /> Candidate Identity
                </h3>
                <span className="text-[10px] font-mono text-[#737373]">STEP 1 OF 2</span>
              </div>

              {/* Candidate Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#A3A3A3] block">Select Cohort Candidate</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => {
                    setSelectedCandidateId(e.target.value);
                    setValue("candidateId", e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                >
                  {candidates?.map((c) => (
                    <option key={c.member.id} value={c.member.id}>
                      {c.member.name} ({c.member.jobRole})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCandidate && (
                <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#D4AF37]">{selectedCandidate.member.id}</span>
                    <Badge variant="success">Eligible</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-[#FFFFFF]">{selectedCandidate.member.name}</h4>
                  <p className="text-[#A3A3A3]">{selectedCandidate.member.jobRole}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F1F] text-[11px]">
                    <div>
                      <span className="text-[#737373] block">Experience</span>
                      <span className="text-[#FFFFFF] font-semibold">{selectedCandidate.member.yearsExperience} Years</span>
                    </div>
                    <div>
                      <span className="text-[#737373] block">Commit Days</span>
                      <span className="text-[#D4AF37] font-mono font-semibold">{selectedCandidate.signals.commitDays} / 31</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-xl shadow-[#D4AF37]/10"
                  isLoading={isInitializing}
                  icon={<Play className="h-4 w-4" />}
                >
                  Launch Assessment Session
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Configuration Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Curriculum Topics */}
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#D4AF37]" /> Curriculum Modules & Topics
                </h3>
                <span className="text-xs font-mono text-[#D4AF37]">
                  {selectedTopics.length} Topics Selected
                </span>
              </div>

              {errors.topics && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 p-3 rounded-xl border border-[#EF4444]/20">
                  {errors.topics.message}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MOCK_INTERVIEW_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.name);
                  return (
                    <div
                      key={topic.name}
                      onClick={() => toggleTopic(topic.name)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                        isSelected
                          ? "bg-[#141414] border-[#D4AF37]/50 text-[#FFFFFF]"
                          : "bg-[#111111] border border-[#222222] text-[#A3A3A3] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold block">{topic.name}</span>
                        <p className="text-[11px] text-[#737373] leading-relaxed">{topic.description}</p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? "bg-[#D4AF37] text-[#0A0A0A]" : "bg-[#171717] border border-[#262626]"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Duration & Difficulty Calibration */}
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D4AF37]" /> Rigor & Duration Calibration
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A3A3A3] block">Target Session Duration</label>
                  <select
                    {...register("durationMinutes", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value={15}>15 Minutes (Fast Screen)</option>
                    <option value={30}>30 Minutes (Standard Deep Dive)</option>
                    <option value={45}>45 Minutes (Comprehensive)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A3A3A3] block">Evaluation Calibration</label>
                  <select
                    {...register("difficulty")}
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="adaptive">Adaptive (Auto-Calibrate Difficulty)</option>
                    <option value="hard">Hard (Strict Senior Level)</option>
                    <option value="medium">Medium (Standard Cohort Level)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Guardrail Rubrics */}
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
                <div>
                  <span className="text-xs font-semibold text-[#FFFFFF] block">Grounded Evaluation Rubric</span>
                  <span className="text-[11px] text-[#737373]">Enforces zero-hallucination scoring against cohort ground truth</span>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
