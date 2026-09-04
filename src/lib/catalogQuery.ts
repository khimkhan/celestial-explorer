import { queryOptions } from '@tanstack/react-query';
import type { CatalogPlanet } from './planetLore';
import type { KnownTarget, PlanetVisualType } from '@/types';
import { getExoplanetCatalog } from './exoplanets.functions';

export const catalogQueryOptions = () =>
  queryOptions({
    queryKey: ['exoplanet-catalog'],
    queryFn: () => getExoplanetCatalog(),
    staleTime: 60 * 60 * 1000,
  });

/** Adapt a catalog record to the shape the 3D/2D orbit renderers expect. */
export function toTarget(p: CatalogPlanet): KnownTarget {
  return {
    name: p.hostName,
    stellarRadius: p.stellarRadius ?? 1,
    stellarTemp: p.stellarTemp ?? undefined,
    knownPlanet: p.plName,
    knownPeriod: p.periodDays,
    knownRadius: p.radiusEarth,
    planetType: p.planetType as PlanetVisualType,
    discoveryYear: p.discoveryYear,
    distance: p.distanceLy ?? 0,
    description: p.description,
    lifeCycle: p.lifeCycle,
    hasKnownImage: p.hasKnownImage,
    planetColor: p.planetColor,
    planetColor2: p.planetColor2,
  };
}

export function classifyPlanet(radiusEarth: number): string {
  if (radiusEarth < 1.25) return 'Earth-sized';
  if (radiusEarth < 2) return 'Super-Earth';
  if (radiusEarth < 6) return 'Sub-Neptune';
  if (radiusEarth < 12) return 'Neptune-like';
  return 'Gas Giant';
}
