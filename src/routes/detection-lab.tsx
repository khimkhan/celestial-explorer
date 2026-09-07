import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import {
  detectSimple,
  generateSeries,
  type TransitModel,
} from "@/lib/observationEngine";
import { FlaskConical, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/detection-lab")({
  head: () => ({
    meta: [
      { title: "Detection Lab · Test a Transit Signal | BR" },
      {
        name: "description",
        content:
          "Dial in noise, stellar variability, transit depth and number of transits, then see whether the educational detection algorithm calls it a planet or a false positive.",
      },
      { property: "og:title", content: "Detection Lab · Test a Transit Signal | BR" },
      {
        property: "og:description",
        content:
          "An interactive false-positive laboratory: build your own synthetic observation and test whether a transit can really be detected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetectionLab,
});

const GLASS = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md";

const DEFAULTS = {
  depthPct: 0.8,
  periodDays: 4,
  durationHours: 3,
  noisePct: 0.15,
  variabilityPct: 0.05,
  transits: 4,
  singleDip: false,
};

function DetectionLab() {
  const [p, setP] = useState(DEFAULTS);

  const { series, result, model } = useMemo(() => {
    const model: TransitModel = {
      periodDays: p.periodDays,
      depth: p.depthPct / 100,
      durationHours: p.durationHours,
      noise: p.noisePct / 100,
      variability: p.variabilityPct / 100,
      epoch: p.periodDays * 0.4,
    };
    const span = p.singleDip
      ? p.periodDays * 0.9
      : p.periodDays * (p.transits - 0.4) + p.periodDays * 0.5;
    const series = generateSeries(model, { durationDays: Math.max(span, 1), seed: 42 });
    return { series, result: detectSimple(series), model };
  }, [p]);

  const tone =
    result.verdict === "strong"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : result.verdict === "candidate"
        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
        : result.verdict === "false-positive"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : "border-slate-700 bg-slate-800/40 text-slate-300";

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />

        <header className={`${GLASS} mb-5 p-5`}>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-violet-300">
            <FlaskConical className="h-4 w-4" />
            Educational detection algorithm
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Detection Lab</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Build your own synthetic observation and ask the question every survey has to answer:
            is this an exoplanet, or just noise? Every number on this page is simulated — nothing
            here is telescope data.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section className={`${GLASS} space-y-4 p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Observation setup</h2>
              <button
                type="button"
                onClick={() => setP(DEFAULTS)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            <Slider label="Transit depth" unit="%" min={0.02} max={3} step={0.02} value={p.depthPct} onChange={(v) => setP({ ...p, depthPct: v })} />
            <Slider label="Orbital period" unit="d" min={0.5} max={20} step={0.5} value={p.periodDays} onChange={(v) => setP({ ...p, periodDays: v })} />
            <Slider label="Transit duration" unit="h" min={0.5} max={8} step={0.5} value={p.durationHours} onChange={(v) => setP({ ...p, durationHours: v })} />
            <Slider label="Photometric noise" unit="%" min={0.01} max={1.5} step={0.01} value={p.noisePct} onChange={(v) => setP({ ...p, noisePct: v })} />
            <Slider label="Stellar variability" unit="%" min={0} max={1} step={0.01} value={p.variabilityPct} onChange={(v) => setP({ ...p, variabilityPct: v })} />
            <Slider label="Transits observed" unit="" min={1} max={8} step={1} value={p.transits} onChange={(v) => setP({ ...p, transits: v })} disabled={p.singleDip} />

            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <input
                type="checkbox"
                checked={p.singleDip}
                onChange={(e) => setP({ ...p, singleDip: e.target.checked })}
                className="h-4 w-4 accent-amber-400"
              />
              Single brightness dip only
            </label>
          </section>

          <div className="space-y-5">
            <section className={`${GLASS} overflow-hidden p-4`}>
              <h2 className="mb-2 text-sm font-semibold">Synthetic light curve</h2>
              <LabCurve series={series} depth={model.depth} marks={result.transitTimes} span={series[series.length - 1]?.time ?? 1} />
            </section>

            <section className={`rounded-2xl border p-5 ${tone}`}>
              <p className="font-mono text-[11px] uppercase tracking-wider opacity-80">
                Simulated result
              </p>
              <p className="mt-1 text-2xl font-bold">{result.verdictLabel.toUpperCase()}</p>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">{result.explanation}</p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Transits detected" value={String(result.transitCount)} />
              <Metric label="Estimated period" value={result.periodDays ? `${result.periodDays.toFixed(2)} d` : "—"} />
              <Metric label="Measured depth" value={result.depth ? `${(result.depth * 100).toFixed(3)} %` : "—"} />
              <Metric label="Signal / noise" value={result.snr ? `${result.snr.toFixed(1)} σ` : "—"} />
              <Metric label="Period consistency" value={`${(result.consistency * 100).toFixed(0)} %`} />
              <Metric label="Model agreement" value={`${(result.modelAgreement * 100).toFixed(0)} %`} />
              <Metric label="Confidence" value={`${(result.confidence * 100).toFixed(1)} %`} />
              <Metric label="True depth (input)" value={`${p.depthPct.toFixed(2)} %`} />
            </section>

            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400/80">
              Simulation score — not scientific validation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabCurve({
  series,
  depth,
  marks,
  span,
}: {
  series: { time: number; flux: number }[];
  depth: number;
  marks: number[];
  span: number;
}) {
  const w = 1000;
  const h = 260;
  const pad = 12;
  const lo = 1 - depth * 2.5 - 0.001;
  const hi = 1 + depth * 1.5 + 0.001;
  const y = (f: number) => pad + ((hi - f) / (hi - lo)) * (h - pad * 2);
  const x = (t: number) => (t / Math.max(span, 1e-6)) * w;
  const pts = series.map((s) => `${x(s.time).toFixed(1)},${y(s.flux).toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="block w-full rounded-lg bg-slate-950/70"
      style={{ height: 260 }}
      role="img"
      aria-label="Synthetic light curve produced by the current lab settings"
    >
      <line x1={0} x2={w} y1={y(1)} y2={y(1)} stroke="#334155" strokeDasharray="4 6" />
      {marks.map((t, i) => (
        <line key={i} x1={x(t)} x2={x(t)} y1={pad} y2={h - pad} stroke="#f59e0b66" strokeWidth={1.5} />
      ))}
      <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth={1.2} />
    </svg>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`block ${disabled ? "opacity-40" : ""}`}>
      <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-slate-400">
        {label}
        <span className="text-white">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-violet-500"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}
