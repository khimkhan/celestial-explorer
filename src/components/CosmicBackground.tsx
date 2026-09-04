import { useEffect, useRef } from "react";
import { CONSTELLATIONS } from "@/lib/constellations";
import { getSimSettings, prefersReducedMotion } from "@/lib/simSettings";

// ─────────────────────────────────────────────────────────────────────────────
// COSMIC BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
// A single canvas that draws the whole deep-space environment:
//   · three parallax star layers with gentle twinkle
//   · slow drifting nebula/dust clouds
//   · occasional shooting stars
//   · IAU constellation stick figures that fade in and out
//   · the constellation of the currently selected object is emphasised
//
// One requestAnimationFrame loop, one canvas, no React re-renders. Honours
// `prefers-reduced-motion` by drawing a single quiet frame.
// ─────────────────────────────────────────────────────────────────────────────

interface Star {
  x: number;
  y: number;
  layer: number; // 0 far → 2 near
  r: number;
  base: number;
  phase: number;
  speed: number;
}

interface Cloud {
  x: number;
  y: number;
  r: number;
  hue: string;
  drift: number;
  /** centre of the slow rotation the cloud sweeps around */
  cx: number;
  cy: number;
  orbit: number;
  angle: number;
  spin: number;
}

interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface PlacedConstellation {
  abbr: string;
  name: string;
  /** normalised 0..1 anchor on screen */
  ax: number;
  ay: number;
  scale: number;
  lines: number[][][];
  stars: number[][];
  bbox: { x0: number; y0: number; w: number; h: number };
  phase: number;
}

function chartBBox(lines: number[][][], stars: number[][]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  const visit = (x: number, y: number) => {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  };
  lines.forEach((seg) => seg.forEach(([x, y]) => visit(x, y)));
  stars.forEach(([x, y]) => visit(x, y));
  if (!Number.isFinite(x0)) return { x0: 0, y0: 0, w: 1, h: 1 };
  return { x0, y0, w: Math.max(x1 - x0, 0.001), h: Math.max(y1 - y0, 0.001) };
}

/** Deterministic sky slots so constellations never overlap badly. */
const SLOTS: [number, number][] = [
  [0.12, 0.16],
  [0.38, 0.1],
  [0.66, 0.18],
  [0.88, 0.34],
  [0.1, 0.42],
  [0.34, 0.5],
  [0.6, 0.44],
  [0.86, 0.62],
  [0.16, 0.72],
  [0.42, 0.82],
  [0.68, 0.74],
  [0.9, 0.88],
  [0.26, 0.3],
];

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let stars: Star[] = [];
    let clouds: Cloud[] = [];
    let shooters: Shooter[] = [];
    const placed: PlacedConstellation[] = CONSTELLATIONS.map((c, i) => {
      const slot = SLOTS[i % SLOTS.length];
      return {
        abbr: c.abbr,
        name: c.name,
        ax: slot[0],
        ay: slot[1],
        scale: 0.1 + ((i * 37) % 5) * 0.012,
        lines: c.chart.lines,
        stars: c.chart.stars,
        bbox: chartBBox(c.chart.lines, c.chart.stars),
        phase: (i * 1.7) % (Math.PI * 2),
      };
    });

    function build() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = w < 640 ? 11000 : 6500;
      const count = Math.min(700, Math.floor((w * h) / density));
      stars = Array.from({ length: count }, () => {
        const layer = Math.floor(Math.random() * 3);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          layer,
          r: 0.3 + layer * 0.35 + Math.random() * 0.6,
          base: 0.25 + layer * 0.2 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.9,
        };
      });

      clouds = Array.from({ length: w < 640 ? 3 : 5 }, (_, i) => {
        const cx = Math.random() * w;
        const cy = Math.random() * h;
        const orbit = 60 + Math.random() * 140;
        const angle = Math.random() * Math.PI * 2;
        return {
          cx,
          cy,
          orbit,
          angle,
          spin: (Math.random() < 0.5 ? -1 : 1) * (0.00002 + Math.random() * 0.00004),
          x: cx + Math.cos(angle) * orbit,
          y: cy + Math.sin(angle) * orbit,
          r: 180 + Math.random() * 260,
          hue: ["139,92,246", "56,189,248", "34,211,238", "99,102,241", "168,85,247"][i % 5],
          drift: 0.004 + Math.random() * 0.01,
        };
      });
    }

    function drawConstellations(t: number, highlight: string | null) {
      for (const c of placed) {
        const active = highlight != null && c.abbr === highlight;
        const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.00013 + c.phase);
        const alpha = active ? 0.85 : 0.06 + pulse * 0.14;
        if (alpha < 0.03) continue;

        const span = Math.min(w, h) * (c.scale * 6);
        const k = span / Math.max(c.bbox.w, c.bbox.h);
        const drift = reduced ? 0 : Math.sin(t * 0.00004 + c.phase) * 10;
        const ox = c.ax * w - (c.bbox.w * k) / 2 + drift;
        const oy = c.ay * h - (c.bbox.h * k) / 2 + drift * 0.4;
        const px = (x: number) => ox + (x - c.bbox.x0) * k;
        const py = (y: number) => oy + (c.bbox.h - (y - c.bbox.y0)) * k;

        ctx!.save();
        ctx!.lineWidth = active ? 1.2 : 0.7;
        ctx!.strokeStyle = active
          ? `rgba(103, 232, 249, ${alpha})`
          : `rgba(148, 178, 255, ${alpha})`;
        if (active) {
          ctx!.shadowColor = "rgba(34,211,238,0.6)";
          ctx!.shadowBlur = 10;
        }
        for (const seg of c.lines) {
          ctx!.beginPath();
          seg.forEach(([x, y], i) => {
            const sx = px(x);
            const sy = py(y);
            if (i === 0) ctx!.moveTo(sx, sy);
            else ctx!.lineTo(sx, sy);
          });
          ctx!.stroke();
        }
        for (const [x, y, mag = 4] of c.stars) {
          const r = Math.max(0.6, (6.5 - Math.min(mag, 6)) * (active ? 0.55 : 0.34));
          ctx!.beginPath();
          ctx!.arc(px(x), py(y), r, 0, Math.PI * 2);
          ctx!.fillStyle = active
            ? `rgba(224, 252, 255, ${Math.min(1, alpha + 0.15)})`
            : `rgba(226, 232, 255, ${alpha + 0.1})`;
          ctx!.fill();
        }
        ctx!.shadowBlur = 0;
        ctx!.font = `${active ? 600 : 400} ${active ? 12 : 10}px ui-monospace, monospace`;
        ctx!.fillStyle = active
          ? `rgba(165, 243, 252, 0.95)`
          : `rgba(148, 178, 255, ${alpha + 0.05})`;
        ctx!.fillText(
          active ? c.name.toUpperCase() : c.name,
          px(c.bbox.x0) - 2,
          py(c.bbox.y0) + 16,
        );
        ctx!.restore();
      }
    }

    function frame(t: number) {
      const s = getSimSettings();
      ctx!.clearRect(0, 0, w, h);

      // nebula clouds
      if (s.starfield) {
        for (const c of clouds) {
          if (!reduced) {
            // slow cinematic sweep: lateral drift plus a wide rotation
            c.angle += c.spin * 16;
            c.cx += c.drift;
            if (c.cx - c.r - c.orbit > w) c.cx = -c.r - c.orbit;
            c.x = c.cx + Math.cos(c.angle) * c.orbit;
            c.y = c.cy + Math.sin(c.angle) * c.orbit * 0.6;
          }
          const g = ctx!.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
          g.addColorStop(0, `rgba(${c.hue},0.055)`);
          g.addColorStop(1, `rgba(${c.hue},0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (s.constellations) drawConstellations(t, s.highlight);

      // stars
      if (s.starfield) {
        for (const st of stars) {
          const tw = reduced ? 1 : 0.75 + 0.25 * Math.sin(t * 0.001 * st.speed + st.phase);
          ctx!.beginPath();
          ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(214, 230, 255, ${st.base * tw})`;
          ctx!.fill();
          if (!reduced) {
            st.y += (0.02 + st.layer * 0.03) * 0.9;
            st.x += 0.008 * (st.layer + 1);
            if (st.y > h) {
              st.y = -2;
              st.x = Math.random() * w;
            }
            if (st.x > w) st.x = 0;
          }
        }

        // shooting stars
        if (!reduced) {
          if (shooters.length < 2 && Math.random() < 0.0016) {
            shooters.push({
              x: Math.random() * w * 0.7,
              y: Math.random() * h * 0.4,
              vx: 5 + Math.random() * 4,
              vy: 1.6 + Math.random() * 1.6,
              life: 1,
            });
          }
          shooters = shooters.filter((sh) => sh.life > 0);
          for (const sh of shooters) {
            const g = ctx!.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 14, sh.y - sh.vy * 14);
            g.addColorStop(0, `rgba(255,255,255,${0.75 * sh.life})`);
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx!.strokeStyle = g;
            ctx!.lineWidth = 1.4;
            ctx!.beginPath();
            ctx!.moveTo(sh.x, sh.y);
            ctx!.lineTo(sh.x - sh.vx * 14, sh.y - sh.vy * 14);
            ctx!.stroke();
            sh.x += sh.vx;
            sh.y += sh.vy;
            sh.life -= 0.012;
          }
        }
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function onResize() {
      build();
      if (reduced) frame(0);
    }

    build();
    if (reduced) frame(0);
    else raf = requestAnimationFrame(frame);

    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(ellipse_at_85%_10%,rgba(139,92,246,0.12),transparent_50%)]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
