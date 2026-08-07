/*
========================================================

File:
postcss.config.js

Purpose:
PostCSS configuration for Tailwind CSS processing.

Responsibilities:
- Registers the Tailwind CSS plugin
- Registers Autoprefixer for cross-browser compatibility

Connected Files:
- tailwind.config.ts
- src/styles/index.css

Depends On:
- postcss
- tailwindcss
- autoprefixer

Notes:
This is standard PostCSS config. No custom plugins needed.

========================================================
*/

export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
