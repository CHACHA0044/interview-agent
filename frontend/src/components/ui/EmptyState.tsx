/*
========================================================

File:
components/ui/EmptyState.tsx

Purpose:
Empty state placeholder for when no data is available.

Responsibilities:
- Displays friendly message when content is empty
- Includes icon, title, description, and optional action

Connected Files:
- CandidatesPage, InterviewPage

Depends On:
- motion
- src/lib/cn.ts

Notes:
Uses muted text colors from Black & Gold palette.

========================================================
*/

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center",
        className
      )}
    >
      <div className="mb-5 text-[#737373]">{icon}</div>
      <h3 className="text-base font-semibold text-[#FFFFFF] mb-2">{title}</h3>
      <p className="text-sm text-[#A3A3A3] max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
