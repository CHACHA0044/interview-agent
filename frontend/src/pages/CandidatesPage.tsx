import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, UserCheck, Play, Filter, Award, ChevronRight } from "lucide-react";
import { Badge, Input, Button, SkeletonCard, EmptyState, Progress, Avatar } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { CandidateDetailsModal } from "@/components/features/candidates/CandidateDetailsModal";
import { useCandidates } from "@/hooks/use-candidates";
import type { Candidate } from "@/types";
import { LayoutContainer, Section, LayoutGrid, PageHeading, Surface, Cluster } from "@/components/layout/system";

export function CandidatesPage() {
  const navigate = useNavigate();
  const { data: candidates, isLoading } = useCandidates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);

  const roles = ["ALL", "AI Engineer", "Senior Data Engineer", "DevOps Engineer", "Software Engineer"];

  const filteredCandidates = candidates?.filter((c) => {
    const matchesSearch =
      c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === "ALL" || c.member.jobRole.toLowerCase().includes(selectedRole.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const handleSelectCandidate = (candidate: Candidate) => {
    navigate("/interview/setup", { state: { candidateId: candidate.member.id } });
  };

  return (
    <PageTransition>
      <Section density="tight">
        <LayoutContainer size="dashboard" className="stack stack-lg">
          <PageHeading
            eyebrow={
              <Badge variant="gold" className="px-3 py-1 font-mono text-[11px] w-fit">
                <UserCheck className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
                Cohort Graduate Roster
              </Badge>
            }
            title="Select Candidate"
            description="Choose an Enterprise AI Cohort graduate to configure and launch an adaptive technical interview session."
            actions={
              <span className="text-xs font-mono text-[#737373] bg-[#121212] px-3.5 py-2 rounded-xl border border-[#222222]">
                {filteredCandidates?.length ?? 0} Candidates Available
              </span>
            }
          />

          <Surface padding="md" className="stack stack-md">
            <LayoutGrid gap="md" className="items-center">
              <div className="col-span-4 md:col-span-4 xl:col-span-4">
                <Input
                  placeholder="Search candidate by name, role, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="col-span-4 md:col-span-4 xl:col-span-8">
                <Cluster gap="sm" className="overflow-x-auto pb-1">
                  {roles.map((role) => (
                    <Button
                      key={role}
                      variant="chip"
                      size="chip"
                      pressed={selectedRole === role}
                      onClick={() => setSelectedRole(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </Cluster>
              </div>
            </LayoutGrid>
          </Surface>
        </LayoutContainer>
      </Section>

      <Section>
        <LayoutContainer size="dashboard">
          {isLoading ? (
            <LayoutGrid gap="md">
              <div className="col-span-4 md:col-span-4 xl:col-span-3"><SkeletonCard /></div>
              <div className="col-span-4 md:col-span-4 xl:col-span-3"><SkeletonCard /></div>
              <div className="col-span-4 md:col-span-4 xl:col-span-3"><SkeletonCard /></div>
              <div className="col-span-4 md:col-span-4 xl:col-span-3"><SkeletonCard /></div>
            </LayoutGrid>
          ) : filteredCandidates && filteredCandidates.length > 0 ? (
            <LayoutGrid gap="md">
              {filteredCandidates.map((candidate) => {
                const completionRate = Math.round((candidate.signals.missionsCompleted / 31) * 100);

                return (
                  <Surface
                    key={candidate.member.id}
                    className="col-span-4 md:col-span-4 xl:col-span-3 h-full flex flex-col justify-between"
                    padding="md"
                  >
                    <div className="stack stack-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 group">
                          <Avatar name={candidate.member.name} size="lg" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-mono text-[#D4AF37] block mb-1">{candidate.member.id}</span>
                            <h3 className="text-base font-bold text-white truncate">{candidate.member.name}</h3>
                            <p className="text-xs text-[#A3A3A3] mt-0.5 truncate">{candidate.member.jobRole}</p>
                          </div>
                        </div>
                        <Badge variant="success">Eligible</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-[#1F1F1F] text-xs">
                        <div className="bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                          <span className="text-[#737373] block text-[10px]">Experience</span>
                          <span className="text-white font-semibold mt-0.5 block">{candidate.member.yearsExperience} Years</span>
                        </div>
                        <div className="bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                          <span className="text-[#737373] block text-[10px]">Commit Streak</span>
                          <span className="text-[#D4AF37] font-mono font-semibold mt-0.5 block">{candidate.signals.commitDays} / 31 Days</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailCandidate(candidate)}
                          aria-label={`View details for ${candidate.member.name}`}
                          className="w-full justify-between rounded-lg h-auto py-1 px-0 -my-1"
                        >
                          <span className="text-[#737373] flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-[#D4AF37]" /> Missions Done
                          </span>
                          <span className="text-white font-mono font-medium flex items-center gap-1">
                            {candidate.signals.missionsCompleted} / 31
                            <ChevronRight className="h-3.5 w-3.5 text-[#D4AF37]" />
                          </span>
                        </Button>
                        <Progress value={completionRate} size="sm" color="gold" />
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full justify-between mt-6"
                      onClick={() => handleSelectCandidate(candidate)}
                      icon={<Play className="h-3.5 w-3.5" />}
                    >
                      Configure Assessment
                    </Button>
                  </Surface>
                );
              })}
            </LayoutGrid>
          ) : (
            <EmptyState
              icon={<Filter className="h-10 w-10 text-[#737373]" />}
              title="No candidates match filters"
              description="Adjust your search criteria or role selection to view available cohort candidates."
            />
          )}
        </LayoutContainer>
      </Section>

      <CandidateDetailsModal candidate={detailCandidate} onClose={() => setDetailCandidate(null)} />
    </PageTransition>
  );
}
