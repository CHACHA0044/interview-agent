import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { AppFooter } from "@/components/layout/AppFooter";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#070707] text-[#FFFFFF] relative selection:bg-[#D4AF37]/20 selection:text-[#FFFFFF] flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-[70] rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0A]"
      >
        Skip to main content
      </a>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-radial from-[#D4AF37]/8 via-[#D4AF37]/2 to-transparent blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 pb-8" role="main">
          <Outlet />
        </main>
        <AppFooter />
      </div>

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
