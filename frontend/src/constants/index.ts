/*
========================================================

File:
constants/index.ts

Purpose:
Central constants file for the Interview Agent application.

Responsibilities:
- Defines application-wide constants and route definitions
- Houses status colors matching Black & Gold design system tokens
- Provides animation variants for Motion components

Connected Files:
- src/app/router.tsx
- src/services/
- All components

Depends On:
- Nothing (leaf module)

Notes:
Gold accent (#D4AF37) is reserved for active states, key numbers, and buttons.

========================================================
*/

/** Application metadata */
export const APP_NAME = "Interview Agent" as const;
export const APP_DESCRIPTION = "Enterprise AI Technical Interview Platform" as const;
export const APP_VERSION = "0.2.0" as const;

/** Route paths */
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CANDIDATES: "/candidates",
  INTERVIEW_SETUP: "/interview/setup",
  INTERVIEW: "/interview/:sessionId",
  FEEDBACK: "/interview/:sessionId/feedback",
  SETTINGS: "/settings",
} as const;

/** Interview configuration */
export const INTERVIEW_CONFIG = {
  MAX_QUESTIONS: 10,
  MIN_QUESTIONS: 5,
  DEFAULT_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 60,
  TYPING_DELAY_MS: 1500,
  MESSAGE_DELAY_MS: 800,
} as const;

/** Status colors for Black & Gold theme */
export const STATUS_COLORS = {
  success: { label: "Completed", className: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
  warning: { label: "Pending", className: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  danger: { label: "Failed", className: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20" },
  gold: { label: "Active", className: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25" },
  neutral: { label: "Inactive", className: "text-[#A3A3A3] bg-[#171717] border-[#262626]" },
} as const;

/** Animation variants for Motion */
export const MOTION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25 },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.2 },
  },
} as const;
