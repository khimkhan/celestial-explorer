import type { ParameterRow } from "@/lib/detectionReport";
import { Table2 } from "lucide-react";

interface Props {
  rows: ParameterRow[];
}

/** Scientific parameter table with explicit archive / simulated provenance. */
export default function OrbitalParametersPanel({ rows }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-5 py-3">
        <Table2 className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold tracking-tight text-white">Orbital parameters</h3>
        <div className="ml-auto flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider">
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Measured · NASA archive
          </span>
          <span className="flex items-center gap-1 text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Estimated · simulation
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-px bg-slate-800/60 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const unavailable = row.value === "Data unavailable";
          return (
            <div key={row.label} className="bg-slate-900/70 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    row.provenance === "archive"
                      ? "bg-emerald-400"
                      : row.provenance === "simulated"
                        ? "bg-cyan-400"
                        : "bg-slate-600"
                  }`}
                />
                <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                  {row.label}
                </span>
              </div>
              <div
                className={`mt-1 font-mono text-sm font-semibold ${unavailable ? "text-slate-600" : "text-white"}`}
              >
                {row.value}
              </div>
              {row.hint && !unavailable && (
                <div className="mt-0.5 text-[10px] text-slate-500">{row.hint}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
