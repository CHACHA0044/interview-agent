/*
========================================================

File:
components/ui/CustomSelect.tsx

Purpose:
Accessible, animated dropdown select that replaces native <select>
elements across the app.

Responsibilities:
- Renders a styled trigger button showing the selected option
  (with optional leading icon and optional sub-label)
- Opens an animated options list (motion) with selected checkmark,
  mouse/keyboard highlight, and click-outside + Escape to close
- Supports keyboard navigation (ArrowUp / ArrowDown / Enter)
- Reports changes via a plain string onChange so callers keep their
  own state/form values in sync

Connected Files:
- src/pages/InterviewSetupPage.tsx (candidate, duration, question count)
- src/components/ui/index.ts (barrel export)

Depends On:
- react
- lucide-react (Check, ChevronDown)
- motion/react
- src/lib/cn.ts

Notes:
- Decorative icons are aria-hidden via parent markup; the trigger is
  labelled through ariaLabel / the wrapping <label htmlFor>.
- Follows the app's Black & Gold palette.

========================================================
*/

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  triggerIcon?: ReactNode;
  optionIcon?: ReactNode;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  ariaLabel,
  className,
  triggerIcon,
  optionIcon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const delta = event.key === "ArrowDown" ? 1 : -1;
        setHighlightedIndex((index) => (index + delta + options.length) % options.length);
        return;
      }
      if (event.key === "Enter") {
        const opt = options[highlightedIndex];
        if (opt) {
          onChange(opt.value);
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, options, onChange, highlightedIndex]);

  const toggleOpen = () => {
    const selectedIndex = Math.max(0, options.findIndex((opt) => opt.value === value));
    setHighlightedIndex(selectedIndex);
    setIsOpen((open) => !open);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={toggleOpen}
        className="touch-target w-full px-4 rounded-xl bg-[#141414] border border-[#222222] text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-colors flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2.5 min-w-0 text-left">
          {triggerIcon}
          <span className="min-w-0">
            {selected ? (
              <>
                <span className="block text-xs font-medium text-white truncate">{selected.label}</span>
                {selected.sublabel ? (
                  <span className="block text-[10px] text-[#737373] truncate">{selected.sublabel}</span>
                ) : null}
              </>
            ) : (
              <span className="block text-xs text-[#737373]">{placeholder}</span>
            )}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[#737373]"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-xl bg-[#171717] border border-[#262626] shadow-2xl shadow-black/60 p-1"
          >
            {options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                      isHighlighted ? "bg-[#1F1F1F]" : "hover:bg-[#1F1F1F]"
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {optionIcon}
                      <span className="min-w-0">
                        <span className="block text-xs text-white truncate">{opt.label}</span>
                        {opt.sublabel ? (
                          <span className="block text-[10px] text-[#737373] truncate">{opt.sublabel}</span>
                        ) : null}
                      </span>
                    </span>
                    {isSelected ? <Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
