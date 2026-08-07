/*
========================================================

File:
tailwind.config.ts

Purpose:
Tailwind CSS configuration for the luxury Black & Gold Linear/Vercel design system.

Responsibilities:
- Configures black, gold, and surface color scales
- Sets up typography, spacing scale, and border radius tokens
- Defines subtle, refined animations for interactive elements

Connected Files:
- src/styles/index.css
- All component files

Depends On:
- tailwindcss

Notes:
Gold accent (#D4AF37) is reserved strictly for highlights, badges, active states, and buttons.

========================================================
*/

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        accent: ['"Indie Flower"', "cursive", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "#0A0A0A",
          secondary: "#111111",
          elevated: "#171717",
        },
        border: {
          subtle: "#1E1E1E",
          default: "#262626",
          hover: "#383838",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A3A3A3",
          muted: "#737373",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E6C76B",
          hover: "#F0D878",
          subtle: "rgba(212, 175, 55, 0.12)",
          border: "rgba(212, 175, 55, 0.25)",
          glow: "rgba(212, 175, 55, 0.15)",
        },
        status: {
          success: "#22C55E",
          error: "#EF4444",
          warning: "#F59E0B",
        },
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        gold: "0 0 20px rgba(212, 175, 55, 0.15)",
        "gold-lg": "0 0 35px rgba(212, 175, 55, 0.25)",
        subtle: "0 4px 20px rgba(0, 0, 0, 0.5)",
        elevated: "0 10px 30px rgba(0, 0, 0, 0.7)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
