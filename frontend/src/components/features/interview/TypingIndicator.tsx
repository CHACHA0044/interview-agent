/*
========================================================

File:
components/features/interview/TypingIndicator.tsx

Purpose:
Visual indicator showing the AI agent is generating a response.

Responsibilities:
- Displays animated Gold dots while agent response is in-flight

Connected Files:
- src/pages/InterviewPage.tsx
- src/styles/index.css (typing animation)

Depends On:
- lucide-react (Bot)

Notes:
Typing dots use Gold (#D4AF37) accent color.

========================================================
*/

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#171717] border border-[#262626] w-fit max-w-xs">
      <div className="h-8 w-8 rounded-xl bg-[#171717] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 pt-2.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
