/*
========================================================

File:
services/curriculum.service.ts

Purpose:
Service layer for curriculum data operations.

Responsibilities:
- Loads the full Enterprise AI Cohort curriculum (8 modules / 31 days)
- Reads directly from the repository-root curriculum.json so the
  setup wizard always reflects every real module and day
- Abstracts the data source from UI components

Connected Files:
- src/hooks/use-curriculum.ts (consumer)
- src/types/index.ts (Curriculum type)
- curriculum.json (repository root data source)

Depends On:
- src/types/index.ts
- curriculum.json

Notes:
Mirrors the candidate.service pattern. Replace with an API call when a
/curriculum endpoint is exposed by the backend gateway.

========================================================
*/

import type { Curriculum } from "@/types";
import curriculumData from "../../../curriculum.json";

interface CurriculumFile {
  cohort: string;
  modules: { n: number; title: string; days: [number, number] }[];
  days: {
    day: number;
    title: string;
    type: string;
    tools: string[];
    objectives: string[];
  }[];
}

const SIMULATED_DELAY = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCurriculum(): Promise<Curriculum> {
  await delay(SIMULATED_DELAY);
  const file = curriculumData as CurriculumFile;
  return {
    cohort: file.cohort,
    modules: file.modules,
    days: file.days,
  } as Curriculum;
}

export async function getModules(): Promise<Curriculum["modules"]> {
  const curriculum = await getCurriculum();
  return curriculum.modules;
}
