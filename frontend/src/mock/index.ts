/*
========================================================

File:
mock/index.ts

Purpose:
Barrel export for all mock data modules.

Responsibilities:
- Re-exports all mock data from a single entry point
- Simplifies imports throughout the application

Connected Files:
- src/mock/candidates.ts
- src/mock/curriculum.ts
- src/mock/interview.ts
- src/mock/feedback.ts

Depends On:
- All mock data files

Notes:
Import mock data via: import { MOCK_CANDIDATES } from '@/mock'

========================================================
*/

export { MOCK_CANDIDATES } from "./candidates";
export { MOCK_CURRICULUM } from "./curriculum";
export { MOCK_MESSAGES, MOCK_QUESTIONS, MOCK_INTERVIEW_TOPICS } from "./interview";
export { MOCK_FEEDBACK } from "./feedback";
