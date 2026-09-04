import { useEffect } from 'react';
import { usePlanetarySound } from '@/hooks/usePlanetarySound';
import { Volume2, VolumeX } from 'lucide-react';

// Ambient space drone. Starts automatically as soon as the app runs; if the
// browser blocks autoplay, playback resumes on the first user interaction.
export default function AmbientSoundBar() {
  const { autoStart, start, stop, blocked, isPlaying } = usePlanetarySound();

  useEffect(() => {
    autoStart({ period: 10 });
  }, [autoStart]);

  function toggle() {
    if (isPlaying) stop();
    else start({ period: 10 });
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 ${
        isPlaying
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
          : blocked
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/70'
      }`}
    >
      {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {isPlaying ? 'Space Sound On' : blocked ? 'Click anywhere to enable sound' : 'Space Ambient Sound'}
    </button>
  );
}
