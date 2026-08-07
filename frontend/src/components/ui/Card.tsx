/*
========================================================

File:
components/ui/Card.tsx

Purpose:
Reusable card component with glassmorphism and elevation options.

Responsibilities:
- Renders styled card containers
- Supports glass, solid, and gradient-border variants
- Provides hover lift animation
- Used as a composable container throughout the app

Connected Files:
- All pages that display content in cards
- src/lib/cn.ts

Depends On:
- react
- motion
- cn utility

Notes:
Cards are the primary content containers.
Use the variant prop to match the visual context.

========================================================
*/

import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const cardVariants = {
  default: "bg-zinc-900/80 border border-zinc-800/60",
  glass: "glass",
  elevated: "bg-zinc-900 border border-zinc-800/60 shadow-lg shadow-black/20",
  ghost: "bg-transparent border border-zinc-800/40",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, padding = "md", children, onClick }, ref) => {
    if (hover) {
      return (
        <motion.div
          ref={ref}
          onClick={onClick}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className={cn(
            "rounded-2xl transition-colors duration-200 cursor-pointer hover:border-zinc-700/80",
            cardVariants[variant],
            paddingClasses[padding],
            className
          )}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "rounded-2xl transition-colors duration-200",
          cardVariants[variant],
          paddingClasses[padding],
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
