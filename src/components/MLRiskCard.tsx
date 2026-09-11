import { useState } from 'react';
import type { MLPredictionResult, MLRiskLevel } from '@/lib/mlRiskModel';
import { BrainCircuit, ChevronDown, ChevronUp, Layers, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, OctagonAlert as AlertOctagon, Info } from 'lucide-react';

interface MLRiskCardProps {
  prediction: MLPredictionResult;
  title?: string;
  subtitle?: string;
  variant?: 'banner' | 'card' | 'compact';
  dataSource?: 'live' | 'simulated';
}

const riskStyles: Record<
  MLRiskLevel,
  {
    ring: string;
    border: string;
    text: string;
    bg: string;
    badge: string;
    glow: string;
    dot: string;
    bar: string;
    icon: typeof CheckCircle2;
  }
> = {
  LOW: {
    ring: 'ring-emerald-500/30',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    glow: 'rgba(34, 197, 94, 0.25)',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  MEDIUM: {
    ring: 'ring-amber-500/30',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    badge: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    glow: 'rgba(245, 158, 11, 0.25)',
    dot: 'bg-amber-400',
    bar: 'bg-amber-500',
    icon: AlertTriangle,
  },
  HIGH: {
    ring: 'ring-red-500/30',
    border: 'border-red-500/40',
    text: 'text-red-400',
    bg: 'from-red-500/15 via-red-500/5 to-transparent',
    badge: 'border-red-500/40 bg-red-500/15 text-red-300',
    glow: 'rgba(239, 68, 68, 0.25)',
    dot: 'bg-red-400',
    bar: 'bg-red-500',
    icon: AlertOctagon,
  },
};

export default function MLRiskCard({
  prediction,
  title = 'ML Predicted Risk',
  subtitle = 'Random Forest Classifier &middot; Multi-Sensor Ensemble',
  variant = 'banner',
  dataSource = 'simulated',
}: MLRiskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const s = riskStyles[prediction.riskLevel];
  const IconComponent = s.icon;

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 ring-1 ${s.border} ${s.ring} bg-slate-900/90 shadow-sm`}
      >
        <BrainCircuit className={`h-4 w-4 ${s.text}`} />
        <span className="text-xs font-semibold tracking-wide text-slate-300">ML RISK:</span>
        <span className={`text-xs font-black tracking-wider ${s.text}`}>
          {prediction.riskLevel}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">({prediction.confidence}%)</span>
        {dataSource === 'live' ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-400">
            LIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-sky-500/30 bg-sky-500/10 px-1 py-0.2 text-[9px] font-bold text-sky-400">
            DEMO
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-r ${s.bg} p-4 sm:p-5 ring-1 ${s.ring} transition-all duration-300`}
    >
      {/* Background ambient pulse */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-2xl transition-all duration-700"
        style={{ background: s.glow }}
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Section: Model Info & Risk Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/60 shadow-inner">
            <BrainCircuit className={`h-6 w-6 ${s.text} animate-pulse`} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-75`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${s.dot}`} />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-sky-400">
                Random Forest ML Engine
              </span>
              <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.2 text-slate-400 font-mono">
                v2.4
              </span>
              {dataSource === 'live' ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE DATA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-sky-400">
                  DEMO DATA
                </span>
              )}
            </div>

            {/* Exactly formatted ML PREDICTED RISK: [CATEGORY] */}
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-black tracking-tight text-slate-100 sm:text-xl">
                ML PREDICTED RISK:
              </span>
              <span
                className={`text-xl font-black tracking-wider sm:text-2xl ${s.text} drop-shadow-[0_0_12px_${s.glow}]`}
              >
                {prediction.riskLevel}
              </span>
            </div>

            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {prediction.topFactors[0] || subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Confidence & Inspector Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-800/60 pt-3 sm:border-0 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="flex items-center sm:justify-end gap-1.5">
              <IconComponent className={`h-4 w-4 ${s.text}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Model Confidence
              </span>
            </div>
            <p className={`text-base font-bold font-mono ${s.text}`}>
              {prediction.confidence}%
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Predicted Probability (independent of tree votes)
            </p>
          </div>

          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700/80"
            title="Inspect Random Forest decision trees"
          >
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">Model Logic</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Model Inspection Drawer */}
      {showDetails && (
        <div className="mt-4 border-t border-slate-800/80 pt-4 text-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Info className="h-3.5 w-3.5 text-sky-400" />
              <span>Tree Voting Breakdown (10 Decision Trees)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              LOW: {prediction.votes.LOW}/10 trees &middot; MEDIUM: {prediction.votes.MEDIUM}/10 trees &middot; HIGH: {prediction.votes.HIGH}/10 trees
            </span>
          </div>

          {/* Voting Distribution Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-emerald-400 font-semibold">LOW Votes</span>
                <span className="font-mono text-slate-300 font-bold">{prediction.votes.LOW} / 10 trees</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(prediction.votes.LOW / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-amber-400 font-semibold">MEDIUM Votes</span>
                <span className="font-mono text-slate-300 font-bold">{prediction.votes.MEDIUM} / 10 trees</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(prediction.votes.MEDIUM / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-red-400 font-semibold">HIGH Votes</span>
                <span className="font-mono text-slate-300 font-bold">{prediction.votes.HIGH} / 10 trees</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(prediction.votes.HIGH / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Primary Model Factors & Feature Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Primary Decision Drivers
              </p>
              <ul className="space-y-1.5">
                {prediction.topFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                FEATURE IMPORTANCE &amp; ACTIVE VALUES
              </p>
              <div className="space-y-1.5">
                {prediction.featureImportance.map((fi, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{fi.feature} ({fi.weight}% Feature Importance):</span>
                    <span className="font-mono font-medium text-slate-200">{fi.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-800/60 pt-1.5 leading-tight">
                * Sensor values are on a Normalized Risk Scale (0&ndash;100), not direct physical measurements. Pipeline: Raw Sensor Data (e.g., mm/hr rainfall) &rarr; Normalized Risk Scale (0&ndash;100) &rarr; Risk Prediction Model. Feature Importance denotes each metric's relative contribution to the prediction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
