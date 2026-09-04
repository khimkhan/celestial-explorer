import { Telescope } from "lucide-react";

const STEPS = [
  {
    title: "A planet crosses its star",
    body: "Once per orbit the planet passes between its host star and our telescope.",
  },
  {
    title: "Starlight dips",
    body: "The planet blocks a tiny fraction of the star's light — often less than 1%.",
  },
  {
    title: "The dip is recorded",
    body: "Photometers measure brightness continuously, producing a light curve.",
  },
  {
    title: "Repeats reveal the period",
    body: "Evenly spaced dips give the orbital period; their depth gives the planet's size.",
  },
];

/** Plain-language explanation of the transit method. */
export default function HowDetectionWorks() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Telescope className="h-4 w-4 text-cyan-400" />
        <h2 className="text-sm font-semibold tracking-tight text-white">How detection works</h2>
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
          Transit method
        </span>
      </header>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
              Step {i + 1}
            </div>
            <h3 className="mt-1 text-sm font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Object metadata on this site comes from the NASA Exoplanet Archive. The photometry shown is
        a synthetic observing campaign generated from those published parameters, so every detection
        result here is an educational simulation — not a new discovery and not NASA-grade validation.
      </p>
    </section>
  );
}
