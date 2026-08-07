/*
========================================================

File:
components/features/interview/TypingIndicator.tsx

Purpose:
Visual indicator showing that the AI Agent is generating a response.

Responsibilities:
- Displays animated dots while agent response is in-flight
- Provides feedback to candidate during evaluation delay

Connected Files:
- src/pages/InterviewPage.tsx (chat area)
- src/styles/index.css (typing animation keyframes)

Depends On:
- react
- lucide-react (Bot)

Notes:
Rendered in the chat stream when isAgentTyping is true in Zustand.

========================================================
*/

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 w-fit max-w-xs">
      <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
