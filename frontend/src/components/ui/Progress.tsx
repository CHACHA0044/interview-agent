/*
========================================================

File:
components/ui/Progress.tsx

Purpose:
Progress bar component with Gold fill animation for Black & Gold theme.

Responsibilities:
- Displays progress fill with Gold (#D4AF37) accent
- Renders percentage labels and custom metrics

Connected Files:
- Interview session metrics, Candidate mission meters

Depends On:
- motion
- src/lib/cn.ts

Notes:
Progress bar uses Gold fill over dark track (#171717).

========================================================
*/

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const progressColors = {
  default: "bg-[#D4AF37]",
  gold: "bg-[#D4AF37]",
  success: "bg-[#22C55E]",
  warning: "bg-[#F59E0B]",
  danger: "bg-[#EF4444]",
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
  color = "gold",
  showLabel = false,
  size = "md",
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-xs text-[#737373] font-medium">Completion Meter</span>
          <span className="text-xs text-[#D4AF37] font-mono font-semibold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-[#171717] border border-[#262626] overflow-hidden",
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
