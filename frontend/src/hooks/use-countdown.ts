/*
========================================================

File:
hooks/use-countdown.ts

Purpose:
Live countdown to an absolute deadline timestamp.

Responsibilities:
- Returns whole seconds remaining until the target ISO timestamp
- Ticks every second while mounted
- Returns 0 for a null or already-passed deadline

Connected Files:
- src/pages/InterviewPage.tsx (session TTL chip)
- src/pages/FeedbackPage.tsx (session expiry card)

Depends On:
- react (useEffect, useState)

========================================================
*/

import { useEffect, useState } from "react";

function computeRemaining(targetIso: string | null): number {
  if (!targetIso) return 0;
  return Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
}

export function useCountdown(targetIso: string | null): number {
  const [remaining, setRemaining] = useState<number>(() => computeRemaining(targetIso));

  useEffect(() => {
    setRemaining(computeRemaining(targetIso));
    if (!targetIso) return;
    const id = window.setInterval(() => {
      setRemaining(computeRemaining(targetIso));
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return remaining;
}

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
