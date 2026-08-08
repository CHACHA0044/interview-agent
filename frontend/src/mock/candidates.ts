/*
========================================================

File:
mock/candidates.ts

Purpose:
Mock candidate data for development and testing.

Responsibilities:
- Provides the full cohort roster from the hackathon dataset
- Simulates backend /candidates API response
- Used by candidate-related services and components

Connected Files:
- src/services/candidate.service.ts (consumes this data)
- src/types/index.ts (Candidate type)
- candidates.json (source data)

Depends On:
- src/types/index.ts
- candidates.json (repository root data source)

Notes:
Candidates are loaded directly from the repository-root candidates.json
so the roster always reflects every candidate in the dataset. Replace with
API calls when backend is ready.

========================================================
*/

import type { Candidate } from "@/types";
import candidatesData from "../../../candidates.json";

interface CandidatesFile {
  candidates: Candidate[];
}

export const MOCK_CANDIDATES: Candidate[] = (candidatesData as CandidatesFile).candidates;
