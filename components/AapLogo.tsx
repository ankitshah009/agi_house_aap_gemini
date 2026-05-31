// The AAP brand mark: a violet -> blue gradient "AAP" wordmark with the pulse waveform.
// Gradient via background-clip:text (uses the loaded Inter weight) + an inline SVG pulse.
export default function AapLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-start ${className}`} aria-label="AAP, Ad AI Pulse">
      <span
        className="text-2xl font-extrabold tracking-tight leading-none"
        style={{
          backgroundImage: "linear-gradient(115deg, #a855f7 0%, #6366f1 50%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        AAP
      </span>
      <svg
        width="17"
        height="13"
        viewBox="0 0 18 14"
        fill="none"
        aria-hidden="true"
        className="ml-0.5 mt-0.5 shrink-0"
      >
        <defs>
          <linearGradient id="aap-pulse" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <polyline
          points="1,7 5,7 8,1.5 11,12.5 14,7 17,7"
          stroke="url(#aap-pulse)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
