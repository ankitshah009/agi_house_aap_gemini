"use client";

import { useEffect, useState } from "react";
import AapLogo from "./AapLogo";

export default function BrandHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md px-6 py-4 transition-shadow${
        scrolled ? " shadow-e2" : ""
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <AapLogo />
            <span aria-hidden="true" className="h-5 w-px bg-border-strong" />
            <h1 className="text-2xl font-extrabold leading-tight text-gradient">
              Ad AI Pulse
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="text-gradient font-medium">From signal to strategy.</span>{" "}
            <span className="text-ink-faint">AI-native adtech intelligence.</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5">
            <span className="status-live h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-2xs text-ink-muted">Ada active</span>
          </span>
          <span className="hidden text-2xs font-mono uppercase tracking-wider text-ink-faint sm:inline">
            Reviewed by the AAP Engine
          </span>
        </div>
      </div>
    </header>
  );
}
