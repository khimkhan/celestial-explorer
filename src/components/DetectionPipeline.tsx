import { Check, Loader2 } from "lucide-react";

const STAGES = [
  "Stellar observation",
  "Brightness measurements",
  "Light curve",
  "Transit signal",
  "Signal analysis",
  "Orbital parameters",
  "Detection confidence",
  "Classification",
  "3D orbital simulation",
];

interface Props {
  /** index of the stage currently running; all earlier stages read as done */
  activeStage: number;
  compact?: boolean;
}

/** Horizontal strip that tells the detection story end to end. */
export default function DetectionPipeline({ activeStage, compact }: Props) {
  return (
    <ol
      className={`thin-scroll flex snap-x gap-2 overflow-x-auto pb-1 ${compact ? "text-[10px]" : "text-[11px]"}`}
    >
      {STAGES.map((stage, i) => {
        const done = i < activeStage;
        const active = i === activeStage;
        return (
          <li
            key={stage}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono uppercase tracking-wider transition-colors duration-500 ${
              active
                ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                : done
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300/80"
                  : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            {done ? (
              <Check className="h-3 w-3" />
            ) : active ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            )}
            {stage}
          </li>
        );
      })}
    </ol>
  );
}
