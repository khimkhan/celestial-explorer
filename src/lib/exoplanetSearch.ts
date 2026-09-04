import { useEffect, useState } from 'react';
import type { CatalogPlanet } from './planetLore';
import { searchExoplanetsLive } from './exoplanets.functions';
import { classifyPlanet } from './catalogQuery';

/** Match a query against the locally loaded catalog (the default 21 worlds). */
export function filterLocalPlanets(planets: CatalogPlanet[], query: string): CatalogPlanet[] {
  const q = query.trim().toLowerCase();
  if (!q) return planets;
  return planets.filter(
    (p) =>
      p.plName.toLowerCase().includes(q) ||
      p.hostName.toLowerCase().includes(q) ||
      p.constellation.toLowerCase().includes(q) ||
      p.discoveryMethod.toLowerCase().includes(q) ||
      String(p.discoveryYear).includes(q) ||
      (p.discoveryFacility ?? '').toLowerCase().includes(q) ||
      classifyPlanet(p.radiusEarth).toLowerCase().includes(q) ||
      'confirmed'.includes(q),
  );
}

/**
 * Debounced live lookup against the NASA Exoplanet Archive. Only runs when the
 * typed term has no match in the local catalog, so the default set stays instant.
 */
export function useLiveExoplanetSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<CatalogPlanet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const rows = await searchExoplanetsLive({ data: { query: q } });
        if (!cancelled) setResults(rows);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError('Live archive lookup failed. Try again in a moment.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, loading, error };
}
