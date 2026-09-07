import { createFileRoute, Link } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import { BookOpen, Database } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology · How Exoplanets Are Detected | BR" },
      {
        name: "description",
        content:
          "Transit photometry, radial velocity, direct imaging, microlensing and astrometry explained, plus exactly which BR-Exoplanet data is real and which is simulated.",
      },
      { property: "og:title", content: "Methodology · How Exoplanets Are Detected | BR" },
      {
        property: "og:description",
        content:
          "The five main detection methods, and an honest account of what this platform measures versus what it simulates.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Methodology,
});

const GLASS = "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md";

const METHODS = [
  {
    name: "Transit photometry",
    focus: true,
    body: "A planet crossing in front of its star blocks a tiny fraction of the light. Measure the brightness precisely enough, repeatedly, and the dips reveal the planet's size and orbital period. This is the method BR-Exoplanet simulates.",
  },
  {
    name: "Radial velocity",
    body: "A planet's gravity tugs the star into a small orbit of its own. That motion shifts the star's spectral lines back and forth, which gives a minimum planet mass and the orbital period.",
  },
  {
    name: "Direct imaging",
    body: "With the starlight blocked out, a young, wide-orbit giant planet can sometimes be photographed as a separate point of light next to its star.",
  },
  {
    name: "Microlensing",
    body: "When a foreground star passes in front of a background one, its gravity magnifies the background light. A planet around the foreground star adds a brief extra spike to that brightening.",
  },
  {
    name: "Astrometry",
    body: "Precise measurements of a star's position on the sky can show the tiny wobble caused by an orbiting planet, without needing spectra at all.",
  },
];

function Methodology() {
  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />

        <header className={`${GLASS} mb-5 p-5`}>
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-cyan-300">
            <BookOpen className="h-4 w-4" />
            Methodology
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            How can we detect a planet we cannot see?
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Five families of measurement have found essentially every planet known outside the
            Solar System. BR-Exoplanet concentrates on the first one, because it is the method you
            can watch happen.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {METHODS.map((m) => (
            <section
              key={m.name}
              className={`${GLASS} p-5 ${m.focus ? "border-violet-500/40" : ""}`}
            >
              <h2 className="text-sm font-semibold text-white">{m.name}</h2>
              {m.focus && (
                <span className="mt-1 inline-block rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-200">
                  Primary educational simulation
                </span>
              )}
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.body}</p>
            </section>
          ))}
        </div>

        <section className={`${GLASS} mt-5 p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-emerald-400" />
            Data provenance
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                NASA Exoplanet Archive
              </span>{" "}
              — planet and host-star metadata: names, periods, radii, temperatures, distances,
              discovery year, discovery method.
            </li>
            <li>
              <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
                Synthetic photometry
              </span>{" "}
              — every light curve on this site is generated from those archive parameters. None of
              it is a telescope measurement.
            </li>
            <li>
              <span className="font-mono text-[11px] uppercase tracking-wider text-violet-300">
                Detection algorithm
              </span>{" "}
              — a simplified educational model written for this project, not NASA&apos;s production
              pipeline.
            </li>
            <li>
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
                Star catalog
              </span>{" "}
              — HYG v3.8 (Hipparcos, Yale Bright Star Catalogue, Gliese) for the 3D star map.
            </li>
          </ul>
        </section>

        <section className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-amber-300">
            Scientific transparency
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            BR-Exoplanet combines NASA Exoplanet Archive metadata with synthetic observational data
            to demonstrate the principles of exoplanet detection. Detection results generated by
            this platform are educational simulations and do not represent new astronomical
            discoveries or professional scientific validation.
          </p>
        </section>

        <p className="mt-5 text-sm text-slate-400">
          Want to try it yourself? Open the{" "}
          <Link to="/detection-lab" className="text-cyan-300 hover:text-cyan-200">
            Detection Lab
          </Link>{" "}
          or watch a live run in{" "}
          <Link to="/mission-control" className="text-cyan-300 hover:text-cyan-200">
            Mission Control
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
