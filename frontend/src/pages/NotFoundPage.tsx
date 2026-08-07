/*
========================================================

File:
pages/NotFoundPage.tsx

Purpose:
404 error page for unmatched routes.

Responsibilities:
- Displays elegant 404 message with Gold accent
- Provides navigation back to home

Connected Files:
- src/app/router.tsx (catch-all route: *)

Depends On:
- react-router (useNavigate)
- lucide-react

Notes:
Minimal, elegant dark-themed error page.

========================================================
*/

import { useNavigate } from "react-router";
import { Home } from "lucide-react";
import { Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-8">
        <div className="space-y-4 max-w-md">
          <span className="text-8xl font-extrabold text-[#D4AF37] font-mono">404</span>
          <h1 className="text-2xl font-bold text-[#FFFFFF]">Page Not Found</h1>
          <p className="text-sm text-[#A3A3A3] leading-relaxed">
            The requested page does not exist or has been relocated within the interview system.
          </p>
        </div>
        <Button onClick={() => navigate("/")} icon={<Home className="h-4 w-4" />}>
          Return to Overview
        </Button>
      </div>
    </PageTransition>
  );
}
