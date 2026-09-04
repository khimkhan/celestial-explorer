import { useMemo } from 'react';
import type { Constellation } from '@/lib/constellations';

interface Marker {
  ra: number;
  dec: number;
  label: string;
}

interface Props {
  constellation: Constellation;
  markers?: Marker[];
  height?: number;
}

/**
 * Star chart drawn from real d3-celestial data: IAU constellation stick figures
 * and Yale Bright Star positions/magnitudes, in RA/Dec degrees.
 */
export default function ConstellationChart({ constellation, markers = [], height = 260 }: Props) {
  const { project, width } = useMemo(() => {
    const pts = constellation.chart.lines.flat();
    const ras = pts.map((p) => p[0]!);
    const decs = pts.map((p) => p[1]!);
    const wrap = Math.max(...ras) - Math.min(...ras) > 180;
    const unwrap = (ra: number) => (wrap && ra < 0 ? ra + 360 : ra);
    const uras = ras.map(unwrap);
    const raLo = Math.min(...uras) - 6;
    const raHi = Math.max(...uras) + 6;
    const decLo = Math.min(...decs) - 6;
    const decHi = Math.max(...decs) + 6;
    const w = Math.round((height * (raHi - raLo)) / (decHi - decLo));
    return {
      width: Math.max(220, Math.min(760, w)),
      project: (ra: number, dec: number): [number, number] => {
        const u = unwrap(ra);
        const x = ((raHi - u) / (raHi - raLo)) * Math.max(220, Math.min(760, w));
        const y = ((decHi - dec) / (decHi - decLo)) * height;
        return [x, y];
      },
    };
  }, [constellation, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm"
      role="img"
      aria-label={`Star chart of ${constellation.name}`}
    >
      {constellation.chart.stars.map(([ra, dec, mag], i) => {
        const [x, y] = project(ra!, dec!);
        const r = Math.max(0.8, 3.4 - mag! * 0.55);
        return <circle key={`s${i}`} cx={x} cy={y} r={r} fill="#e2e8f0" opacity={0.9} />;
      })}

      {constellation.chart.lines.map((seg, i) => (
        <polyline
          key={`l${i}`}
          points={seg.map(([ra, dec]) => project(ra!, dec!).join(',')).join(' ')}
          fill="none"
          stroke="rgba(56,189,248,0.55)"
          strokeWidth={1.1}
        />
      ))}

      {markers.map((m, i) => {
        const [x, y] = project(m.ra, m.dec);
        return (
          <g key={`m${i}`}>
            <circle cx={x} cy={y} r={5} fill="none" stroke="#a78bfa" strokeWidth={1.4} />
            <circle cx={x} cy={y} r={1.8} fill="#a78bfa" />
            <text x={x + 8} y={y + 4} fontSize={10} className="font-mono" fill="#c4b5fd">
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
