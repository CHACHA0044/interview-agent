/*
========================================================

File:
cn.ts

Purpose:
Utility function for merging Tailwind CSS class names.

Responsibilities:
- Combines clsx for conditional class joining
- Uses tailwind-merge to resolve conflicting Tailwind classes
- Provides a single clean API for all class name composition

Connected Files:
- Every component file that uses className props
- All UI components in src/components/ui/

Depends On:
- clsx
- tailwind-merge

Notes:
Always use cn() instead of raw string concatenation for class names.
This ensures conflicting Tailwind classes are properly resolved.

========================================================
*/

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
