/*
========================================================

File:
components/ui/EmptyState.tsx

Purpose:
Empty state placeholder for when no data is available.

Responsibilities:
- Displays a friendly message when content is empty
- Includes an icon, title, description, and optional action
- Used across all pages with potentially empty lists

Connected Files:
- src/pages/CandidatesPage.tsx
- src/pages/InterviewPage.tsx
- Any page that can have zero items

Depends On:
- lucide-react
- cn utility
- motion

Notes:
Always provide a helpful message and action when possible.

========================================================
*/

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 text-zinc-600">{icon}</div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  );
}
