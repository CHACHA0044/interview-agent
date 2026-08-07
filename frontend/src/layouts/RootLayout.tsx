/*
========================================================

File:
layouts/RootLayout.tsx

Purpose:
Root layout wrapping all application pages.

Responsibilities:
- Renders the Navbar at the top
- Provides a main content area with proper padding
- Houses the Sonner toast container
- Adds a subtle background gradient

Connected Files:
- src/app/router.tsx (used as layout route)
- src/components/layout/Navbar.tsx
- All pages render inside this layout

Depends On:
- react-router (Outlet)
- sonner (Toaster)
- Navbar component

Notes:
The pt-16 padding accounts for the fixed navbar height.

========================================================
*/

import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/3 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/3 rounded-full blur-[128px]" />
      </div>

      <Navbar />

      <main className="relative pt-16 min-h-screen">
        <Outlet />
      </main>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(24, 24, 27, 0.9)",
            border: "1px solid rgba(63, 63, 70, 0.3)",
            backdropFilter: "blur(16px)",
            color: "#fafafa",
          },
        }}
      />
    </div>
  );
}
