import { useEffect } from "react";
import { usePlanetarySound } from "@/hooks/usePlanetarySound";
import { Volume2, VolumeX, AudioLines } from "lucide-react";

interface Props {
  planetName: string;
  periodDays: number;
}

/**
 * Per-object planetary sound. A single shared audio engine is retuned when the
 * object changes, so no duplicate oscillators are ever created and the previous
 * object's voice is released. Rendering never waits for audio.
 */
export default function PlanetSoundPanel({ planetName, periodDays }: Props) {
  const { autoStart, start, stop, retune, blocked, isPlaying, setVolume, volume } =
    usePlanetarySound();

  useEffect(() => {
    autoStart({ period: periodDays });
    retune({ period: periodDays });
  }, [periodDays, autoStart, retune]);

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <AudioLines className="h-4 w-4 text-emerald-400" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
          Planetary sound · {planetName}
        </span>
      </div>

      <button
        type="button"
        onClick={() => (isPlaying ? stop() : start({ period: periodDays }))}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
          isPlaying
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            : blocked
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-slate-800 bg-slate-950/50 text-slate-300 hover:text-white"
        }`}
      >
        {isPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {isPlaying ? "Pause" : blocked ? "Tap to enable" : "Play"}
      </button>

      <label className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Volume</span>
        <input
          type="range"
          min="0"
          max="0.4"
          step="0.01"
          defaultValue={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 accent-emerald-400"
          aria-label="Planetary sound volume"
        />
      </label>

      <span className="ml-auto font-mono text-[10px] text-slate-600">
        Tone pitch derived from the orbital period
      </span>
    </section>
  );
}
