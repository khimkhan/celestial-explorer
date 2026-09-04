import { Link } from '@tanstack/react-router';
import { Telescope, Sparkles } from 'lucide-react';

export default function SiteHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <Link to="/" className="group flex items-center gap-3">
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/15 p-2.5 transition-colors group-hover:bg-violet-500/25">
          <Telescope className="h-7 w-7 text-violet-400" />
        </div>
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            BR-EGATE Exoplanet Detection Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            NASA Exoplanet Archive data · educational detection simulation
          </p>
        </div>
      </Link>

      <nav className="flex items-center gap-2 font-mono text-xs">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300 backdrop-blur-md transition-colors hover:border-violet-500/40 hover:text-white"
          activeProps={{ className: 'border-violet-500/40 text-violet-200' }}
        >
          Catalog
        </Link>
        <Link
          to="/constellations"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300 backdrop-blur-md transition-colors hover:border-cyan-500/40 hover:text-white"
          activeProps={{ className: 'border-cyan-500/40 text-cyan-200' }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Constellations
        </Link>
      </nav>
    </header>
  );
}
