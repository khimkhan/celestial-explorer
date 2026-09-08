import { Link } from '@tanstack/react-router';
import { Telescope, Sparkles, History, Radar, FlaskConical, BookOpen, LayoutGrid } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Observatory', icon: LayoutGrid, exact: true, accent: 'hover:border-violet-500/40', active: 'border-violet-500/40 text-violet-200' },
  { to: '/mission-control', label: 'Mission Control', icon: Radar, accent: 'hover:border-cyan-500/40', active: 'border-cyan-500/40 text-cyan-200' },
  { to: '/detection-lab', label: 'Detection Lab', icon: FlaskConical, accent: 'hover:border-emerald-500/40', active: 'border-emerald-500/40 text-emerald-200' },
  { to: '/constellations', label: '3D Star Map', icon: Sparkles, accent: 'hover:border-cyan-500/40', active: 'border-cyan-500/40 text-cyan-200' },
  { to: '/timeline', label: 'Timeline', icon: History, accent: 'hover:border-amber-500/40', active: 'border-amber-500/40 text-amber-200' },
  { to: '/methodology', label: 'Methodology', icon: BookOpen, accent: 'hover:border-slate-500/60', active: 'border-slate-500/60 text-white' },
] as const;

export default function SiteHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link to="/" className="group flex items-center gap-3">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/15 p-2.5 transition-colors group-hover:bg-violet-500/25">
          <Telescope className="h-7 w-7 text-violet-400" />
        </div>
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            BR-Exoplanet Detection
          </h1>
          <p className="text-sm text-slate-400">
            NASA Exoplanet Archive data · educational detection simulation
          </p>
        </div>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap items-center gap-2 font-mono text-xs">
        {NAV.map(({ to, label, icon: Icon, accent, active, ...rest }) => (
          <Link
            key={to}
            to={to}
            {...('exact' in rest && rest.exact ? { activeOptions: { exact: true } } : {})}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300 backdrop-blur-md transition-colors ${accent} hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400`}
            activeProps={{ className: active }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
