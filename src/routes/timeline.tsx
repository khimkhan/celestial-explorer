import { createFileRoute, Link } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "History of Exoplanet Discovery | BR" },
      {
        name: "description",
        content:
          "A milestone-by-milestone timeline of exoplanet discovery, from the first pulsar planets in 1992 to today's atmosphere studies with JWST.",
      },
      { property: "og:title", content: "History of Exoplanet Discovery | BR" },
      {
        property: "og:description",
        content:
          "Key milestones in exoplanet science: 51 Pegasi b, Kepler, TESS, JWST — and how detection methods evolved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

interface Milestone {
  year: string;
  title: string;
  method: string;
  body: string;
  /** Constellation the story is anchored in, if any. */
  constellation?: string;
}

const MILESTONES: Milestone[] = [
  {
    year: "1992",
    title: "First confirmed planets — around a dead star",
    method: "Pulsar timing",
    body: "Aleksander Wolszczan and Dale Frail found two planet-sized bodies circling the pulsar PSR B1257+12 by measuring tiny irregularities in the pulsar's clock-like radio beats. Nobody expected the first known exoplanets to orbit a stellar corpse.",
    constellation: "Virgo",
  },
  {
    year: "1995",
    title: "51 Pegasi b — the first planet around a Sun-like star",
    method: "Radial velocity",
    body: "Michel Mayor and Didier Queloz detected a Jupiter-mass world whipping around its star every 4.2 days. Hot Jupiters were not supposed to exist, and the discovery rewrote how we think planets form and migrate. It won the 2019 Nobel Prize in Physics.",
    constellation: "Pegasus",
  },
  {
    year: "1999",
    title: "First transit seen — HD 209458 b",
    method: "Transit photometry",
    body: "A planet was caught crossing the face of its star, dimming it by about 1.5%. For the first time a planet's true size could be measured, and the transit method — the backbone of everything that followed — was proven.",
    constellation: "Pegasus",
  },
  {
    year: "2001",
    title: "First exoplanet atmosphere detected",
    method: "Transmission spectroscopy",
    body: "Hubble spotted sodium in the starlight filtering through HD 209458 b's atmosphere. Planets stopped being dots in a graph and became places with weather and chemistry.",
    constellation: "Pegasus",
  },
  {
    year: "2004",
    title: "First direct image of a planetary companion",
    method: "Direct imaging",
    body: "The VLT captured 2M1207 b as a faint red point of light beside a brown dwarf — an actual photograph rather than an inference from starlight.",
    constellation: "Hydra",
  },
  {
    year: "2009",
    title: "Kepler launches and industrialises the hunt",
    method: "Transit photometry",
    body: "NASA's Kepler telescope stared at a single patch of the Milky Way for four years, monitoring more than 150,000 stars at once. It took the tally from dozens to thousands and showed that small planets are the galaxy's default.",
    constellation: "Cygnus",
  },
  {
    year: "2014",
    title: "The 'verification by multiplicity' bonanza",
    method: "Statistical validation",
    body: "715 new planets were confirmed in a single announcement by proving that multi-planet candidate systems are almost never false alarms. Confirmation became a statistics problem as much as an observing one.",
    constellation: "Cygnus",
  },
  {
    year: "2016",
    title: "Proxima b — a temperate world next door",
    method: "Radial velocity",
    body: "An Earth-mass planet was found in the habitable zone of Proxima Centauri, the closest star to the Sun at 4.24 light-years. Suddenly the nearest possibly-habitable ground was within a plausible interstellar mission's reach.",
    constellation: "Centaurus",
  },
  {
    year: "2017",
    title: "TRAPPIST-1's seven Earth-sized planets",
    method: "Transit photometry",
    body: "A dim red dwarf turned out to host seven rocky worlds, three of them in the habitable zone. Small, cool stars became the most efficient place to look for temperate planets.",
    constellation: "Aquarius",
  },
  {
    year: "2018",
    title: "TESS begins an all-sky survey",
    method: "Transit photometry",
    body: "Where Kepler went deep on one field, TESS scans nearly the whole sky for bright, nearby host stars — the targets whose atmospheres larger telescopes can actually study in detail.",
  },
  {
    year: "2022",
    title: "JWST reads an alien atmosphere in detail",
    method: "Infrared spectroscopy",
    body: "The James Webb Space Telescope delivered a clear carbon-dioxide detection at WASP-39 b, then sulphur dioxide produced by photochemistry. Exoplanet science shifted from counting planets to characterising them.",
  },
  {
    year: "Today",
    title: "Over 6,000 confirmed worlds",
    method: "Everything at once",
    body: "Transit, radial velocity, microlensing, direct imaging and astrometry now work together. The open question is no longer whether other planets exist, but which of them could be alive.",
  },
];

function TimelinePage() {
  return (
    <div className="relative min-h-screen text-white">
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteHeader />

        <header className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">
            ◈ Three decades of discovery
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            The history of exoplanet discovery
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            In 1992 we knew of no planets beyond our own Sun. Today the count passes six
            thousand. Here is how the field evolved — and which patch of sky each
            breakthrough came from.
          </p>
          <Link
            to="/constellations"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-mono text-xs text-cyan-200 backdrop-blur-md transition-colors hover:bg-cyan-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Find these constellations in the 3D star map
          </Link>
        </header>

        <ol className="relative space-y-6 border-l border-slate-800 pl-6">
          {MILESTONES.map((m) => (
            <li key={m.year + m.title} className="relative">
              <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_2px_rgba(34,211,238,0.6)]" />
              <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-colors hover:border-cyan-500/30">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-lg font-semibold text-cyan-300">
                    {m.year}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {m.method}
                  </span>
                </div>
                <h2 className="mt-1.5 text-base font-semibold tracking-tight">{m.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.body}</p>
                {m.constellation ? (
                  <Link
                    to="/constellations"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan-400/90 transition-colors hover:text-cyan-200"
                  >
                    <Sparkles className="h-3 w-3" />
                    Seen in {m.constellation} — open the star map
                  </Link>
                ) : null}
              </article>
            </li>
          ))}
        </ol>

        <footer className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-slate-600">
          Sources: NASA Exoplanet Archive · ESO · NASA/ESA/CSA mission releases
        </footer>
      </div>
    </div>
  );
}
