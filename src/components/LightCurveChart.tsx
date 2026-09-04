import { useMemo, useRef, useState, useEffect } from 'react';
import type { FluxPoint } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT CURVE CHART — interactive SVG plot
// ─────────────────────────────────────────────────────────────────────────────
// Renders a flux vs. time (or phase) scatter/line chart with:
//   - Auto-scaling axes
//   - Hover tooltips showing exact values
//   - Zoom via click-and-drag
//   - Grid lines and axis labels
//   - Transit region highlighting (for folded curves)
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  points: FluxPoint[];
  xLabel: string;
  yLabel: string;
  color?: string;
  highlightTransit?: { center: number; width: number }; // for folded curves
  height?: number;
}

interface ViewBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export default function LightCurveChart({
  points,
  xLabel,
  yLabel,
  color = '#38bdf8',
  highlightTransit,
  height = 280,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; data: FluxPoint } | null>(null);
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const margin = { top: 16, right: 16, bottom: 36, left: 60 };
  const width = containerWidth;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Track container width for responsiveness
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute visible points (respecting zoom)
  const visiblePoints = useMemo(() => {
    if (!zoomRange) return points;
    return points.filter((p) => p.time >= zoomRange.start && p.time <= zoomRange.end);
  }, [points, zoomRange]);

  // Compute viewBox
  const vb = useMemo<ViewBox>(() => {
    if (visiblePoints.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0.99, yMax: 1.01 };
    }
    const xs = visiblePoints.map((p) => p.time);
    const ys = visiblePoints.map((p) => p.flux);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const yPad = (yMax - yMin) * 0.1 || 0.001;
    return { xMin, xMax, yMin: yMin - yPad, yMax: yMax + yPad };
  }, [visiblePoints]);

  // Scale functions
  const sx = (x: number) => margin.left + ((x - vb.xMin) / (vb.xMax - vb.xMin || 1)) * plotW;
  const sy = (y: number) => margin.top + (1 - (y - vb.yMin) / (vb.yMax - vb.yMin || 1)) * plotH;
  const invSx = (px: number) => vb.xMin + ((px - margin.left) / plotW) * (vb.xMax - vb.xMin);

  // Build the SVG path
  const pathD = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    let d = `M ${sx(visiblePoints[0].time).toFixed(2)} ${sy(visiblePoints[0].flux).toFixed(2)}`;
    for (let i = 1; i < visiblePoints.length; i++) {
      d += ` L ${sx(visiblePoints[i].time).toFixed(2)} ${sy(visiblePoints[i].flux).toFixed(2)}`;
    }
    return d;
  }, [visiblePoints, vb, plotW, plotH]);

  // Axis tick generation
  const xTicks = useMemo(() => generateTicks(vb.xMin, vb.xMax, 6), [vb]);
  const yTicks = useMemo(() => generateTicks(vb.yMin, vb.yMax, 5), [vb]);

  // Format axis labels
  const fmtX = (v: number) => {
    if (xLabel.toLowerCase().includes('phase')) return v.toFixed(2);
    if (Math.abs(v) > 10000) return v.toFixed(0);
    if (Math.abs(v) > 100) return v.toFixed(1);
    return v.toFixed(2);
  };
  const fmtY = (v: number) => {
    const dev = (v - 1) * 1e6;
    if (Math.abs(dev) < 100) return dev.toFixed(0);
    return (dev / 1000).toFixed(1) + 'k';
  };

  // Mouse handlers
  function handleMouseMove(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;

    // Find nearest data point
    const targetX = invSx(px);
    let nearest = visiblePoints[0];
    let minDist = Infinity;
    for (const p of visiblePoints) {
      const d = Math.abs(p.time - targetX);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    if (nearest) {
      setHoverPoint({ x: sx(nearest.time), y: sy(nearest.flux), data: nearest });
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setDragStart(invSx(px));
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (dragStart === null) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const dragEnd = invSx(px);

    if (Math.abs(dragEnd - dragStart) > (vb.xMax - vb.xMin) * 0.02) {
      setZoomRange({
        start: Math.min(dragStart, dragEnd),
        end: Math.max(dragStart, dragEnd),
      });
    }
    setDragStart(null);
  }

  function handleDoubleClick() {
    setZoomRange(null);
  }

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500 text-sm" style={{ height }}>
        No data to display
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setHoverPoint(null)}
        onDoubleClick={handleDoubleClick}
        className="cursor-crosshair select-none"
      >
        {/* Grid */}
        {xTicks.map((t, i) => (
          <line key={`xg${i}`} x1={sx(t)} y1={margin.top} x2={sx(t)} y2={margin.top + plotH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {yTicks.map((t, i) => (
          <line key={`yg${i}`} x1={margin.left} y1={sy(t)} x2={margin.left + plotW} y2={sy(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* Transit highlight band */}
        {highlightTransit && (
          <rect
            x={sx(highlightTransit.center - highlightTransit.width / 2)}
            y={margin.top}
            width={sx(highlightTransit.center + highlightTransit.width / 2) - sx(highlightTransit.center - highlightTransit.width / 2)}
            height={plotH}
            fill="rgba(56, 189, 248, 0.08)"
            stroke="rgba(56, 189, 248, 0.2)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Data path */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1" opacity="0.8" />

        {/* Axes */}
        <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* X tick labels */}
        {xTicks.map((t, i) => (
          <text key={`xt${i}`} x={sx(t)} y={margin.top + plotH + 18} textAnchor="middle"
            className="fill-slate-500" fontSize="10" fontFamily="monospace">
            {fmtX(t)}
          </text>
        ))}
        {/* Y tick labels */}
        {yTicks.map((t, i) => (
          <text key={`yt${i}`} x={margin.left - 8} y={sy(t) + 3} textAnchor="end"
            className="fill-slate-500" fontSize="10" fontFamily="monospace">
            {fmtY(t)}
          </text>
        ))}

        {/* Axis labels */}
        <text x={margin.left + plotW / 2} y={height - 4} textAnchor="middle"
          className="fill-slate-400" fontSize="11" fontWeight="500">
          {xLabel}
        </text>
        <text
          x={-(margin.top + plotH / 2)}
          y={16}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-slate-400"
          fontSize="11"
          fontWeight="500"
        >
          {yLabel} (ppm)
        </text>

        {/* Hover marker */}
        {hoverPoint && (
          <>
            <line x1={hoverPoint.x} y1={margin.top} x2={hoverPoint.x} y2={margin.top + plotH}
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hoverPoint.x} cy={hoverPoint.y} r="3" fill={color} stroke="white" strokeWidth="1" />
          </>
        )}

        {/* Zoom hint */}
        {zoomRange && (
          <text x={margin.left + plotW - 8} y={margin.top + 14} textAnchor="end"
            className="fill-slate-500" fontSize="9">
            Double-click to reset zoom
          </text>
        )}
      </svg>

      {/* Tooltip */}
      {hoverPoint && (
        <div
          className="absolute pointer-events-none px-2 py-1 rounded bg-slate-900/95 border border-white/15 text-xs text-slate-300 font-mono whitespace-nowrap z-10"
          style={{
            left: `${Math.min(hoverPoint.x + 8, width - 140)}px`,
            top: `${Math.max(hoverPoint.y - 30, 0)}px`,
          }}
        >
          {xLabel}: {hoverPoint.data.time.toFixed(4)}
          <br />
          Flux: {((hoverPoint.data.flux - 1) * 1e6).toFixed(1)} ppm
        </div>
      )}
    </div>
  );
}

/** Generate 'nice' axis tick values. */
function generateTicks(min: number, max: number, count: number): number[] {
  const range = max - min;
  if (range <= 0) return [min];
  const rawStep = range / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized < 1 ? 1 : normalized < 2 ? 2 : normalized < 5 ? 5 : 10) * magnitude;
  const start = Math.ceil(min / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; v <= max + niceStep * 0.01; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}
