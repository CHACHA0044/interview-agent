/*
========================================================

File:
vite.config.ts

Purpose:
Vite build configuration for the Interview Agent frontend.

Responsibilities:
- Configures React plugin with SWC for fast builds
- Sets up path aliases for clean imports
- Configures development server settings
- Optimizes build output for production

Connected Files:
- tsconfig.app.json (path aliases must match)
- All src/ files (use @ alias)

Depends On:
- vite
- @vitejs/plugin-react

Notes:
Path alias '@' maps to 'src/' for clean imports.
Dev server runs on port 5173 by default.

========================================================
*/

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
