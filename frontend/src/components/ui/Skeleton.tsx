/*
========================================================

File:
components/ui/Skeleton.tsx

Purpose:
Skeleton loading placeholders for Black & Gold theme.

Responsibilities:
- Displays subtle shimmer loading states in #171717 surfaces
- Preserves layout dimensions while data fetches asynchronously

Connected Files:
- CandidatesPage, InterviewPage

Depends On:
- react
- src/lib/cn.ts

Notes:
Shimmer animation defined in index.css.

========================================================
*/

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer rounded-xl bg-[#171717]",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#171717] border border-[#262626] max-w-lg">
      <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
