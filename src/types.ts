// ─────────────────────────────────────────────────────────────────────────────
// Core types for the Exoplanet Detection Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/** A single time-series data point in a light curve. */
export interface FluxPoint {
  time: number;   // Barycentric Julian Date (BJD) or relative time in days
  flux: number;   // Normalized flux (dimensionless, ~1.0 baseline)
  error: number;  // Flux uncertainty
}

/** Raw light curve metadata + data. */
export interface LightCurve {
  targetName: string;
  targetId: string;
  source: 'kepler' | 'tess' | 'synthetic';
  fluxPoints: FluxPoint[];
  stellarRadius?: number;   // in solar radii
  stellarTemp?: number;     // in Kelvin
  stellarMag?: number;      // apparent magnitude
  cadence?: number;         // seconds between exposures
  sector?: string;          // TESS sector or Kepler quarter
}

/** BLS periodogram peak — one candidate transit signal. */
export interface BlsPeak {
  period: number;        // days
  power: number;         // BLS power (relative, 0–1)
  depth: number;         // fractional transit depth (e.g. 0.0001 = 0.01%)
  duration: number;      // transit duration in hours
  transitCenter: number; // time of first transit (in same units as light curve)
  snr: number;           // signal-to-noise ratio of the detection
}

/** Full transit detection result. */
export interface TransitDetection {
  detected: boolean;
  bestPeak: BlsPeak | null;
  allPeaks: BlsPeak[];        // top N candidates for diagnostic display
  periodogram: PeriodogramData;
  foldedCurve: FluxPoint[];   // light curve folded on best period
  detrendedCurve: FluxPoint[]; // flattened light curve
  confidence: 'high' | 'moderate' | 'low' | 'none';
  confidenceReason: string;
}

/** Periodogram data for plotting power vs. period. */
export interface PeriodogramData {
  periods: number[];
  powers: number[];
}

/** Planet parameter estimates derived from transit detection. */
export interface PlanetEstimate {
  orbitalPeriod: number;       // days
  orbitalPeriodError: number;  // days (rough)
  planetRadius: number;        // Earth radii
  planetRadiusError: number;   // Earth radii
  planetRadiusJupiter: number; // Jupiter radii
  transitDepth: number;        // fractional
  transitDuration: number;     // hours
  stellarRadius: number;       // solar radii
  stellarRadiusSource: string; // where the stellar radius came from
  equilibriumTemp?: number;    // K (if stellar temp available)
  semiMajorAxis?: number;      // AU (estimated from Kepler's 3rd law)
}

/** Planet visual category for 3D rendering. */
export type PlanetVisualType =
  | 'lava'        // molten rocky, very hot
  | 'rocky'       // Earth-like rocky
  | 'desert'      // dry, sandy rocky
  | 'mini-ice'    // small with ice
  | 'gas-orange'  // warm gas giant
  | 'gas-blue'    // cool gas giant
  | 'gas-stripped'; // hot Jupiter with evaporating atmosphere

/** Known target catalog entry. */
export interface KnownTarget {
  name: string;
  ticId?: string;
  kicId?: string;
  stellarRadius: number; // solar radii
  stellarTemp?: number;
  knownPlanet: string;
  knownPeriod: number;   // days
  knownRadius: number;   // Earth radii

  // Display + education fields
  planetType: PlanetVisualType;
  discoveryYear: number;
  distance: number;        // light-years from Earth
  description: string;     // simple English description for students
  lifeCycle: string;       // how the planet "spends its life" — simple English
  hasKnownImage: boolean;  // whether we have an artist rendering
  planetColor: string;     // primary color for 3D rendering
  planetColor2: string;    // secondary color for 3D rendering
}

/** Search result for a target. */
export interface SearchResult {
  targetName: string;
  targetId: string;
  found: boolean;
  source: string;
  stellarRadius?: number;
  stellarTemp?: number;
  sector?: string;
  dataPoints: number;
  timeSpan: number; // days
}
