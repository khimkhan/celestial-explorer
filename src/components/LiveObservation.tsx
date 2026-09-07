import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogPlanet } from "@/lib/planetLore";
import {
  detectSimple,
  isInTransit,
  modelFromPlanet,
  observedFlux,
  type FluxSample,
} from "@/lib/observationEngine";
import { useSimSettings, prefersReducedMotion } from "@/lib/simSettings";
import { Radio, Activity, Timer } from "lucide-react";

interface Props {
  planet: CatalogPlanet;
  /** compact layout for side panels */
  height?: number;
}

interface LogEntry {
  t: string;
  msg: string;
}

/**
 * LIVE OBSERVATION
 * A single simulated clock drives the star/planet geometry AND the light curve,
 * so the photometric dip happens at exactly the moment the planet crosses the
 * stellar disc. Everything shown is synthetic photometry for teaching.
 */
export default function LiveObservation({ planet, height = 220 }: Props) {
  const sim = useSimSettings();
  const { model, depthSource, durationSource } = useMemo(() => modelFromPlanet(planet), [planet]);

  const [samples, setSamples] = useState<FluxSample[]>([]);
  const [simDays, setSimDays] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [transitCount, setTransitCount] = useState(0);

  const clock = useRef(0);
  const buffer = useRef<FluxSample[]>([]);
  const wasInTransit = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduced = mounted && prefersReducedMotion();

  // Reset the whole run whenever the observed object changes.
  useEffect(() => {
    clock.current = 0;
    buffer.current = [];
    wasInTransit.current = false;
    setSamples([]);
    setSimDays(0);
    setTransitCount(0);
    setLog([{ t: stamp(0), msg: `Observation started · target ${planet.plName}` }]);
    const id = window.setTimeout(
      () => setLog((l) => [...l, { t: stamp(0.4), msg: "Stellar baseline established" }]),
      400,
    );
    return () => window.clearTimeout(id);
  }, [planet.slug, planet.plName]);

  // Simulated observing clock: 1 orbital period ≈ 6 s at 1×.
  useEffect(() => {
    if (!sim.playing || reduced) {
      cancelAnimationFrame(raf.current);
      last.current = 0;
      return;
    }
    const daysPerSecond = model.periodDays / 6;

    const step = (now: number) => {
      if (!last.current) last.current = now;
      const dt = Math.min(80, now - last.current) / 1000;
      last.current = now;
      clock.current += dt * daysPerSecond * sim.speed;
      const t = clock.current;

      buffer.current = [...buffer.current, { time: t, flux: observedFlux(model, t, 7) }].slice(-900);

      const inside = isInTransit(model, t);
      if (inside && !wasInTransit.current) {
        setTransitCount((c) => {
          const n = c + 1;
          setLog((l) => [
            ...l,
            { t: stamp(t), msg: `Flux anomaly detected — transit #${n} in progress` },
            ...(n === 2
              ? [{ t: stamp(t), msg: "Repeated transit confirmed · periodic signal identified" }]
              : []),
            ...(n === 3
              ? [
                  {
                    t: stamp(t),
                    msg: `Orbital period estimated · ${model.periodDays.toFixed(3)} d`,
                  },
                  { t: stamp(t), msg: "Detection analysis complete" },
                ]
              : []),
          ]);
          return n;
        });
      }
      wasInTransit.current = inside;

      setSamples(buffer.current);
      setSimDays(t);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [sim.playing, sim.speed, model, reduced]);

  const detection = useMemo(() => detectSimple(samples), [samples]);
  const inTransit = samples.length > 0 && isInTransit(model, simDays);
  const flux = samples.length ? samples[samples.length - 1].flux : 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Stat label="Target" value={planet.plName} tone="text-white" />
        <Stat
          label="Observation status"
          value={sim.playing && !reduced ? "● Active" : "● Paused"}
          tone={sim.playing && !reduced ? "text-emerald-300" : "text-slate-400"}
        />
        <Stat
          label="Photometry"
          value={sim.playing && !reduced ? "● Recording" : "● Standby"}
          tone={sim.playing && !reduced ? "text-cyan-300" : "text-slate-400"}
        />
        <Stat label="Transits" value={String(transitCount).padStart(2, "0")} tone="text-amber-300" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Synchronised light curve */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <LiveCurve samples={samples} depth={model.depth} height={height} />
          <span className="absolute left-2 top-2 rounded border border-slate-700/70 bg-slate-950/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Synthetic photometry · relative flux vs time
          </span>
          {inTransit && (
            <span className="absolute right-2 top-2 rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-300">
              Transit — starlight blocked
            </span>
          )}
        </div>

        {/* Star + planet geometry driven by the same clock */}
        <div
          className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70"
          style={{ height }}
        >
          <TransitStage planet={planet} inTransit={inTransit} flux={flux} depth={model.depth} />
          <span className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
            Simulation — not to scale
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Transits detected"
          value={String(detection.transitCount)}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Estimated period"
          value={detection.periodDays ? `${detection.periodDays.toFixed(3)} d` : "Awaiting repeat"}
          icon={<Timer className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Transit depth"
          value={detection.depth ? `${(detection.depth * 1e6).toFixed(0)} ppm` : "—"}
          icon={<Radio className="h-3.5 w-3.5" />}
        />
        <Metric
          label="Signal / noise"
          value={detection.snr ? `${detection.snr.toFixed(1)} σ` : "—"}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ConfidenceCard detection={detection} archivePeriod={planet.periodDays} />
        <EventLog log={log} />
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        {detection.explanation} Transit depth is{" "}
        {depthSource === "archive" ? "taken from the NASA archive" : "a simulated value derived from the archive radii"};
        duration is {durationSource === "archive" ? "from the archive" : "a simulated estimate"}. Detection
        results here are an educational simulation, not a new discovery.
      </p>
    </div>
  );
}

// ── Live light curve ─────────────────────────────────────────────────────────
function LiveCurve({
  samples,
  depth,
  height,
}: {
  samples: FluxSample[];
  depth: number;
  height: number;
}) {
  const w = 1000;
  const h = height;
  const pad = 10;
  const lo = 1 - depth * 2.2;
  const hi = 1 + depth * 1.2;
  const y = (f: number) => pad + ((hi - f) / (hi - lo)) * (h - pad * 2);

  const pts = samples.length
    ? samples
        .map((s, i) => `${((i / Math.max(1, samples.length - 1)) * w).toFixed(1)},${y(s.flux).toFixed(1)}`)
        .join(" ")
    : "";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height }}
      role="img"
      aria-label="Live synthetic light curve of the observed star"
    >
      <line x1={0} x2={w} y1={y(1)} y2={y(1)} stroke="#334155" strokeDasharray="4 6" strokeWidth={1} />
      <line
        x1={0}
        x2={w}
        y1={y(1 - depth)}
        y2={y(1 - depth)}
        stroke="#f59e0b40"
        strokeDasharray="2 8"
        strokeWidth={1}
      />
      {pts && <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth={1.4} />}
    </svg>
  );
}

// ── Star / planet stage ──────────────────────────────────────────────────────
function TransitStage({
  planet,
  inTransit,
  flux,
  depth,
}: {
  planet: CatalogPlanet;
  inTransit: boolean;
  flux: number;
  depth: number;
}) {
  const dim = Math.max(0, Math.min(1, (1 - flux) / Math.max(depth, 1e-6)));
  const star = 96;
  const rel = Math.max(8, Math.min(46, star * Math.sqrt(depth) * 3));
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative" style={{ width: star * 2, height: star }}>
        <div
          className="absolute rounded-full transition-[filter] duration-200"
          style={{
            width: star,
            height: star,
            left: star / 2,
            top: 0,
            background: "radial-gradient(circle at 35% 35%, #fff6da, #ffcf6a 55%, #d98324 100%)",
            boxShadow: `0 0 ${40 - dim * 18}px ${14 - dim * 6}px rgba(255,196,90,${0.45 - dim * 0.2})`,
            filter: `brightness(${1 - dim * 0.35})`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: rel,
            height: rel,
            top: star / 2 - rel / 2,
            left: inTransit ? star + star / 2 - rel / 2 - dim * 0 : star * 1.7,
            background: `radial-gradient(circle at 30% 30%, ${planet.planetColor}, ${planet.planetColor2})`,
            transition: "left 120ms linear",
            zIndex: 5,
          }}
        />
      </div>
    </div>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────
function ConfidenceCard({
  detection,
  archivePeriod,
}: {
  detection: ReturnType<typeof detectSimple>;
  archivePeriod: number;
}) {
  const pct = (detection.confidence * 100).toFixed(1);
  const band =
    detection.confidence > 0.75 ? "High" : detection.confidence > 0.45 ? "Moderate" : "Low";
  const checks: [string, boolean][] = [
    ["Signal strength", detection.snr > 6],
    ["Repeated transits", detection.transitCount >= 2],
    ["Period consistency", detection.consistency > 0.6],
    ["Noise level", detection.depth != null && detection.depth > detection.noise * 4],
    ["Model agreement", detection.modelAgreement > 0.6],
  ];
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
        Simulated detection confidence
      </h3>
      <p className="mt-1 text-3xl font-bold text-cyan-300">
        {pct}% <span className="text-sm font-medium uppercase text-slate-400">{band}</span>
      </p>
      <ul className="mt-3 space-y-1">
        {checks.map(([label, ok]) => (
          <li key={label} className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">{label}</span>
            <span className={ok ? "text-emerald-400" : "text-slate-600"}>{ok ? "✓" : "—"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-amber-400/80">
        Simulation score — not scientific validation
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        NASA archive period for comparison: {archivePeriod.toFixed(4)} d.
      </p>
    </section>
  );
}

function EventLog({ log }: { log: LogEntry[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [log]);
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-slate-400">Event log</h3>
      <div ref={boxRef} className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
        {log.map((e, i) => (
          <p key={i} className="font-mono text-[11px] text-slate-400">
            <span className="text-slate-600">{e.t}</span> {e.msg}
          </p>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`font-mono text-xs ${tone}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}

/** Simulation-time stamp (HH:MM:SS of elapsed observing time). */
function stamp(days: number): string {
  const secs = Math.floor(days * 24 * 60 * 60) % 86400;
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
