/*
========================================================

File:
stores/interview.store.ts

Purpose:
Zustand store for interview session state management.

Responsibilities:
- Manages active interview session state
- Tracks conversation messages
- Manages interview progress (question index, topics covered)
- Handles session timer state
- Provides actions for starting, sending messages, and ending interviews

Connected Files:
- src/services/interview.service.ts (data fetching)
- src/pages/InterviewPage.tsx (main consumer)
- src/components/features/interview/ (UI consumers)
- src/types/index.ts

Depends On:
- zustand
- src/types/index.ts
- src/services/interview.service.ts
- dayjs

Notes:
No UI logic belongs here. Only state and actions.
Timer management uses setInterval externally.

========================================================
*/

import { create } from "zustand";
import type {
  InterviewSession,
  InterviewMessage,
  InterviewFeedback,
  Candidate,
} from "@/types";
import * as interviewService from "@/services/interview.service";
import dayjs from "dayjs";

interface InterviewState {
  /** Current session */
  session: InterviewSession | null;
  /** Conversation messages */
  messages: InterviewMessage[];
  /** Whether the agent is currently "typing" */
  isAgentTyping: boolean;
  /** Interview feedback (set when interview ends) */
  feedback: InterviewFeedback | null;
  /** Elapsed seconds */
  elapsedSeconds: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;

  /** Actions */
  startInterview: (candidate: Candidate) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  endInterview: () => Promise<void>;
  clearError: () => void;
  incrementTimer: () => void;
  reset: () => void;
}

const initialState = {
  session: null,
  messages: [],
  isAgentTyping: false,
  feedback: null,
  elapsedSeconds: 0,
  isLoading: false,
  error: null,
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  ...initialState,

  startInterview: async (candidate: Candidate) => {
    set({ isLoading: true, error: null });
    try {
      const { session, response } = await interviewService.startInterview(candidate);
      const systemMessage: InterviewMessage = {
        id: `msg-system-${Date.now()}`,
        role: "system",
        content: "Interview session started. The AI interviewer will now begin the assessment.",
        timestamp: dayjs().toISOString(),
      };
      const agentMessage: InterviewMessage = {
        id: `msg-agent-${Date.now()}`,
        role: "agent",
        content: response.reply,
        timestamp: dayjs().toISOString(),
        questionIndex: 0,
        topic: "Introduction",
      };
      set({
        session,
        messages: [systemMessage, agentMessage],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to start interview",
        isLoading: false,
      });
    }
  },

  sendMessage: async (content: string) => {
    const { session } = get();
    if (!session) return;

    const candidateMessage: InterviewMessage = {
      id: `msg-cand-${Date.now()}`,
      role: "candidate",
      content,
      timestamp: dayjs().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, candidateMessage],
      isAgentTyping: true,
    }));

    try {
      const response = await interviewService.sendMessage({
        sessionId: session.sessionId,
        message: content,
      });

      const agentMessage: InterviewMessage = {
        id: `msg-agent-${Date.now()}`,
        role: "agent",
        content: response.reply,
        timestamp: dayjs().toISOString(),
        questionIndex: (session.currentQuestionIndex ?? 0) + 1,
      };

      set((state) => ({
        messages: [...state.messages, agentMessage],
        isAgentTyping: false,
        session: state.session
          ? {
              ...state.session,
              currentQuestionIndex: state.session.currentQuestionIndex + 1,
              status: response.done ? "COMPLETED" : "IN_PROGRESS",
            }
          : null,
      }));

      if (response.done && response.feedback) {
        const feedbackData = await interviewService.getInterviewFeedback(session.sessionId);
        set({ feedback: feedbackData });
      }
    } catch (err) {
      set({
        isAgentTyping: false,
        error: err instanceof Error ? err.message : "Failed to send message",
      });
    }
  },

  endInterview: async () => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true });
    try {
      const feedback = await interviewService.endInterview(session.sessionId);
        set((state) => ({
          feedback,
          isLoading: false,
          session: state.session
            ? {
                ...state.session,
                status: "COMPLETED",
                endedAt: dayjs().toISOString(),
              }
            : null,
        }));
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to end interview",
          isLoading: false,
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },

    incrementTimer: () => {
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  reset: () => {
    set(initialState);
  },
}));
