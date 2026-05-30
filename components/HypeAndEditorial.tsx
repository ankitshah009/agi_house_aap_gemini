import { BookOpen } from "lucide-react";

export default function HypeAndEditorial({
  hypeCheckScore,
  hypeNotes,
  rachelEicComment,
}: {
  hypeCheckScore: number;
  hypeNotes: string;
  rachelEicComment: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      {/* Anti-hype grounding index (Ada) */}
      <div className="md:col-span-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <h3 className="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Grounding Index · Anti-Hype
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tighter text-violet-400 leading-none tabular-nums">
              {hypeCheckScore}%
            </span>
            <span className="text-[10px] font-mono uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/20 font-bold tracking-wider leading-none">
              {hypeCheckScore > 85 ? "Highly Fact-Grounded" : "Fringe / Volatile"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal mt-2.5 font-sans">{hypeNotes}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-900">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${hypeCheckScore}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
            <span>Marketing Hype</span>
            <span>Verified Truth</span>
          </div>
        </div>
      </div>

      {/* Rachel's Editor-in-Chief edict */}
      <div className="md:col-span-7 rounded-xl border border-slate-800 bg-amber-500/5 p-4 flex flex-col justify-between border-l-4 border-l-amber-500/40">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-500/80" />
            <h3 className="font-mono text-[10px] font-bold tracking-widest text-amber-500 uppercase">
              Editor-in-Chief · Rachel
            </h3>
          </div>
          <blockquote
            className="text-[12px] text-slate-300 italic leading-relaxed pr-2"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {rachelEicComment}
          </blockquote>
        </div>
        <div className="mt-4 pt-2.5 border-t border-amber-500/10 flex items-center justify-between text-[10px] font-mono text-amber-600 uppercase font-black tracking-wider">
          <span>Sign-off: Rachel · EIC Approved</span>
          <span>Review Valid 30d</span>
        </div>
      </div>
    </div>
  );
}
