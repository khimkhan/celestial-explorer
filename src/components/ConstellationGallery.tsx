import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SpaceEnvironment from "./space/SpaceEnvironment";
import { makeStarSprite } from "./space/spaceTextures";
import { CONSTELLATIONS, type Constellation } from "@/lib/constellations";

/** Radius of the celestial shell the constellations are painted on. */
const SHELL = 260;

function toVec(raDeg: number, decDeg: number, r = SHELL): THREE.Vector3 {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(dec) * Math.cos(ra),
    r * Math.sin(dec),
    -r * Math.cos(dec) * Math.sin(ra),
  );
}

interface FigureProps {
  constellation: Constellation;
  active: boolean;
  dimmed: boolean;
  onSelect: (abbr: string) => void;
  onHover: (abbr: string | null) => void;
}

function ConstellationFigure({ constellation, active, dimmed, onSelect, onHover }: FigureProps) {
  const sprite = useMemo(() => makeStarSprite(), []);

  const { segments, starGeometry, centroid } = useMemo(() => {
    const segs = constellation.chart.lines.map((seg) =>
      seg.map(([ra, dec]) => toVec(ra!, dec!).toArray() as [number, number, number]),
    );

    const stars = constellation.chart.stars;
    const pos = new Float32Array(stars.length * 3);
    const size = new Float32Array(stars.length);
    const centre = new THREE.Vector3();
    stars.forEach(([ra, dec, mag], i) => {
      const v = toVec(ra!, dec!);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
      size[i] = Math.max(2, 9 - mag! * 1.4);
      centre.add(v);
    });
    if (stars.length) centre.divideScalar(stars.length).setLength(SHELL * 0.98);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    return { segments: segs, starGeometry: g, centroid: centre };
  }, [constellation]);

  const lineColor = active ? "#7dd3fc" : "#38bdf8";
  const lineOpacity = active ? 0.95 : dimmed ? 0.16 : 0.42;

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(constellation.abbr);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(constellation.abbr);
      }}
    >
      {segments.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={lineColor}
          lineWidth={active ? 2.1 : 1.1}
          transparent
          opacity={lineOpacity}
          depthWrite={false}
        />
      ))}

      <points geometry={starGeometry} frustumCulled={false}>
        <pointsMaterial
          size={active ? 9 : 6}
          sizeAttenuation={false}
          map={sprite}
          color={active ? "#ffffff" : "#dbeafe"}
          transparent
          opacity={dimmed ? 0.35 : 1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <Html
        position={centroid}
        center
        distanceFactor={420}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", opacity: dimmed ? 0.35 : 1 }}
      >
        <div
          className={`whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[13px] uppercase tracking-[0.25em] backdrop-blur-sm transition-colors ${
            active
              ? "border-cyan-300/70 bg-cyan-400/10 text-cyan-100"
              : "border-slate-500/30 bg-slate-950/40 text-slate-300"
          }`}
        >
          {constellation.name}
        </div>
      </Html>
    </group>
  );
}

/** Telescope-style scroll zoom: smoothly narrows the camera field of view. */
function FovZoom({ targetFov }: { targetFov: React.RefObject<number> }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const k = 1 - Math.exp(-8 * delta);
    const next = cam.fov + (targetFov.current - cam.fov) * k;
    if (Math.abs(next - cam.fov) > 0.001) {
      cam.fov = next;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

function WheelBinding({ targetFov }: { targetFov: React.RefObject<number> }) {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = targetFov.current * Math.exp(dy * 0.0012);
      targetFov.current = Math.min(75, Math.max(9, next));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, targetFov]);

  return null;
}

/** Flies the camera so a chosen constellation sits centre-frame. */
function CameraFocus({
  focus,
  targetFov,
}: {
  focus: THREE.Vector3 | null;
  targetFov: React.RefObject<number>;
}) {
  const { camera } = useThree();
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (focus) {
      goal.current = focus.clone().setLength(40);
      targetFov.current = 26;
    }
  }, [focus, targetFov]);

  useFrame((_, delta) => {
    if (!goal.current) return;
    const k = 1 - Math.exp(-3 * delta);
    camera.position.lerp(goal.current, k);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(goal.current) < 0.4) goal.current = null;
  });

  return null;
}

/**
 * Planetarium-style 3D constellation gallery. Every constellation is plotted
 * into the same space environment used site-wide; drag to look around,
 * scroll to zoom.
 */
export default function ConstellationGallery() {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const targetFov = useRef(58);

  useEffect(() => setMounted(true), []);

  const active = hovered ?? selected;
  const selectedConstellation = CONSTELLATIONS.find((c) => c.abbr === selected) ?? null;

  const focus = useMemo(() => {
    if (!selectedConstellation) return null;
    const centre = new THREE.Vector3();
    selectedConstellation.chart.stars.forEach(([ra, dec]) => centre.add(toVec(ra!, dec!)));
    if (selectedConstellation.chart.stars.length)
      centre.divideScalar(selectedConstellation.chart.stars.length);
    return centre;
  }, [selectedConstellation]);

  return (
    <div className="fixed inset-0">
      {mounted ? (
        <Canvas
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
          camera={{ position: [0, 12, 60], fov: 58, near: 0.1, far: 2000 }}
        >
          <color attach="background" args={["#04060d"]} />
          <Suspense fallback={null}>
            <SpaceEnvironment drift={0.004} />
            <group>
              {CONSTELLATIONS.map((c) => (
                <ConstellationFigure
                  key={c.abbr}
                  constellation={c}
                  active={active === c.abbr}
                  dimmed={Boolean(active) && active !== c.abbr}
                  onSelect={(abbr) => setSelected((prev) => (prev === abbr ? null : abbr))}
                  onHover={setHovered}
                />
              ))}
            </group>
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={-0.35}
            target={[0, 0, 0]}
          />
          <FovZoom targetFov={targetFov} />
          <WheelBinding targetFov={targetFov} />
          <CameraFocus focus={focus} targetFov={targetFov} />
        </Canvas>
      ) : null}

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-slate-600/40 bg-slate-950/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400 backdrop-blur">
        Drag to look around · Scroll to zoom · Click a constellation
      </div>

      {selectedConstellation ? (
        <aside className="absolute right-4 top-24 z-20 max-h-[70vh] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-cyan-400/25 bg-slate-950/80 p-5 text-white shadow-[0_8px_60px_-12px_rgba(56,189,248,0.4)] backdrop-blur-md">
          <button
            onClick={() => setSelected(null)}
            className="float-right font-mono text-xs text-slate-400 transition-colors hover:text-cyan-300"
          >
            close
          </button>
          <h2 className="text-lg font-semibold tracking-tight">{selectedConstellation.name}</h2>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">
            {selectedConstellation.abbr} · {selectedConstellation.meaning}
          </p>
          <dl className="mb-3 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Brightest star</dt>
              <dd className="text-right">{selectedConstellation.brightestStar}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Hemisphere</dt>
              <dd>{selectedConstellation.hemisphere}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Best seen</dt>
              <dd>{selectedConstellation.bestSeen}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-slate-400">
            {selectedConstellation.mythology}
          </p>
        </aside>
      ) : null}
    </div>
  );
}
