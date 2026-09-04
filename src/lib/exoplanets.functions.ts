import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { PLANET_LORE, type CatalogPlanet } from './planetLore';
import { rowToCatalogPlanet, slugToLikePattern, type LiveRow } from './liveCatalog';

const TAP = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const PC_TO_LY = 3.26156;

interface TapRow {
  pl_name: string;
  hostname: string;
  pl_orbper: number | null;
  pl_rade: number | null;
  pl_orbsmax: number | null;
  pl_eqt: number | null;
  pl_trandep: number | null;
  pl_trandur: number | null;
  st_rad: number | null;
  st_teff: number | null;
  sy_dist: number | null;
  ra: number;
  dec: number;
  disc_year: number;
  discoverymethod: string;
  disc_facility: string;
}

/**
 * Live catalog read from the NASA Exoplanet Archive (pscomppars table, TAP
 * service). Every number rendered in the app comes from this query; the local
 * lore table only supplies slugs, colours and story text.
 */
export const getExoplanetCatalog = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CatalogPlanet[]> => {
    const names = PLANET_LORE.map((l) => `'${l.plName.replace(/'/g, "''")}'`).join(',');
    const query = `select pl_name,hostname,pl_orbper,pl_rade,pl_orbsmax,pl_eqt,pl_trandep,pl_trandur,st_rad,st_teff,sy_dist,ra,dec,disc_year,discoverymethod,disc_facility from pscomppars where pl_name in (${names})`;

    const url = `${TAP}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`NASA Exoplanet Archive request failed (${res.status})`);
    }
    const rows = (await res.json()) as TapRow[];
    const byName = new Map(rows.map((r) => [r.pl_name, r]));

    const merged: CatalogPlanet[] = [];
    for (const lore of PLANET_LORE) {
      const r = byName.get(lore.plName);
      if (!r || r.pl_orbper == null || r.pl_rade == null) continue;
      merged.push({
        ...lore,
        hostName: r.hostname,
        periodDays: r.pl_orbper,
        radiusEarth: r.pl_rade,
        semiMajorAxisAu: r.pl_orbsmax,
        eqTempK: r.pl_eqt,
        transitDepthPct: r.pl_trandep,
        transitDurationHours: r.pl_trandur,
        stellarRadius: r.st_rad,
        stellarTemp: r.st_teff,
        distanceLy: r.sy_dist == null ? null : Math.round(r.sy_dist * PC_TO_LY),
        ra: r.ra,
        dec: r.dec,
        discoveryYear: r.disc_year,
        discoveryMethod: r.discoverymethod,
        discoveryFacility: r.disc_facility,
      });
    }
    merged.sort((a, b) => a.periodDays - b.periodDays);
    return merged;
  },
);

// ── Live search ──────────────────────────────────────────────────────────────

const LIVE_COLUMNS =
  'pl_name,hostname,discoverymethod,disc_year,pl_orbper,pl_rade,pl_eqt,pl_orbsmax,st_rad,st_teff,sy_dist,ra,dec';

async function runTap(query: string): Promise<LiveRow[]> {
  const url = `${TAP}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`NASA Exoplanet Archive request failed (${res.status})`);
  return (await res.json()) as LiveRow[];
}

/** Free-text live lookup against the NASA Exoplanet Archive `ps` table. */
export const searchExoplanetsLive = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ query: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }): Promise<CatalogPlanet[]> => {
    const like = `%${data.query.toLowerCase().replace(/'/g, "''")}%`;
    const query = `select top 10 ${LIVE_COLUMNS} from ps where lower(pl_name) like lower('${like}') order by pl_name`;
    const rows = await runTap(query);
    const seen = new Set<string>();
    const out: CatalogPlanet[] = [];
    for (const r of rows) {
      const p = rowToCatalogPlanet(r);
      if (!p || seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
    return out;
  });

/** Resolve a single planet by slug, for detail pages outside the local set. */
export const getExoplanetBySlug = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }): Promise<CatalogPlanet | null> => {
    const like = slugToLikePattern(data.slug).replace(/'/g, "''");
    const query = `select top 10 ${LIVE_COLUMNS} from ps where lower(pl_name) like lower('${like}') order by pl_name`;
    const rows = await runTap(query);
    for (const r of rows) {
      const p = rowToCatalogPlanet(r);
      if (p && p.slug === data.slug) return p;
    }
    return null;
  });
