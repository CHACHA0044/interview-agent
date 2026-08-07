/*
========================================================

File:
components/ui/Button.tsx

Purpose:
Reusable button component with multiple variants and sizes.

Responsibilities:
- Renders styled buttons with consistent design tokens
- Supports variants: primary, secondary, ghost, danger, outline
- Supports sizes: sm, md, lg
- Includes loading state with spinner
- Handles disabled states with visual feedback

Connected Files:
- All pages and features that need buttons
- src/lib/cn.ts (class merging)

Depends On:
- react
- clsx / tailwind-merge via cn()
- motion (for hover/tap animations)

Notes:
Use the variant prop to match the action's intent.
Loading state disables the button and shows a spinner.

========================================================
*/

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/20 border border-brand-500/20",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/50",
  ghost:
    "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
  danger:
    "bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/20",
  outline:
    "bg-transparent text-zinc-300 hover:bg-zinc-800/60 border border-zinc-700",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      children,
      disabled,
      type = "button",
      onClick,
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
