# Ad AI Pulse (AAP)

**From Signal to Strategy.** AI-native intelligence for the AdTech and AI economy.

The **AAP Lens Engine™** turns one industry signal into four role-specific decisions:

| Lens | Deliverable | Score metric |
|------|-------------|--------------|
| Agency Strategist | Client POV | Campaign Urgency |
| Executive Strategy | Investment Decision | Strategic Priority |
| Adtech & GTM | Product Opportunity | Market Potential |
| Responsible AI & Policy | Trust Assessment | Regulatory Risk |

> **Same Signal. Different Decisions.** · Produced by **Ada** (AI Research Analyst) · Reviewed by **Rachel** (Editor-in-Chief) · Sources available.

## What's in the demo

All six MVP components, one screen:

1. **Lens Engine** — one signal → four genuinely distinct Pulse Cards (different scores, vocabulary, and `NOW / NEXT / LATER` action ladders).
2. **Content-gen pipeline** — the visible `source → filter → frame ×4 → review → publish` reasoning feed (Ada browses & grounds; Rachel reviews; the cards publish).
3. **60-second daily brief** — a glanceable infographic of the four scored lenses.
4. **Voice mode** — a Rachel-voice briefing (Gemini TTS → browser Web Speech fallback, AI-disclosed) + **Ask Ada** follow-up Q&A.
5. **Short-form reel** — a 9:16 motion-graphics reel of the brief ("Rachel as creator").
6. **Trust layer** — sources drawer, provenance hash, and the Ada → Rachel → **Aubric** disclosure progression.

## Three engine modes (presenter picks on stage)

| Mode | Backend | Speed | Use |
|------|---------|-------|-----|
| **Cached** | Local fixtures | Instant | Bulletproof opener; works offline |
| **Fast** | `gemini-2.5-flash` structured output | ~15–20s | Reliable live analysis |
| **Ada Live** | Antigravity managed agent (Interactions API) | ~30–150s | Real browsing + real source URLs |

Any live failure (timeout, error, malformed output) **transparently falls back to a cached brief**, so the audience always sees four cards.

## Run it

```bash
cp .env.example .env.local   # add your GEMINI_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Pre-flight on stage: `curl localhost:3000/api/health` → `{ "hasApiKey": true }`.

## Architecture

- **Next.js 16 (App Router) + Tailwind v4**, fonts via `next/font` (Playfair Display / Plus Jakarta Sans / JetBrains Mono).
- `lib/` — `lenses`, `types`, `data` (curated signals), `prompt` (shared system prompt + JSON contract + `responseSchema`), `parse` (defensive extraction → `SignalAnalysis`), `agent` (Antigravity + Gemini backends), `env` (server-only key).
- `app/api/` — `pulse` (NDJSON streaming engine), `ada` (Q&A), `speech` (Rachel TTS), `health`.
- `components/` — the console, hero orb, Pulse Cards, reasoning panel, voice player, Ask Ada, reel, infographic, disclosure.
- The Gemini key is read **only** in server route handlers (`x-goog-api-key`); never shipped to the client.

## Suggested stage flow

1. Open on **Cached** — the hero signal is already on screen (zero network).
2. Click a signal → watch it transform into four decisions; toggle **Pulse Cards / 60s Brief / Reel**.
3. Play the **Rachel briefing**; ask **Ada** a follow-up.
4. Switch to **Ada Live**, drop a fresh signal in the Playground → watch Ada browse live and publish four cards with real sources.
5. Open the **Trust Registry** → show the Aubric progression.

---

Hackathon build · 2026-05-30. Pricing, accounts, and email are intentionally out of scope.
