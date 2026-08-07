/*
========================================================

File:
layouts/RootLayout.tsx

Purpose:
Root layout container for the Black & Gold application theme.

Responsibilities:
- Renders sticky Navbar with proper top clearance (pt-32) to eliminate text clipping
- Provides background radial gradients for modern Vercel/Linear dark aesthetics
- Houses Sonner toast container with Gold accent borders

Connected Files:
- src/app/router.tsx
- src/components/layout/Navbar.tsx

Depends On:
- react-router (Outlet)
- sonner

Notes:
pt-32 (128px top padding) guarantees page hero titles never get clipped under sticky navbar.

========================================================
*/

import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#FFFFFF] relative selection:bg-[#D4AF37]/20 selection:text-[#FFFFFF] overflow-x-hidden">
      {/* Subtle Background Glow Radial Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-radial from-[#D4AF37]/10 via-[#D4AF37]/2 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-1/3 -right-60 w-[600px] h-[600px] bg-radial from-[#D4AF37]/5 to-transparent blur-3xl opacity-30" />
      </div>

      {/* Sticky Header Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="relative z-10 pt-32 pb-24 min-h-screen">
        <Outlet />
      </main>

      {/* Global Toast Notifications */}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#111111",
            border: "1px solid #262626",
            color: "#FFFFFF",
            borderRadius: "0.875rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
          },
        }}
      />
    </div>
  );
}
