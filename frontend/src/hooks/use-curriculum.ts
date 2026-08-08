/*
========================================================

File:
hooks/use-curriculum.ts

Purpose:
TanStack Query hook for fetching and caching the Enterprise AI Cohort
curriculum (modules + day-by-day content).

Responsibilities:
- Provides curriculum modules and day content with caching
- Reuses the standard stale-time pattern from use-candidates

Connected Files:
- src/services/curriculum.service.ts (data source)
- src/pages/InterviewSetupPage.tsx (consumer)
- src/pages/LandingPage.tsx (consumer)

Depends On:
- @tanstack/react-query
- src/services/curriculum.service.ts

Notes:
Uses TanStack Query for automatic caching, deduplication, and background
refresh. Stale time is set to 5 minutes to match candidate data.

========================================================
*/

import { useQuery } from "@tanstack/react-query";
import * as curriculumService from "@/services/curriculum.service";

const STALE_TIME = 5 * 60 * 1000;

export function useCurriculum() {
  return useQuery({
    queryKey: ["curriculum"],
    queryFn: curriculumService.getCurriculum,
    staleTime: STALE_TIME,
  });
}
