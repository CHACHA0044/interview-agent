/*
========================================================

File:
components/layout/PageTransition.tsx

Purpose:
Animated wrapper for page transitions using Motion.

Responsibilities:
- Wraps page content with enter/exit animations
- Provides smooth fade + slide transitions between routes
- Respects reduced motion preferences

Connected Files:
- All page components (wrap their content)
- src/hooks/use-reduced-motion.ts

Depends On:
- motion
- react

Notes:
Wrap every page's root content with this component.
Animations are disabled when user prefers reduced motion.

========================================================
*/

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
