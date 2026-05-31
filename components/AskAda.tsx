"use client";

import { useRef, useState, useId } from "react";
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
  const fieldId = useId();

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
        { role: "ada", text: "I'm offline this second. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      <div className="flex items-center gap-2 mb-3 border-b border-border pb-2.5">
        <Sparkles className="w-4 h-4 text-ink-faint" />
        <div>
          <h3 className="text-sm font-semibold text-ink">Ask Ada</h3>
          <p className="text-xs text-ink-muted">
            Follow-up questions about this brief. Go deeper.
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
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent-soft border border-accent text-ink"
                    : "bg-surface-2 border border-border text-ink"
                }`}
              >
                {m.role === "ada" && (
                  <span className="block text-2xs font-medium text-ink-faint mb-1">
                    Ada
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink-muted">
                Ada is thinking<span className="text-ink-muted">▌</span>
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
              className="min-h-9 text-xs text-ink-muted bg-surface-2 border border-border hover:border-border-strong rounded-full px-3 py-1 transition-colors duration-fast disabled:opacity-50"
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
        <label htmlFor={fieldId} className="sr-only">
          Ask Ada about this signal
        </label>
        <input
          id={fieldId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Ada about this signal."
          disabled={loading}
          className="flex-1 min-h-11 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors duration-base"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send question"
          className="min-h-11 min-w-11 flex items-center justify-center bg-accent text-accent-ink hover:bg-accent-hover rounded-md transition-colors duration-fast disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
