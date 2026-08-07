/*
========================================================

File:
components/ui/Badge.tsx

Purpose:
Small status indicator badges with color coding.

Responsibilities:
- Displays status labels with appropriate colors
- Supports multiple variants matching STATUS_COLORS
- Used for tags, status indicators, and labels

Connected Files:
- Candidate cards (status badges)
- Interview UI (difficulty, topic badges)
- src/constants/index.ts (STATUS_COLORS)

Depends On:
- cn utility

Notes:
Keep badges compact. Use variant prop to communicate status.

========================================================
*/

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700/50",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  purple: "bg-brand-500/10 text-brand-400 border-brand-500/20",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        "transition-colors duration-200",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
