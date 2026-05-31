# Design System — Ad AI Pulse (AAP)

> Read this before any visual or UI change. All fonts, colors, spacing, and aesthetic
> direction are defined here. Don't deviate without explicit approval.

## Product Context
- **What this is:** An AI-native daily intelligence product for the AdTech + AI industry. One curated signal is refracted through four professional lenses into four role-specific decisions, and the day's top signals can be consumed four ways (Visual / Voice / Video / Read).
- **Who it's for:** Agency strategists, executives, AdTech & GTM leaders, and Responsible-AI/Policy leads.
- **Memorable thing:** "Same signal, four decisions." A premium intelligence terminal that feels AI-native, not a dashboard.

## Aesthetic Direction
- **Direction:** Dark premium "intelligence terminal." High-end consulting meets a glowing futuristic schematic.
- **Decoration level:** Intentional — a lens-colored neon aurora behind opaque cards; restrained glows on active state only.
- **Mood:** Confident, sophisticated, information-dense but calm. Neon energy earned, never gaudy.
- **Default theme:** DARK (`data-theme="dark"`). Light is opt-in via the toggle.

## Typography
- **Display / headings (h1, h2):** **Sora** (geometric, premium) via `--font-display`. Tracking `-0.02em`.
- **Body / UI:** **Inter** via `--font-sans`. The readable workhorse; all body + small labels.
- **Data / mono:** **Geist Mono** via `--font-mono`. Figures, hashes, timestamps, eyebrows.
- **Brand gradient text:** `text-gradient` utility (violet→indigo→blue, `#a855f7 → #6366f1 → #3b82f6`) — brand moments only (taglines, one prominent heading per surface), never small/body text (WCAG).
- **Scale (rem):** 2xs .6875 · xs .75 · sm .8125 · base .9375 · lg 1.125 · xl 1.375 · 2xl 1.75 · 3xl 2.25.
- **Eyebrows / meta:** `text-2xs font-mono uppercase tracking-wider text-ink-faint`.

## Color (OKLCH tokens, dark default)
- **Canvas:** `--color-bg oklch(15% 0.022 280)` (near-black, faint violet) + the `bg-canvas` aurora.
- **Surfaces:** `--color-surface oklch(22% …)`, `--color-surface-2 oklch(26% …)`. Cards use `card-depth` (1px top-edge highlight + soft drop) for glass lift.
- **Ink:** `--color-ink oklch(96%)`, `-muted oklch(74%)`, `-faint oklch(62%)`. Body ≥ 4.5:1 always.
- **Accent (action/selection):** `--color-accent oklch(72% 0.2 272)` vivid blue-violet. Active states add `glow-accent`.
- **Four lens hues (8px dots, per-lens active glow `glow-lens-*`):** strategist violet 285 · executive blue 245 · gtm cyan 195 · policy gold 70.
- **Aurora (`bg-canvas`):** four soft radial glows in the lens hues — violet top-left, blue top-right, cyan bottom-right, gold bottom. Decorative, killed by `prefers-reduced-motion`.

## Spacing
- **Base unit:** 8px rhythm. Density: comfortable. Section gaps `gap-5/6`; card padding `p-5/6`.
- **Max content width:** `max-w-7xl` (1280px). Reading measure `max-w-[68ch]` on prose.

## Layout
- **Approach:** Hybrid — editorial hero + grid app. Single vertical scroll: header → today's signals → personalize (lens + format) → format content → Ada → footer.
- **Border radius:** sm 6px · md 8px · lg 12px · pill 999px.

## Motion
- **Approach:** State-only, minimal. `enter` entrance, `status-live` breathe, `working` shimmer, `level-bar` audio.
- **Easing/duration:** ease-out; fast 130ms / base 180ms / slow 240ms. Global `prefers-reduced-motion` kill-switch.

## Glows (brand neon — relaxes the old "no glows" rule, kept restrained)
- `glow-accent` — soft violet ring + bloom on the single active control (mode tab, persona chip, selected card).
- `glow-lens-{id}` — per-lens tinted glow on active lens chips.
- Decorative only — never the sole state indicator (borders + aria remain).

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-31 | Dark-neon default + lens aurora | Match the AAP brand panels (dark premium, violet→blue, neon lens streams). |
| 2026-05-31 | Sora display + Inter body | Distinctive AI-native headings; Inter stays for readable body. Drop the all-Inter "safe default" look. |
| 2026-05-31 | Brand gradient + restrained glows | Brand cohesion on active states + key headings, AA preserved. |
