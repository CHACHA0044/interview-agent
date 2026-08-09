/*
========================================================

File:
services/candidate.service.ts

Purpose:
Service layer for candidate-related data operations.

Responsibilities:
- Loads the full cohort roster from the repository-root candidates.json
  so the UI always reflects every candidate in the dataset
- Fetches a single candidate by ID and filters by search query
- Abstracts the data source from UI components

Connected Files:
- src/hooks/use-candidates.ts (consumer)
- src/types/index.ts (Candidate type)
- candidates.json (repository root data source)

Depends On:
- src/types/index.ts
- candidates.json

Notes:
The backend is the single data source — candidates.json is the same file
the backend services consume. Replace the JSON import with an API call if
a /candidates endpoint is exposed by the gateway.

========================================================
*/

import type { Candidate } from "@/types";
import candidatesData from "../../../candidates.json";

interface CandidatesFile {
  candidates: Candidate[];
}

const CANDIDATES: Candidate[] = (candidatesData as CandidatesFile).candidates;

const SIMULATED_DELAY = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCandidates(): Promise<Candidate[]> {
  await delay(SIMULATED_DELAY);
  return CANDIDATES;
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  await delay(SIMULATED_DELAY);
  return CANDIDATES.find((c) => c.member.id === id);
}

export async function searchCandidates(query: string): Promise<Candidate[]> {
  await delay(SIMULATED_DELAY);
  const lowerQuery = query.toLowerCase();
  return CANDIDATES.filter(
    (c) =>
      c.member.name.toLowerCase().includes(lowerQuery) ||
      c.member.jobRole.toLowerCase().includes(lowerQuery) ||
      c.member.id.toLowerCase().includes(lowerQuery)
  );
}
