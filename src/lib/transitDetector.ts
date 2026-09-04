import type { FluxPoint, LightCurve, TransitDetection, BlsPeak } from '@/types';
import { runBLS } from './bls';

// ─────────────────────────────────────────────────────────────────────────────
// TRANSIT DETECTOR
// ─────────────────────────────────────────────────────────────────────────────
// Pipeline:
//   1. Normalize flux to ~1.0 baseline (median)
//   2. Detrend: remove long-term stellar variability using a moving-median
//      filter. This is analogous to lightkurve's `flatten()` which uses a
//      Savitzky-Golay or sliding-window approach. We use a moving median
//      because it's robust to the sharp transit dips we want to preserve —
//      a mean-based filter would "smear" transits into the baseline.
//   3. Run BLS periodogram on the detrended curve
//   4. Fold the light curve on the best period for visualization
//   5. Assess confidence based on SNR, power, and number of transits observed
// ─────────────────────────────────────────────────────────────────────────────

interface DetectionOptions {
  minPeriod?: number;
  maxPeriod?: number;
  detrendWindow?: number; // in units of data points
}

/**
 * Detect transits in a light curve using the BLS method.
 * Returns the full detection result including folded curve and confidence.
 */
export function detectTransits(
  curve: LightCurve,
  options: DetectionOptions = {}
): TransitDetection {
  const {
    minPeriod = 0.5,
    maxPeriod = Math.min(50, estimateMaxPeriod(curve.fluxPoints)),
    detrendWindow = Math.max(51, Math.round(curve.fluxPoints.length / 100)),
  } = options;

  const points = curve.fluxPoints;
  if (points.length < 100) {
    return emptyResult();
  }

  // ── Step 1: Normalize ──────────────────────────────────────────────────────
  // Divide by the median flux so baseline ≈ 1.0
  const sortedFlux = points.map((p) => p.flux).sort((a, b) => a - b);
  const medianFlux = sortedFlux[Math.floor(sortedFlux.length / 2)];
  if (medianFlux <= 0) return emptyResult();

  const normalized: FluxPoint[] = points.map((p) => ({
    time: p.time,
    flux: p.flux / medianFlux,
    error: p.error / medianFlux,
  }));

  // ── Step 2: Detrend (moving median filter) ──────────────────────────────────
  // The window size should be much larger than the transit duration (so the
  // transit isn't removed) but smaller than stellar variability timescales.
  // A window of ~1% of the data, minimum 51 points, works well for most
  // Kepler/TESS light curves.
  const detrended = movingMedianDetrend(normalized, detrendWindow);

  // ── Step 3: Run BLS ─────────────────────────────────────────────────────────
  const { periodogram, peaks } = runBLS(detrended, { minPeriod, maxPeriod });

  if (peaks.length === 0 || peaks[0].power <= 0) {
    return {
      detected: false,
      bestPeak: null,
      allPeaks: [],
      periodogram,
      foldedCurve: [],
      detrendedCurve: detrended,
      confidence: 'none',
      confidenceReason: 'No significant periodic signal found in the BLS periodogram.',
    };
  }

  // ── Step 4: Fold the light curve on the best period ─────────────────────────
  const bestPeak = peaks[0];
  const folded = foldLightCurve(detrended, bestPeak.period, bestPeak.transitCenter);

  // ── Step 5: Confidence assessment ────────────────────────────────────────────
  const { confidence, reason } = assessConfidence(bestPeak, detrended, maxPeriod);

  return {
    detected: confidence !== 'none',
    bestPeak,
    allPeaks: peaks,
    periodogram,
    foldedCurve: folded,
    detrendedCurve: detrended,
    confidence,
    confidenceReason: reason,
  };
}

/**
 * Detrend a light curve using a moving median filter.
 * The moving median captures the local baseline (stellar variability) while
 * being robust to the sharp transit dips. We divide the original by the
 * median trend to get a flat baseline with transits preserved.
 */
function movingMedianDetrend(points: FluxPoint[], window: number): FluxPoint[] {
  const n = points.length;
  const fluxes = points.map((p) => p.flux);
  const trend = new Float64Array(n);
  const halfW = Math.floor(window / 2);

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - halfW);
    const end = Math.min(n, i + halfW + 1);
    const windowVals = fluxes.slice(start, end).sort((a, b) => a - b);
    trend[i] = windowVals[Math.floor(windowVals.length / 2)];
  }

  return points.map((p, i) => ({
    time: p.time,
    flux: p.flux / trend[i],
    error: p.error / trend[i],
  }));
}

/**
 * Fold the light curve onto a period: phase = ((t - t_center) mod P) / P.
 * Returns points sorted by phase in [0, 1).
 * We also duplicate the points shifted by ±1 phase so the plot can wrap
 * continuously across the 0/1 boundary.
 */
export function foldLightCurve(
  points: FluxPoint[],
  period: number,
  transitCenter: number
): FluxPoint[] {
  const folded = points.map((p) => {
    const phase = (((p.time - transitCenter) % period) + period) % period / period;
    return { time: phase, flux: p.flux, error: p.error };
  });

  folded.sort((a, b) => a.time - b.time);

  // Duplicate at ±1 for continuous plotting
  const extended: FluxPoint[] = [];
  for (const p of folded) {
    extended.push({ time: p.time - 1, flux: p.flux, error: p.error });
  }
  extended.push(...folded);
  for (const p of folded) {
    extended.push({ time: p.time + 1, flux: p.flux, error: p.error });
  }

  return extended;
}

/**
 * Assess detection confidence based on SNR, BLS power, and data coverage.
 *
 * Criteria (based on standard exoplanet vetting thresholds):
 *   - HIGH: SNR ≥ 12 and at least 3 transits observed and power well above noise
 *   - MODERATE: SNR ≥ 7 or strong power but fewer transits
 *   - LOW: Weak signal (SNR 4–7), likely noise or stellar variability
 *   - NONE: No significant signal
 */
function assessConfidence(
  peak: BlsPeak,
  points: FluxPoint[],
  maxPeriod: number
): { confidence: TransitDetection['confidence']; reason: string } {
  const timeSpan = points[points.length - 1].time - points[0].time;
  const nTransits = Math.floor(timeSpan / peak.period);
  const power = peak.power;
  const snr = peak.snr;

  if (snr >= 12 && nTransits >= 3 && power > 0.3) {
    return {
      confidence: 'high',
      reason: `Strong detection: SNR ${snr.toFixed(1)}, ${nTransits} transits observed over ${timeSpan.toFixed(1)} days.`,
    };
  }

  if (snr >= 7 || (power > 0.2 && nTransits >= 2)) {
    return {
      confidence: 'moderate',
      reason: `Moderate signal: SNR ${snr.toFixed(1)}, ${nTransits} transits, power ${power.toFixed(2)}. Worth vetting.`,
    };
  }

  if (snr >= 4 || power > 0.1) {
    return {
      confidence: 'low',
      reason: `Weak signal: SNR ${snr.toFixed(1)}, power ${power.toFixed(2)}. Could be noise or stellar variability.`,
    };
  }

  return {
    confidence: 'none',
    reason: 'No transit signal exceeding the detection threshold.',
  };
}

/** Estimate the maximum searchable period: half the data time span. */
function estimateMaxPeriod(points: FluxPoint[]): number {
  const span = points[points.length - 1].time - points[0].time;
  return Math.max(1, span / 2);
}

function emptyResult(): TransitDetection {
  return {
    detected: false,
    bestPeak: null,
    allPeaks: [],
    periodogram: { periods: [], powers: [] },
    foldedCurve: [],
    detrendedCurve: [],
    confidence: 'none',
    confidenceReason: 'Insufficient data for analysis.',
  };
}
