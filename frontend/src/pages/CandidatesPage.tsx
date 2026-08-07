/*
========================================================

File:
pages/CandidatesPage.tsx

Purpose:
Candidate roster management and assessment selection view.

Responsibilities:
- Displays candidate roster from candidates.json dataset in a clean hybrid layout
- Filters by candidate search query and job role chip selectors
- Displays mission completion stats, experience years, and commit streak telemetry
- Initiates session configuration flow

Connected Files:
- src/app/router.tsx
- src/hooks/use-candidates.ts

Depends On:
- react
- react-router (useNavigate)
- lucide-react

Notes:
Adheres to 8px grid system with clear visual hierarchy and Gold accent action triggers.

========================================================
*/

import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, UserCheck, Play, Filter, Award } from "lucide-react";
import { Card, Badge, Input, Button, SkeletonCard, EmptyState, Progress } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";
import { useCandidates } from "@/hooks/use-candidates";
import type { Candidate } from "@/types";

export function CandidatesPage() {
  const navigate = useNavigate();
  const { data: candidates, isLoading } = useCandidates();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  const roles = ["ALL", "AI Engineer", "Senior Data Engineer", "DevOps Engineer", "Software Engineer"];

  const filteredCandidates = candidates?.filter((c) => {
    const matchesSearch =
      c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.member.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      selectedRole === "ALL" || c.member.jobRole.toLowerCase().includes(selectedRole.toLowerCase());

    return matchesSearch && matchesRole;
  });

  const handleSelectCandidate = (candidate: Candidate) => {
    navigate("/interview/setup", { state: { candidateId: candidate.member.id } });
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#262626] pb-8">
          <div className="space-y-2">
            <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
              <UserCheck className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              Cohort Graduate Roster
            </Badge>
            <h1 className="text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              Select Candidate
            </h1>
            <p className="text-sm text-[#A3A3A3] max-w-xl">
              Choose an Enterprise AI Cohort graduate to configure and launch an adaptive technical interview session.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#737373]">
              {filteredCandidates?.length ?? 0} Candidates Available
            </span>
          </div>
        </div>

        {/* Filter & Search Bar Panel */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111111] p-4 rounded-2xl border border-[#262626]">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search candidate by name, role, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Role Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedRole === role
                    ? "bg-[#D4AF37] text-[#0A0A0A] font-semibold shadow-sm"
                    : "bg-[#171717] text-[#A3A3A3] hover:text-[#FFFFFF] border border-[#262626]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCandidates && filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => {
              const completionRate = Math.round((candidate.signals.missionsCompleted / 31) * 100);

              return (
                <Card
                  key={candidate.member.id}
                  variant="default"
                  hover
                  className="flex flex-col justify-between p-6 space-y-6 group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-[#D4AF37] block mb-1">
                          {candidate.member.id}
                        </span>
                        <h3 className="text-lg font-bold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
                          {candidate.member.name}
                        </h3>
                        <p className="text-xs text-[#A3A3A3] mt-0.5">{candidate.member.jobRole}</p>
                      </div>
                      <Badge variant="success">Eligible</Badge>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#262626] text-xs">
                      <div className="bg-[#171717] p-2.5 rounded-xl border border-[#262626]">
                        <span className="text-[#737373] block text-[10px]">Experience</span>
                        <span className="text-[#FFFFFF] font-semibold mt-0.5 block">
                          {candidate.member.yearsExperience} Years
                        </span>
                      </div>
                      <div className="bg-[#171717] p-2.5 rounded-xl border border-[#262626]">
                        <span className="text-[#737373] block text-[10px]">Commit Days</span>
                        <span className="text-[#D4AF37] font-mono font-semibold mt-0.5 block">
                          {candidate.signals.commitDays} / 31
                        </span>
                      </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#737373] flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-[#D4AF37]" /> Missions Completed
                        </span>
                        <span className="text-[#FFFFFF] font-mono font-medium">
                          {candidate.signals.missionsCompleted} / 31
                        </span>
                      </div>
                      <Progress value={completionRate} size="sm" color="gold" />
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => handleSelectCandidate(candidate)}
                    icon={<Play className="h-3.5 w-3.5" />}
                  >
                    Configure Assessment
                  </Button>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Filter className="h-10 w-10 text-[#737373]" />}
            title="No candidates match filters"
            description="Adjust your search criteria or role selection to view available cohort candidates."
          />
        )}
      </div>
    </PageTransition>
  );
}
