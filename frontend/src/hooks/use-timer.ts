/*
========================================================

File:
hooks/use-timer.ts

Purpose:
Custom hook for managing interview session timer.

Responsibilities:
- Provides elapsed time tracking with start/stop/reset
- Formats time as MM:SS string
- Auto-increments every second when active

Connected Files:
- src/pages/InterviewPage.tsx (consumer)
- src/components/features/interview/SessionTimer.tsx

Depends On:
- react (useEffect, useRef, useState, useCallback)

Notes:
Timer is paused when the interview is not active.
Uses useRef for interval to avoid stale closure issues.

========================================================
*/

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerReturn {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { elapsedSeconds, formattedTime, isRunning, start, stop, reset };
}
