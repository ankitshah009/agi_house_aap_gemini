// The four professional lenses. Colors match the deck (slide 1):
// Agency=violet, Executive=blue, Adtech=teal, Responsible AI=amber/gold.
// Per-lens colors are applied via inline styles (hex), not dynamic Tailwind
// classes, so nothing gets purged.

import type { LensId } from "./types";

export type LensIconName = "Target" | "Award" | "TrendingUp" | "ShieldAlert";

export interface LensMeta {
  id: LensId;
  role: string; // "Agency Strategist"
  deliverable: string; // "Client POV"
  scoreName: string; // "Campaign Urgency"
  voice: string;
  color: string; // accent hex
  icon: LensIconName; // lucide icon name (resolved in components)
}

export const LENSES: LensMeta[] = [
  {
    id: "strategist",
    role: "Agency Strategist",
    deliverable: "Client POV",
    scoreName: "Campaign Urgency",
    voice: "What this means for campaigns, clients, and creative strategy.",
    color: "#8b5cf6", // violet
    icon: "Target",
  },
  {
    id: "executive",
    role: "Executive Strategy",
    deliverable: "Investment Decision",
    scoreName: "Strategic Priority",
    voice: "Business impact, competitive shifts, and strategic priorities.",
    color: "#3b82f6", // blue
    icon: "Award",
  },
  {
    id: "gtm",
    role: "Adtech & GTM",
    deliverable: "Product Opportunity",
    scoreName: "Market Potential",
    voice: "Who wins, who loses, and where the market is moving.",
    color: "#14b8a6", // teal
    icon: "TrendingUp",
  },
  {
    id: "policy",
    role: "Responsible AI & Policy",
    deliverable: "Trust Assessment",
    scoreName: "Regulatory Risk",
    voice: "Ethical implications, policy updates, and transparency considerations.",
    color: "#f59e0b", // amber/gold
    icon: "ShieldAlert",
  },
];

export const LENS_ORDER: LensId[] = LENSES.map((l) => l.id);

export const LENS_BY_ID: Record<LensId, LensMeta> = LENSES.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<LensId, LensMeta>,
);

export function isLensId(v: unknown): v is LensId {
  return typeof v === "string" && v in LENS_BY_ID;
}

// hex (#rrggbb) -> rgba string with alpha; for soft fills/glows from one source of truth.
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
