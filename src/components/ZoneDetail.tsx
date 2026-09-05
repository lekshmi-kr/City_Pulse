import type { ZoneData, StatusLevel, Scenario } from '@/data/scenarios';
import type { IotSensorState } from '@/lib/supabase';
import { predictZoneRisk, type MLRiskLevel, type MLPredictionResult } from '@/lib/mlRiskModel';
import { BrainCircuit, ShieldAlert } from 'lucide-react';

interface ZoneDetailProps {
  zone: ZoneData | null;
  scenario?: Scenario;
  iotState?: IotSensorState | null;
  prediction?: MLPredictionResult | null;
}

const levelStyles: Record<StatusLevel, { label: string; badge: string; dot: string }> = {
  good: { label: 'Good', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  caution: { label: 'Caution', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  warning: { label: 'Warning', badge: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-500' },
};

const mlStyles: Record<MLRiskLevel, { text: string; dot: string; bg: string; border: string; badge: string }> = {
  LOW: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    bg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    border: 'border-emerald-500/30',
    badge: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  },
  MEDIUM: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    bg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30',
    badge: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  },
  HIGH: {
    text: 'text-red-400',
    dot: 'bg-red-400',
    bg: 'from-red-500/15 via-red-500/5 to-transparent',
    border: 'border-red-500/30',
    badge: 'border-red-500/40 bg-red-500/20 text-red-300',
  },
};

export default function ZoneDetail({ zone, scenario, iotState, prediction }: ZoneDetailProps) {
  if (!zone) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
          <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-300">Select a zone on the map</p>
        <p className="mt-1 text-xs text-slate-500">Click any marker to see plain-language risk details for that area.</p>
      </div>
    );
  }

  const s = levelStyles[zone.level];

  // Calculate ML prediction for this specific zone if not supplied
  const mlPred = prediction ?? (scenario ? predictZoneRisk(zone, scenario, iotState) : null);
  const ml = mlPred ? mlStyles[mlPred.riskLevel] : null;

  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div>
        {/* Zone Header with general status */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{zone.name}</h3>
            <p className="mt-0.5 text-xs text-slate-400">{zone.summary}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>

        {/* Machine Learning Risk Prediction Indicator */}
        {mlPred && ml && (
          <div className={`mt-3.5 rounded-xl border ${ml.border} bg-gradient-to-r ${ml.bg} p-3.5 ring-1 ${ml.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 text-sky-400" />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-sky-400">
                  Random Forest Model
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Model Confidence: {mlPred.confidence}%
              </span>
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xs font-bold tracking-tight text-slate-200">
                ML PREDICTED RISK:
              </span>
              <span className={`text-base font-black tracking-wider ${ml.text}`}>
                {mlPred.riskLevel}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400 line-clamp-2">
              {mlPred.topFactors[0]}
            </p>
          </div>
        )}

        {/* Current Status List */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
          <ul className="space-y-2">
            {zone.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {mlPred && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-800/30 px-2.5 py-1.5 text-[11px] text-slate-500 font-mono">
          <span>Tree Voting Breakdown:</span>
          <span>
            <strong className="text-emerald-400 font-semibold">LOW {mlPred.votes.LOW}/10 trees</strong> &middot;{' '}
            <strong className="text-amber-400 font-semibold">MEDIUM {mlPred.votes.MEDIUM}/10 trees</strong> &middot;{' '}
            <strong className="text-red-400 font-semibold">HIGH {mlPred.votes.HIGH}/10 trees</strong>
          </span>
        </div>
      )}
    </div>
  );
}
