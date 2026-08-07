/*
========================================================

File:
hooks/use-reduced-motion.ts

Purpose:
Hook to detect user's motion preferences for accessibility.

Responsibilities:
- Checks prefers-reduced-motion media query
- Updates when system preference changes
- Used to disable animations for accessibility

Connected Files:
- Any component using Motion animations
- src/components/ui/ (animation consumers)

Depends On:
- react (useEffect, useState)

Notes:
Always respect this preference. When true, skip
or simplify animations for accessibility compliance.

========================================================
*/

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}
