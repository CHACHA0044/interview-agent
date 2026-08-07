/*
========================================================

File:
pages/CandidatesPage.tsx

Purpose:
Candidate selection roster with responsive 4-column wide grid layout.

Responsibilities:
- Displays candidate roster in a responsive 4-column dashboard layout (xl:grid-cols-4)
- Provides top filter bar with search input and role pill selectors
- Ensures uniform card heights, spacing rhythm, and button baselines

Connected Files:
- src/app/router.tsx
- src/hooks/use-candidates.ts

Depends On:
- react
- react-router (useNavigate)
- lucide-react

Notes:
Uses global max-w-[1440px] px-6 sm:px-10 lg:px-12 container system.

========================================================
*/

import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, UserCheck, Play, Filter, Award } from "lucide-react";
import { Badge, Input, Button, SkeletonCard, EmptyState, Progress } from "@/components/ui";
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
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F1F1F] pb-8">
          <div className="space-y-2">
            <Badge variant="gold" className="px-3 py-1 font-mono text-[11px]">
              <UserCheck className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" />
              Cohort Graduate Roster
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              Select Candidate
            </h1>
            <p className="text-sm text-[#A3A3A3] max-w-xl">
              Choose an Enterprise AI Cohort graduate to configure and launch an adaptive technical interview session.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono text-[#737373] bg-[#121212] px-3.5 py-2 rounded-xl border border-[#222222]">
              {filteredCandidates?.length ?? 0} Candidates Available
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0F0F0F] p-4 sm:p-5 rounded-2xl border border-[#1F1F1F]">
          <div className="w-full lg:w-96">
            <Input
              placeholder="Search candidate by name, role, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Role Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  selectedRole === role
                    ? "bg-[#D4AF37] text-[#0A0A0A] font-semibold shadow-sm"
                    : "bg-[#141414] text-[#A3A3A3] hover:text-[#FFFFFF] border border-[#222222]"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive 4-Column Roster Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCandidates && filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCandidates.map((candidate) => {
              const completionRate = Math.round((candidate.signals.missionsCompleted / 31) * 100);

              return (
                <div
                  key={candidate.member.id}
                  className="bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#D4AF37]/40 transition-all duration-200 p-6 rounded-2xl flex flex-col justify-between space-y-6 group h-full shadow-lg"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-[#D4AF37] block mb-1">
                          {candidate.member.id}
                        </span>
                        <h3 className="text-base font-bold text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
                          {candidate.member.name}
                        </h3>
                        <p className="text-xs text-[#A3A3A3] mt-0.5">{candidate.member.jobRole}</p>
                      </div>
                      <Badge variant="success">Eligible</Badge>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-[#1F1F1F] text-xs">
                      <div className="bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                        <span className="text-[#737373] block text-[10px]">Experience</span>
                        <span className="text-[#FFFFFF] font-semibold mt-0.5 block">
                          {candidate.member.yearsExperience} Years
                        </span>
                      </div>
                      <div className="bg-[#141414] p-2.5 rounded-xl border border-[#222222]">
                        <span className="text-[#737373] block text-[10px]">Commit Streak</span>
                        <span className="text-[#D4AF37] font-mono font-semibold mt-0.5 block">
                          {candidate.signals.commitDays} / 31 Days
                        </span>
                      </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#737373] flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-[#D4AF37]" /> Missions Done
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
                </div>
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
