import type { PlanetVisualType } from '@/types';
import type { CatalogPlanet } from './planetLore';

/** URL-safe slug for a NASA planet name ("Kepler-452 b" -> "kepler-452-b"). */
export function slugifyPlanetName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** ADQL LIKE pattern that reverses a slug back to a planet name. */
export function slugToLikePattern(slug: string): string {
  return `%${slug.replace(/-/g, '%')}%`;
}

function visualType(radiusEarth: number, eqTempK: number | null): PlanetVisualType {
  const hot = (eqTempK ?? 0) > 1200;
  if (radiusEarth >= 8) return hot ? 'gas-stripped' : 'gas-blue';
  if (radiusEarth >= 4) return 'gas-orange';
  if (radiusEarth >= 2) return 'mini-ice';
  if (hot) return 'lava';
  return (eqTempK ?? 0) > 700 ? 'desert' : 'rocky';
}

const COLORS: Record<PlanetVisualType, [string, string]> = {
  lava: ['#ff6b35', '#c9302c'],
  rocky: ['#8ba888', '#5c7a6b'],
  desert: ['#d9a066', '#a9743f'],
  'mini-ice': ['#9fd8e8', '#6ba3bd'],
  'gas-orange': ['#e8a87c', '#c38d5e'],
  'gas-blue': ['#6f9ceb', '#3f5fa8'],
  'gas-stripped': ['#2c2c2c', '#1a1a2e'],
};

export interface LiveRow {
  pl_name: string;
  hostname: string;
  discoverymethod: string | null;
  disc_year: number | null;
  pl_orbper: number | null;
  pl_rade: number | null;
  pl_eqt?: number | null;
  pl_orbsmax?: number | null;
  st_rad: number | null;
  st_teff: number | null;
  sy_dist: number | null;
  ra?: number | null;
  dec?: number | null;
}

const PC_TO_LY = 3.26156;

/** Map a NASA `ps` row into the app's standard catalog model. */
export function rowToCatalogPlanet(r: LiveRow): CatalogPlanet | null {
  if (r.pl_orbper == null || r.pl_rade == null) return null;
  const type = visualType(r.pl_rade, r.pl_eqt ?? null);
  const [c1, c2] = COLORS[type];
  return {
    slug: slugifyPlanetName(r.pl_name),
    plName: r.pl_name,
    constellation: '',
    planetType: type,
    planetColor: c1,
    planetColor2: c2,
    hasKnownImage: false,
    description: `${r.pl_name} is a confirmed exoplanet orbiting ${r.hostname}, listed in the NASA Exoplanet Archive. Its orbital period and size below come straight from that archive; the light curve and detection panels on this page are educational simulations built from those numbers.`,
    lifeCycle: `${r.pl_name} completes one orbit of ${r.hostname} every ${r.pl_orbper.toFixed(2)} days. Everything else shown here is modelled from the archive parameters rather than newly observed.`,
    hostName: r.hostname,
    periodDays: r.pl_orbper,
    radiusEarth: r.pl_rade,
    semiMajorAxisAu: r.pl_orbsmax ?? null,
    eqTempK: r.pl_eqt ?? null,
    transitDepthPct: null,
    transitDurationHours: null,
    stellarRadius: r.st_rad,
    stellarTemp: r.st_teff,
    distanceLy: r.sy_dist == null ? null : Math.round(r.sy_dist * PC_TO_LY),
    ra: r.ra ?? 0,
    dec: r.dec ?? 0,
    discoveryYear: r.disc_year ?? 0,
    discoveryMethod: r.discoverymethod ?? 'Unknown',
    discoveryFacility: '',
  };
}
