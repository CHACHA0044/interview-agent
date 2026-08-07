/*
========================================================

File:
components/layout/Navbar.tsx

Purpose:
Top navigation bar matching Apple/Linear/Vercel minimal design guidelines.

Responsibilities:
- Displays application logo with Gold icon highlight
- Renders navigation items with active Gold indicator pill
- Provides glassmorphism with backdrop blur on scroll
- Ensures correct positioning without content collision

Connected Files:
- src/layouts/RootLayout.tsx
- src/app/router.tsx

Depends On:
- react-router (Link, useLocation)
- lucide-react (Brain, Users, MessageSquare, Info, Settings)
- motion

Notes:
Active link gets a Gold (#D4AF37) subtle background and bottom highlight pill.

========================================================
*/

import { Link, useLocation } from "react-router";
import {
  Brain,
  Users,
  MessageSquare,
  Settings,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/constants";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: Brain },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Assessment Setup", href: "/interview/setup", icon: MessageSquare },
  { label: "Architecture", href: "/about", icon: Info },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function Navbar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-[#171717] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-colors shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-mono text-[#737373] tracking-widest uppercase">
                Enterprise AI Assessment
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 bg-[#111111]/80 p-1.5 rounded-2xl border border-[#262626]">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                    isActive
                      ? "text-[#D4AF37] bg-[#171717] border border-[#D4AF37]/30 shadow-sm"
                      : "text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#171717]/60"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#D4AF37]" : "text-[#737373]")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
