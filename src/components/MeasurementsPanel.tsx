import type { CatalogPlanet } from '@/lib/planetLore';
import { classifyPlanet } from '@/lib/catalogQuery';

export default function MeasurementsPanel({ planet }: { planet: CatalogPlanet }) {
  const rows: [string, string][] = [
    [
      'Period',
      planet.periodDays < 1
        ? `${(planet.periodDays * 24).toFixed(2)} h`
        : `${planet.periodDays.toFixed(4)} d`,
    ],
    ['Radius', `${planet.radiusEarth.toFixed(2)} R⊕`],
    [
      'Transit depth',
      planet.transitDepthPct == null ? '—' : `${planet.transitDepthPct.toFixed(3)} %`,
    ],
    [
      'Transit duration',
      planet.transitDurationHours == null ? '—' : `${planet.transitDurationHours.toFixed(2)} h`,
    ],
    [
      'Semi-major axis',
      planet.semiMajorAxisAu == null ? '—' : `${planet.semiMajorAxisAu.toFixed(4)} AU`,
    ],
    ['Equilibrium temp', planet.eqTempK == null ? '—' : `${Math.round(planet.eqTempK)} K`],
    ['Class', classifyPlanet(planet.radiusEarth)],
  ];

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-300/80">
          Confirmed · {planet.discoveryMethod}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {planet.discoveryFacility} · {planet.discoveryYear}
        </p>
      </div>

      <dl className="divide-y divide-slate-800/80 overflow-hidden rounded-lg border border-slate-800 bg-slate-800/30">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="font-mono text-xs font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="font-mono text-[10px] leading-relaxed text-slate-600">
        Source: NASA Exoplanet Archive (pscomppars)
      </p>
    </div>
  );
}
