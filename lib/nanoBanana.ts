// Client helper for the "Nano Banana" (Gemini 2.5 Flash Image) hero band.
// Best-effort: returns a data URL or null; callers fall back to a coded gradient hero.

import type { DailyView } from "./dailyBrief";

export function buildHeroPrompt(view: DailyView): string {
  const movers = view.movers.map((m) => `${m.company} (${m.move})`).join(", ");
  return [
    "A premium, dark, futuristic editorial hero banner for an AdTech + AI intelligence brief.",
    `Theme: three industry movers and how their moves interconnect — ${movers}.`,
    `Framed for the ${view.lensLabel} lens. Through-line: "${view.through}".`,
    "Visual style: Bloomberg terminal meets an OpenAI launch page. Near-black navy background,",
    `neon gradient accents in ${view.color}, cyan and violet, faint grid lines, three glowing abstract`,
    "company nodes connected by luminous edges to show dynamics.",
    "Cinematic, high-contrast, wide 16:9 banner. No real logos, no readable body text, no words.",
    "Keep the lower third visually calm for a text overlay.",
  ].join(" ");
}

export async function generateHeroImage(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = (await res.json()) as { image?: string };
      if (data.image) return data.image;
    }
  } catch {
    /* fall through to coded hero */
  }
  return null;
}
