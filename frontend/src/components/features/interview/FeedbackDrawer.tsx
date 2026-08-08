/*
========================================================

File:
components/features/interview/FeedbackDrawer.tsx

Purpose:
Slide-out drawer displaying interim interview telemetry.

Responsibilities:
- Displays live performance metrics in a slide panel
- Gold-accented score display and progress bars

Connected Files:
- src/pages/InterviewPage.tsx

Depends On:
- motion
- lucide-react
- src/components/ui/

Notes:
Uses Black & Gold palette for all surfaces and accent elements.

========================================================
*/

import { motion, AnimatePresence } from "motion/react";
import { X, Award, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Card, Progress, Button } from "@/components/ui";
import type { InterviewFeedback } from "@/types";

interface FeedbackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: InterviewFeedback | null;
  onViewFullReport?: () => void;
}

export function FeedbackDrawer({
  isOpen,
  onClose,
  feedback,
  onViewFullReport,
}: FeedbackDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0A0A] border-l border-[#262626] z-50 p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#D4AF37]" /> Session Telemetry
                </h2>
                <Button
                  variant="ghost"
                  iconOnly
                  size="sm"
                  onClick={onClose}
                  aria-label="Close telemetry panel"
                  className="rounded-lg text-[#737373]"
                  icon={<X className="h-5 w-5" />}
                />
              </div>

              {feedback ? (
                <div className="space-y-6">
                  <Card variant="default" className="text-center p-6 space-y-3">
                    <span className="text-[10px] text-[#737373] font-mono uppercase tracking-widest">
                      Overall Score
                    </span>
                    <div className="text-5xl font-extrabold text-[#D4AF37]">
                      {feedback.overallScore}%
                    </div>
                    <Progress value={feedback.overallScore} showLabel color="gold" />
                  </Card>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> Key Strengths
                    </h3>
                    <div className="space-y-1.5">
                      {feedback.strengths.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-xs text-[#FFFFFF] bg-[#171717] p-3 rounded-xl border border-[#262626]">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B]" /> Growth Areas
                    </h3>
                    <div className="space-y-1.5">
                      {feedback.gaps.slice(0, 2).map((g, i) => (
                        <div key={i} className="text-xs text-[#FFFFFF] bg-[#171717] p-3 rounded-xl border border-[#262626]">
                          {g}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#737373] text-center py-8">
                  Feedback report is generated automatically upon interview completion.
                </p>
              )}
            </div>

            {feedback && onViewFullReport && (
              <Button
                onClick={onViewFullReport}
                className="w-full justify-center"
                icon={<ArrowRight className="h-4 w-4" />}
              >
                View Full Report
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
