/*
========================================================

File:
layouts/RootLayout.tsx

Purpose:
Root layout container establishing the global 1440px desktop grid container.

Responsibilities:
- Enforces standardized max width (max-w-[1440px]) and padding across all routes
- Renders sticky header navigation aligned with content container
- Provides clean dark background surfaces and subtle glow ambient gradients

Connected Files:
- src/app/router.tsx
- src/components/layout/Navbar.tsx

Depends On:
- react-router (Outlet)
- sonner

Notes:
Standardized grid system container ensures consistent left/right alignment across all pages.

========================================================
*/

import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#FFFFFF] relative selection:bg-[#D4AF37]/20 selection:text-[#FFFFFF] flex flex-col">
      {/* Background Radial Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-radial from-[#D4AF37]/8 via-[#D4AF37]/2 to-transparent blur-3xl opacity-50" />
      </div>

      {/* Fixed Sticky Header Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="relative z-10 flex-1 pt-28 lg:pt-32 pb-16 w-full">
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
