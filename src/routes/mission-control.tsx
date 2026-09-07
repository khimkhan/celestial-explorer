import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { catalogQueryOptions } from "@/lib/catalogQuery";
import { toTarget, classifyPlanet } from "@/lib/catalogQuery";
import { CONSTELLATION_BY_ABBR } from "@/lib/constellations";
import { setSimSettings } from "@/lib/simSettings";
import { useSimSettings } from "@/lib/simSettings";
import SiteHeader from "@/components/SiteHeader";
import LiveObservation from "@/components/LiveObservation";
import OrbitalAnimation from "@/components/OrbitalAnimation";
import SimulationControls from "@/components/SimulationControls";
import { Radar, Sparkles } from "lucide-react";

export const Route = createFileRoute("/mission-control")({
  head: () => ({
    meta: [
      { title: "Mission Control · Live Transit Observation | BR" },
      {
        name: "description",
        content:
          "Run a live simulated transit observation: synchronized 3D orbit, synthetic light curve, detection metrics and an observing event log.",
      },
      { property: "og:title", content: "Mission Control · Live Transit Observation | BR" },
      {
        property: "og:description",
        content:
          "Watch a planet cross its star while the light curve dips at the same moment, then follow the educational detection analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions()),
  component: MissionControl,
});

const GLASS = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md";

function MissionControl() {
  const { data: planets } = useSuspenseQuery(catalogQueryOptions());
  const [slug, setSlug] = useState(
    () => planets.find((p) => p.plName.startsWith("TRAPPIST-1"))?.slug ?? planets[0]?.slug ?? "",
  );
  const planet = planets.find((p) => p.slug === slug) ?? planets[0];
  const sim = useSimSettings();
  const [cameraToken, setCameraToken] = useState(0);
  const target = useMemo(() => (planet ? toTarget(planet) : null), [planet]);
  const constellation = planet ? CONSTELLATION_BY_ABBR.get(planet.constellation) : undefined;

  if (!planet || !target) return null;

  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />

        <header className={`${GLASS} mb-5 p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                <Radar className="h-4 w-4" />
                BR-Exoplanet Observatory
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Mission Control</h1>
              <p className="mt-1 text-sm text-slate-400">
                One simulated clock drives the orbit and the photometry, so every brightness dip
                lines up with a real crossing of the stellar disc.
              </p>
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                Observation target
              </span>
              <select
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 font-mono text-xs text-white outline-none focus:border-cyan-500/60"
              >
                {planets.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.plName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Cell label="System status" value="● Online" tone="text-emerald-300" />
            <Cell label="Host star" value={planet.hostName} />
            <Cell label="Method" value="Transit photometry" />
            <Cell label="Archive period" value={`${planet.periodDays.toFixed(3)} d`} />
            <Cell label="Planet type" value={classifyPlanet(planet.radiusEarth)} />
            <Cell label="Constellation" value={constellation?.name ?? planet.constellation} />
          </dl>
        </header>

        <section className={`${GLASS} mb-5 p-5`}>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Live observation</h2>
          <LiveObservation planet={planet} height={240} />
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${GLASS} overflow-hidden border-violet-500/20`}>
            <div className="border-b border-slate-800 px-5 py-3 text-sm font-semibold">
              3D orbital system
            </div>
            <div className="flex justify-center p-3">
              <OrbitalAnimation
                key={planet.slug}
                target={target}
                playing={sim.playing}
                speed={sim.speed}
                showTrail={sim.trail}
                showLabels={sim.labels}
                resetToken={cameraToken}
                height={360}
              />
            </div>
          </section>

          <div className="space-y-5">
            <SimulationControls
              onResetCamera={() => setCameraToken((t) => t + 1)}
              onResetSimulation={() => setSimSettings({ speed: 1, playing: true })}
            />
            <section className={`${GLASS} p-5`}>
              <h2 className="text-sm font-semibold">Target location</h2>
              <p className="mt-1 text-sm text-slate-400">
                {planet.hostName} sits in {constellation?.name ?? planet.constellation}
                {planet.distanceLy ? `, about ${planet.distanceLy} light-years away` : ""}.
              </p>
              <Link
                to="/constellations"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cyan-200 transition-colors hover:bg-cyan-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Find it in the 3D star map
              </Link>
            </section>
            <section className={`${GLASS} p-5`}>
              <h2 className="text-sm font-semibold">Data provenance</h2>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-slate-400">
                <li>✓ NASA Exoplanet Archive — planet and star metadata</li>
                <li>✓ Synthetic photometry — educational simulation</li>
                <li>✓ Detection algorithm — BR-Exoplanet educational model</li>
                <li>✓ NASA confirmation — existing archive confirmation</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <dt className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`truncate font-mono text-xs ${tone}`}>{value}</dd>
    </div>
  );
}
