"use client";

import { useState } from "react";
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

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-5 space-y-3">
      <div className="flex items-center gap-1.5 border-b border-slate-800/70 pb-2.5">
        <FlaskConical className="w-4 h-4 text-violet-400" />
        <h3 className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-200">
          Lens Engine Playground
        </h3>
      </div>
      <p className="text-[11px] text-slate-400 leading-snug">
        Drop in any AdTech + AI signal. Ada runs it through all four lenses live.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) onSubmit(text.trim());
        }}
        className="space-y-2.5"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. The Trade Desk launches an AI-native CTV bidding layer…"
          disabled={disabled}
          className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-colors resize-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              disabled={disabled}
              className="text-[10px] text-slate-400 bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 hover:text-slate-200 rounded-full px-2 py-1 transition-colors disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-40"
        >
          <span>Run Lens Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
