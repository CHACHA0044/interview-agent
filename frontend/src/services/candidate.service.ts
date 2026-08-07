/*
========================================================

File:
services/candidate.service.ts

Purpose:
Service layer for candidate-related data operations.

Responsibilities:
- Fetches candidate list (mock for now)
- Fetches single candidate by ID
- Abstracts data source from UI components
- Easy to swap mock with real API calls

Connected Files:
- src/mock/candidates.ts (data source)
- src/types/index.ts (Candidate type)
- src/hooks/use-candidates.ts (consumer)
- src/pages/CandidatesPage.tsx

Depends On:
- src/mock/candidates.ts
- src/types/index.ts

Notes:
Replace MOCK_CANDIDATES imports with fetch() calls when backend is ready.
All methods return Promises to maintain async API compatibility.

========================================================
*/

import type { Candidate } from "@/types";
import { MOCK_CANDIDATES } from "@/mock";

const SIMULATED_DELAY = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCandidates(): Promise<Candidate[]> {
  await delay(SIMULATED_DELAY);
  return MOCK_CANDIDATES;
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  await delay(SIMULATED_DELAY);
  return MOCK_CANDIDATES.find((c) => c.member.id === id);
}

export async function searchCandidates(query: string): Promise<Candidate[]> {
  await delay(SIMULATED_DELAY);
  const lowerQuery = query.toLowerCase();
  return MOCK_CANDIDATES.filter(
    (c) =>
      c.member.name.toLowerCase().includes(lowerQuery) ||
      c.member.jobRole.toLowerCase().includes(lowerQuery) ||
      c.member.id.toLowerCase().includes(lowerQuery)
  );
}
