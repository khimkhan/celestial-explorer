import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  subtitle?: string;
}

/**
 * Collapsible container used ONLY for secondary text sections
 * (Quick Facts, What We Found). Primary visualisations are never hidden.
 */
export default function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  subtitle,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {icon}
        <span className="text-sm font-semibold tracking-tight text-white">{title}</span>
        {subtitle && (
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:inline">
            {subtitle}
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-slate-800 p-4">{children}</div>}
    </section>
  );
}
