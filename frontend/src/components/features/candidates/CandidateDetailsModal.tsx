/*
========================================================

File:
components/features/candidates/CandidateDetailsModal.tsx

Purpose:
Animated detail modal for a single cohort candidate.

Responsibilities:
- Displays every field for the selected candidate from the dataset
  (identity, experience, commit streak, mission signals, and the full
  mission log with passed/failed/skipped states and attempt counts)
- Uses motion (AnimatePresence) for smooth pop-in/pop-out transitions
- Blurs and darkens the backdrop, closes on backdrop click, close button,
  or Escape

Connected Files:
- src/pages/CandidatesPage.tsx (consumer)
- src/types/index.ts (Candidate / Mission types)

Depends On:
- motion
- lucide-react
- src/components/ui/ (Badge, Progress)
- src/lib/cn.ts

Notes:
Uses Black & Gold palette consistent with the candidate cards.

========================================================
*/

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Award,
  Layers,
  CheckCircle2,
  XCircle,
  SkipForward,
} from "lucide-react";
import { Badge, Progress, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Candidate, Mission } from "@/types";

interface CandidateDetailsModalProps {
  candidate: Candidate | null;
  onClose: () => void;
}

function getMissionStatus(mission: Mission): { label: string; className: string } {
  if (mission.skipped) {
    return {
      label: "Skipped",
      className: "text-[#737373] bg-[#171717] border-[#262626]",
    };
  }

  if (mission.passed) {
    const attempts = mission.attempts ?? 1;
    return {
      label: `Passed · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
      className: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
    };
  }

  const attempts = mission.attempts ?? 0;
  return {
    label: `Failed · ${attempts} attempt${attempts === 1 ? "" : "s"}`,
    className: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20",
  };
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#141414] p-3 rounded-xl border border-[#222222]">
      <span className="text-[#737373] block text-[10px] tracking-wide">{label}</span>
      <span className={cn("mt-0.5 block font-semibold", accent ? "text-[#D4AF37] font-mono" : "text-white")}>
        {value}
      </span>
    </div>
  );
}

export function CandidateDetailsModal({ candidate, onClose }: CandidateDetailsModalProps) {
  useEffect(() => {
    if (!candidate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [candidate, onClose]);

  const passedCount = candidate?.missions.filter((m) => m.passed === true).length ?? 0;
  const failedCount = candidate?.missions.filter((m) => m.passed === false).length ?? 0;
  const skippedCount = candidate?.missions.filter((m) => m.skipped === true).length ?? 0;
  const completionRate = candidate
    ? Math.round((candidate.signals.missionsCompleted / 31) * 100)
    : 0;

  return (
    <AnimatePresence>
      {candidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-details-title"
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#111111] border border-[#262626] shadow-2xl shadow-black/70 z-10"
          >
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 px-7 pt-6 pb-4 bg-[#111111]/95 backdrop-blur-md border-b border-[#1F1F1F] rounded-t-2xl">
              <div className="stack stack-xs">
                <span className="text-[11px] font-mono text-[#D4AF37]">{candidate.member.id}</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 id="candidate-details-title" className="text-xl font-bold text-white">
                    {candidate.member.name}
                  </h3>
                  <Badge variant="success">Eligible</Badge>
                </div>
                <p className="text-sm text-[#A3A3A3]">{candidate.member.jobRole}</p>
              </div>

              <Button
                type="button"
                variant="secondary"
                iconOnly
                onClick={onClose}
                aria-label="Close candidate details"
                className="shrink-0 border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#D4AF37]/50"
                icon={<X className="h-4 w-4" />}
              />
            </div>

            <div className="p-7 stack stack-md">
              <div className="grid grid-cols-2 gap-2.5">
                <StatCell label="Experience" value={`${candidate.member.yearsExperience} Years`} />
                <StatCell label="Education" value={candidate.member.education} />
                <StatCell label="Commit Streak" value={`${candidate.signals.commitDays} / 31 Days`} accent />
                <StatCell label="First-Try Missions" value={`${candidate.signals.missionsFirstTry} / 31`} accent />
              </div>

              <div className="stack stack-xs">
                <div className="flex justify-between text-xs">
                  <span className="text-[#737373] flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-[#D4AF37]" /> Missions Done
                  </span>
                  <span className="text-white font-mono font-medium">
                    {candidate.signals.missionsCompleted} / 31 · {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} size="sm" color="gold" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-2 text-xs text-[#22C55E]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {passedCount} Passed
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 px-3 py-2 text-xs text-[#EF4444]">
                  <XCircle className="h-3.5 w-3.5" /> {failedCount} Failed
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-[#171717] border border-[#262626] px-3 py-2 text-xs text-[#A3A3A3]">
                  <SkipForward className="h-3.5 w-3.5" /> {skippedCount} Skipped
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3 mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#D4AF37]" /> Mission Log
                  </h4>
                  <span className="text-[10px] font-mono text-[#737373]">
                    {candidate.missions.length} RECORDS
                  </span>
                </div>

                <div className="stack stack-sm">
                  {candidate.missions.map((mission) => {
                    const status = getMissionStatus(mission);
                    return (
                      <div
                        key={`${mission.day}-${mission.title}`}
                        className="flex items-center gap-3 rounded-xl bg-[#141414] border border-[#1F1F1F] px-3.5 py-2.5"
                      >
                        <span className="font-mono text-[11px] text-[#D4AF37] w-9 shrink-0">
                          D{String(mission.day).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-xs text-[#A3A3A3] min-w-0 truncate">{mission.title}</span>
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
