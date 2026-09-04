import { useEffect, useRef, useState } from 'react';
import type { KnownTarget, PlanetVisualType } from '@/types';
import { prefersReducedMotion } from '@/lib/simSettings';

// ─────────────────────────────────────────────────────────────────────────────
// 3D ORBITAL SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
// CSS-3D scene showing a planet orbiting its host star: orbit path, orbital
// trail, direction marker, labels and a rotating host star. The camera can be
// dragged (azimuth + tilt) and zoomed; playback, speed, trail and labels are
// controlled from the simulation control panel.
//
// The geometry is visually exaggerated so both bodies stay readable — the UI
// always states SIMULATION — NOT TO SCALE.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  target: KnownTarget;
  playing?: boolean;
  speed?: number;
  showTrail?: boolean;
  showLabels?: boolean;
  /** change this value to snap the camera back to its default framing */
  resetToken?: number;
  height?: number;
}

const DEFAULT_TILT = 62;
const DEFAULT_ZOOM = 1.15;

export default function OrbitalAnimation({
  target,
  playing = true,
  speed = 1,
  showTrail = true,
  showLabels = true,
  resetToken = 0,
  height = 400,
}: Props) {
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(DEFAULT_TILT);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const reduced = mounted && prefersReducedMotion();

  useEffect(() => setMounted(true), []);

  // Reset camera when the control panel asks for it, and whenever the
  // observed object changes.
  useEffect(() => {
    setTilt(DEFAULT_TILT);
    setZoom(DEFAULT_ZOOM);
  }, [resetToken, target.knownPlanet]);

  // Fresh object → restart the orbit from a known phase (no leftover loop).
  useEffect(() => {
    setAngle(0);
    lastTimeRef.current = 0;
  }, [target.knownPlanet]);

  // Orbit speed: 1-day period ≈ 3 s, 300-day period ≈ 15 s (log-compressed).
  const orbitSeconds = Math.max(2.5, Math.min(15, 2 + Math.log10(target.knownPeriod + 1) * 4));
  const effectiveSeconds = orbitSeconds / Math.max(0.05, speed);
  const degreesPerMs = 360 / (effectiveSeconds * 1000);

  const starSize = 110;
  const planetSize = Math.max(14, Math.min(70, 14 + Math.log10(target.knownRadius + 1) * 24));
  const orbitRadius = 185;
  const starColor = getStarColor(target.stellarTemp);

  useEffect(() => {
    if (!playing || reduced) {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
      return;
    }
    function animate(now: number) {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min(64, now - lastTimeRef.current);
      lastTimeRef.current = now;
      setAngle((a) => (a + degreesPerMs * dt) % 360);
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [playing, degreesPerMs, reduced]);

  const tiltRad = (tilt * Math.PI) / 180;
  const project = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    const x3d = Math.cos(rad) * orbitRadius;
    const z3d = Math.sin(rad) * orbitRadius;
    return {
      x: x3d * zoom,
      y: z3d * Math.cos(tiltRad) * zoom,
      depth: z3d * Math.sin(tiltRad),
    };
  };

  const pos = project(angle);
  const planetScale = zoom * (1 + (1 - Math.abs(pos.depth) / orbitRadius) * 0.15);
  const isBehind = pos.depth > 0;
  const inTransit = !isBehind && Math.abs(pos.x) < (starSize * zoom) / 2;

  const trail = showTrail
    ? Array.from({ length: 18 }, (_, i) => {
        const p = project(angle - (i + 1) * 3.2);
        return { ...p, opacity: 0.35 * (1 - i / 18) };
      })
    : [];

  // ── camera drag ────────────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setTilt((t) => Math.max(8, Math.min(88, t + dy * 0.3)));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="relative w-full select-none">
      <div
        className="relative mx-auto max-w-full cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={(e) => setZoom((z) => Math.max(0.6, Math.min(1.9, z - e.deltaY * 0.0008)))}
        style={{ width: 520, height, perspective: 1000, perspectiveOrigin: '50% 50%' }}
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          <OrbitRing radius={orbitRadius} tilt={tiltRad} zoom={zoom} />

          {/* Orbital trail */}
          {mounted &&
            trail.map((t, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  left: 'calc(50% - 2px)',
                  top: 'calc(50% - 2px)',
                  transform: `translate(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px)`,
                  background: target.planetColor,
                  opacity: Number((t.depth > 0 ? t.opacity * 0.45 : t.opacity).toFixed(3)),
                  zIndex: t.depth > 0 ? 4 : 19,
                }}
              />
            ))}

          {/* Host star */}
          <div
            className="absolute rounded-full"
            style={{
              width: starSize * zoom,
              height: starSize * zoom,
              left: `calc(50% - ${(starSize * zoom) / 2}px)`,
              top: `calc(50% - ${(starSize * zoom) / 2}px)`,
              background: `radial-gradient(circle at 35% 35%, ${starColor.bright}, ${starColor.mid} 60%, ${starColor.dark} 100%)`,
              boxShadow: `0 0 60px 20px ${starColor.glow}, 0 0 100px 40px ${starColor.glowFade}`,
              zIndex: 10,
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: `radial-gradient(circle at 60% 70%, ${starColor.dark}20, transparent 40%), radial-gradient(circle at 20% 50%, ${starColor.dark}20, transparent 30%)`,
                animation: reduced ? undefined : 'spin 40s linear infinite',
              }}
            />
            <div
              className={`absolute inset-0 rounded-full ${reduced ? '' : 'animate-pulse'}`}
              style={{ boxShadow: `0 0 30px 8px ${starColor.glow}`, animationDuration: '3s' }}
            />
          </div>

          {/* Planet */}
          <div
            className="absolute rounded-full"
            style={{
              width: planetSize * planetScale,
              height: planetSize * planetScale,
              left: `calc(50% - ${(planetSize * planetScale) / 2}px)`,
              top: `calc(50% - ${(planetSize * planetScale) / 2}px)`,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              zIndex: isBehind ? 5 : 20,
              opacity: isBehind ? 0.5 : 1,
            }}
          >
            <PlanetSurface
              type={target.planetType}
              color1={target.planetColor}
              color2={target.planetColor2}
              size={planetSize * planetScale}
            />
          </div>

          {showLabels && (
            <>
              <div
                className="absolute text-center"
                style={{
                  left: '50%',
                  top: `calc(50% + ${(starSize * zoom) / 2 + 12}px)`,
                  transform: 'translateX(-50%)',
                  zIndex: 25,
                }}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  ★ {target.name}
                </span>
              </div>
              <div
                className="absolute whitespace-nowrap"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y - planetSize * planetScale * 0.8 - 10}px))`,
                  zIndex: 26,
                }}
              >
                <span className="font-mono text-[10px] text-violet-300">{target.knownPlanet}</span>
              </div>
            </>
          )}
        </div>

        {/* Overlays */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1">
          <span className="rounded border border-slate-700/70 bg-slate-950/70 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            Simulation — not to scale
          </span>
          {inTransit && (
            <span className="rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-300">
              Transit in progress · starlight dips
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
          Prograde ↻ · drag to tilt · scroll to zoom
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-500">
        One full orbit ={' '}
        {target.knownPeriod < 1
          ? `${(target.knownPeriod * 24).toFixed(1)} hours`
          : `${target.knownPeriod.toFixed(2)} days`}{' '}
        in reality · {effectiveSeconds.toFixed(1)} s here at {speed}×
      </p>
    </div>
  );
}

// ── Orbit ring (the visible path) ────────────────────────────────────────────
function OrbitRing({ radius, tilt, zoom }: { radius: number; tilt: number; zoom: number }) {
  return (
    <div
      className="absolute rounded-full border"
      style={{
        width: radius * 2 * zoom,
        height: radius * 2 * zoom,
        left: `calc(50% - ${radius * zoom}px)`,
        top: `calc(50% - ${radius * zoom}px)`,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        transform: `rotateX(${(tilt * 180) / Math.PI}deg)`,
        transformStyle: 'preserve-3d',
      }}
    />
  );
}


// ── Planet surface renderer ──────────────────────────────────────────────────
function PlanetSurface({
  type,
  color1,
  color2,
  size,
}: {
  type: PlanetVisualType;
  color1: string;
  color2: string;
  size: number;
}) {
  const baseGradient = `radial-gradient(circle at 30% 30%, ${color1}, ${color2} 80%)`;
  const glowColor = type === 'lava' ? color1 : type === 'gas-stripped' ? color1 : 'transparent';

  return (
    <div
      className="w-full h-full rounded-full relative overflow-hidden"
      style={{
        background: baseGradient,
        boxShadow: type === 'lava' ? `0 0 12px 3px ${glowColor}80` : type === 'gas-stripped' ? `0 0 8px 2px ${glowColor}60` : 'none',
      }}
    >
      {/* Surface texture overlays by type */}
      {type === 'lava' && (
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color1}40 0%, transparent 30%), radial-gradient(circle at 70% 40%, ${color1}60 0%, transparent 20%)`,
          }}
        />
      )}
      {type === 'gas-orange' && (
        <div className="absolute inset-0 rounded-full opacity-40"
          style={{
            background: `repeating-linear-gradient(0deg, ${color2}30 0px, transparent 4px, ${color1}20 8px, transparent 12px)`,
          }}
        />
      )}
      {type === 'gas-blue' && (
        <div className="absolute inset-0 rounded-full opacity-40"
          style={{
            background: `repeating-linear-gradient(0deg, ${color2}30 0px, transparent 5px, ${color1}20 10px, transparent 15px)`,
          }}
        />
      )}
      {type === 'gas-stripped' && (
        <div className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(ellipse at 80% 50%, ${color1}00 30%, ${color1}60 100%)`,
          }}
        />
      )}
      {type === 'rocky' && (
        <div className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at 40% 60%, ${color2}50 0%, transparent 25%), radial-gradient(circle at 65% 30%, ${color2}40 0%, transparent 20%)`,
          }}
        />
      )}
      {type === 'desert' && (
        <div className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color2}40 0%, transparent 40%)`,
          }}
        />
      )}
      {type === 'mini-ice' && (
        <div className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color1}60 0%, transparent 40%), repeating-linear-gradient(0deg, ${color2}30 0px, transparent 6px)`,
          }}
        />
      )}
      {/* Shadow (night side) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}

// ── Star color from temperature ──────────────────────────────────────────────
function getStarColor(temp?: number): { bright: string; mid: string; dark: string; glow: string; glowFade: string } {
  if (!temp) temp = 5800;
  if (temp < 3700) {
    return { bright: '#ff8866', mid: '#cc4422', dark: '#882211', glow: 'rgba(255,100,50,0.4)', glowFade: 'rgba(255,80,40,0.1)' };
  }
  if (temp < 5200) {
    return { bright: '#ffdd88', mid: '#ffaa44', dark: '#cc7722', glow: 'rgba(255,180,80,0.4)', glowFade: 'rgba(255,160,60,0.1)' };
  }
  if (temp < 6000) {
    return { bright: '#fff5dd', mid: '#ffdd99', dark: '#ccaa55', glow: 'rgba(255,220,150,0.35)', glowFade: 'rgba(255,200,120,0.1)' };
  }
  return { bright: '#ffffff', mid: '#ddeeff', dark: '#88aacc', glow: 'rgba(200,220,255,0.4)', glowFade: 'rgba(180,200,255,0.1)' };
}
