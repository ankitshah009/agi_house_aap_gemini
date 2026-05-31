"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Send, Sparkles, UserCog, Check } from "lucide-react";
import type { SignalAnalysis } from "@/lib/types";
import { LENS_BY_ID } from "@/lib/lenses";

const STORE = "aap-profile";

interface Msg {
  role: "user" | "ada";
  text: string;
}

export default function AskAda({
  analysis,
  roleHint = "",
}: {
  analysis: SignalAnalysis;
  roleHint?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [project, setProject] = useState("");
  const [editing, setEditing] = useState(false);
  const [userSet, setUserSet] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const qId = useId();
  const roleId = useId();
  const projId = useId();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const p = JSON.parse(raw) as { role?: string; project?: string };
        setRole(p.role ?? "");
        setProject(p.project ?? "");
        if ((p.role ?? "").trim() || (p.project ?? "").trim()) setUserSet(true);
      }
    } catch {
      /* no storage */
    }
  }, []);

  // The top-level persona seeds Ada's role until the user sets their own context.
  useEffect(() => {
    if (roleHint && !userSet) setRole(roleHint);
  }, [roleHint, userSet]);

  function saveProfile() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ role, project }));
    } catch {
      /* ignore */
    }
    setUserSet(true);
    setEditing(false);
  }

  const hasProfile = role.trim().length > 0 || project.trim().length > 0;

  const briefContext =
    `${analysis.title}\nSummary: ${analysis.summary}\n` +
    analysis.cards
      .map((c) => `${LENS_BY_ID[c.lens].role} (${c.scoreName} ${c.score}): ${c.brief}`)
      .join("\n");

  const suggestions = hasProfile
    ? ["How does this affect my project specifically?", "What is my single most important next step?", "What should I tell my stakeholders?"]
    : ["How does this impact programmatic workflows?", "What do I tell my biggest client this week?", "Which lens should a CMO care about most?"];

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: briefContext, profile: { role, project } }),
      });
      const data = (await res.json()) as { answer?: string };
      setMessages((m) => [...m, { role: "ada", text: data.answer ?? "…" }]);
    } catch {
      setMessages((m) => [...m, { role: "ada", text: "I'm offline this second. Try again in a moment." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-e1">
      <div className="flex items-center justify-between gap-2 mb-3 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ink-faint" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-ink">Ask Ada</h3>
            <p className="text-xs text-ink-muted">Project-aware follow-up. Tailored to your work.</p>
          </div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 min-h-9 rounded-md border border-border bg-surface px-2.5 text-xs text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
        >
          <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
          {hasProfile ? "Your context" : "Set your context"}
        </button>
      </div>

      {/* Project context */}
      {editing ? (
        <div className="mb-3 rounded-md border border-border bg-surface-2 p-3 space-y-2.5">
          <p className="text-xs text-ink-muted">
            Tell Ada who you are so answers fit your actual work.
          </p>
          <div>
            <label htmlFor={roleId} className="block text-2xs font-medium text-ink-muted mb-1">
              Your role
            </label>
            <input
              id={roleId}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Agency strategist on a CPG account"
              className="w-full min-h-11 bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>
          <div>
            <label htmlFor={projId} className="block text-2xs font-medium text-ink-muted mb-1">
              Current project
            </label>
            <input
              id={projId}
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g. Migrating Search to Performance Max for Q3"
              className="w-full min-h-11 bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
            />
          </div>
          <button
            onClick={saveProfile}
            className="inline-flex items-center gap-1.5 min-h-9 rounded-md bg-accent text-accent-ink px-3 text-xs font-medium hover:bg-accent-hover transition-colors duration-fast"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            Save context
          </button>
        </div>
      ) : hasProfile ? (
        <div className="mb-3 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-ink">
          <span className="font-medium">{role || "Your role"}</span>
          {project ? <span className="text-ink-muted"> · {project}</span> : null}
        </div>
      ) : null}

      {messages.length > 0 && (
        <div ref={scrollRef} className="space-y-2.5 max-h-56 overflow-y-auto thin-scroll mb-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent-soft border border-accent text-ink"
                    : "bg-surface-2 border border-border text-ink"
                }`}
              >
                {m.role === "ada" && (
                  <span className="block text-2xs font-medium text-ink-faint mb-1">Ada</span>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-ink-muted">
                Ada is thinking
                <span className="animate-blink">▌</span>
              </div>
            </div>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {suggestions.map((s) => (
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
        <label htmlFor={qId} className="sr-only">
          Ask Ada about this signal
        </label>
        <input
          id={qId}
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
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
