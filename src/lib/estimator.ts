import type { BlsPeak, LightCurve, PlanetEstimate } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// PLANET PARAMETER ESTIMATOR
// ─────────────────────────────────────────────────────────────────────────────
// From the BLS detection results, we estimate physical planet parameters.
//
// KEY FORMULAS
//
// 1. ORBITAL PERIOD
//    Directly from the BLS best-fit period. The uncertainty is roughly
//    P / (2π × N_transits × SNR), following the scaling from the timing
//    precision of individual transits (Carter et al. 2008).
//
// 2. PLANET RADIUS
//    During a transit, the planet blocks a fraction of starlight equal to the
//    ratio of areas:
//       δ = (R_p / R_★)²
//    Therefore:
//       R_p = R_★ × √δ
//    where δ is the transit depth (fractional flux decrease) and R_★ is the
//    stellar radius. We convert to Earth radii using:
//       R_earth = 0.009168 R_sun  (IAU 2015 nominal solar radius)
//
//    The stellar radius comes from the target's catalog metadata. If it's not
//    available, we flag it and cannot compute R_p.
//
// 3. SEMI-MAJOR AXIS (orbital distance)
//    From Kepler's third law for a planet orbiting a star of mass M_★:
//       a³ = G × M_★ × P² / (4π²)
//    In convenient units (a in AU, P in years, M in solar masses):
//       a³ = M_★ × P²
//    We approximate M_★ ≈ R_★ (valid for main-sequence stars, rough but
//    standard for estimates when mass isn't directly available).
//
// 4. EQUILIBRIUM TEMPERATURE (if stellar T_eff is known)
//    T_eq = T_eff × √(R_★ / (2a)) × (1 - α)^0.25
//    Assuming Bond albedo α = 0.3 (Earth-like) and uniform heat redistribution.
//
// 5. JUPITER RADIUS CONVERSION
//    R_jup = 0.10049 R_sun  (IAU 2015)
// ─────────────────────────────────────────────────────────────────────────────

// IAU 2015 nominal values
const R_SUN_TO_EARTH = 109.2;   // 1 R_sun = 109.2 R_earth
const R_SUN_TO_JUPITER = 9.95;  // 1 R_sun = 9.95 R_jup
const AU_IN_SOLAR_RADII = 215.0; // 1 AU = 215 R_sun

/**
 * Estimate planet parameters from BLS detection results.
 */
export function estimatePlanet(
  peak: BlsPeak,
  curve: LightCurve
): PlanetEstimate {
  const period = peak.period;
  const depth = peak.depth;
  const duration = peak.duration;
  const snr = peak.snr;

  // ── Orbital period uncertainty ─────────────────────────────────────────────
  // Rough estimate: timing precision improves with more transits and higher SNR
  const timeSpan = curve.fluxPoints[curve.fluxPoints.length - 1].time - curve.fluxPoints[0].time;
  const nTransits = Math.max(1, Math.floor(timeSpan / period));
  const periodError = period / (2 * Math.PI * nTransits * Math.max(snr, 1));

  // ── Planet radius ───────────────────────────────────────────────────────────
  // R_p = R_★ × √δ
  let stellarRadius = curve.stellarRadius;
  let stellarRadiusSource = 'Not available';
  let planetRadius = 0;
  let planetRadiusError = 0;
  let planetRadiusJupiter = 0;

  if (stellarRadius && stellarRadius > 0) {
    stellarRadiusSource = 'Catalog metadata';
    // δ is the fractional depth; R_p/R_★ = √δ
    const radiusRatio = Math.sqrt(Math.abs(depth));
    planetRadius = stellarRadius * radiusRatio * R_SUN_TO_EARTH;
    planetRadiusJupiter = stellarRadius * radiusRatio * R_SUN_TO_JUPITER;

    // Uncertainty: dominated by depth uncertainty ≈ depth/SNR
    const depthError = depth / Math.max(snr, 1);
    const radiusRatioError = 0.5 * depthError / Math.sqrt(Math.abs(depth));
    planetRadiusError = stellarRadius * radiusRatioError * R_SUN_TO_EARTH;
  }

  // ── Semi-major axis from Kepler's 3rd law ───────────────────────────────────
  // a³ = M_★ × P², with P in years, a in AU, M in solar masses
  // Approximate M_★ ≈ R_★ for main-sequence stars
  let semiMajorAxis: number | undefined;
  if (stellarRadius && stellarRadius > 0) {
    const periodYears = period / 365.25;
    const stellarMass = stellarRadius; // rough approximation
    semiMajorAxis = Math.cbrt(stellarMass * periodYears * periodYears);
  }

  // ── Equilibrium temperature ──────────────────────────────────────────────────
  let equilibriumTemp: number | undefined;
  if (curve.stellarTemp && stellarRadius && semiMajorAxis) {
    const aInStellarRadii = semiMajorAxis * AU_IN_SOLAR_RADII;
    const albedo = 0.3; // Earth-like Bond albedo
    equilibriumTemp = curve.stellarTemp * Math.sqrt(stellarRadius / (2 * aInStellarRadii)) * Math.pow(1 - albedo, 0.25);
  }

  return {
    orbitalPeriod: period,
    orbitalPeriodError: periodError,
    planetRadius,
    planetRadiusError,
    planetRadiusJupiter,
    transitDepth: depth,
    transitDuration: duration,
    stellarRadius: stellarRadius ?? 0,
    stellarRadiusSource,
    equilibriumTemp,
    semiMajorAxis,
  };
}
