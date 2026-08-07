/*
========================================================

File:
components/ui/index.ts

Purpose:
Barrel export for all UI components.

Responsibilities:
- Re-exports all UI primitives from a single entry point
- Simplifies imports: import { Button, Card } from '@/components/ui'

Connected Files:
- All UI component files in this directory
- All consumers across the application

Depends On:
- All UI component files

Notes:
Add new UI components to this barrel as they are created.

========================================================
*/

export { Button } from "./Button";
export { Card } from "./Card";
export { Input, Textarea } from "./Input";
export { Badge } from "./Badge";
export { Skeleton, SkeletonCard, SkeletonMessage } from "./Skeleton";
export { EmptyState } from "./EmptyState";
export { Progress } from "./Progress";
