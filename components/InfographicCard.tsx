"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";

type Props = {
  title: string;
  summary: string;
  brief?: string;
  // "signal" = single-story infographic; "digest" = combined blueprint executive brief.
  kind?: "signal" | "digest";
  // Structured spec for the digest blueprint (layers, score, winners/risks, actions).
  // Memoize at the call site so the fetch effect runs once.
  blueprint?: unknown;
};

// Module-level cache keyed by title: lazily generate each infographic at most once
// per session, so re-mounting (tab switches, list re-renders) reuses the result.
const cache = new Map<string, string | null>();

export default function InfographicCard({ title, summary, brief, kind = "signal", blueprint }: Props) {
  const cacheKey = `${kind}|${title}`;
  const [dataUrl, setDataUrl] = useState<string | null>(() => cache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(() => !cache.has(cacheKey));
  const requested = useRef(false);

  useEffect(() => {
    // If we already have a cached result for this kind+title, use it and skip the fetch.
    if (cache.has(cacheKey)) {
      setDataUrl(cache.get(cacheKey) ?? null);
      setLoading(false);
      return;
    }
    if (requested.current) return;
    requested.current = true;

    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/infographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, summary, brief, kind, blueprint }),
        });
        const json = (await res.json()) as { dataUrl?: string | null };
        const url = typeof json.dataUrl === "string" ? json.dataUrl : null;
        cache.set(cacheKey, url);
        if (alive) setDataUrl(url);
      } catch {
        cache.set(cacheKey, null);
        if (alive) setDataUrl(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [cacheKey, title, summary, brief, kind, blueprint]);

  return (
    <figure className="enter rounded-lg border border-border bg-surface overflow-hidden shadow-e1">
      <div className="relative aspect-video w-full bg-surface-2">
        {loading ? (
          // Tasteful neutral shimmer while the image generates.
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="working absolute inset-0 opacity-20" />
            <div className="relative flex items-center gap-2 text-2xs text-ink-faint">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Generating infographic…
            </div>
          </div>
        ) : dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`AI-generated infographic explaining: ${title}`}
            className="block w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          // Neutral placeholder (NOT an error) — keep the layout, show the title.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
            <ImageOff className="w-5 h-5 text-ink-faint" aria-hidden="true" />
            <p className="text-sm font-medium text-ink line-clamp-2">{title}</p>
            <p className="text-2xs text-ink-faint">Visual unavailable</p>
          </div>
        )}
      </div>

      <figcaption className="flex items-center gap-1.5 px-3 py-2 text-2xs text-ink-faint">
        <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
        AI-generated visual by Ada / Nano Banana
      </figcaption>
    </figure>
  );
}
