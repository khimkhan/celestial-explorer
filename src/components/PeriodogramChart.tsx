import { useMemo, useRef, useState, useEffect } from 'react';
import type { PeriodogramData, BlsPeak } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// BLS PERIODOGRAM CHART
// ─────────────────────────────────────────────────────────────────────────────
// Plots BLS power vs. trial period (log scale on x-axis). Peaks in this plot
// correspond to candidate transit periods. The highest peak is the best-fit
// period; secondary peaks are often harmonics (P/2, 2P, P/3, etc.)
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  data: PeriodogramData;
  peaks: BlsPeak[];
  height?: number;
}

export default function PeriodogramChart({ data, peaks, height = 200 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hover, setHover] = useState<{ x: number; y: number; period: number; power: number } | null>(null);

  const margin = { top: 16, right: 16, bottom: 36, left: 50 };
  const width = containerWidth;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const vb = useMemo(() => {
    if (data.periods.length === 0) return { xMin: 0.5, xMax: 50, yMin: 0, yMax: 1 };
    return {
      xMin: data.periods[0],
      xMax: data.periods[data.periods.length - 1],
      yMin: 0,
      yMax: 1,
    };
  }, [data]);

  // Log scale on x-axis
  const sx = (x: number) => margin.left + ((Math.log10(x) - Math.log10(vb.xMin)) / (Math.log10(vb.xMax) - Math.log10(vb.xMin))) * plotW;
  const sy = (y: number) => margin.top + (1 - y) * plotH;
  const invSx = (px: number) => Math.pow(10, Math.log10(vb.xMin) + ((px - margin.left) / plotW) * (Math.log10(vb.xMax) - Math.log10(vb.xMin)));

  const pathD = useMemo(() => {
    if (data.periods.length === 0) return '';
    let d = `M ${sx(data.periods[0]).toFixed(2)} ${sy(data.powers[0]).toFixed(2)}`;
    for (let i = 1; i < data.periods.length; i++) {
      d += ` L ${sx(data.periods[i]).toFixed(2)} ${sy(data.powers[i]).toFixed(2)}`;
    }
    return d;
  }, [data, vb, plotW, plotH]);

  // Log-spaced x ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const minExp = Math.floor(Math.log10(vb.xMin));
    const maxExp = Math.ceil(Math.log10(vb.xMax));
    for (let e = minExp; e <= maxExp; e++) {
      ticks.push(Math.pow(10, e));
    }
    return ticks;
  }, [vb]);
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  function handleMouseMove(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg || data.periods.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const targetPeriod = invSx(px);

    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < data.periods.length; i++) {
      const d = Math.abs(Math.log10(data.periods[i]) - Math.log10(targetPeriod));
      if (d < minDist) { minDist = d; nearestIdx = i; }
    }
    setHover({
      x: sx(data.periods[nearestIdx]),
      y: sy(data.powers[nearestIdx]),
      period: data.periods[nearestIdx],
      power: data.powers[nearestIdx],
    });
  }

  if (data.periods.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500 text-sm" style={{ height }}>
        No periodogram data
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ minHeight: height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        className="select-none"
      >
        {/* Grid */}
        {xTicks.map((t, i) => (
          <g key={`xg${i}`}>
            <line x1={sx(t)} y1={margin.top} x2={sx(t)} y2={margin.top + plotH} stroke="rgba(255,255,255,0.05)" />
            <text x={sx(t)} y={margin.top + plotH + 18} textAnchor="middle" className="fill-slate-500" fontSize="10" fontFamily="monospace">
              {t < 1 ? t.toFixed(1) : t.toFixed(0)}
            </text>
          </g>
        ))}
        {yTicks.map((t, i) => (
          <g key={`yg${i}`}>
            <line x1={margin.left} y1={sy(t)} x2={margin.left + plotW} y2={sy(t)} stroke="rgba(255,255,255,0.05)" />
            <text x={margin.left - 8} y={sy(t) + 3} textAnchor="end" className="fill-slate-500" fontSize="10" fontFamily="monospace">
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Periodogram curve */}
        <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="1.2" opacity="0.9" />

        {/* Peak markers */}
        {peaks.slice(0, 3).map((peak, i) => (
          <g key={`peak${i}`}>
            <line
              x1={sx(peak.period)} y1={margin.top}
              x2={sx(peak.period)} y2={margin.top + plotH}
              stroke={i === 0 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255,255,255,0.15)'}
              strokeWidth="1"
              strokeDasharray={i === 0 ? 'none' : '3 3'}
            />
            <circle cx={sx(peak.period)} cy={sy(peak.power)} r={i === 0 ? 5 : 3}
              fill={i === 0 ? '#38bdf8' : 'rgba(167, 139, 250, 0.6)'}
              stroke="white" strokeWidth="1" />
            {i === 0 && (
              <text x={sx(peak.period)} y={sy(peak.power) - 10} textAnchor="middle"
                className="fill-sky-300" fontSize="10" fontWeight="600">
                P = {peak.period.toFixed(3)}d
              </text>
            )}
          </g>
        ))}

        {/* Axes */}
        <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke="rgba(255,255,255,0.2)" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH} stroke="rgba(255,255,255,0.2)" />

        {/* Labels */}
        <text x={margin.left + plotW / 2} y={height - 4} textAnchor="middle" className="fill-slate-400" fontSize="11" fontWeight="500">
          Period (days, log scale)
        </text>
        <text x={-(margin.top + plotH / 2)} y={14} textAnchor="middle" transform="rotate(-90)"
          className="fill-slate-400" fontSize="11" fontWeight="500">
          BLS Power
        </text>

        {/* Hover */}
        {hover && (
          <>
            <line x1={hover.x} y1={margin.top} x2={hover.x} y2={margin.top + plotH} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="3" fill="#a78bfa" stroke="white" strokeWidth="1" />
          </>
        )}
      </svg>

      {hover && (
        <div
          className="absolute pointer-events-none px-2 py-1 rounded bg-slate-900/95 border border-white/15 text-xs text-slate-300 font-mono z-10"
          style={{ left: `${Math.min(hover.x + 8, width - 100)}px`, top: `${Math.max(hover.y - 28, 0)}px` }}
        >
          P: {hover.period.toFixed(3)}d
          <br />
          Power: {hover.power.toFixed(3)}
        </div>
      )}
    </div>
  );
}
