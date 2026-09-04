import { setSimSettings, useSimSettings } from "@/lib/simSettings";
import { Pause, Play, RotateCcw, Camera, Orbit, Sparkles, Stars, Tag } from "lucide-react";

const SPEEDS = [0.25, 1, 5, 20, 100];

interface Props {
  onResetCamera: () => void;
  onResetSimulation: () => void;
}

/** Mission-control style panel driving the 3D simulation and sky layers. */
export default function SimulationControls({ onResetCamera, onResetSimulation }: Props) {
  const s = useSimSettings();

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSimSettings({ playing: !s.playing })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-violet-200 transition-colors hover:bg-violet-500/25"
        >
          {s.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {s.playing ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          onClick={onResetSimulation}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <button
          type="button"
          onClick={onResetCamera}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
        >
          <Camera className="h-3.5 w-3.5" />
          Camera
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/50 p-1 font-mono text-[11px]">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSimSettings({ speed: sp })}
              className={`rounded px-2 py-1 transition-colors ${
                s.speed === sp ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400 hover:text-white"
              }`}
            >
              {sp}×
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Toggle
            on={s.trail}
            onClick={() => setSimSettings({ trail: !s.trail })}
            icon={<Orbit className="h-3.5 w-3.5" />}
            label="Trail"
          />
          <Toggle
            on={s.labels}
            onClick={() => setSimSettings({ labels: !s.labels })}
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Labels"
          />
          <Toggle
            on={s.constellations}
            onClick={() => setSimSettings({ constellations: !s.constellations })}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Constellations"
          />
          <Toggle
            on={s.starfield}
            onClick={() => setSimSettings({ starfield: !s.starfield })}
            icon={<Stars className="h-3.5 w-3.5" />}
            label="Starfield"
          />
        </div>
      </div>
    </section>
  );
}

function Toggle({
  on,
  onClick,
  icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        on
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-slate-800 bg-slate-950/50 text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
