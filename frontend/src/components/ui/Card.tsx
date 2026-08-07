/*
========================================================

File:
components/ui/Card.tsx

Purpose:
Card container component for the Black & Gold design system.

Responsibilities:
- Renders structured content containers with dark surface backgrounds
- Supports variants: default (#111111), glass (blur overlay), elevated (#171717), ghost
- Provides optional hover animation with gold border highlight

Connected Files:
- All pages and feature components

Depends On:
- react
- motion
- src/lib/cn.ts

Notes:
Card surface uses #111111 with border #262626. Avoid large gold backgrounds.

========================================================
*/

import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

const cardVariants = {
  default: "bg-[#111111] border border-[#262626]",
  glass: "glass-panel",
  elevated: "bg-[#171717] border border-[#262626] shadow-xl shadow-black/60",
  ghost: "bg-transparent border border-[#262626]/60",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
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
            "rounded-2xl transition-all duration-200 cursor-pointer hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5",
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
