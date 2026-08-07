import { Link, useLocation } from "react-router";
import { Brain, Users, MessageSquare, Settings, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/constants";
import { LayoutContainer } from "@/components/layout/system";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: Brain },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Interview Setup", href: "/interview/setup", icon: MessageSquare },
  { label: "Architecture", href: "/about", icon: Info },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#070707]/88 backdrop-blur-xl">
      <LayoutContainer size="dashboard" className="py-3 md:py-4">
        <div className="grid gap-3 md:gap-4">
          <div className="flex items-center justify-between gap-4 min-h-[var(--nav-height)]">
            <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none">
              <span className="h-10 w-10 rounded-xl border border-[#262626] bg-[#121212] text-[#D4AF37] flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  {APP_NAME}
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                </span>
                <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-[#737373]">
                  Enterprise AI Assessment
                </span>
              </span>
            </Link>
          </div>

          <nav aria-label="Primary" className="overflow-x-auto pb-1">
            <ul className="flex min-w-max items-center gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "touch-target inline-flex items-center gap-2 rounded-xl px-3.5 text-xs font-medium border",
                        isActive
                          ? "bg-[#141414] border-[#D4AF37]/35 text-[#D4AF37]"
                          : "bg-[#101010] border-[#242424] text-[#A3A3A3] hover:text-white hover:border-[#343434]"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#D4AF37]" : "text-[#737373]")} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </LayoutContainer>
    </header>
  );
}
