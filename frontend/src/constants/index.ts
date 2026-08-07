/*
========================================================

File:
constants/index.ts

Purpose:
Central constants file for the Interview Agent application.

Responsibilities:
- Defines application-wide constants
- Houses route paths, API endpoints, and config values
- Prevents magic strings and numbers throughout the codebase

Connected Files:
- src/app/router.tsx (route paths)
- src/services/ (API endpoints)
- All components (consume constants)

Depends On:
- Nothing (leaf module)

Notes:
Group constants by domain. Never use magic values inline.
All constants should be UPPER_SNAKE_CASE.

========================================================
*/

/** Application metadata */
export const APP_NAME = "Interview Agent" as const;
export const APP_DESCRIPTION = "AI-Powered Technical Interview Platform" as const;
export const APP_VERSION = "0.1.0" as const;

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

/** Status labels and colors */
export const STATUS_COLORS = {
  success: { label: "Success", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  warning: { label: "Warning", className: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  danger: { label: "Danger", className: "text-red-400 bg-red-400/10 border-red-400/20" },
  info: { label: "Info", className: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  neutral: { label: "Neutral", className: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20" },
} as const;

/** Animation variants for Motion */
export const MOTION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  slideDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
} as const;

/** Curriculum module labels */
export const MODULE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SETUP: { label: "Setup", color: "text-blue-400" },
  BUILD: { label: "Build", color: "text-emerald-400" },
  AI_CORE: { label: "AI Core", color: "text-purple-400" },
  LEARN: { label: "Learn", color: "text-amber-400" },
  SHIP_IT: { label: "Ship It", color: "text-rose-400" },
  OPTIMIZE: { label: "Optimize", color: "text-cyan-400" },
  CAPSTONE: { label: "Capstone", color: "text-pink-400" },
};
