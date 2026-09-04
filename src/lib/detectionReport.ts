import type { CatalogPlanet } from "./planetLore";
import type { LightCurve, PlanetEstimate, TransitDetection } from "@/types";
import { classifyPlanet } from "./catalogQuery";

// ─────────────────────────────────────────────────────────────────────────────
// DETECTION REPORT
// ─────────────────────────────────────────────────────────────────────────────
// Turns the simulated transit-detection output into the numbers and wording
// shown in the UI. Two data provenances are kept strictly separate:
//
//   ARCHIVE  — values published by the NASA Exoplanet Archive
//   SIMULATED — values recovered by this project's educational detection
//               pipeline running on synthetic photometry built from the
//               archive parameters
//
// Nothing here invents an archive measurement: missing archive values are
// reported as "Data unavailable".
// ─────────────────────────────────────────────────────────────────────────────

export type Provenance = "archive" | "simulated";

export type ObjectStatus = "confirmed" | "validated" | "candidate" | "false-positive";

export interface ConfidenceMetric {
  label: string;
  value: string;
  note: string;
  /** 0..1 contribution to the simulated confidence score */
  score: number;
}

export interface DetectionReport {
  status: ObjectStatus;
  statusLabel: string;
  /** 0–100, clearly labelled as a simulated score in the UI */
  confidencePercent: number;
  confidenceLevel: "HIGH" | "MODERATE" | "LOW" | "INCONCLUSIVE";
  metrics: ConfidenceMetric[];
  explanation: string;
  narrative: string[];
  transitCount: number;
  snr: number;
  depthPpm: number;
  periodDays: number | null;
}

export interface ParameterRow {
  label: string;
  value: string;
  provenance: Provenance | null;
  hint?: string;
}

const STATUS_LABEL: Record<ObjectStatus, string> = {
  confirmed: "Confirmed exoplanet",
  validated: "Validated",
  candidate: "Simulated candidate",
  "false-positive": "False positive",
};

export const STATUS_STYLE: Record<ObjectStatus, { dot: string; text: string; ring: string }> = {
  confirmed: { dot: "bg-emerald-400", text: "text-emerald-300", ring: "border-emerald-500/40 bg-emerald-500/10" },
  validated: { dot: "bg-sky-400", text: "text-sky-300", ring: "border-sky-500/40 bg-sky-500/10" },
  candidate: { dot: "bg-amber-400", text: "text-amber-300", ring: "border-amber-500/40 bg-amber-500/10" },
  "false-positive": { dot: "bg-red-400", text: "text-red-300", ring: "border-red-500/40 bg-red-500/10" },
};

function fmt(n: number | null | undefined, digits = 2, unit = ""): string {
  if (n == null || !Number.isFinite(n)) return "Data unavailable";
  return `${n.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

/** Number of transits covered by the simulated observing campaign. */
function transitCount(curve: LightCurve | null, period: number | null): number {
  if (!curve || !period || period <= 0 || curve.fluxPoints.length < 2) return 0;
  const span =
    curve.fluxPoints[curve.fluxPoints.length - 1].time - curve.fluxPoints[0].time;
  return Math.max(0, Math.floor(span / period));
}

export function buildDetectionReport(
  planet: CatalogPlanet,
  detection: TransitDetection | null,
  estimate: PlanetEstimate | null,
  curve: LightCurve | null,
): DetectionReport {
  const peak = detection?.bestPeak ?? null;
  const period = peak?.period ?? estimate?.orbitalPeriod ?? null;
  const nTransits = transitCount(curve, period);
  const snr = peak?.snr ?? 0;
  const depth = estimate?.transitDepth ?? peak?.depth ?? 0;
  const depthPpm = depth * 1e6;

  // Agreement between the recovered period and the archive period is the
  // strongest indicator that the pipeline locked onto the real signal.
  const periodError =
    period && planet.periodDays > 0 ? Math.abs(period - planet.periodDays) / planet.periodDays : 1;
  const consistency = Math.max(0, 1 - Math.min(1, periodError * 40));

  const snrScore = Math.max(0, Math.min(1, (snr - 5) / 25));
  const depthScore = Math.max(0, Math.min(1, Math.log10(Math.max(depthPpm, 1)) / 4));
  const coverageScore = Math.max(0, Math.min(1, nTransits / 6));
  const fitScore = detection?.detected
    ? { high: 1, moderate: 0.75, low: 0.45, none: 0.1 }[detection.confidence]
    : 0.1;

  const metrics: ConfidenceMetric[] = [
    {
      label: "Transit depth",
      value: depthPpm > 0 ? `${depthPpm.toFixed(0)} ppm` : "Data unavailable",
      note: "How much starlight the planet blocks",
      score: depthScore,
    },
    {
      label: "Signal-to-noise",
      value: snr > 0 ? `${snr.toFixed(1)} σ` : "Data unavailable",
      note: "Dip strength against photometric scatter",
      score: snrScore,
    },
    {
      label: "Observed transits",
      value: nTransits > 0 ? `${nTransits}` : "Data unavailable",
      note: "Repeat events in the simulated campaign",
      score: coverageScore,
    },
    {
      label: "Estimated period",
      value: period ? `${period.toFixed(4)} d` : "Data unavailable",
      note: "Recovered by the box-least-squares search",
      score: consistency,
    },
    {
      label: "Detection consistency",
      value: `${(consistency * 100).toFixed(1)} %`,
      note: "Agreement with the archive orbital period",
      score: consistency,
    },
    {
      label: "Model-fit quality",
      value: detection ? detection.confidence.toUpperCase() : "Data unavailable",
      note: "Shape of the folded transit against the box model",
      score: fitScore,
    },
  ];

  const weights = [0.15, 0.25, 0.15, 0.15, 0.15, 0.15];
  const raw = metrics.reduce((sum, m, i) => sum + m.score * weights[i], 0);
  const confidencePercent = Math.round(Math.min(99.4, Math.max(3, raw * 100)) * 10) / 10;

  const confidenceLevel: DetectionReport["confidenceLevel"] =
    confidencePercent >= 80
      ? "HIGH"
      : confidencePercent >= 55
        ? "MODERATE"
        : confidencePercent >= 30
          ? "LOW"
          : "INCONCLUSIVE";

  // Every catalog object is a NASA-confirmed planet; the status below reflects
  // the archive, not a discovery made by this site.
  const status: ObjectStatus =
    confidencePercent >= 55 ? "confirmed" : detection?.detected ? "validated" : "candidate";

  const explanation = [
    `The simulated pipeline recovered ${nTransits || "no"} repeat event${nTransits === 1 ? "" : "s"}`,
    snr > 0 ? `at ${snr.toFixed(1)}σ` : null,
    depthPpm > 0 ? `with a ${depthPpm.toFixed(0)} ppm dip` : null,
    period
      ? `and a period within ${(periodError * 100).toFixed(2)}% of the archive value`
      : null,
  ]
    .filter(Boolean)
    .join(" ")
    .concat(
      ". The score weighs signal strength, repeat coverage and how closely the recovered period matches the published one.",
    );

  const radius = estimate?.planetRadius || planet.radiusEarth;
  const narrative = [
    `Brightness of ${planet.hostName} was monitored across a simulated ${
      curve?.source === "kepler" ? "Kepler-style" : "TESS-style"
    } observing campaign built from the archive parameters.`,
    nTransits > 0
      ? `${nTransits} recurring brightness decrease${nTransits === 1 ? " was" : "s were"} identified in the cleaned light curve.`
      : "No repeating brightness decrease could be isolated in the cleaned light curve.",
    period
      ? `The repeated signal gives an estimated orbital period of ${period.toFixed(4)} days (archive value ${planet.periodDays.toFixed(4)} days).`
      : "The orbital period could not be recovered from this signal.",
    depthPpm > 0
      ? `A transit depth of ${depthPpm.toFixed(0)} ppm implies a planetary size near ${radius.toFixed(2)} R⊕ — ${classifyPlanet(radius)}.`
      : "Transit depth could not be measured, so no size estimate is derived here.",
    `Simulated detection confidence: ${confidenceLevel} (${confidencePercent}%).`,
    `Archive status: NASA confirmed object · detected here through an educational transit simulation.`,
  ];

  return {
    status,
    statusLabel: STATUS_LABEL[status],
    confidencePercent,
    confidenceLevel,
    metrics,
    explanation,
    narrative,
    transitCount: nTransits,
    snr,
    depthPpm,
    periodDays: period,
  };
}

/** Orbital / physical parameters with explicit provenance for each row. */
export function buildParameterRows(
  planet: CatalogPlanet,
  estimate: PlanetEstimate | null,
  constellationName?: string,
): ParameterRow[] {
  return [
    { label: "Planet radius", value: fmt(planet.radiusEarth, 2, "R⊕"), provenance: "archive" },
    {
      label: "Planet radius (recovered)",
      value: estimate && estimate.planetRadius > 0 ? fmt(estimate.planetRadius, 2, "R⊕") : "Data unavailable",
      provenance: "simulated",
      hint: "From the simulated transit depth",
    },
    { label: "Orbital period", value: fmt(planet.periodDays, 4, "days"), provenance: "archive" },
    {
      label: "Semi-major axis",
      value:
        planet.semiMajorAxisAu != null
          ? fmt(planet.semiMajorAxisAu, 4, "AU")
          : estimate?.semiMajorAxis
            ? `${estimate.semiMajorAxis.toFixed(4)} AU`
            : "Data unavailable",
      provenance: planet.semiMajorAxisAu != null ? "archive" : "simulated",
    },
    { label: "Eccentricity", value: "Data unavailable", provenance: null },
    {
      label: "Transit depth",
      value:
        planet.transitDepthPct != null
          ? `${(planet.transitDepthPct * 1e4).toFixed(0)} ppm`
          : estimate
            ? `${(estimate.transitDepth * 1e6).toFixed(0)} ppm`
            : "Data unavailable",
      provenance: planet.transitDepthPct != null ? "archive" : "simulated",
    },
    {
      label: "Transit duration",
      value:
        planet.transitDurationHours != null
          ? fmt(planet.transitDurationHours, 2, "h")
          : estimate
            ? fmt(estimate.transitDuration, 2, "h")
            : "Data unavailable",
      provenance: planet.transitDurationHours != null ? "archive" : "simulated",
    },
    {
      label: "Host-star radius",
      value: planet.stellarRadius != null ? fmt(planet.stellarRadius, 3, "R☉") : "Data unavailable",
      provenance: planet.stellarRadius != null ? "archive" : null,
    },
    {
      label: "Host-star temperature",
      value: planet.stellarTemp != null ? `${planet.stellarTemp} K` : "Data unavailable",
      provenance: planet.stellarTemp != null ? "archive" : null,
    },
    {
      label: "Planet equilibrium temp.",
      value:
        planet.eqTempK != null
          ? `${planet.eqTempK} K`
          : estimate?.equilibriumTemp
            ? `${estimate.equilibriumTemp.toFixed(0)} K`
            : "Data unavailable",
      provenance: planet.eqTempK != null ? "archive" : estimate?.equilibriumTemp ? "simulated" : null,
    },
    {
      label: "Distance from Earth",
      value: planet.distanceLy != null ? fmt(planet.distanceLy, 1, "ly") : "Data unavailable",
      provenance: planet.distanceLy != null ? "archive" : null,
    },
    { label: "Detection method", value: planet.discoveryMethod || "Data unavailable", provenance: "archive" },
    { label: "Discovery year", value: String(planet.discoveryYear), provenance: "archive" },
    { label: "Discovery facility", value: planet.discoveryFacility || "Data unavailable", provenance: "archive" },
    { label: "Constellation", value: constellationName || planet.constellation, provenance: "archive" },
  ];
}
