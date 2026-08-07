/*
========================================================

File:
components/ui/Progress.tsx

Purpose:
Progress bar component with animated fill and optional label.

Responsibilities:
- Displays progress as a horizontal bar
- Supports color variants for different contexts
- Smooth animation on value changes
- Optionally shows percentage text

Connected Files:
- Interview progress tracking
- Candidate mission completion
- Feedback score display

Depends On:
- motion
- cn utility

Notes:
Value should be between 0 and 100.

========================================================
*/

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const progressColors = {
  default: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
} as const;

interface ProgressProps {
  value: number;
  max?: number;
  color?: keyof typeof progressColors;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Progress({
  value,
  max = 100,
  color = "default",
  showLabel = false,
  size = "md",
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-zinc-500">Progress</span>
          <span className="text-xs text-zinc-400 font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-zinc-800/60 overflow-hidden",
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
