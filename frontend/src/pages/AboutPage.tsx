import { Brain, Cpu, Database, Layers, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { Badge } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { LayoutContainer, Section, LayoutGrid, PageHeading, Surface, Stack } from "@/components/layout/system";

export function AboutPage() {
  return (
    <PageTransition>
      <Section density="tight">
        <LayoutContainer size="reading" className="stack stack-lg">
          <PageHeading
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                System Architecture
              </Badge>
            }
            title="Architecture Overview"
            description="An adaptive technical evaluation platform engineered for Enterprise AI Cohort graduates, powered by multi-agent orchestration and precision assessment models."
          />

          <p className="text-sm text-[#A3A3A3] leading-relaxed max-w-reading">
            This route preserves existing business behavior while documenting the architecture model, platform boundaries, and frontend foundation.
          </p>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="content">
          <LayoutGrid gap="md">
            {[
              {
                icon: Brain,
                title: "Adaptive Dialogue Engine",
                text: "Dynamically tailors follow-up questions based on candidate responses and identified skill gaps.",
              },
              {
                icon: Layers,
                title: "Curriculum Grounded Assessment",
                text: "Evaluates candidates across 31 modules spanning vector databases, RAG, agentic tools, MCP, and K8s.",
              },
              {
                icon: ShieldCheck,
                title: "Objective Scoring Guardrails",
                text: "Generates holistic evaluation reports with strengths, gaps, and customized growth trajectories.",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Surface key={pillar.title} className="col-span-4 md:col-span-4 xl:col-span-4 h-full" padding="lg">
                  <Stack gap="sm">
                    <span className="h-10 w-10 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-semibold text-white">{pillar.title}</h2>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">{pillar.text}</p>
                  </Stack>
                </Surface>
              );
            })}
          </LayoutGrid>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="reading">
          <Surface padding="lg" className="stack stack-md">
            <div className="flex items-center gap-3 border-b border-[#262626] pb-4">
              <Terminal className="h-5 w-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-white">Frontend Foundation Specs</h2>
            </div>

            <LayoutGrid gap="md">
              <div className="col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#D4AF37]" /> Core Engine
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm">
                  Built with React 19, TypeScript, and Vite with feature-oriented frontend modules and decoupled mock service state handlers.
                </p>
              </div>

              <div className="col-span-4 md:col-span-4 xl:col-span-6 stack stack-sm">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#D4AF37]" /> State & Data Flow
                </h3>
                <p className="text-[#A3A3A3] leading-relaxed text-sm">
                  Powered by Zustand for global interview state and TanStack Query for async mock request orchestration.
                </p>
              </div>
            </LayoutGrid>
          </Surface>
        </LayoutContainer>
      </Section>
    </PageTransition>
  );
}
