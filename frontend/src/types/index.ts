/*
========================================================

File:
types/index.ts

Purpose:
Central type definitions for the Interview Agent application.

Responsibilities:
- Defines all domain types (Candidate, Interview, Feedback, etc.)
- Provides shared interfaces consumed across the application
- Acts as the single source of truth for data shapes

Connected Files:
- src/services/ (data sources typed with these)
- src/stores/ (state shapes)
- src/components/ (props typed with these)

Depends On:
- Nothing (leaf module)

Notes:
Keep types organized by domain. Export everything from this index.
Never use 'any'. Always prefer interfaces for extendable shapes.

========================================================
*/

/* ========================================
   Candidate Types
   ======================================== */

export interface CandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: CandidateStatus;
}

export type CandidateStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";

export interface Mission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface Candidate {
  member: CandidateMember;
  missions: Mission[];
  signals: CandidateSignals;
}

/* ========================================
   Curriculum Types
   ======================================== */

export interface CurriculumModule {
  n: number;
  title: string;
  days: [number, number];
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: DayType;
  tools: string[];
  objectives: string[];
}

export type DayType = "SETUP" | "BUILD" | "AI_CORE" | "LEARN" | "SHIP_IT" | "OPTIMIZE" | "CAPSTONE";

export interface Curriculum {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}

/* ========================================
   Interview Types
   ======================================== */

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  candidate: Candidate;
  status: InterviewStatus;
  startedAt: string;
  endedAt?: string;
  questionCount: number;
  currentQuestionIndex: number;
  topicsCovered: string[];
  duration: number;
}

export type InterviewStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  questionIndex?: number;
  topic?: string;
}

export type MessageRole = "agent" | "candidate" | "system";

export interface InterviewQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: QuestionDifficulty;
  moduleRef: number;
  expectedTopics: string[];
}

export type QuestionDifficulty = "easy" | "medium" | "hard";

/* ========================================
   Feedback Types
   ======================================== */

export interface InterviewFeedback {
  sessionId: string;
  candidateId: string;
  summary: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  next: string[];
  topicScores: TopicScore[];
  generatedAt: string;
}

export interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
  notes: string;
}

/* ========================================
   API Types
   ======================================== */

export interface ApiInterviewRequest {
  sessionId: string;
  candidate?: Candidate;
  message?: string;
}

export interface ApiQuestionMeta {
  questionId: string;
  type?: string;
  difficulty?: QuestionDifficulty;
  topic?: string;
  day?: number;
  followUpOf?: string | null;
  expectedConcepts?: string[];
}

export interface ApiSessionMeta {
  questionCount: number;
  daysAsked: number[];
  scores: number[];
  status: string;
  followUpBudgetRemaining?: number | null;
  currentDifficulty?: string | null;
}

export interface ApiInterviewResponse {
  reply: string;
  done: boolean;
  feedback?: {
    summary: string;
    strengths: string[];
    gaps: string[];
    next: string[];
  } | null;
  question?: ApiQuestionMeta | null;
  session?: ApiSessionMeta | null;
}

/** Live agent metadata surfaced by the gateway for the debug panel. */
export interface InterviewLiveMetadata {
  question: ApiQuestionMeta | null;
  session: ApiSessionMeta | null;
}

/* ========================================
   LLM Provider Failover Types
   ======================================== */

export interface ProviderSlot {
  label: string;
  display: string;
  active: boolean;
}

export interface ProviderRotation {
  seq: number;
  at: number;
  from: string;
  to: string;
  retry_after_seconds: number | null;
  reason: string;
}

export interface ProviderStatus {
  provider: string;
  primary_model?: string;
  fallback_model?: string;
  active_slot: string;
  all_exhausted: boolean;
  fake_active?: boolean;
  slots: ProviderSlot[];
  last_rotation: ProviderRotation | null;
  rotations: ProviderRotation[];
  status_error?: string;
}

/* ========================================
   UI Types
   ======================================== */

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export type ToastType = "success" | "error" | "warning" | "info";

/* ========================================
   Interview Setup Form Types
   ======================================== */

export interface InterviewSetupFormData {
  candidateId: string;
  questionCount: number;
  focusTopics: string[];
  duration: number;
}
