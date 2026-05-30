import { ShieldCheck, Cpu } from "lucide-react";

export default function BrandHeader() {
  return (
    <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-sans font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 text-3xl select-none">
              AAP
            </span>
            <div className="flex items-baseline gap-2">
              <h1 className="font-sans font-extrabold text-xl tracking-tight text-white">
                Ad AI Pulse
              </h1>
              <span className="text-[9px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                Provenance Approved
              </span>
            </div>
          </div>
          <p className="text-slate-400 font-sans text-xs tracking-wide">
            From Signal to Strategy.{" "}
            <span className="text-slate-600 font-mono text-[10px]">
              | AI-Native AdTech Intelligence
            </span>
          </p>
        </div>

        <div className="hidden lg:flex flex-col items-center py-1.5 px-4 rounded-xl border border-slate-900 bg-slate-950 text-center">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black">
            Core Moat
          </span>
          <span className="text-xs font-semibold tracking-wide text-white">
            Same Signal. <span className="text-teal-400">Different Decisions.</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-xs font-mono text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            <span>Ada Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-xs font-mono text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>AAP Engine Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
}
