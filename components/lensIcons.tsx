import { Target, Award, TrendingUp, ShieldAlert, type LucideIcon } from "lucide-react";
import type { LensId } from "@/lib/types";

// Lens -> icon, matching the deck's lens iconography.
export const LENS_ICON: Record<LensId, LucideIcon> = {
  strategist: Target,
  executive: Award,
  gtm: TrendingUp,
  policy: ShieldAlert,
};
