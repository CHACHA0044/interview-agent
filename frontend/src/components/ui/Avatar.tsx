/*
========================================================

File:
components/ui/Avatar.tsx

Purpose:
Deterministic AI-generated profile avatar for cohort candidates.

Responsibilities:
- Renders a small circular avatar generated from the candidate name
  via the DiceBear avatar API (seed = name)
- Picks an art style based on inferred gender so the set reads as
  intentional rather than a single generic template
- Falls back to gold monogram initials if the image cannot load
- Supports a subtle scale-up on hover via `group-hover` when the
  consumer marks its container with the `group` class

Connected Files:
- src/pages/CandidatesPage.tsx (consumer)
- src/components/ui/index.ts (barrel export)

Depends On:
- react
- src/lib/cn.ts

Notes:
- Purely presentational. No network dependency at build time; the
  image loads at runtime and degrades gracefully offline.
- Avatar is decorative (aria-hidden) — candidate names are always
  rendered as text next to it.

========================================================
*/

import { useState } from "react";
import { cn } from "@/lib/cn";

const FEMALE_FIRST_NAMES = new Set([
  "sarah",
  "emily",
  "wendy",
  "zara",
  "mia",
  "bethany",
  "isabella",
  "diane",
  "priyanka",
]);

const MALE_FIRST_NAMES = new Set([
  "alex",
  "david",
  "michael",
  "ethan",
  "harold",
  "gerald",
  "chen",
  "ravi",
  "noah",
  "tyler",
  "frank",
]);

type Gender = "male" | "female" | "neutral";

const STYLE_BY_GENDER: Record<Gender, string> = {
  male: "adventurer",
  female: "lorelei",
  neutral: "micah",
};

function inferGender(name: string): Gender {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (FEMALE_FIRST_NAMES.has(first)) return "female";
  if (MALE_FIRST_NAMES.has(first)) return "male";
  return "neutral";
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const gender = inferGender(name);
  const seed = encodeURIComponent(name.trim());
  const src = `https://api.dicebear.com/9.x/${STYLE_BY_GENDER[gender]}/svg?seed=${seed}&backgroundColor=0f0f0f`;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full border border-[#262626] bg-[#171717]",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {failed ? (
        <span className="font-mono font-bold text-[#D4AF37]">{initials(name)}</span>
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      )}
    </span>
  );
}
