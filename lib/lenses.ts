// The four professional lenses. Per the impeccable-modern system, lens hues are used
// ONLY as an 8px category dot or a 2px under-tab indicator — never as a fill, full
// border, or score color. dotClass is a static Tailwind class (token-backed); cssVar is
// for the inline 2px indicator.

import type { LensId } from "./types";

export type LensIconName = "Target" | "Award" | "TrendingUp" | "ShieldAlert";

export interface LensMeta {
  id: LensId;
  role: string;
  deliverable: string;
  scoreName: string;
  voice: string;
  color: string; // hex (legacy / dark-reel dot fallback)
  dotClass: string; // static token-backed class for the 8px dot
  cssVar: string; // CSS var() for inline 2px indicators
  icon: LensIconName;
}

export const LENSES: LensMeta[] = [
  {
    id: "strategist",
    role: "Agency Strategist",
    deliverable: "Client POV",
    scoreName: "Campaign Urgency",
    voice: "What this means for campaigns, clients, and creative strategy.",
    color: "#8b5cf6",
    dotClass: "bg-lens-strategist",
    cssVar: "var(--color-lens-strategist)",
    icon: "Target",
  },
  {
    id: "executive",
    role: "Executive Strategy",
    deliverable: "Investment Decision",
    scoreName: "Strategic Priority",
    voice: "Business impact, competitive shifts, and strategic priorities.",
    color: "#3b82f6",
    dotClass: "bg-lens-executive",
    cssVar: "var(--color-lens-executive)",
    icon: "Award",
  },
  {
    id: "gtm",
    role: "Adtech & GTM",
    deliverable: "Product Opportunity",
    scoreName: "Market Potential",
    voice: "Who wins, who loses, and where the market is moving.",
    color: "#14b8a6",
    dotClass: "bg-lens-gtm",
    cssVar: "var(--color-lens-gtm)",
    icon: "TrendingUp",
  },
  {
    id: "policy",
    role: "Responsible AI & Policy",
    deliverable: "Trust Assessment",
    scoreName: "Regulatory Risk",
    voice: "Ethical implications, policy updates, and transparency considerations.",
    color: "#f59e0b",
    dotClass: "bg-lens-policy",
    cssVar: "var(--color-lens-policy)",
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

// hex (#rrggbb) -> rgba string with alpha (legacy helper; used by the dark reel only).
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
