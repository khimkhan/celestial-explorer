// ─────────────────────────────────────────────────────────────────────────────
// EDUCATIONAL OBSERVATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// Pure, deterministic helpers shared by the live observation view (Mission
// Control / object detail) and the Detection Lab. Everything produced here is
// SYNTHETIC photometry generated for teaching — never telescope data.
// ─────────────────────────────────────────────────────────────────────────────

export interface TransitModel {
  /** orbital period in days */
  periodDays: number;
  /** fractional transit depth, e.g. 0.008 = 0.8 % */
  depth: number;
  /** transit duration in hours */
  durationHours: number;
  /** gaussian photometric scatter, fractional */
  noise: number;
  /** slow stellar variability amplitude, fractional */
  variability: number;
  /** time of first transit centre, days */
  epoch: number;
}

/** Fraction of the orbit spent in transit (0–0.5). */
export function transitFraction(m: TransitModel): number {
  return Math.min(0.5, m.durationHours / 24 / Math.max(m.periodDays, 1e-6));
}

/**
 * Noise-free relative flux of the star at a given time.
 * Uses a soft-edged (trapezoidal) transit profile — realistic ingress/egress
 * without pretending to be a full limb-darkened Mandel–Agol model.
 */
export function modelFlux(m: TransitModel, timeDays: number): number {
  const half = m.durationHours / 24 / 2;
  if (half <= 0) return 1;
  const phase = wrapPhase(timeDays - m.epoch, m.periodDays);
  const d = Math.abs(phase);
  if (d >= half) return 1;
  const ingress = half * 0.25;
  const shape = d <= half - ingress ? 1 : (half - d) / ingress;
  return 1 - m.depth * shape;
}

/** Signed offset from the nearest transit centre, in days. */
export function wrapPhase(dt: number, period: number): number {
  const p = Math.max(period, 1e-6);
  let x = ((dt % p) + p) % p;
  if (x > p / 2) x -= p;
  return x;
}

/** True when the planet is crossing the stellar disc at this time. */
export function isInTransit(m: TransitModel, timeDays: number): boolean {
  return Math.abs(wrapPhase(timeDays - m.epoch, m.periodDays)) < m.durationHours / 24 / 2;
}

export interface FluxSample {
  time: number;
  flux: number;
}

/** Deterministic pseudo-random noise so re-renders never reshuffle the data. */
function hashNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const u = x - Math.floor(x);
  const y = Math.sin(seed * 78.233 + 1.7) * 24634.6345;
  const v = y - Math.floor(y);
  // Box–Muller → approximately standard normal
  return Math.sqrt(-2 * Math.log(Math.max(u, 1e-9))) * Math.cos(2 * Math.PI * v);
}

/** Observed (noisy) flux at a time, including slow stellar variability. */
export function observedFlux(m: TransitModel, timeDays: number, seed = 1): number {
  const wobble = m.variability * Math.sin((timeDays / Math.max(m.periodDays, 0.1)) * 1.7 + seed);
  return modelFlux(m, timeDays) + wobble + hashNoise(timeDays * 1000 + seed) * m.noise;
}

/** Generate a full synthetic observing run. */
export function generateSeries(
  m: TransitModel,
  opts: { durationDays: number; cadenceMinutes?: number; seed?: number },
): FluxSample[] {
  const cadence = (opts.cadenceMinutes ?? 20) / (60 * 24);
  const n = Math.min(6000, Math.max(50, Math.round(opts.durationDays / cadence)));
  const out: FluxSample[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i * opts.durationDays) / n;
    out.push({ time: t, flux: observedFlux(m, t, opts.seed ?? 1) });
  }
  return out;
}

// ── Simplified educational detection ─────────────────────────────────────────

export interface DetectionResult {
  transitTimes: number[];
  transitCount: number;
  periodDays: number | null;
  periodScatter: number | null;
  depth: number | null;
  noise: number;
  snr: number;
  consistency: number; // 0–1
  modelAgreement: number; // 0–1
  confidence: number; // 0–1
  verdict: 'strong' | 'candidate' | 'insufficient' | 'false-positive';
  verdictLabel: string;
  explanation: string;
}

const VERDICT_LABEL: Record<DetectionResult['verdict'], string> = {
  strong: 'Strong transit signal',
  candidate: 'Transit candidate',
  insufficient: 'Insufficient evidence',
  'false-positive': 'Likely false positive',
};

/**
 * Baseline → anomaly search → repeated-transit grouping → period estimation.
 * Deliberately simple and fully inspectable: this is NOT NASA's pipeline.
 */
export function detectSimple(series: FluxSample[]): DetectionResult {
  const empty: DetectionResult = {
    transitTimes: [],
    transitCount: 0,
    periodDays: null,
    periodScatter: null,
    depth: null,
    noise: 0,
    snr: 0,
    consistency: 0,
    modelAgreement: 0,
    confidence: 0,
    verdict: 'insufficient',
    verdictLabel: VERDICT_LABEL.insufficient,
    explanation: 'No usable photometry was produced by the simulated observation.',
  };
  if (series.length < 20) return empty;

  // 1. Baseline: running median (robust to the dips we are hunting for).
  const flux = series.map((s) => s.flux);
  const baseline = median(flux);
  // 2. Noise: median absolute deviation of the out-of-dip points.
  const noise = 1.4826 * median(flux.map((f) => Math.abs(f - baseline))) || 1e-6;
  const threshold = baseline - 3 * noise;

  // 3. Anomaly grouping → transit events.
  const events: { time: number; depth: number }[] = [];
  let run: FluxSample[] = [];
  for (const s of series) {
    if (s.flux < threshold) {
      run.push(s);
    } else if (run.length) {
      pushEvent(run);
      run = [];
    }
  }
  if (run.length) pushEvent(run);

  function pushEvent(group: FluxSample[]) {
    if (group.length < 2) return; // single outlier: cosmic ray, not a transit
    const mid = group[Math.floor(group.length / 2)].time;
    const deep = baseline - Math.min(...group.map((g) => g.flux));
    events.push({ time: mid, depth: deep });
  }

  const transitTimes = events.map((e) => e.time);
  const depth = events.length ? mean(events.map((e) => e.depth)) : null;
  const snr = depth ? (depth / noise) * Math.sqrt(Math.max(1, events.length)) : 0;

  // 4. Period from the spacing between repeated events.
  let periodDays: number | null = null;
  let periodScatter: number | null = null;
  let consistency = 0;
  if (transitTimes.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < transitTimes.length; i++) gaps.push(transitTimes[i] - transitTimes[i - 1]);
    periodDays = mean(gaps);
    periodScatter = gaps.length > 1 ? stdev(gaps) : 0;
    consistency = periodDays ? clamp01(1 - (periodScatter ?? 0) / (periodDays * 0.15)) : 0;
  }

  // 5. Model agreement: how box-like and repeatable the dips are.
  const depthSpread = events.length > 1 ? stdev(events.map((e) => e.depth)) : 0;
  const modelAgreement = depth ? clamp01(1 - depthSpread / (depth * 0.6)) : 0;

  const signalScore = clamp01((snr - 3) / 15);
  const repeatScore = clamp01((events.length - 1) / 2);
  const noiseScore = depth ? clamp01(depth / (noise * 8)) : 0;
  const confidence = clamp01(
    0.32 * signalScore + 0.24 * repeatScore + 0.2 * consistency + 0.12 * noiseScore + 0.12 * modelAgreement,
  );

  let verdict: DetectionResult['verdict'];
  if (events.length >= 3 && confidence > 0.7) verdict = 'strong';
  else if (events.length >= 2 && confidence > 0.45) verdict = 'candidate';
  else if (events.length === 1) verdict = 'false-positive';
  else verdict = 'insufficient';

  return {
    transitTimes,
    transitCount: events.length,
    periodDays,
    periodScatter,
    depth,
    noise,
    snr,
    consistency,
    modelAgreement,
    confidence,
    verdict,
    verdictLabel: VERDICT_LABEL[verdict],
    explanation: explain(verdict, events.length, periodDays, snr),
  };
}

function explain(
  verdict: DetectionResult['verdict'],
  count: number,
  period: number | null,
  snr: number,
): string {
  const p = period ? `${period.toFixed(3)} days` : 'no repeat spacing';
  switch (verdict) {
    case 'strong':
      return `The simulated observation produced ${count} recurring reductions in stellar brightness at a signal-to-noise of ${snr.toFixed(1)}. Their even spacing gives an estimated orbital period of ${p}, which is what transit photometry looks like when a planet is really there.`;
    case 'candidate':
      return `Two dips were recovered (spacing ${p}, signal-to-noise ${snr.toFixed(1)}). That is enough for a candidate, but a third transit is needed before the period can be trusted.`;
    case 'false-positive':
      return 'Only a single brightness dip was recorded. A one-off drop can come from stellar activity or an instrument glitch, so with no repeat it cannot be treated as a planet.';
    default:
      return 'No brightness dip rose clearly above the noise, so this run contains no evidence of a transiting planet.';
  }
}

// ── small numeric helpers ────────────────────────────────────────────────────
function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
}

/** Build a transit model from an archive catalog record. */
export function modelFromPlanet(p: {
  periodDays: number;
  radiusEarth: number;
  stellarRadius: number | null;
  transitDepthPct: number | null;
  transitDurationHours: number | null;
}): { model: TransitModel; depthSource: 'archive' | 'simulated'; durationSource: 'archive' | 'simulated' } {
  const rStar = p.stellarRadius ?? 1;
  const derivedDepth = ((p.radiusEarth * 6371) / (rStar * 696340)) ** 2;
  const depth = p.transitDepthPct != null ? p.transitDepthPct / 100 : derivedDepth;
  const derivedDuration = Math.max(0.5, (p.periodDays / Math.PI) * 0.09 * 24);
  const durationHours = p.transitDurationHours ?? derivedDuration;
  return {
    model: {
      periodDays: p.periodDays,
      depth: Math.max(depth, 5e-5),
      durationHours,
      noise: Math.max(depth * 0.18, 1e-4),
      variability: Math.max(depth * 0.05, 2e-5),
      epoch: p.periodDays * 0.35,
    },
    depthSource: p.transitDepthPct != null ? 'archive' : 'simulated',
    durationSource: p.transitDurationHours != null ? 'archive' : 'simulated',
  };
}
