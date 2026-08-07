/*
========================================================

File:
layouts/RootLayout.tsx

Purpose:
Root layout container for the Black & Gold application theme.

Responsibilities:
- Renders sticky Navbar with proper top padding (pt-24 / pt-28) to eliminate text clipping/overlap
- Houses Sonner toast container with Gold accent borders

Connected Files:
- src/app/router.tsx
- src/components/layout/Navbar.tsx

Depends On:
- react-router (Outlet)
- sonner

Notes:
pt-24 (96px top padding) guarantees page titles never get clipped under the navbar.

========================================================
*/

import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FFFFFF] relative selection:bg-[#D4AF37]/20 selection:text-[#FFFFFF]">
      <Navbar />

      <main className="relative pt-28 pb-16 min-h-screen">
        <Outlet />
      </main>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#111111",
            border: "1px solid #262626",
            color: "#FFFFFF",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}
