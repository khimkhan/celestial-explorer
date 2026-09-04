import type { DetectionReport } from "@/lib/detectionReport";
import { ShieldCheck, Info } from "lucide-react";

interface Props {
  report: DetectionReport;
}

const LEVEL_COLOR: Record<DetectionReport["confidenceLevel"], string> = {
  HIGH: "text-emerald-300",
  MODERATE: "text-sky-300",
  LOW: "text-amber-300",
  INCONCLUSIVE: "text-red-300",
};

const LEVEL_BAR: Record<DetectionReport["confidenceLevel"], string> = {
  HIGH: "from-emerald-400 to-emerald-300",
  MODERATE: "from-sky-400 to-cyan-300",
  LOW: "from-amber-400 to-amber-300",
  INCONCLUSIVE: "from-red-500 to-red-400",
};

export default function DetectionConfidencePanel({ report }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold tracking-tight text-white">Detection confidence</h3>
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
          Simulated score · not an official confirmation
        </span>
      </header>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <div className={`font-mono text-4xl font-bold tracking-tight ${LEVEL_COLOR[report.confidenceLevel]}`}>
            {report.confidencePercent.toFixed(1)}%
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Confidence level ·{" "}
            <span className={LEVEL_COLOR[report.confidenceLevel]}>{report.confidenceLevel}</span>
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${LEVEL_BAR[report.confidenceLevel]} transition-[width] duration-700`}
              style={{ width: `${report.confidencePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
        {report.metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
            <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
              {m.label}
            </div>
            <div className="truncate font-mono text-sm font-semibold text-white">{m.value}</div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400/70"
                style={{ width: `${Math.round(m.score * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">{m.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
        {report.explanation}
      </p>
    </section>
  );
}
