import { useState, useMemo } from 'react';
import type { CatalogPlanet } from '@/lib/planetLore';
import { classifyPlanet, toTarget } from '@/lib/catalogQuery';
import { CONSTELLATION_BY_ABBR } from '@/lib/constellations';
import LiveMiniOrbit from './LiveMiniOrbit';


import OrbitMap2D from './OrbitMap2D';
import HowDetectionWorks from './HowDetectionWorks';
import SearchBar from './SearchBar';
import { Sparkles, LayoutGrid, Orbit } from 'lucide-react';

interface Props {
  planets: CatalogPlanet[];
  onSelect: (planet: CatalogPlanet) => void;
}

type View = 'grid' | 'map';

export default function HomePage({ planets, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('grid');

  const filtered = useMemo(() => {
    if (!search.trim()) return planets;
    const q = search.trim().toLowerCase();
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
  }, [planets, search]);

  return (
    <div className="space-y-8">
      <section className="py-6 text-center sm:py-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 font-mono text-xs text-violet-300">
          <Sparkles className="h-3 w-3" />
          Exoplanet detection &amp; simulation system
        </div>
        <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-5xl">
          Explore Worlds Beyond Our Sun
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-400 sm:text-base">
          Explore worlds beyond our Sun through observation, transit detection and orbital
          simulation.
        </p>

        <dl className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
          <Status label="Observatory status" value="● Online" tone="text-emerald-300" />
          <Status label="NASA archive objects" value={String(planets.length)} tone="text-white" />
          <Status label="Detection method" value="Transit photometry" tone="text-cyan-300" />
          <Status label="Simulation" value="Active" tone="text-violet-300" />
        </dl>
      </section>


      <section className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchBar planets={planets} onQueryChange={setSearch} onSelect={onSelect} />
        </div>

        <div className="flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 font-mono text-xs">
          <ViewTab active={view === 'grid'} onClick={() => setView('grid')} icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Cards" />
          <ViewTab active={view === 'map'} onClick={() => setView('map')} icon={<Orbit className="h-3.5 w-3.5" />} label="Orbit map" />
        </div>
      </section>

      {view === 'map' ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <OrbitMap2D planets={filtered} onSelect={onSelect} />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((planet) => (
            <PlanetCard key={planet.slug} planet={planet} onSelect={onSelect} />
          ))}
        </div>
      )}

      <HowDetectionWorks />

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          Nothing in the catalog matches &ldquo;{search}&rdquo;.
        </p>
      )}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
        active ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PlanetCard({
  planet,
  onSelect,
}: {
  planet: CatalogPlanet;
  onSelect: (p: CatalogPlanet) => void;
}) {
  return (
    <button
      onClick={() => onSelect(planet)}
      className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_30px_rgba(139,92,246,0.18)]"
    >
      <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        <LiveMiniOrbit target={toTarget(planet)} size={220} />
        <span className="absolute left-3 top-3 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
          NASA-confirmed world
        </span>
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/70">Live</span>
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 text-left">
        <h3 className="text-lg font-bold text-white transition-colors group-hover:text-violet-300">
          {planet.plName}
        </h3>
        <dl className="mt-2 space-y-1 font-mono text-[11px]">
          <Row label="Host star" value={planet.hostName} />
          <Row
            label="Constellation"
            value={CONSTELLATION_BY_ABBR.get(planet.constellation)?.name ?? planet.constellation}
          />
          <Row label="Planet type" value={classifyPlanet(planet.radiusEarth)} />
          <Row
            label="Orbital period"
            value={
              planet.periodDays < 1
                ? `${(planet.periodDays * 24).toFixed(1)} h`
                : `${planet.periodDays.toFixed(2)} d`
            }
          />
          <Row label="Detection method" value={planet.discoveryMethod} />
        </dl>
      </div>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="truncate text-slate-300">{value}</dd>
    </div>
  );
}

function Status({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left backdrop-blur-md">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`font-mono text-xs ${tone}`}>{value}</dd>
    </div>
  );
}

