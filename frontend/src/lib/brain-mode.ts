import type { InterviewSession } from "@/types";

export type BrainMode = "idle" | "listening" | "processing" | "synthesis";

export function deriveBrainMode(
  session: InterviewSession | null,
  isAgentTyping: boolean,
  isLoading: boolean,
  hasFeedback: boolean
): BrainMode {
  if (isLoading && session?.status === "IN_PROGRESS") return "synthesis";
  if (session?.status === "COMPLETED" && !hasFeedback) return "synthesis";
  if (isAgentTyping || (isLoading && !session)) return "processing";
  if (session?.status === "IN_PROGRESS") return "listening";
  return "idle";
}
