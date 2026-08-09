import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Settings2, Check, UserCheck, Layers, Clock, UserRound, ListChecks } from "lucide-react";
import { Button, Badge, CustomSelect } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCandidates } from "@/hooks/use-candidates";
import { useCurriculum } from "@/hooks/use-curriculum";
import { useInterviewStore } from "@/stores/interview.store";
import type { InterviewSetupFormData } from "@/types";
import { LayoutContainer, Section, LayoutGrid, PageHeading, Surface, Stack } from "@/components/layout/system";
import { cn } from "@/lib/cn";

const DAY_TYPE_LABELS: Record<string, string> = {
  SETUP: "Setup",
  BUILD: "Build",
  AI_CORE: "AI Core",
  LEARN: "Learn",
  SHIP_IT: "Ship It",
  OPTIMIZE: "Optimize",
  CAPSTONE: "Capstone",
};

function buildTopicList(
  modules: { n: number; title: string; days: [number, number] }[],
  days: { day: number; title: string; type: string }[]
) {
  return modules.map((module) => {
    const [start, end] = module.days;
    const moduleDays = days
      .filter((d) => d.day >= start && d.day <= end)
      .slice(0, 4);
    const highlights = moduleDays
      .map((d) => DAY_TYPE_LABELS[d.type] ?? d.type)
      .filter((label, index, all) => all.indexOf(label) === index)
      .join(", ");
    const desc = `Days ${start}\u2013${end}${highlights ? ` \u00b7 ${highlights}` : ""}`;
    return { name: module.title, desc };
  });
}

const setupSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  questionCount: z.number().min(1).max(20),
  focusTopics: z.array(z.string()).min(1, "Select at least one focus topic"),
  duration: z.number().min(5).max(60),
});

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: candidates } = useCandidates();
  const { data: curriculum } = useCurriculum();
  const { startInterview, isLoading } = useInterviewStore();

  const preselectedCandidateId = (location.state as { candidateId?: string })?.candidateId;

  const availableTopics = useMemo(
    () =>
      curriculum
        ? buildTopicList(curriculum.modules, curriculum.days)
        : [{ name: "Vector Search & Indexing", desc: "Loading curriculum..." }],
    [curriculum]
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    preselectedCandidateId || candidates?.[0]?.member.id || "cand_01"
  );

  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "Environment & Tooling",
    "Data Foundations",
  ]);

  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(5);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InterviewSetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      candidateId: selectedCandidateId,
      questionCount: 5,
      focusTopics: selectedTopics,
      duration: 30,
    },
  });

  const selectedCandidate = candidates?.find((c) => c.member.id === selectedCandidateId) || candidates?.[0];

  useEffect(() => {
    if (candidates && candidates.length > 0 && !selectedCandidateId) {
      const firstId = candidates[0]?.member.id;
      if (firstId) {
        setSelectedCandidateId(firstId);
        setValue("candidateId", firstId);
      }
    }
  }, [candidates, selectedCandidateId, setValue]);

  useEffect(() => {
    if (curriculum && curriculum.modules.length > 0) {
      setSelectedTopics((current) => {
        const valid = current.filter((t) => curriculum.modules.some((m) => m.title === t));
        return valid.length > 0 ? valid : [curriculum.modules[0]!.title, curriculum.modules[1]!.title];
      });
    }
  }, [curriculum]);

  const toggleTopic = (topicName: string) => {
    const updated = selectedTopics.includes(topicName)
      ? selectedTopics.filter((t) => t !== topicName)
      : [...selectedTopics, topicName];

    setSelectedTopics(updated);
    setValue("focusTopics", updated, { shouldValidate: true });
  };

  const handleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setValue("candidateId", candidateId, { shouldValidate: true });
  };

  const handleDurationChange = (value: string) => {
    setDuration(Number(value));
    setValue("duration", Number(value), { shouldValidate: true });
  };

  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(Number(value));
    setValue("questionCount", Number(value), { shouldValidate: true });
  };

  const onSubmit = async (_data: InterviewSetupFormData) => {
    if (!selectedCandidate) return;
    try {
      await startInterview(selectedCandidate);
      navigate(`/interview/sess_${selectedCandidate.member.id}`);
    } catch (err) {
      console.error("Failed to start interview:", err);
    }
  };

  return (
    <PageTransition>
      <Section density="tight">
        <LayoutContainer size="form" className="stack stack-lg">
          <PageHeading
            align="center"
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Settings2 className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                Assessment Calibration Wizard
              </Badge>
            }
            title="Configure Interview Parameters"
            description="Select curriculum topics, session duration, and question depth before launching the assessment."
          />

          <form onSubmit={handleSubmit(onSubmit)} className="stack stack-lg">
            <LayoutGrid gap="md" className="items-start">
              <div className="col-span-4 md:col-span-8 xl:col-span-4">
                <Surface padding="md" className="stack stack-md xl:sticky xl:top-28">
                  <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#D4AF37]" /> Candidate Identity
                    </h2>
                    <span className="text-[10px] font-mono text-[#737373]">STEP 1 OF 3</span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="candidate-select" className="text-xs font-medium text-[#A3A3A3] block">
                      Select Cohort Candidate
                    </label>
                    <CustomSelect
                      id="candidate-select"
                      value={selectedCandidateId}
                      onChange={handleSelectCandidate}
                      options={(candidates ?? []).map((c) => ({
                        value: c.member.id,
                        label: c.member.name,
                        sublabel: c.member.jobRole,
                      }))}
                      placeholder="Select a candidate"
                      ariaLabel="Select cohort candidate"
                      triggerIcon={<UserRound className="h-4 w-4 text-[#D4AF37]" />}
                      optionIcon={<UserRound className="h-3.5 w-3.5 text-[#D4AF37]" />}
                    />
                  </div>

                  {selectedCandidate ? (
                    <div className="surface surface-padding-sm stack stack-sm text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#D4AF37]">{selectedCandidate.member.id}</span>
                        <Badge variant="success">Eligible</Badge>
                      </div>
                      <h3 className="text-sm font-bold text-white">{selectedCandidate.member.name}</h3>
                      <p className="text-[#A3A3A3]">{selectedCandidate.member.jobRole}</p>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F1F] text-[11px]">
                        <div>
                          <span className="text-[#737373] block">Experience</span>
                          <span className="text-white font-semibold">{selectedCandidate.member.yearsExperience} Years</span>
                        </div>
                        <div>
                          <span className="text-[#737373] block">Commit Days</span>
                          <span className="text-[#D4AF37] font-mono font-semibold">{selectedCandidate.signals.commitDays} / 31</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    isLoading={isLoading}
                    icon={<Play className="h-4 w-4" />}
                  >
                    Launch Assessment Session
                  </Button>
                </Surface>
              </div>

              <div className="col-span-4 md:col-span-8 xl:col-span-8 stack stack-md">
                <Surface padding="lg" className="stack stack-md">
                  <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#D4AF37]" /> Curriculum Modules & Topics
                    </h2>
                    <span className="text-xs font-mono text-[#D4AF37]">{selectedTopics.length} Selected</span>
                  </div>

                  {errors.focusTopics ? (
                    <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 p-3 rounded-xl border border-[#EF4444]/20">
                      {errors.focusTopics.message}
                    </p>
                  ) : null}

                  <LayoutGrid gap="sm">
                    {availableTopics.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.name);
                      return (
                        <Button
                          key={topic.name}
                          type="button"
                          variant="chip"
                          aria-pressed={isSelected}
                          onClick={() => toggleTopic(topic.name)}
                          className={cn(
                            "col-span-4 md:col-span-4 xl:col-span-6 text-left rounded-xl p-4 h-auto w-full justify-start items-start border",
                            isSelected
                              ? "bg-[#141414] border-[#D4AF37]/50 text-white hover:bg-[#141414]"
                              : "bg-[#111111] border-[#222222] text-[#A3A3A3] hover:text-white hover:bg-[#111111]"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 w-full">
                            <Stack gap="xs" className="min-w-0">
                              <span className="text-xs font-bold block">{topic.name}</span>
                              <span className="text-[11px] text-[#737373] leading-relaxed">{topic.desc}</span>
                            </Stack>
                            <span
                              className={cn(
                                "h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                                isSelected ? "bg-[#D4AF37] text-[#0A0A0A]" : "bg-[#171717] border border-[#262626]"
                              )}
                              aria-hidden="true"
                            >
                              {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </LayoutGrid>
                </Surface>

                <LayoutGrid gap="md">
                  <Surface className="col-span-4 md:col-span-4 xl:col-span-6" padding="md">
                    <Stack gap="sm">
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#D4AF37]" /> Session Duration
                      </h2>
                      <label htmlFor="duration-select" className="text-xs font-medium text-[#A3A3A3]">
                        Target session length
                      </label>
                      <CustomSelect
                        id="duration-select"
                        value={String(duration)}
                        onChange={handleDurationChange}
                        options={[
                          { value: "15", label: "15 Minutes", sublabel: "Fast Screen" },
                          { value: "30", label: "30 Minutes", sublabel: "Standard Deep Dive" },
                          { value: "45", label: "45 Minutes", sublabel: "Comprehensive" },
                        ]}
                        ariaLabel="Session duration"
                        triggerIcon={<Clock className="h-4 w-4 text-[#D4AF37]" />}
                      />
                    </Stack>
                  </Surface>

                  <Surface className="col-span-4 md:col-span-4 xl:col-span-6" padding="md">
                    <Stack gap="sm">
                      <h2 className="text-sm font-bold text-white">Question Count</h2>
                      <label htmlFor="question-count-select" className="text-xs font-medium text-[#A3A3A3]">
                        Assessment depth target
                      </label>
                      <CustomSelect
                        id="question-count-select"
                        value={String(questionCount)}
                        onChange={handleQuestionCountChange}
                        options={[
                          { value: "3", label: "3 Questions", sublabel: "Express" },
                          { value: "5", label: "5 Questions", sublabel: "Standard" },
                          { value: "8", label: "8 Questions", sublabel: "In-depth" },
                        ]}
                        ariaLabel="Assessment depth target"
                        triggerIcon={<ListChecks className="h-4 w-4 text-[#D4AF37]" />}
                      />
                    </Stack>
                  </Surface>
                </LayoutGrid>
              </div>
            </LayoutGrid>
          </form>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
