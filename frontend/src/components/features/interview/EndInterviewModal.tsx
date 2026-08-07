/*
========================================================

File:
components/features/interview/EndInterviewModal.tsx

Purpose:
Confirmation dialog for concluding an interview session.

Responsibilities:
- Warns user before ending the assessment prematurely
- Uses motion animations for modal entrance/exit

Connected Files:
- src/pages/InterviewPage.tsx

Depends On:
- motion
- lucide-react
- src/components/ui/ (Button)

Notes:
Uses Black & Gold palette with warning amber accents.

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-interview-title"
          className="relative w-full max-w-md rounded-2xl bg-[#111111] border border-[#262626] p-8 space-y-6 z-10 shadow-2xl shadow-black/60"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 id="end-interview-title" className="text-lg font-bold text-[#FFFFFF]">Conclude Assessment?</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Ending now will freeze response recording and synthesize the final performance evaluation report.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262626]">
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
              Conclude & Generate Report
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
