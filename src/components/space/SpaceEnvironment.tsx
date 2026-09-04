import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGasGiantTexture, makeHazeTexture, makeStarSprite } from "./spaceTextures";

/** Deterministic pseudo-random so the sky is stable between renders. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function gauss(rnd: () => number) {
  return (rnd() + rnd() + rnd() + rnd() - 2) / 2;
}

/** Tilt of the galactic band relative to the scene. */
const BAND_TILT = new THREE.Euler(0.42, 0.2, -0.55);

interface StarfieldProps {
  count?: number;
  radius?: number;
}

/** Dense all-sky field of faint stars. */
function Starfield({ count = 6000, radius = 420 }: StarfieldProps) {
  const sprite = useMemo(() => makeStarSprite(), []);
  const geometry = useMemo(() => {
    const rnd = makeRng(1337);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const phi = rnd() * Math.PI * 2;
      const r = radius * (0.75 + rnd() * 0.25);
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(phi);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(phi);
      const t = rnd();
      // mostly cold white, a few warm giants
      c.setHSL(t > 0.9 ? 0.08 : 0.58 - t * 0.06, t > 0.9 ? 0.5 : 0.25, 0.55 + rnd() * 0.4);
      const dim = 0.35 + Math.pow(rnd(), 2.2) * 0.65;
      col[i * 3] = c.r * dim;
      col[i * 3 + 1] = c.g * dim;
      col[i * 3 + 2] = c.b * dim;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count, radius]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={2.6}
        sizeAttenuation
        map={sprite}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Bright galactic band: concentrated stars plus layered haze billboards. */
function MilkyWay({ radius = 400 }: { radius?: number }) {
  const sprite = useMemo(() => makeStarSprite(), []);
  const haze = useMemo(() => makeHazeTexture(), []);

  const geometry = useMemo(() => {
    const count = 14000;
    const rnd = makeRng(90210);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const theta = rnd() * Math.PI * 2;
      // tight scatter around the galactic plane, with dust-lane clumping
      const lat = gauss(rnd) * 0.16 + (rnd() > 0.85 ? gauss(rnd) * 0.4 : 0);
      const r = radius * (0.7 + rnd() * 0.3);
      const cl = Math.cos(lat);
      pos[i * 3] = r * cl * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(lat);
      pos[i * 3 + 2] = r * cl * Math.sin(theta);
      const warm = rnd();
      c.setHSL(warm > 0.7 ? 0.09 : 0.6, 0.35, 0.6 + rnd() * 0.4);
      const dim = 0.3 + Math.pow(rnd(), 1.8) * 0.7;
      col[i * 3] = c.r * dim;
      col[i * 3 + 1] = c.g * dim;
      col[i * 3 + 2] = c.b * dim;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [radius]);

  const hazePatches = useMemo(() => {
    const rnd = makeRng(4242);
    return Array.from({ length: 26 }, () => {
      const theta = rnd() * Math.PI * 2;
      const lat = gauss(rnd) * 0.12;
      const r = radius * 0.92;
      const cl = Math.cos(lat);
      return {
        position: [r * cl * Math.cos(theta), r * Math.sin(lat), r * cl * Math.sin(theta)] as const,
        scale: 120 + rnd() * 220,
        opacity: 0.12 + rnd() * 0.2,
        warm: rnd() > 0.65,
      };
    });
  }, [radius]);

  return (
    <group rotation={BAND_TILT}>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial
          size={2.1}
          sizeAttenuation
          map={sprite}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {hazePatches.map((p, i) => (
        <sprite key={i} position={p.position as unknown as THREE.Vector3Tuple} scale={[p.scale, p.scale * 0.55, 1]}>
          <spriteMaterial
            map={haze}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            color={p.warm ? "#f2d9bd" : "#bcd0ff"}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}

/** Large, dark, slowly rotating gas giant sitting deep in the background. */
function GasGiant({ position = [-190, -60, -260] as THREE.Vector3Tuple, radius = 95 }) {
  const ref = useRef<THREE.Mesh>(null);
  const map = useMemo(() => makeGasGiantTexture(), []);
  const haze = useMemo(() => makeHazeTexture(), []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });

  return (
    <group position={position}>
      {/* atmospheric rim glow */}
      <sprite scale={[radius * 2.9, radius * 2.9, 1]}>
        <spriteMaterial
          map={haze}
          transparent
          opacity={0.28}
          color="#7f9bd6"
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh ref={ref} rotation={[0.18, 0, 0.12]}>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/**
 * Shared cinematic space environment: dense starfield, glowing Milky Way band
 * and a dark gas giant, all under a continuous slow orbital drift.
 */
export default function SpaceEnvironment({ drift = 0.006 }: { drift?: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * drift;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.02;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.18} />
      <directionalLight position={[220, 120, 180]} intensity={1.1} color="#cfe0ff" />
      <Starfield />
      <MilkyWay />
      <GasGiant />
    </group>
  );
}
