"use client";

import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";

const SUGGESTIONS = [
  "How does this impact programmatic workflows?",
  "What do I tell my biggest client this week?",
  "Which lens should a CMO care about most?",
];

interface Msg {
  role: "user" | "ada";
  text: string;
}

export default function AskAda({ analysis }: { analysis: SignalAnalysis }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const context =
    `${analysis.title}\nSummary: ${analysis.summary}\n` +
    analysis.cards
      .map((c) => `${LENS_BY_ID[c.lens].role} (${c.scoreName} ${c.score}): ${c.brief}`)
      .join("\n");

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context }),
      });
      const data = (await res.json()) as { answer?: string };
      setMessages((m) => [...m, { role: "ada", text: data.answer ?? "…" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ada", text: "I'm offline this second — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800/70 pb-2.5">
        <span className="w-7 h-7 rounded bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-[10px] font-black">
          ADA
        </span>
        <div>
          <h3 className="text-xs font-sans font-bold text-white flex items-center gap-1.5">
            Ask Ada <Sparkles className="w-3 h-3 text-violet-400" />
          </h3>
          <p className="text-[10px] font-mono text-slate-500">
            Follow-up questions about this brief — go deeper.
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div ref={scrollRef} className="space-y-2.5 max-h-56 overflow-y-auto thin-scroll mb-3 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-slate-100"
                    : "bg-slate-950/60 border border-slate-800 text-slate-300"
                }`}
              >
                {m.role === "ada" && (
                  <span className="block text-[9px] font-mono text-violet-400 uppercase tracking-wider mb-1">
                    Ada
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono">
                Ada is thinking<span className="animate-blink">▌</span>
              </div>
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-[10px] font-sans text-slate-300 bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 hover:text-white rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Ada about this signal…"
          disabled={loading}
          className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-violet-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg p-2 transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
