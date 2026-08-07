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
import { Badge, Progress, Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useInterviewStore } from "@/stores/interview.store";
import { MOCK_FEEDBACK } from "@/mock";
import type { InterviewFeedback } from "@/types";
import { LayoutContainer, Section, LayoutGrid, PageHeading, Surface, Stack, Cluster } from "@/components/layout/system";

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
      <Section density="tight">
        <LayoutContainer size="dashboard" className="stack stack-lg">
          <PageHeading
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                Assessment Concluded
              </Badge>
            }
            title="Performance Evaluation Report"
            description="Synthesized assessment results with topic mastery breakdown and actionable recommendations."
            actions={
              <Cluster gap="sm">
                <Button variant="outline" size="sm" onClick={() => navigate("/candidates")} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                  New Assessment
                </Button>
                <Button variant="secondary" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>
                  Export PDF
                </Button>
              </Cluster>
            }
          />

          <Surface padding="lg" elevated className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <Stack gap="sm" className="max-w-reading">
              <h2 className="text-2xl font-bold text-white">Overall Mastery Rating</h2>
              <p className="text-sm text-[#A3A3A3] leading-relaxed">{feedback.summary}</p>
            </Stack>

            <div className="surface surface-padding-md text-center min-w-[220px]">
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-widest block mb-2">Composite Score</span>
              <span className="text-6xl font-extrabold text-[#D4AF37] leading-none">{feedback.overallScore}</span>
              <span className="text-xs font-mono text-[#737373] mt-1 block">/ 100</span>
              <div className="mt-4">
                <Progress value={feedback.overallScore} size="md" color="gold" />
              </div>
            </div>
          </Surface>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="dashboard">
          <LayoutGrid gap="md">
            <div className="col-span-4 md:col-span-8 xl:col-span-6 stack stack-md">
              <Surface padding="lg" className="stack stack-md">
                <h3 className="text-base font-bold text-white flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
                  <CheckCircle2 className="h-5 w-5 text-[#22C55E]" /> Demonstrated Strengths
                </h3>
                <ul className="stack stack-sm">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-white">
                      <span className="h-5 w-5 rounded-md bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </Surface>

              <Surface padding="lg" className="stack stack-md">
                <h3 className="text-base font-bold text-white flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B]" /> Growth Opportunities
                </h3>
                <ul className="stack stack-sm">
                  {feedback.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-white">
                      <span className="h-5 w-5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{g}</span>
                    </li>
                  ))}
                </ul>
              </Surface>
            </div>

            <div className="col-span-4 md:col-span-8 xl:col-span-6">
              <Surface padding="lg" className="stack stack-md h-full">
                <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2.5">
                    <Award className="h-5 w-5 text-[#D4AF37]" /> Topic Mastery Breakdown
                  </h3>
                  <span className="text-xs font-mono text-[#737373]">{feedback.topicScores.length} Topics</span>
                </div>

                <div className="stack stack-sm">
                  {feedback.topicScores.map((ts) => (
                    <div key={ts.topic} className="space-y-2 p-4 rounded-xl bg-[#141414] border border-[#222222]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-white">{ts.topic}</span>
                        <span className="text-xs font-mono font-bold text-[#D4AF37]">
                          {ts.score} / {ts.maxScore}
                        </span>
                      </div>
                      <Progress value={(ts.score / ts.maxScore) * 100} size="sm" color="gold" />
                      <p className="text-[11px] text-[#A3A3A3] leading-relaxed">{ts.notes}</p>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </LayoutGrid>
        </LayoutContainer>
      </Section>

      {feedback.next && feedback.next.length > 0 ? (
        <Section>
          <LayoutContainer size="content">
            <Surface padding="lg" className="stack stack-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2.5 border-b border-[#1F1F1F] pb-4">
                <Target className="h-5 w-5 text-[#D4AF37]" /> Actionable Growth Trajectory
              </h3>
              <LayoutGrid gap="sm">
                {feedback.next.map((n, i) => (
                  <div key={i} className="col-span-4 md:col-span-4 xl:col-span-6 flex items-center gap-3 bg-[#141414] p-4 rounded-xl border border-[#222222] text-xs text-white">
                    <ArrowRight className="h-4 w-4 text-[#D4AF37] shrink-0" />
                    <span>{n}</span>
                  </div>
                ))}
              </LayoutGrid>
            </Surface>
          </LayoutContainer>
        </Section>
      ) : null}
    </PageTransition>
  );
}
