/*
========================================================

File:
pages/InterviewSetupPage.tsx

Purpose:
Guided setup interface for calibrating AI assessment parameters prior to session launch.

Responsibilities:
- Candidate selection with real-time profile preview
- Multi-select assessment topic chips with Gold selection highlights
- Question count & duration sliders/inputs
- Live session preview sidebar with summary specs
- Form submission & navigation to active interview

Connected Files:
- src/app/router.tsx
- src/stores/interview.store.ts
- src/hooks/use-candidates.ts

Depends On:
- react
- react-router
- react-hook-form, zod
- lucide-react

Notes:
Adheres strictly to Black & Gold design system with zero header overlapping.

========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Settings2, ShieldCheck, Check } from "lucide-react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCandidates } from "@/hooks/use-candidates";
import { useInterviewStore } from "@/stores/interview.store";
import { MOCK_INTERVIEW_TOPICS } from "@/mock";
import type { InterviewSetupFormData } from "@/types";

const schema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  questionCount: z.number().min(3).max(15),
  focusTopics: z.array(z.string()).min(1, "Select at least one focus topic"),
  duration: z.number().min(15).max(60),
});

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: candidates, isLoading } = useCandidates();
  const startInterview = useInterviewStore((s) => s.startInterview);

  const defaultCandidateId = (location.state as { candidateId?: string })?.candidateId ?? "";

  const [selectedTopics, setSelectedTopics] = useState<string[]>(MOCK_INTERVIEW_TOPICS.slice(0, 3));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InterviewSetupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      candidateId: defaultCandidateId,
      questionCount: 5,
      focusTopics: MOCK_INTERVIEW_TOPICS.slice(0, 3),
      duration: 30,
    },
  });

  const currentCandidateId = watch("candidateId");
  const questionCount = watch("questionCount");
  const duration = watch("duration");

  useEffect(() => {
    if (defaultCandidateId) {
      setValue("candidateId", defaultCandidateId);
    } else if (candidates && candidates.length > 0 && !currentCandidateId) {
      setValue("candidateId", candidates[0]!.member.id);
    }
  }, [candidates, defaultCandidateId, setValue, currentCandidateId]);

  const toggleTopic = (topic: string) => {
    const updated = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];

    setSelectedTopics(updated);
    setValue("focusTopics", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: InterviewSetupFormData) => {
    const candidate = candidates?.find((c) => c.member.id === data.candidateId);
    if (!candidate) return;

    await startInterview(candidate);
    const session = useInterviewStore.getState().session;
    if (session) {
      navigate(`/interview/${session.sessionId}`);
    }
  };

  const selectedCandidate = candidates?.find((c) => c.member.id === currentCandidateId);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-10">
        {/* Page Header */}
        <div className="border-b border-[#262626] pb-8 space-y-2">
          <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
            <Settings2 className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
            Session Configuration
          </Badge>
          <h1 className="text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            Configure Assessment Parameters
          </h1>
          <p className="text-sm text-[#A3A3A3] max-w-2xl">
            Calibrate the AI interviewer's focus areas, target candidate baseline, and question volume prior to launching the live session.
          </p>
        </div>

        {/* 2-Column Guided Layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Controls Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Target Candidate */}
            <Card variant="default" className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-mono text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-base font-bold text-[#FFFFFF]">Target Candidate Selection</h3>
                </div>
              </div>

              {isLoading ? (
                <div className="h-12 bg-[#171717] rounded-xl animate-pulse" />
              ) : (
                <select
                  {...register("candidateId")}
                  className="w-full rounded-xl bg-[#111111] border border-[#262626] px-4 py-3.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all cursor-pointer"
                >
                  <option value="" disabled>Select a candidate from the cohort...</option>
                  {candidates?.map((c) => (
                    <option key={c.member.id} value={c.member.id}>
                      {c.member.name} ({c.member.jobRole}) — {c.member.id}
                    </option>
                  ))}
                </select>
              )}

              {errors.candidateId && (
                <p className="text-xs text-[#EF4444]">{errors.candidateId.message}</p>
              )}
            </Card>

            {/* Step 2: Assessment Focus Topics */}
            <Card variant="default" className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-mono text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-base font-bold text-[#FFFFFF]">Curriculum Focus Topics</h3>
                </div>
                <span className="text-xs text-[#737373] font-mono">
                  {selectedTopics.length} Topics Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_INTERVIEW_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <div
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`p-4 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37] shadow-sm"
                          : "bg-[#171717] border-[#262626] text-[#A3A3A3] hover:border-[#383838] hover:text-[#FFFFFF]"
                      }`}
                    >
                      <span>{topic}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#D4AF37]" />}
                    </div>
                  );
                })}
              </div>

              {errors.focusTopics && (
                <p className="text-xs text-[#EF4444]">{errors.focusTopics.message}</p>
              )}
            </Card>

            {/* Step 3: Question Volume & Timing */}
            <Card variant="default" className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <div className="flex items-center gap-3">
                  <span className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-mono text-xs font-bold">
                    3
                  </span>
                  <h3 className="text-base font-bold text-[#FFFFFF]">Assessment Telemetry Parameters</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A3A3A3] block">Question Volume (3-15)</label>
                  <Input
                    type="number"
                    {...register("questionCount", { valueAsNumber: true })}
                    error={!!errors.questionCount}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A3A3A3] block">Target Session Time (Minutes)</label>
                  <Input
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    error={!!errors.duration}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Live Session Preview Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card variant="elevated" className="p-6 space-y-6 sticky top-28">
              <div className="border-b border-[#262626] pb-4">
                <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" /> Session Specs Preview
                </h3>
              </div>

              {selectedCandidate ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] space-y-1">
                    <span className="text-[10px] text-[#737373] uppercase tracking-wider font-mono">Candidate</span>
                    <p className="font-bold text-[#FFFFFF] text-sm">{selectedCandidate.member.name}</p>
                    <p className="text-[#A3A3A3]">{selectedCandidate.member.jobRole}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-[#111111] border border-[#262626]">
                      <span className="text-[10px] text-[#737373] block">Questions</span>
                      <span className="text-base font-mono font-bold text-[#D4AF37]">{questionCount || 5}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#111111] border border-[#262626]">
                      <span className="text-[10px] text-[#737373] block">Target Time</span>
                      <span className="text-base font-mono font-bold text-[#D4AF37]">{duration || 30}m</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111111] border border-[#262626] space-y-1.5">
                    <span className="text-[10px] text-[#737373] uppercase tracking-wider font-mono">Focus Scope</span>
                    <ul className="space-y-1 text-[#A3A3A3]">
                      {selectedTopics.map((t) => (
                        <li key={t} className="flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#737373] text-center py-6">Select a candidate to view preview.</p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                icon={<Play className="h-4 w-4" />}
              >
                Launch Assessment
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
