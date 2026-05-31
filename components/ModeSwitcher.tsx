"use client";

import { Eye, Volume2, Play, BookOpen } from "lucide-react";

// The four ways to consume one daily intelligence source.
export type BriefMode = "visual" | "voice" | "video" | "read";

const MODES: { id: BriefMode; label: string; hint: string; icon: typeof Eye }[] = [
  { id: "visual", label: "Visual", hint: "60 sec", icon: Eye },
  { id: "voice", label: "Voice", hint: "listen", icon: Volume2 },
  { id: "video", label: "Video", hint: "watch", icon: Play },
  { id: "read", label: "Read", hint: "3-5 min", icon: BookOpen },
];

export default function ModeSwitcher({
  mode,
  onMode,
}: {
  mode: BriefMode;
  onMode: (m: BriefMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose how to consume today's intelligence"
      className="flex flex-wrap gap-2"
    >
      {MODES.map((m) => {
        const Icon = m.icon;
        const on = mode === m.id;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={on}
            onClick={() => onMode(m.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 min-h-12 text-sm transition-colors duration-fast ${
              on
                ? "border-accent bg-accent text-accent-ink shadow-e1"
                : "border-border bg-surface text-ink-muted hover:text-ink hover:border-border-strong"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">{m.label}</span>
            <span className={on ? "text-2xs text-accent-ink/80" : "text-2xs text-ink-faint"}>
              {m.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
