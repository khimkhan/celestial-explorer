import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouterState } from "@tanstack/react-router";
import SpaceEnvironment from "./space/SpaceEnvironment";

/**
 * Persistent, non-interactive 3D space backdrop rendered behind the whole site.
 * Client-only: WebGL must never run during SSR.
 */
export default function SpaceCanvas() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The constellation gallery renders its own full-screen scene, so the
  // backdrop pauses there instead of paying for a second WebGL context.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = mounted && !pathname.startsWith("/constellations");

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-[#04060d]"
      style={{ contain: "strict" }}
    >
      {active ? (
        <Canvas
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 0.1], fov: 62, near: 0.1, far: 2000 }}
        >
          <color attach="background" args={["#04060d"]} />
          <fog attach="fog" args={["#04060d", 900, 2000]} />
          <Suspense fallback={null}>
            <SpaceEnvironment drift={0.006} />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
