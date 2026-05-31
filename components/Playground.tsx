"use client";

import { useState, useId } from "react";
import { FlaskConical, ArrowRight } from "lucide-react";

const EXAMPLES = [
  "Google launches Gemini Ads Studio for advertisers",
  "OpenAI launches GPT-6 with lower inference costs",
  "Apple restricts third-party ad attribution in iOS 27",
];

export default function Playground({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const fieldId = useId();

  return (
    <div className="rounded-lg border border-border bg-surface p-5 space-y-3 shadow-e1">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <FlaskConical className="w-4 h-4 text-ink-faint" />
        <h3 className="text-sm font-semibold text-ink">Playground</h3>
      </div>
      <p className="text-sm text-ink-muted leading-snug">
        Drop in any AdTech and AI signal. Ada runs it through all four lenses live.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSubmit(text.trim());
        }}
        className="space-y-2.5"
      >
        <label htmlFor={fieldId} className="sr-only">
          Signal to analyze
        </label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. The Trade Desk launches an AI-native CTV bidding layer."
          disabled={disabled}
          className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-faint resize-none transition-colors duration-base"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              disabled={disabled}
              className="min-h-9 text-xs text-ink-muted bg-surface-2 border border-border hover:border-border-strong rounded-full px-3 py-1 transition-colors duration-fast disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-full min-h-11 flex items-center justify-center gap-2 bg-accent text-accent-ink hover:bg-accent-hover rounded-md px-3 text-sm font-semibold transition-colors duration-fast disabled:opacity-40"
        >
          <span>Run lens engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
