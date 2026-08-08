/*
========================================================

File:
components/ui/Button.tsx

Purpose:
Luxury button component with Gold accents for the Black & Gold design system.
This is the single shared button for the entire application. All existing
action buttons (page CTAs, filter chips, close buttons, expanders, retry
buttons) are expected to render through this component.

Responsibilities:
- Centralizes hover scale, tap/press, loading, disabled, and focus ring
- Respects the user's reduced-motion preference (skips scale animations)
- Supports variants: primary (gold), secondary (dark elevated), ghost,
  danger, outline, chip (toggle pill)
- Supports sizes: sm, md, lg, chip, icon (square icon-only buttons)
- `pressed` toggles an accessible gold-accented selected state (aria-pressed)
- Includes loading spinner and icon support

Connected Files:
- All pages and feature components
- src/lib/cn.ts
- src/hooks/use-reduced-motion.ts

Depends On:
- react
- motion
- lucide-react (Loader2)

Notes:
Primary buttons use solid Gold (#D4AF37) with dark text for high contrast.
`pressed` styling can be overridden per-consumer via className when a
selection card needs a distinct selected look.

========================================================
*/

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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
  chip:
    "bg-[#141414] text-[#A3A3A3] border border-[#222222] hover:text-white hover:bg-[#1D1D1D]",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
  chip: "touch-target px-3.5 text-xs rounded-xl whitespace-nowrap",
  icon: "h-9 w-9 rounded-xl",
} as const;

const pressedStyle =
  "bg-[#D4AF37] text-[#0A0A0A] font-semibold border-[#D4AF37] hover:bg-[#F0D878] hover:text-[#0A0A0A] hover:border-[#D4AF37]";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  icon?: React.ReactNode;
  /** Marks a toggleable button as selected (sets aria-pressed + gold accent). */
  pressed?: boolean;
  /** Square icon-only button (used for close buttons). */
  iconOnly?: boolean;
}

const MotionButton = motion.button as React.ElementType;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      pressed = false,
      iconOnly = false,
      children,
      disabled,
      type = "button",
      onClick,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const isDisabled = disabled || isLoading;
    const resolvedSize = iconOnly ? sizes.icon : sizes[size];

    return (
      <MotionButton
        ref={ref}
        type={type}
        onClick={onClick}
        aria-pressed={pressed ? true : undefined}
        whileHover={!isDisabled && !prefersReducedMotion ? { scale: 1.015 } : undefined}
        whileTap={!isDisabled && !prefersReducedMotion ? { scale: 0.985 } : undefined}
        transition={{ duration: 0.15 }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
          "disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
          variants[variant],
          pressed && pressedStyle,
          resolvedSize,
          className
        )}
        disabled={isDisabled}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </MotionButton>
    );
  }
);

Button.displayName = "Button";
