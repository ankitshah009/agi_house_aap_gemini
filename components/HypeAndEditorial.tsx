export default function HypeAndEditorial({
  hypeCheckScore,
  hypeNotes,
  rachelEicComment,
}: {
  hypeCheckScore: number;
  hypeNotes: string;
  rachelEicComment: string;
}) {
  const grounded = hypeCheckScore > 85;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      {/* Anti-hype grounding index (Ada) */}
      <div className="md:col-span-5 rounded-lg border border-border bg-surface p-4 shadow-e1 flex flex-col">
        <h3 className="text-sm font-semibold text-ink">Grounding index</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          How fact-grounded this signal is, not how loud the hype is.
        </p>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-2xl font-semibold tnum text-ink leading-none">
            {hypeCheckScore}%
          </span>
          <span
            className={`text-sm font-medium ${grounded ? "text-success" : "text-warning"}`}
          >
            {grounded ? "Highly fact-grounded" : "Fringe or volatile"}
          </span>
        </div>

        <p className="text-sm text-ink-muted leading-normal mt-3">{hypeNotes}</p>

        <div className="mt-auto pt-4">
          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-[width] duration-180"
              style={{ width: `${hypeCheckScore}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-2xs text-ink-faint">
            <span>Marketing hype</span>
            <span>Verified truth</span>
          </div>
        </div>
      </div>

      {/* Rachel's Editor-in-Chief edict */}
      <div className="md:col-span-7 rounded-lg border border-border bg-surface p-4 shadow-e1 flex flex-col">
        <h3 className="text-sm font-semibold text-ink">Editor-in-chief note</h3>

        <blockquote className="text-base text-ink italic leading-relaxed mt-3">
          {rachelEicComment}
        </blockquote>

        <p className="text-xs text-ink-muted mt-auto pt-4">
          Rachel, editor-in-chief. Sign-off valid 30 days.
        </p>
      </div>
    </div>
  );
}
