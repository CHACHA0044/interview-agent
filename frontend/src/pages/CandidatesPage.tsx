/*
========================================================

File:
pages/CandidatesPage.tsx

Purpose:
Candidate selection and roster management view.

Responsibilities:
- Displays candidate roster from candidates.json dataset
- Filters candidates by search query and experience level
- Allows selecting a candidate to initiate interview setup
- Displays cohort completion stats and commit activity signals

Connected Files:
- src/app/router.tsx (route: /candidates)
- src/hooks/use-candidates.ts (fetches candidates)
- src/components/ui/ (Card, Badge, Input, Button, Skeleton)

Depends On:
- react
- react-router (useNavigate)
- lucide-react

Notes:
Allows administrators/interviewers to pick candidates for assessment.

========================================================
*/

import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, UserCheck, Play, Filter, Award } from "lucide-react";
import { Card, Badge, Input, Button, SkeletonCard, EmptyState } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCandidates } from "@/hooks/use-candidates";
import type { Candidate } from "@/types";

export function CandidatesPage() {
  const navigate = useNavigate();
  const { data: candidates, isLoading } = useCandidates();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCandidates = candidates?.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.member.name.toLowerCase().includes(query) ||
      c.member.jobRole.toLowerCase().includes(query) ||
      c.member.id.toLowerCase().includes(query)
    );
  });

  const handleSelectCandidate = (candidate: Candidate) => {
    navigate("/interview/setup", { state: { candidateId: candidate.member.id } });
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Cohort Candidates</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Select a candidate from the Enterprise AI Cohort to launch an adaptive technical interview session.
            </p>
          </div>

          <Badge variant="purple" className="self-start md:self-auto py-1 px-3">
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            {candidates?.length ?? 0} Eligible Graduates
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search candidate by name, role, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCandidates && filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <Card
                key={candidate.member.id}
                variant="glass"
                hover
                className="flex flex-col justify-between space-y-4 p-6 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-brand-400 font-medium">
                        {candidate.member.id}
                      </span>
                      <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-brand-300 transition-colors">
                        {candidate.member.name}
                      </h3>
                      <p className="text-xs text-zinc-400">{candidate.member.jobRole}</p>
                    </div>
                    <Badge variant="success">Ready</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-y border-zinc-800/60 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Experience</span>
                      <span className="font-medium text-zinc-300">
                        {candidate.member.yearsExperience} Years
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Commit Days</span>
                      <span className="font-medium text-zinc-300">
                        {candidate.signals.commitDays} / 31
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    <span>{candidate.signals.missionsCompleted} Missions completed</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-between mt-2"
                  onClick={() => handleSelectCandidate(candidate)}
                  icon={<Play className="h-3.5 w-3.5" />}
                >
                  Configure Session
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Filter className="h-10 w-10 text-zinc-600" />}
            title="No candidates found"
            description="Try adjusting your search criteria to find cohort candidates."
          />
        )}
      </div>
    </PageTransition>
  );
}
