import { useEffect, useMemo, useState } from 'react';
import type { CatalogPlanet } from '@/lib/planetLore';

interface Props {
  planets: CatalogPlanet[];
  onSelect: (p: CatalogPlanet) => void;
}

const W = 900;
const H = 560;
const CX = W / 2;
const CY = H / 2;
const R_MIN = 46;
const R_MAX = 250;

/**
 * Top-down 2D orbit map. Orbit radii are the real semi-major axes from the
 * NASA archive, mapped logarithmically so both 0.01 AU and 1 AU worlds fit.
 * Angular positions advance at each planet's real orbital period.
 */
export default function OrbitMap2D({ planets, onSelect }: Props) {
  const [t, setT] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rows = useMemo(() => {
    const withAxis = planets.filter((p) => p.semiMajorAxisAu && p.semiMajorAxisAu > 0);
    const logs = withAxis.map((p) => Math.log10(p.semiMajorAxisAu!));
    const lo = Math.min(...logs);
    const hi = Math.max(...logs);
    return withAxis.map((p, i) => {
      const frac = hi === lo ? 0.5 : (logs[i]! - lo) / (hi - lo);
      return {
        planet: p,
        radius: R_MIN + frac * (R_MAX - R_MIN),
        // one screen revolution per 6 s for the shortest period, scaled by real period
        angularSpeed: (2 * Math.PI) / (4 + Math.log10(1 + p.periodDays) * 14),
        phase: (i * 137.5 * Math.PI) / 180,
        size: Math.max(3.2, Math.min(9, 2.4 + Math.log2(p.radiusEarth + 1) * 1.8)),
      };
    });
  }, [planets]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="2D orbit map of catalog exoplanets">
        <defs>
          <radialGradient id="starGlow">
            <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={90} fill="url(#starGlow)" />
        <circle cx={CX} cy={CY} r={14} fill="#fde68a" />

        {rows.map(({ planet, radius }) => (
          <ellipse
            key={`o-${planet.slug}`}
            cx={CX}
            cy={CY}
            rx={radius}
            ry={radius * 0.42}
            fill="none"
            stroke={hover === planet.slug ? planet.planetColor : 'rgba(148,163,184,0.22)'}
            strokeWidth={hover === planet.slug ? 1.6 : 0.8}
          />
        ))}

        {rows.map(({ planet, radius, angularSpeed, phase, size }) => {
          const a = phase + t * angularSpeed;
          const x = CX + Math.cos(a) * radius;
          const y = CY + Math.sin(a) * radius * 0.42;
          const active = hover === planet.slug;
          return (
            <g
              key={planet.slug}
              className="cursor-pointer"
              onMouseEnter={() => setHover(planet.slug)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(planet)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(planet);
              }}
            >
              <circle cx={x} cy={y} r={size + 7} fill={planet.planetColor} opacity={active ? 0.28 : 0.12} />
              <circle cx={x} cy={y} r={size} fill={planet.planetColor} stroke={planet.planetColor2} strokeWidth={1} />
              <text
                x={x + size + 8}
                y={y + 4}
                className="pointer-events-none font-mono"
                fontSize={active ? 14 : 11}
                fill={active ? '#e2e8f0' : 'rgba(148,163,184,0.75)'}
              >
                {planet.plName}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center font-mono text-[11px] text-slate-500">
        Orbit radii = real semi-major axes (log scale) · dot size scales with planet radius · click a world to inspect it
      </p>
    </div>
  );
}
