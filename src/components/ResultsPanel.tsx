import { useEffect, useState } from 'react';
import type { LightCurve, PlanetEstimate, TransitDetection } from '@/types';
import type { CatalogPlanet } from '@/lib/planetLore';
import type { FluxPoint } from '@/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import LightCurveChart from './LightCurveChart';
import PeriodogramChart from './PeriodogramChart';
import {
  Orbit, Gauge, Ruler, Thermometer, Sun, Globe, AlertCircle, CheckCircle2,
  HelpCircle, Info, Clock, Loader2,
} from 'lucide-react';

interface Props {
  detection: TransitDetection | null;
  estimate: PlanetEstimate | null;
  planet: CatalogPlanet;
  rawCurve: LightCurve | null;
  rawPlotData: FluxPoint[];
  detrendedPlotData: FluxPoint[];
  loading?: boolean;
  progressMsg?: string;
}

const CHART_H = 140;

export default function ResultsPanel({
  detection,
  estimate,
  planet,
  rawCurve,
  rawPlotData,
  detrendedPlotData,
  loading,
  progressMsg,
}: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
        <p className="font-mono text-[11px]">{progressMsg || 'Analysing photometry…'}</p>
      </div>
    );
  }

  if (!detection) {
    return <p className="font-mono text-[11px] text-slate-500">No detection data available.</p>;
  }

  const confStyle = {
    high: { icon: CheckCircle2, color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    moderate: { icon: CheckCircle2, color: 'text-sky-300', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
    low: { icon: HelpCircle, color: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
    none: { icon: AlertCircle, color: 'text-red-300', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  }[detection.confidence];
  const ConfIcon = confStyle.icon;

  const stats: { icon: React.ReactNode; label: string; value: string; sub?: string }[] = estimate
    ? [
        {
          icon: <Orbit className="h-3 w-3" />,
          label: 'Period',
          value: `${estimate.orbitalPeriod.toFixed(3)} d`,
          sub: `± ${estimate.orbitalPeriodError.toFixed(4)}`,
        },
        {
          icon: <Ruler className="h-3 w-3" />,
          label: 'Radius',
          value: estimate.planetRadius > 0 ? `${estimate.planetRadius.toFixed(2)} R⊕` : 'N/A',
          sub: estimate.planetRadiusJupiter > 0 ? `${estimate.planetRadiusJupiter.toFixed(3)} R♃` : undefined,
        },
        {
          icon: <Gauge className="h-3 w-3" />,
          label: 'Depth',
          value: `${(estimate.transitDepth * 1e6).toFixed(0)} ppm`,
          sub: `${(estimate.transitDepth * 100).toFixed(3)} %`,
        },
        {
          icon: <Clock className="h-3 w-3" />,
          label: 'Duration',
          value: `${estimate.transitDuration.toFixed(2)} h`,
        },
        {
          icon: <Sun className="h-3 w-3" />,
          label: 'Star R',
          value: estimate.stellarRadius > 0 ? `${estimate.stellarRadius.toFixed(3)} R☉` : 'N/A',
        },
        estimate.semiMajorAxis
          ? {
              icon: <Orbit className="h-3 w-3" />,
              label: 'Axis',
              value: `${estimate.semiMajorAxis.toFixed(4)} AU`,
            }
          : {
              icon: <Thermometer className="h-3 w-3" />,
              label: 'Eq. temp',
              value: estimate.equilibriumTemp ? `${estimate.equilibriumTemp.toFixed(0)} K` : '—',
            },
      ]
    : [];

  const slides: { key: string; label: string; caption: string; node: React.ReactNode }[] = [];
  if (rawCurve) {
    slides.push({
      key: 'raw',
      label: 'Raw',
      caption: 'Star brightness over time.',
      node: <LightCurveChart points={rawPlotData} xLabel="Time (BJD)" yLabel="Flux" color="#38bdf8" height={CHART_H} />,
    });
    slides.push({
      key: 'clean',
      label: 'Cleaned',
      caption: 'Slow brightness drifts removed.',
      node: <LightCurveChart points={detrendedPlotData} xLabel="Time (BJD)" yLabel="Flux" color="#34d399" height={CHART_H} />,
    });
    slides.push({
      key: 'bls',
      label: 'BLS',
      caption: 'Tallest spike = recovered orbit length.',
      node: <PeriodogramChart data={detection.periodogram} peaks={detection.allPeaks} height={CHART_H} />,
    });
    if (detection.detected && detection.bestPeak) {
      slides.push({
        key: 'folded',
        label: 'Folded',
        caption: 'All dips stacked — the U-shape proves the planet.',
        node: (
          <LightCurveChart
            points={detection.foldedCurve}
            xLabel="Orbital Phase"
            yLabel="Flux"
            color="#fbbf24"
            highlightTransit={{
              center: 0,
              width: detection.bestPeak.duration / 24 / detection.bestPeak.period,
            }}
            height={CHART_H}
          />
        ),
      });
    }
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="space-y-3">
        {/* ── Detection status ─────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-2 rounded-lg border ${confStyle.border} ${confStyle.bg} px-2.5 py-1.5`}
        >
          <ConfIcon className={`h-3.5 w-3.5 shrink-0 ${confStyle.color}`} />
          <span className={`font-mono text-[10px] uppercase tracking-wider ${confStyle.color}`}>
            {detection.detected ? `Transit · ${detection.confidence} confidence` : 'No clear transit'}
          </span>
          <InfoTip text={detection.confidenceReason} />
        </div>

        {/* ── Telemetry grid ───────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 backdrop-blur-md"
              >
                <div className="flex items-center gap-1 text-slate-500">
                  {s.icon}
                  <span className="text-[9px] uppercase tracking-wider">{s.label}</span>
                </div>
                <div className="truncate font-mono text-xs font-semibold text-white">{s.value}</div>
                {s.sub && <div className="truncate font-mono text-[9px] text-slate-500">{s.sub}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Classification ───────────────────────────────────────────── */}
        {estimate && estimate.planetRadius > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1.5">
            <Globe className="h-3 w-3 shrink-0 text-violet-400" />
            <span className="truncate text-[11px] font-semibold text-white">
              {classifyPlanet(estimate.planetRadius)}
            </span>
            <InfoTip text={classifyDescription(estimate.planetRadius)} />
          </div>
        )}

        {/* ── Horizontal chart carousel ────────────────────────────────── */}
        {slides.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 backdrop-blur-md">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                {slides[Math.min(current, slides.length - 1)].label}
              </span>
              <div className="flex items-center gap-1">
                {slides.map((s, i) => (
                  <span
                    key={s.key}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      i === current ? 'bg-cyan-300' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Carousel setApi={setApi} opts={{ align: 'start' }} className="w-full">
              <CarouselContent className="-ml-0">
                {slides.map((s) => (
                  <CarouselItem key={s.key} className="basis-full pl-0">
                    <div className="px-0.5">
                      {s.node}
                      <p className="mt-1 font-mono text-[9px] text-slate-600">{s.caption}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 h-6 w-6 border-slate-700 bg-slate-900/80 text-slate-300 backdrop-blur-md hover:text-cyan-200" />
              <CarouselNext className="right-0 h-6 w-6 border-slate-700 bg-slate-900/80 text-slate-300 backdrop-blur-md hover:text-cyan-200" />
            </Carousel>
          </div>
        )}

        {/* ── Footnote + method tooltip ────────────────────────────────── */}
        <div className="flex items-start gap-1.5">
          <p className="min-w-0 flex-1 font-mono text-[9px] leading-relaxed text-slate-600">
            {estimate
              ? `Recovered ${estimate.orbitalPeriod.toFixed(3)} d / ${estimate.planetRadius.toFixed(2)} R⊕ vs archive ${planet.periodDays.toFixed(3)} d / ${planet.radiusEarth.toFixed(2)} R⊕`
              : 'NASA Exoplanet Archive (pscomppars)'}
          </p>
          <InfoTip
            text={
              'Planet size = Star size × √(depth of dip)\nOrbit distance³ ≈ Star size × Period²\nPlanet temp ≈ Star temp × √(Star size / 2 × distance) × (1 − albedo)^0.25'
            }
            label="How we calculated these numbers"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

function InfoTip({ text, label }: { text: string; label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label ?? 'More info'}
          className="ml-auto shrink-0 rounded-full p-0.5 text-slate-500 transition-colors hover:text-cyan-300"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[240px] whitespace-pre-line border-slate-700 bg-slate-900/95 font-mono text-[10px] leading-relaxed text-slate-300 backdrop-blur-md">
        {label && <span className="mb-1 block uppercase tracking-wider text-cyan-300">{label}</span>}
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function classifyPlanet(radiusEarth: number): string {
  if (radiusEarth < 1.0) return 'Sub-Earth';
  if (radiusEarth < 1.8) return 'Terrestrial / Super-Earth';
  if (radiusEarth < 4.0) return 'Mini-Neptune';
  if (radiusEarth < 12.0) return 'Neptune-class';
  return 'Gas Giant';
}

function classifyDescription(radiusEarth: number): string {
  if (radiusEarth < 1.0) return 'Smaller than Earth. It is probably made of rock.';
  if (radiusEarth < 1.8) return 'About the size of Earth or a bit bigger. Probably rocky, maybe with some air around it.';
  if (radiusEarth < 4.0) return 'Between Earth and Neptune in size. It may have a rocky center with a thick gas layer on top.';
  if (radiusEarth < 12.0) return 'Similar to Neptune. It has a lot of gas and maybe a small rocky core deep inside.';
  return 'A giant planet made mostly of gas, like Jupiter or even bigger.';
}
