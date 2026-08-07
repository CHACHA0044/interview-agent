/*
========================================================

File:
pages/InterviewSetupPage.tsx

Purpose:
Configures interview parameters before launching a technical session.

Responsibilities:
- Select candidate (if not passed via navigation state)
- Configure target question count, topics, and duration
- Initialize interview store and redirect to active interview screen

Connected Files:
- src/app/router.tsx (route: /interview/setup)
- src/stores/interview.store.ts
- src/hooks/use-candidates.ts
- src/mock/interview.ts (topics)

Depends On:
- react
- react-router (useNavigate, useLocation)
- react-hook-form, zod
- lucide-react

Notes:
Pre-populates candidate details if selected from CandidatesPage.

========================================================
*/

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Settings2, User, BookOpen, Clock } from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Settings2 className="h-7 w-7 text-brand-400" />
            Interview Session Configuration
          </h1>
          <p className="text-zinc-400 text-sm">
            Set assessment parameters and customize the AI interviewer's focus before starting.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card variant="glass" className="space-y-4 p-6">
            <label className="block text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-400" /> Target Candidate
            </label>

            {isLoading ? (
              <div className="h-10 bg-zinc-800/50 rounded-xl animate-pulse" />
            ) : (
              <select
                {...register("candidateId")}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="" disabled>Select Candidate</option>
                {candidates?.map((c) => (
                  <option key={c.member.id} value={c.member.id}>
                    {c.member.name} ({c.member.jobRole}) — {c.member.id}
                  </option>
                ))}
              </select>
            )}

            {errors.candidateId && (
              <p className="text-xs text-red-400">{errors.candidateId.message}</p>
            )}

            {selectedCandidate && (
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs flex justify-between items-center text-zinc-400">
                <span>Education: {selectedCandidate.member.education}</span>
                <span>Missions Passed: {selectedCandidate.signals.missionsCompleted}</span>
              </div>
            )}
          </Card>

          <Card variant="glass" className="space-y-4 p-6">
            <label className="block text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" /> Assessment Topics
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOCK_INTERVIEW_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <div
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-500/10 border-brand-500/40 text-brand-300"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {topic}
                  </div>
                );
              })}
            </div>
            {errors.focusTopics && (
              <p className="text-xs text-red-400">{errors.focusTopics.message}</p>
            )}
          </Card>

          <Card variant="glass" className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 block">Question Count</label>
              <Input
                type="number"
                {...register("questionCount", { valueAsNumber: true })}
                error={!!errors.questionCount}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 block flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400" /> Session Target Time (Minutes)
              </label>
              <Input
                type="number"
                {...register("duration", { valueAsNumber: true })}
                error={!!errors.duration}
              />
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full justify-center"
            icon={<Play className="h-4 w-4" />}
          >
            Launch Interview Session
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}
