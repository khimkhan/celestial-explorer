import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2, Globe2, Database } from 'lucide-react';
import type { CatalogPlanet } from '@/lib/planetLore';
import { filterLocalPlanets, useLiveExoplanetSearch } from '@/lib/exoplanetSearch';
import { classifyPlanet } from '@/lib/catalogQuery';

interface Props {
  /** The default catalog (21 worlds) that is always searched first, offline. */
  planets: CatalogPlanet[];
  /** Called on every keystroke so the page behind can filter its own grid. */
  onQueryChange?: (query: string) => void;
  /** Called when a local or live result is picked. */
  onSelect: (planet: CatalogPlanet) => void;
  placeholder?: string;
}

export default function SearchBar({ planets, onQueryChange, onSelect, placeholder }: Props) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const localMatches = useMemo(
    () => (value.trim() ? filterLocalPlanets(planets, value).slice(0, 8) : []),
    [planets, value],
  );

  // Only reach out to NASA when the local catalog has nothing to offer.
  const needsLive = value.trim().length >= 2 && localMatches.length === 0;
  const { results: liveMatches, loading, error } = useLiveExoplanetSearch(value, needsLive);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function update(next: string) {
    setValue(next);
    setOpen(true);
    onQueryChange?.(next);
  }

  function pick(planet: CatalogPlanet) {
    setOpen(false);
    onSelect(planet);
  }

  const showDropdown = open && value.trim().length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => update(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Search any confirmed exoplanet — local catalog or NASA archive…'}
        className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3.5 pl-12 pr-12 text-sm text-white placeholder-slate-500 transition-all focus:border-violet-500/50 focus:bg-slate-900/80 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => update('')}
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-md">
          {localMatches.length > 0 && (
            <ul className="max-h-80 overflow-y-auto py-1">
              {localMatches.map((p) => (
                <ResultRow key={p.slug} planet={p} onPick={pick} source="catalog" />
              ))}
            </ul>
          )}

          {needsLive && loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
              Searching the NASA Exoplanet Archive…
            </div>
          )}

          {needsLive && !loading && liveMatches.length > 0 && (
            <>
              <div className="border-b border-slate-800 px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-violet-300">
                Live · NASA Exoplanet Archive
              </div>
              <ul className="max-h-80 overflow-y-auto py-1">
                {liveMatches.map((p) => (
                  <ResultRow key={p.slug} planet={p} onPick={pick} source="live" />
                ))}
              </ul>
            </>
          )}

          {needsLive && !loading && !error && liveMatches.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">
              No confirmed planet matches &ldquo;{value.trim()}&rdquo;.
            </div>
          )}

          {error && <div className="px-4 py-3 text-xs text-rose-300">{error}</div>}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  planet,
  onPick,
  source,
}: {
  planet: CatalogPlanet;
  onPick: (p: CatalogPlanet) => void;
  source: 'catalog' | 'live';
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(planet)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-violet-500/10"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm text-white">{planet.plName}</span>
          <span className="block truncate text-xs text-slate-500">
            {planet.hostName} · {classifyPlanet(planet.radiusEarth)} ·{' '}
            {planet.periodDays.toFixed(2)} d orbit
          </span>
        </span>
        <span className="shrink-0 text-slate-500">
          {source === 'live' ? (
            <Globe2 className="h-3.5 w-3.5 text-violet-300" />
          ) : (
            <Database className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
    </li>
  );
}
