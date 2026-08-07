/*
========================================================

File:
hooks/use-candidates.ts

Purpose:
TanStack Query hook for fetching and caching candidate data.

Responsibilities:
- Provides candidates list with caching
- Provides single candidate lookup
- Handles loading and error states automatically

Connected Files:
- src/services/candidate.service.ts (data source)
- src/pages/CandidatesPage.tsx (consumer)
- src/pages/InterviewSetupPage.tsx (consumer)

Depends On:
- @tanstack/react-query
- src/services/candidate.service.ts

Notes:
Uses TanStack Query for automatic caching, deduplication,
and background refresh. Stale time is set to 5 minutes.

========================================================
*/

import { useQuery } from "@tanstack/react-query";
import * as candidateService from "@/services/candidate.service";

const STALE_TIME = 5 * 60 * 1000;

export function useCandidates() {
  return useQuery({
    queryKey: ["candidates"],
    queryFn: candidateService.getCandidates,
    staleTime: STALE_TIME,
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: () => candidateService.getCandidateById(id!),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}
