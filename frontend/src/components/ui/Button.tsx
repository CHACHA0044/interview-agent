/*
========================================================

File:
components/ui/Button.tsx

Purpose:
Luxury button component with Gold accents for the Black & Gold design system.

Responsibilities:
- Renders styled buttons with gold primary styling and dark elevated options
- Supports variants: primary (gold gradient), secondary (dark elevated), ghost, outline, danger
- Supports sizes: sm, md, lg
- Includes loading spinner and icon support

Connected Files:
- All pages and feature components
- src/lib/cn.ts

Depends On:
- react
- motion
- lucide-react (Loader2)

Notes:
Primary buttons use solid Gold (#D4AF37) with dark text for high contrast.

========================================================
*/

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-[#D4AF37] text-[#0A0A0A] font-semibold hover:bg-[#F0D878] shadow-md shadow-[#D4AF37]/10 border border-[#E6C76B]",
  secondary:
    "bg-[#171717] text-[#FFFFFF] hover:bg-[#262626] border border-[#262626] hover:border-[#383838]",
  ghost:
    "bg-transparent text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#171717]",
  danger:
    "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/20",
  outline:
    "bg-transparent text-[#FFFFFF] hover:border-[#D4AF37] border border-[#262626] hover:text-[#D4AF37]",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
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
        whileHover={!disabled && !isLoading ? { scale: 1.015 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.985 } : undefined}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
          "disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
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
