/*
========================================================

File:
components/features/interview/EndInterviewModal.tsx

Purpose:
Confirmation dialog when user clicks to conclude an interview session.

Responsibilities:
- Warns user before finishing interview prematurely
- Confirms submission and triggers final evaluation report generation

Connected Files:
- src/pages/InterviewPage.tsx

Depends On:
- react
- motion
- lucide-react
- src/components/ui/ (Button)

Notes:
Modal prevents accidental exit during an active technical assessment.

========================================================
*/

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui";

interface EndInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function EndInterviewModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: EndInterviewModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-6 z-10 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100">End Interview Session?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Concluding the interview now will freeze response recording and synthesize the final performance assessment.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/80">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onConfirm}
              isLoading={isSubmitting}
              icon={<Check className="h-4 w-4" />}
            >
              Conclude & Submit
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
