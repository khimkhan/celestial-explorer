import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { LightCurve, TransitDetection, PlanetEstimate } from "@/types";
import type { CatalogPlanet } from "@/lib/planetLore";
import { toTarget, classifyPlanet } from "@/lib/catalogQuery";
import { CONSTELLATION_BY_ABBR } from "@/lib/constellations";
import { fetchLightCurveForTarget, downsampleForPlotting } from "@/lib/dataFetcher";
import { detectTransits } from "@/lib/transitDetector";
import {
  needsSimulation,
  synthesizeDetection,
  synthesizeEstimate,
} from "@/lib/syntheticDetection";
import { buildDetectionReport, buildParameterRows, STATUS_STYLE } from "@/lib/detectionReport";
import { setSimSettings, useSimSettings } from "@/lib/simSettings";
import OrbitalAnimation from "./OrbitalAnimation";
import SimulationControls from "./SimulationControls";
import PlanetSoundPanel from "./PlanetSoundPanel";
import LightCurveStudio from "./LightCurveStudio";
import DetectionPipeline from "./DetectionPipeline";
import DetectionConfidencePanel from "./DetectionConfidencePanel";
import OrbitalParametersPanel from "./OrbitalParametersPanel";
import CollapsibleCard from "./CollapsibleCard";

import {
  ArrowLeft,
  Activity,
  BarChart3,
  Globe,
  Sun,
  Clock,
  Ruler,
  Thermometer,
  MapPin,
  Calendar,
  BookOpen,
  Sparkles,
  Database,
} from "lucide-react";

interface Props {
  planet: CatalogPlanet;
}

const GLASS =
  "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md transition-all duration-300";

export default function PlanetDetailPage({ planet }: Props) {
  const target = useMemo(() => toTarget(planet), [planet]);
  const constellation = CONSTELLATION_BY_ABBR.get(planet.constellation);
  const sim = useSimSettings();

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [rawCurve, setRawCurve] = useState<LightCurve | null>(null);
  const [detection, setDetection] = useState<TransitDetection | null>(null);
  const [estimate, setEstimate] = useState<PlanetEstimate | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [rawPlotData, setRawPlotData] = useState<{ time: number; flux: number; error: number }[]>([]);
  const [cleanPlotData, setCleanPlotData] = useState<{ time: number; flux: number; error: number }[]>(
    [],
  );
  const [cameraToken, setCameraToken] = useState(0);
  const [simToken, setSimToken] = useState(0);

  // Emphasise this object's constellation in the sky background.
  useEffect(() => {
    setSimSettings({ highlight: planet.constellation });
    return () => setSimSettings({ highlight: null });
  }, [planet.constellation]);

  // ── Detection pipeline (runs after the 3D scene is already on screen) ──────
  const runPipeline = useCallback(async () => {
    setLoading(true);
    setStage(0);
    setProgressMsg("Collecting stellar brightness measurements…");

    try {
      await delay(120);
      const tgt = toTarget(planet);
      setStage(1);
      const curve = fetchLightCurveForTarget(tgt);
      setRawCurve(curve);
      setStage(2);
      setProgressMsg("Filtering noise and estimating the baseline…");
      await delay(80);

      let det = detectTransits(curve);
      let sims = false;
      if (needsSimulation(det)) {
        det = synthesizeDetection(tgt, curve);
        sims = true;
      }
      setStage(4);
      setSimulated(sims);
      setDetection(det);
      setRawPlotData(downsampleForPlotting(curve.fluxPoints, 2000));
      setCleanPlotData(downsampleForPlotting(det.detrendedCurve, 2000));
      const est = synthesizeEstimate(tgt, det, curve);
      setEstimate(est);
      setStage(8);
      setProgressMsg("");
      setLoading(false);
    } catch (err) {
      console.error("Transit pipeline failed", err);
      setProgressMsg("The detection simulation could not complete for this object.");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planet.slug]);

  useEffect(() => {
    runPipeline();
  }, [runPipeline]);

  const report = useMemo(
    () => buildDetectionReport(planet, detection, estimate, rawCurve),
    [planet, detection, estimate, rawCurve],
  );
  const paramRows = useMemo(
    () => buildParameterRows(planet, estimate, constellation?.name),
    [planet, estimate, constellation],
  );
  const statusStyle = STATUS_STYLE[report.status];
  const planetRadiusJupiter = (planet.radiusEarth / 11.2).toFixed(2);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All objects
        </Link>
        {constellation && (
          <Link
            to="/constellations"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-300/80 transition-colors hover:text-cyan-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Host constellation · {constellation.name}
          </Link>
        )}
      </div>

      {/* ── 1. OBJECT IDENTITY + STATUS ──────────────────────────────────── */}
      <header className={`${GLASS} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {planet.plName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Orbits {planet.hostName}
              {planet.distanceLy ? ` · ${planet.distanceLy} light-years away` : ""}
              {constellation ? ` · in ${constellation.name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${statusStyle.ring} ${statusStyle.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
              {report.statusLabel}
            </span>
            <Badge label="NASA confirmed object" />
            <Badge label={simulated ? "Simulated detection · modelled" : "Simulated detection"} />
            <Badge label={`${planet.discoveryMethod} · ${planet.discoveryYear}`} />
          </div>
        </div>

        <div className="mt-4">
          <DetectionPipeline activeStage={loading ? stage : 8} />
        </div>
      </header>

      {/* ── 2. 3D ORBITAL SIMULATION (never hidden, never waits) ─────────── */}
      <section className={`${GLASS} overflow-hidden border-violet-500/20`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-5 py-3">
          <Globe className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold tracking-tight text-white">
            3D orbital simulation
          </h2>
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Period and radius from the NASA archive
          </span>
        </div>
        <div className="flex min-h-0 justify-center p-3 sm:p-4">
          <OrbitalAnimation
            key={planet.slug}
            target={target}
            playing={sim.playing}
            speed={sim.speed}
            showTrail={sim.trail}
            showLabels={sim.labels}
            resetToken={cameraToken + simToken}
          />
        </div>
      </section>

      {/* ── 3. SIMULATION CONTROLS ───────────────────────────────────────── */}
      <SimulationControls
        onResetCamera={() => setCameraToken((t) => t + 1)}
        onResetSimulation={() => {
          setSimSettings({ speed: 1, playing: true });
          setSimToken((t) => t + 1);
        }}
      />

      {/* ── 4. PLANETARY SOUND ───────────────────────────────────────────── */}
      <PlanetSoundPanel planetName={planet.plName} periodDays={planet.periodDays} />

      {/* ── 5. LIGHT CURVE / OBSERVATION DATA ────────────────────────────── */}
      <LightCurveStudio
        rawPoints={rawPlotData}
        cleanPoints={cleanPlotData}
        detection={detection}
        loading={loading}
        progressMsg={progressMsg}
      />

      {/* ── 6. DETECTION ANALYSIS ────────────────────────────────────────── */}
      <section className={`${GLASS} p-5`}>
        <header className="mb-3 flex flex-wrap items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Detection analysis</h2>
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Simplified box-least-squares search
          </span>
        </header>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="Recovered period" value={report.periodDays ? `${report.periodDays.toFixed(4)} d` : "Data unavailable"} />
          <Metric label="Archive period" value={`${planet.periodDays.toFixed(4)} d`} />
          <Metric label="Transit depth" value={report.depthPpm ? `${report.depthPpm.toFixed(0)} ppm` : "Data unavailable"} />
          <Metric label="Signal-to-noise" value={report.snr ? `${report.snr.toFixed(1)} σ` : "Data unavailable"} />
          <Metric label="Transits observed" value={`${report.transitCount}`} />
          <Metric
            label="Transit duration"
            value={estimate ? `${estimate.transitDuration.toFixed(2)} h` : "Data unavailable"}
          />
          <Metric
            label="Size class"
            value={classifyPlanet(estimate?.planetRadius || planet.radiusEarth)}
          />
          <Metric label="Photometry" value={simulated ? "Modelled from archive" : `${rawCurve?.source ?? "—"}-style synthetic`} />
        </div>
        {detection && (
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{detection.confidenceReason}</p>
        )}
      </section>

      {/* ── 7. DETECTION CONFIDENCE ──────────────────────────────────────── */}
      <DetectionConfidencePanel report={report} />

      {/* ── 8. ORBITAL PARAMETERS ────────────────────────────────────────── */}
      <OrbitalParametersPanel rows={paramRows} />

      {/* ── 9. QUICK FACTS (collapsible) ─────────────────────────────────── */}
      <CollapsibleCard
        title="Quick facts"
        subtitle="NASA archive values"
        icon={<BarChart3 className="h-4 w-4 text-violet-400" />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <FactCard
            icon={<Clock className="h-4 w-4" />}
            label="Orbital period"
            value={
              planet.periodDays < 1
                ? `${(planet.periodDays * 24).toFixed(1)} hrs`
                : `${planet.periodDays.toFixed(3)} days`
            }
          />
          <FactCard
            icon={<Ruler className="h-4 w-4" />}
            label="Planet radius"
            value={`${planet.radiusEarth.toFixed(2)} R⊕`}
            sub={`${planetRadiusJupiter} R♃`}
          />
          <FactCard
            icon={<Sun className="h-4 w-4" />}
            label="Star radius"
            value={planet.stellarRadius ? `${planet.stellarRadius.toFixed(2)} R☉` : "Data unavailable"}
          />
          <FactCard
            icon={<Thermometer className="h-4 w-4" />}
            label="Star temperature"
            value={planet.stellarTemp ? `${planet.stellarTemp} K` : "Data unavailable"}
          />
          <FactCard
            icon={<MapPin className="h-4 w-4" />}
            label="Distance"
            value={planet.distanceLy ? `${planet.distanceLy} ly` : "Data unavailable"}
          />
          <FactCard
            icon={<Calendar className="h-4 w-4" />}
            label="Discovery year"
            value={planet.discoveryYear.toString()}
          />
        </div>
      </CollapsibleCard>

      {/* ── 10. WHAT WE FOUND (collapsible) ──────────────────────────────── */}
      <CollapsibleCard
        title="What we found"
        subtitle="Detection result"
        defaultOpen
        icon={<Activity className="h-4 w-4 text-cyan-400" />}
      >
        <ul className="space-y-2">
          {report.narrative.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
              {line}
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      {/* ── Story sections ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className={`${GLASS} p-5`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <BookOpen className="h-4 w-4 text-violet-400" />
            About this planet
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">{planet.description}</p>
        </article>
        <article className={`${GLASS} border-violet-500/20 bg-violet-500/5 p-5`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <Sparkles className="h-4 w-4 text-violet-400" />
            How this planet spends its life
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">{planet.lifeCycle}</p>
        </article>
      </div>

      {/* ── 11. DATA SOURCE ──────────────────────────────────────────────── */}
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-slate-800 bg-slate-950/50 px-5 py-4 font-mono text-[10px] uppercase tracking-wider text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          Data source: NASA Exoplanet Archive
        </span>
        <span>Archive identifier: {planet.plName}</span>
        <span>Detection method: {planet.discoveryMethod}</span>
        <span>Facility: {planet.discoveryFacility || "Data unavailable"}</span>
        <span className="text-slate-600">
          Photometry and detection results on this page are an educational simulation
        </span>
      </footer>
    </div>
  );
}

// ── Small components ─────────────────────────────────────────────────────────
function Metric({ label, value }: { label: string; value: string }) {
  const unavailable = value === "Data unavailable";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div
        className={`truncate font-mono text-sm font-semibold ${unavailable ? "text-slate-600" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}

function FactCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 transition-colors duration-300 hover:border-violet-500/30">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="font-mono text-sm font-semibold tracking-tight text-white">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-300 backdrop-blur-md">
      {label}
    </span>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
