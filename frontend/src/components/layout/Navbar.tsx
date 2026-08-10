import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Users, MessageSquare, Settings, Info, Sparkles, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/constants";
import { LayoutContainer } from "@/components/layout/system";
import { AnimatedBrain } from "@/components/brand/AnimatedBrain";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: Brain },
  { label: "Candidates", href: "/candidates", icon: Users },
  { label: "Interview Setup", href: "/interview/setup", icon: MessageSquare },
  { label: "Architecture", href: "/about", icon: Info },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  // Close the menu whenever the route changes (item tap navigates + closes).
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Scroll-lock the page while the menu is open + close on Escape.
  useEffect(() => {
    if (!isOpen) return;

    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // Close the menu if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!isOpen) return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mediaQuery.matches) setIsOpen(false);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [isOpen]);

  const iconSwapTransition = { duration: prefersReducedMotion ? 0 : 0.18 };
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const };
  const backdropTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2 };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#070707]/88 backdrop-blur-xl">
        <LayoutContainer size="dashboard">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none shrink-0">
              <span className="h-10 w-10 rounded-xl border border-[#262626] bg-[#121212] text-[#D4AF37] flex items-center justify-center">
                <AnimatedBrain />
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

            {/* Desktop navigation (unchanged, hidden below md) */}
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-2">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium border transition-colors",
                          active
                            ? "bg-[#141414] border-[#D4AF37]/35 text-[#D4AF37]"
                            : "bg-[#101010] border-[#242424] text-[#A3A3A3] hover:text-white hover:border-[#343434]"
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", active ? "text-[#D4AF37]" : "text-[#737373]")} />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Mobile hamburger toggle */}
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[#262626] bg-[#121212] text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={iconSwapTransition}
                  >
                    <X className="h-5 w-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={iconSwapTransition}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </LayoutContainer>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {isOpen ? (
            <motion.nav
              id="mobile-menu"
              aria-label="Mobile"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={panelTransition}
              className="absolute top-full left-0 right-0 z-50 md:hidden bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#1F1F1F] shadow-2xl shadow-black/60 overflow-hidden"
            >
              <ul className="py-2">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full px-5 py-4 text-sm font-medium border-b border-[#1F1F1F]/60 last:border-b-0 transition-colors",
                          active
                            ? "bg-[#141414] text-[#D4AF37]"
                            : "text-[#A3A3A3] hover:text-white hover:bg-[#111111]"
                        )}
                      >
                        <span
                          className={cn(
                            "shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center transition-colors",
                            active
                              ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
                              : "border-[#262626] bg-[#171717] text-[#737373]"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                        ) : (
                          <span className="text-[#3F3F3F]">
                            <X className="h-3 w-3 rotate-45" aria-hidden="true" />
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Backdrop: dim + blur behind the menu */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
