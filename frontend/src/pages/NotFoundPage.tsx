/*
========================================================

File:
pages/NotFoundPage.tsx

Purpose:
404 error page for unmatched routes.

Responsibilities:
- Displays friendly 404 message and navigation action

Connected Files:
- src/app/router.tsx (catch-all route: *)

Depends On:
- react-router (useNavigate)
- lucide-react
- src/components/ui/ (Button)

Notes:
Keeps route fallback elegant and dark-themed.

========================================================
*/

import { useNavigate } from "react-router";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { PageTransition } from "@/components/layout/PageTransition";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="p-4 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <AlertCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-4xl font-extrabold text-zinc-100">404 — Page Not Found</h1>
          <p className="text-sm text-zinc-400">
            The requested page does not exist or has been relocated within the interview system.
          </p>
        </div>
        <Button onClick={() => navigate("/")} icon={<Home className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </div>
    </PageTransition>
  );
}
