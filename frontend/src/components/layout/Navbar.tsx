/*
========================================================

File:
components/layout/Navbar.tsx

Purpose:
Top navigation bar aligned with global 1440px container width.

Responsibilities:
- Displays application logo with Gold mark
- Aligns text links with grid container boundaries
- Renders responsive navigation with clear active states

Connected Files:
- src/layouts/RootLayout.tsx
- src/app/router.tsx

Depends On:
- react-router (Link, useLocation)
- lucide-react (Brain, Users, MessageSquare, Info, Settings, Sparkles)

Notes:
Navbar container width matches max-w-[1440px] px-6 sm:px-10 lg:px-12.

========================================================
*/

import { Link, useLocation } from "react-router";
import {
  Brain,
  Users,
  MessageSquare,
  Settings,
  Info,
  Sparkles,
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070707]/85 backdrop-blur-xl border-b border-[#1A1A1A]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-[#121212] border border-[#262626] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 transition-colors shadow-inner">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#FFFFFF] group-hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                {APP_NAME}
                <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              </span>
              <span className="text-[10px] font-mono text-[#737373] tracking-widest uppercase hidden sm:block">
                Enterprise AI Assessment
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
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
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                    isActive
                      ? "text-[#D4AF37] bg-[#141414] border border-[#D4AF37]/30 shadow-sm"
                      : "text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#121212]"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#D4AF37]" : "text-[#737373]")} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
