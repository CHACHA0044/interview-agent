/*
========================================================

File:
components/ui/Input.tsx

Purpose:
Input and Textarea components tailored for Black & Gold theme.

Responsibilities:
- Renders input controls with dark surface styling (#111111) and gold focus rings (#D4AF37)
- Handles icon placement, error states, and disabled states

Connected Files:
- CandidatesPage, InterviewSetupPage, InterviewPage

Depends On:
- react
- src/lib/cn.ts

Notes:
Focus border shifts to Gold (#D4AF37) with subtle glow ring.

========================================================
*/

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-[#111111] border border-[#262626] px-4 py-3",
            "text-sm text-[#FFFFFF] placeholder:text-[#737373]",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]",
            "hover:border-[#383838]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            icon && "pl-10",
            rightIcon && "pr-10",
            error && "border-[#EF4444] focus:ring-[#EF4444]/30",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373]">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ========================================
   Textarea Variant
   ======================================== */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl bg-[#111111] border border-[#262626] px-4 py-3",
          "text-sm text-[#FFFFFF] placeholder:text-[#737373]",
          "transition-all duration-200 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]",
          "hover:border-[#383838]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "min-h-[100px]",
          error && "border-[#EF4444] focus:ring-[#EF4444]/30",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
