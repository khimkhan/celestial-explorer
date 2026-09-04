import { useEffect, useRef, useState } from 'react';
import type { KnownTarget, PlanetVisualType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// LIVE MINI ORBIT — animated rotating planet for flash cards
// ─────────────────────────────────────────────────────────────────────────────
// A lightweight CSS-3D mini orbit that runs continuously on every card.
// Uses requestAnimationFrame to move the planet around the star with
// proper depth (behind/front) so it looks like a real 3D orbit.
// Each card gets a different starting angle so they don't all sync.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  target: KnownTarget;
  size?: number;
}

export default function LiveMiniOrbit({ target, size = 140 }: Props) {
  const [angle, setAngle] = useState(() => {
    // Random starting angle per target name for visual variety
    let h = 0;
    for (let i = 0; i < target.name.length; i++) h = (h * 31 + target.name.charCodeAt(i)) % 360;
    return h;
  });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  // Orbit speed based on period (shorter = faster, but clamped for visibility)
  const seconds = Math.max(3, Math.min(8, 2 + Math.log10(target.knownPeriod + 1) * 3));
  const degPerMs = 360 / (seconds * 1000);

  const starColor = getStarColor(target.stellarTemp);
  const planetSize = Math.max(10, Math.min(26, 7 + Math.log10(target.knownRadius + 1) * 10));
  const orbitR = size * 0.32;

  useEffect(() => {
    function tick(now: number) {
      if (!lastRef.current) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      setAngle((a) => (a + degPerMs * dt) % 360);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [degPerMs]);

  const rad = (angle * Math.PI) / 180;
  const tiltRad = (62 * Math.PI) / 180;
  const x = Math.cos(rad) * orbitR;
  const z = Math.sin(rad) * orbitR;
  const screenY = z * Math.sin(tiltRad);
  const depth = z * Math.cos(tiltRad);
  const isBehind = depth > 0;

  return (
    <div
      className="relative"
      style={{ width: size, height: size, perspective: 400 }}
    >
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {/* Orbit ring */}
        <div
          className="absolute rounded-full border"
          style={{
            width: orbitR * 2,
            height: orbitR * 2,
            left: `calc(50% - ${orbitR}px)`,
            top: `calc(50% - ${orbitR}px)`,
            borderColor: 'rgba(255,255,255,0.08)',
            borderStyle: 'dashed',
            transform: `rotateX(62deg)`,
          }}
        />

        {/* Star */}
        <div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            left: 'calc(50% - 12px)',
            top: 'calc(50% - 12px)',
            background: `radial-gradient(circle at 35% 35%, ${starColor.bright}, ${starColor.mid} 60%, ${starColor.dark})`,
            boxShadow: `0 0 16px 4px ${starColor.glow}`,
            zIndex: 10,
          }}
        >
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ boxShadow: `0 0 10px 3px ${starColor.glow}`, animationDuration: '3s' }}
          />
        </div>

        {/* Planet */}
        <div
          className="absolute rounded-full transition-opacity"
          style={{
            width: planetSize,
            height: planetSize,
            left: `calc(50% - ${planetSize / 2}px)`,
            top: `calc(50% - ${planetSize / 2}px)`,
            transform: `translate(${x}px, ${screenY}px)`,
            zIndex: isBehind ? 5 : 20,
            opacity: isBehind ? 0.45 : 1,
            background: `radial-gradient(circle at 30% 30%, ${target.planetColor}, ${target.planetColor2} 80%)`,
            boxShadow: target.planetType === 'lava' ? `0 0 8px 2px ${target.planetColor}80` : 'none',
          }}
        >
          {/* Type-specific texture */}
          {(target.planetType === 'gas-orange' || target.planetType === 'gas-blue') && (
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background: `repeating-linear-gradient(0deg, ${target.planetColor2}30 0px, transparent 3px, ${target.planetColor}20 6px, transparent 9px)`,
              }}
            />
          )}
          {target.planetType === 'lava' && (
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{ background: `radial-gradient(circle at 50% 50%, ${target.planetColor}50 0%, transparent 30%)` }}
            />
          )}
          {target.planetType === 'gas-stripped' && (
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(ellipse at 80% 50%, transparent 30%, ${target.planetColor}60 100%)` }}
            />
          )}
          {/* Night-side shadow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
          />
        </div>
      </div>
    </div>
  );
}

function getStarColor(temp?: number): { bright: string; mid: string; dark: string; glow: string } {
  if (!temp) temp = 5800;
  if (temp < 3700) return { bright: '#ff8866', mid: '#cc4422', dark: '#882211', glow: 'rgba(255,100,50,0.4)' };
  if (temp < 5200) return { bright: '#ffdd88', mid: '#ffaa44', dark: '#cc7722', glow: 'rgba(255,180,80,0.4)' };
  if (temp < 6000) return { bright: '#fff5dd', mid: '#ffdd99', dark: '#ccaa55', glow: 'rgba(255,220,150,0.35)' };
  return { bright: '#ffffff', mid: '#ddeeff', dark: '#88aacc', glow: 'rgba(200,220,255,0.4)' };
}

// Re-export for convenience
export type { PlanetVisualType };
