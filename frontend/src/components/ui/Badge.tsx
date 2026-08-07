/*
========================================================

File:
components/ui/Badge.tsx

Purpose:
Badge indicator component for the Black & Gold theme.

Responsibilities:
- Displays status chips with precise color accents (Gold, Success, Error, Warning, Neutral)
- Supports minimal capsule styling

Connected Files:
- All pages and feature components

Depends On:
- react
- src/lib/cn.ts

Notes:
Gold variant (#D4AF37) is used for highlighted badges and active status indicators.

========================================================
*/

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = {
  default: "bg-[#171717] text-[#A3A3A3] border-[#262626]",
  gold: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
  success: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30",
  warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  danger: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border tracking-wide",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
