/*
========================================================

File:
components/layout/Navbar.tsx

Purpose:
Top navigation bar displayed across all pages.

Responsibilities:
- Displays the application logo and name
- Provides navigation links to key sections
- Shows a hamburger menu for mobile responsiveness
- Includes subtle glassmorphism effect when scrolled

Connected Files:
- src/layouts/RootLayout.tsx (parent)
- src/app/router.tsx (navigation targets)
- src/stores/app.store.ts (sidebar toggle)

Depends On:
- react-router (Link, useLocation)
- lucide-react (icons)
- motion
- cn utility

Notes:
The navbar is fixed at the top with a glass background.
Active links are highlighted with the brand color.

========================================================
*/

import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Brain,
  Users,
  MessageSquare,
  Settings,
  Info,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/stores/app.store";
import { APP_NAME } from "@/constants";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Brain },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Interview", href: "/interview/setup", icon: MessageSquare },
  { label: "About", href: "/about", icon: Info },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function Navbar() {
  const location = useLocation();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass-heavy"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
                <Brain className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-sm font-semibold text-zinc-100 tracking-tight hidden sm:block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-brand-400 bg-brand-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
