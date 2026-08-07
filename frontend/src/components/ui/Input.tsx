/*
========================================================

File:
components/ui/Input.tsx

Purpose:
Reusable text input component with consistent styling.

Responsibilities:
- Renders styled input fields
- Supports icons (left/right)
- Handles focus, error, and disabled states
- Includes textarea variant for multi-line input

Connected Files:
- src/pages/InterviewPage.tsx (answer input)
- src/pages/InterviewSetupPage.tsx (form inputs)
- React Hook Form integration

Depends On:
- react
- cn utility

Notes:
Use with React Hook Form's register() for form integration.
Error messages should be displayed separately by the parent form.

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
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-zinc-900/80 border border-zinc-800 px-4 py-2.5",
            "text-sm text-zinc-100 placeholder:text-zinc-500",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50",
            "hover:border-zinc-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-10",
            rightIcon && "pr-10",
            error && "border-red-500/50 focus:ring-red-500/30",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
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
          "w-full rounded-xl bg-zinc-900/80 border border-zinc-800 px-4 py-3",
          "text-sm text-zinc-100 placeholder:text-zinc-500",
          "transition-all duration-200 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50",
          "hover:border-zinc-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-h-[100px]",
          error && "border-red-500/50 focus:ring-red-500/30",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
