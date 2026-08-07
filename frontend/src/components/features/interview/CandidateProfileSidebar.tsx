/*
========================================================

File:
components/features/interview/CandidateProfileSidebar.tsx

Purpose:
Sidebar displaying active candidate profile details during the interview session.

Responsibilities:
- Displays candidate metadata (name, job role, experience, education)
- Displays progress metrics (missions passed, commit streak)
- Shows curriculum coverage status and active topic badges

Connected Files:
- src/pages/InterviewPage.tsx (main container)
- src/stores/interview.store.ts

Depends On:
- react
- lucide-react
- src/components/ui/ (Card, Badge, Progress)

Notes:
Keeps interviewer informed of candidate baseline experience during the call.

========================================================
*/

import { Card } from "@/components/ui";
import type { Candidate } from "@/types";

interface CandidateProfileSidebarProps {
  candidate: Candidate;
  currentQuestionIndex: number;
  totalQuestions: number;
  elapsedFormatted: string;
}

export function CandidateProfileSidebar({
  candidate,
}: CandidateProfileSidebarProps) {
  const { member } = candidate;

  return (
    <aside className="w-80 shrink-0 space-y-4 hidden lg:block">
      {/* Profile Card */}
      <Card variant="glass" className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-base">
            {member.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">{member.name}</h3>
            <p className="text-xs text-zinc-400">{member.jobRole}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-800/60">
          <div>
            <span className="text-zinc-500 block">Experience</span>
            <span className="text-zinc-200 font-medium">{member.yearsExperience} Years</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Education</span>
            <span className="text-zinc-200 font-medium truncate block">{member.education}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
