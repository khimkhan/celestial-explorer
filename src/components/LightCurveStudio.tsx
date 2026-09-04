import { useMemo, useState } from "react";
import type { FluxPoint, TransitDetection } from "@/types";
import LightCurveChart from "./LightCurveChart";
import PeriodogramChart from "./PeriodogramChart";
import { LineChart, Loader2 } from "lucide-react";

type Mode = "raw" | "clean" | "transit" | "model" | "bls";

interface Props {
  rawPoints: FluxPoint[];
  cleanPoints: FluxPoint[];
  detection: TransitDetection | null;
  loading?: boolean;
  progressMsg?: string;
}

const TABS: { key: Mode; label: string; caption: string }[] = [
  { key: "raw", label: "Raw data", caption: "Every simulated brightness measurement, drifts and noise included." },
  { key: "clean", label: "Cleaned data", caption: "Slow instrumental and stellar drifts removed; baseline flattened to 1.0." },
  { key: "transit", label: "Detected transit", caption: "All events folded on the recovered period — the repeated dip stacks up." },
  { key: "model", label: "Model fit", caption: "Box transit model (depth and duration) drawn over the folded observations." },
  { key: "bls", label: "Periodogram", caption: "Box-least-squares power: the tallest spike is the recovered orbital period." },
];

/** Interactive light-curve workbench: raw → cleaned → detected → model fit. */
export default function LightCurveStudio({
  rawPoints,
  cleanPoints,
  detection,
  loading,
  progressMsg,
}: Props) {
  const [mode, setMode] = useState<Mode>("raw");

  const peak = detection?.bestPeak ?? null;
  const halfWidth = peak ? peak.duration / 24 / peak.period / 2 : 0;

  const modelPoints = useMemo<FluxPoint[]>(() => {
    if (!peak) return [];
    const pts: FluxPoint[] = [];
    for (let i = 0; i < 600; i++) {
      const phase = -0.5 + i / 599;
      pts.push({
        time: phase,
        flux: 1 - (Math.abs(phase) < halfWidth ? peak.depth : 0),
        error: 0,
      });
    }
    return pts;
  }, [peak, halfWidth]);

  const active = TABS.find((t) => t.key === mode)!;

  let body: React.ReactNode = null;
  if (loading) {
    body = (
      <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <p className="font-mono text-[11px]">{progressMsg || "Analysing photometry…"}</p>
      </div>
    );
  } else if (mode === "raw") {
    body = <LightCurveChart points={rawPoints} xLabel="Time (BJD)" yLabel="Relative flux" color="#38bdf8" height={300} />;
  } else if (mode === "clean") {
    body = <LightCurveChart points={cleanPoints} xLabel="Time (BJD)" yLabel="Relative flux" color="#34d399" height={300} />;
  } else if (mode === "bls") {
    body = detection ? (
      <PeriodogramChart data={detection.periodogram} peaks={detection.allPeaks} height={300} />
    ) : null;
  } else if (mode === "transit" && detection) {
    body = (
      <LightCurveChart
        points={detection.foldedCurve}
        xLabel="Orbital phase"
        yLabel="Relative flux"
        color="#fbbf24"
        highlightTransit={peak ? { center: 0, width: halfWidth * 2 } : undefined}
        height={300}
      />
    );
  } else if (mode === "model") {
    body = (
      <LightCurveChart
        points={modelPoints}
        xLabel="Orbital phase"
        yLabel="Model flux"
        color="#a78bfa"
        highlightTransit={peak ? { center: 0, width: halfWidth * 2 } : undefined}
        height={300}
      />
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-5 py-3">
        <LineChart className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold tracking-tight text-white">
          Light curve · observation data
        </h3>
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
          Educational detection simulation
        </span>
      </header>

      <div className="flex flex-wrap gap-1.5 px-5 pt-3 font-mono text-[10px] uppercase tracking-wider">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            className={`rounded-lg border px-2.5 py-1.5 transition-colors ${
              mode === t.key
                ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-2 pt-3 sm:px-5">{body}</div>
      <p className="px-5 pb-4 text-xs text-slate-500">
        {active.caption} Drag horizontally to zoom, double-click to reset, hover for exact values.
      </p>
    </section>
  );
}
