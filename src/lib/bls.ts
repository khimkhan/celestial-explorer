import type { FluxPoint, BlsPeak, PeriodogramData } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// BOX LEAST SQUARES (BLS) PERIODOGRAM
// ─────────────────────────────────────────────────────────────────────────────
// The BLS algorithm is the standard method for detecting transiting exoplanets
// in photometric light curves. It was introduced by Kovács, Zucker & Mazeh
// (2002, A&A, 391, 369).
//
// CONCEPT
// A planetary transit causes a periodic, box-shaped dip in stellar brightness.
// Unlike sinusoidal variations (stellar pulsation, spots), transits are flat-
// bottomed and short-lived. BLS searches for this signature by:
//
//   1. Folding the light curve onto a trial period P
//   2. For each trial transit duration q (as a fraction of P), sliding a
//      "box" (in-transit window) across all phases
//   3. Computing the best-fit box depth at each position
//   4. The BLS power measures how much better a box model fits vs. a flat line
//
// For each (P, q, phase₀) trial, the model is:
//   F(t) = 1 - δ   if (t mod P) is within the box centered at phase₀
//   F(t) = 1       otherwise
//
// where δ is the transit depth. The BLS power is:
//
//   SR = Σ [ (fᵢ - F_flat)² - (fᵢ - F_box)² ]
//      = (δ² / σ²) × (N_in × N_out / N)
//
// where N_in is the number of in-transit points, N_out out-of-transit, and
// σ² is the point-to-point variance.
//
// EFFICIENT IMPLEMENTATION
// A brute-force search is O(P × q × phase × N) — far too slow for thousands
// of trial periods. We optimize with two techniques:
//
//   a) For each trial period, fold and sort the data by phase, then use
//      cumulative sums to compute in-transit/out-of-transit means in O(1)
//      per trial position (sliding window), instead of re-summing each time.
//
//   b) We use a moderate number of trial periods (~2000) on a log-spaced grid
//      from 0.5 to 50 days, and a handful of duration fractions (5 values).
//      This covers the parameter space of most Kepler/TESS planets without
//      excessive computation.
// ─────────────────────────────────────────────────────────────────────────────

interface BlsOptions {
  minPeriod: number;   // days
  maxPeriod: number;   // days
  nPeriods: number;    // number of trial periods
  durations: number[]; // trial durations as fraction of period (0–0.5)
}

const DEFAULT_OPTIONS: BlsOptions = {
  minPeriod: 0.5,
  maxPeriod: 50,
  nPeriods: 2000,
  // Transit duration ≈ (P/π) × (R★/a) × √(1 - b²)  — for typical hot Jupiters
  // and warm Neptunes, q ranges from ~0.5% to ~5% of the orbital period.
  durations: [0.005, 0.01, 0.02, 0.04, 0.08],
};

/**
 * Run the BLS periodogram on a light curve.
 * Returns the periodogram (power vs. period) and the top candidate peaks.
 */
export function runBLS(
  points: FluxPoint[],
  options: Partial<BlsOptions> = {}
): { periodogram: PeriodogramData; peaks: BlsPeak[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Extract time and flux arrays. BLS works in relative time (days from first
  // data point) to keep the modular arithmetic numerically stable.
  const t0 = points[0].time;
  const times = points.map((p) => p.time - t0);
  const fluxes = points.map((p) => p.flux);
  const N = points.length;

  if (N < 50) {
    return { periodogram: { periods: [], powers: [] }, peaks: [] };
  }

  // Global variance for power normalization
  const meanFlux = fluxes.reduce((a, b) => a + b, 0) / N;
  const variance = fluxes.reduce((a, f) => a + (f - meanFlux) ** 2, 0) / N;
  if (variance < 1e-15) {
    return { periodogram: { periods: [], powers: [] }, peaks: [] };
  }

  // Generate log-spaced trial periods. Log spacing gives finer resolution at
  // short periods (where there are more cycles to detect) and coarser at long
  // periods (where data is sparser).
  const periods = logSpace(opts.minPeriod, opts.maxPeriod, opts.nPeriods);
  const powers = new Float64Array(periods.length);

  // Store best (depth, duration, center, snr) for each period
  const bestDepth = new Float64Array(periods.length);
  const bestDurFrac = new Float64Array(periods.length);
  const bestCenter = new Float64Array(periods.length);
  const bestSnr = new Float64Array(periods.length);

  for (let pi = 0; pi < periods.length; pi++) {
    const P = periods[pi];

    // Fold the light curve onto period P: phase = (t mod P) / P, in [0, 1)
    const folded: { phase: number; flux: number }[] = new Array(N);
    for (let i = 0; i < N; i++) {
      folded[i] = { phase: ((times[i] % P) + P) % P / P, flux: fluxes[i] };
    }
    // Sort by phase for the sliding-window approach
    folded.sort((a, b) => a.phase - b.phase);

    const phases = folded.map((f) => f.phase);
    const flxs = folded.map((f) => f.flux);

    // Cumulative sums for O(1) window sums. Using circular indexing since
    // the transit box can wrap around phase=0/1 boundary.
    const cumFlux = new Float64Array(N + 1);
    for (let i = 0; i < N; i++) cumFlux[i + 1] = cumFlux[i] + flxs[i];
    const totalSum = cumFlux[N];

    let maxPower = -Infinity;
    let maxDepth = 0;
    let maxDurFrac = opts.durations[0];
    let maxCenter = 0;
    let maxSnr = 0;

    for (const q of opts.durations) {
      // Number of points in the transit box
      const nIn = Math.max(1, Math.round(q * N));

      for (let start = 0; start < N; start++) {
        // In-transit window: [start, start + nIn) with circular wrap
        let inSum: number;
        const end = start + nIn;
        if (end <= N) {
          inSum = cumFlux[end] - cumFlux[start];
        } else {
          // Wrap around
          inSum = (cumFlux[N] - cumFlux[start]) + cumFlux[end - N];
        }

        const nOut = N - nIn;
        if (nOut === 0) continue;

        const inMean = inSum / nIn;
        const outMean = (totalSum - inSum) / nOut;

        // Transit depth: how much the in-transit flux dips below out-of-transit
        const depth = outMean - inMean;
        if (depth <= 0) continue; // Only positive dips (transits decrease flux)

        // BLS signal residue (power): proportional to depth² × efficiency factor
        // SR = (depth² / σ²) × (N_in × N_out / N)
        const power = (depth * depth / variance) * (nIn * nOut / N);

        if (power > maxPower) {
          maxPower = power;
          maxDepth = depth;
          maxDurFrac = q;
          // Transit center phase = midpoint of the box
          const centerIdx = (start + nIn / 2) % N;
          maxCenter = phases[Math.floor(centerIdx)] ?? phases[start] + q / 2;
          // SNR estimate: depth / (point-to-point scatter / sqrt(nIn))
          const scatter = Math.sqrt(variance);
          maxSnr = depth / (scatter / Math.sqrt(nIn));
        }
      }
    }

    if (maxPower > -Infinity) {
      powers[pi] = maxPower;
      bestDepth[pi] = maxDepth;
      bestDurFrac[pi] = maxDurFrac;
      bestCenter[pi] = maxCenter;
      bestSnr[pi] = maxSnr;
    } else {
      powers[pi] = 0;
    }
  }

  // ── Find peaks in the periodogram ──────────────────────────────────────────
  // A "peak" is a period with power higher than its neighbors. We find the
  // global max, then mask out a window around it and find the next, etc.

  const powerArr = Array.from(powers);
  const peaks: BlsPeak[] = [];
  const maskRadius = Math.max(5, Math.round(periods.length * 0.01)); // ~1% of range
  const masked = [...powerArr];

  for (let rank = 0; rank < 5; rank++) {
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let i = 0; i < masked.length; i++) {
      if (masked[i] > maxVal) {
        maxVal = masked[i];
        maxIdx = i;
      }
    }
    if (maxVal <= 0) break;

    peaks.push({
      period: periods[maxIdx],
      power: maxVal,
      depth: bestDepth[maxIdx],
      duration: bestDurFrac[maxIdx] * periods[maxIdx] * 24, // convert days→hours
      transitCenter: bestCenter[maxIdx] * periods[maxIdx] + t0, // convert phase→time
      snr: bestSnr[maxIdx],
    });

    // Mask out neighbors to find the next independent peak
    for (let i = Math.max(0, maxIdx - maskRadius); i < Math.min(masked.length, maxIdx + maskRadius + 1); i++) {
      masked[i] = 0;
    }
  }

  // Normalize powers to 0–1 for plotting
  const maxPower = Math.max(...powerArr, 1e-10);
  const normalizedPowers = powerArr.map((p) => p / maxPower);

  return {
    periodogram: { periods: Array.from(periods), powers: normalizedPowers },
    peaks,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate n log-spaced values from a to b. */
function logSpace(a: number, b: number, n: number): Float64Array {
  const la = Math.log(a);
  const lb = Math.log(b);
  const result = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = Math.exp(la + (lb - la) * i / (n - 1));
  }
  return result;
}
