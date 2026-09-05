import type { MetricCard, StatusLevel } from '@/data/scenarios';
import type { MLRiskLevel } from '@/lib/mlRiskModel';
import { useFloodRisk } from '@/context/FloodRiskContext';
import { Users, Car, CloudRain, ShieldCheck, BrainCircuit, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  icon: 'crowd' | 'traffic' | 'weather' | 'safety';
  data: MetricCard;
  mlRisk?: MLRiskLevel;
  dataSource?: 'live' | 'simulated';
  forecastText?: string | null;
}

const iconMap = {
  crowd: Users,
  traffic: Car,
  weather: CloudRain,
  safety: ShieldCheck,
};

const levelStyles: Record<StatusLevel, { dot: string; badge: string; bar: string; text: string }> = {
  good: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  caution: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bar: 'bg-amber-500',
    text: 'text-amber-400',
  },
  warning: {
    dot: 'bg-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    bar: 'bg-red-500',
    text: 'text-red-400',
  },
};

const mlRiskStyles: Record<MLRiskLevel, { text: string; bg: string; border: string }> = {
  LOW: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  MEDIUM: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  HIGH: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
};

const floodRiskStyles = {
  LOW: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  MEDIUM: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  HIGH: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function MetricCardView({
  title,
  icon,
  data,
  mlRisk,
  dataSource = 'simulated',
  forecastText,
}: MetricCardProps) {
  const Icon = iconMap[icon];
  const s = levelStyles[data.level];
  const flood = useFloodRisk();

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 ring-1 ring-slate-700/50">
              <Icon className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-400">{title}</p>
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
            </div>
          </div>
          {/* General status badge kept intact */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {data.label}
          </span>
        </div>

        <div className="mt-4">
          <p className={`text-3xl font-bold tracking-tight ${s.text}`}>{data.value}</p>
          <p className="mt-1 text-sm text-slate-400">{data.sublabel}</p>
        </div>

        {typeof data.percent === 'number' && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${s.bar} transition-all duration-700 ease-out`}
                style={{ width: `${data.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Machine Learning Predicted Risk Sub-Badge (if applicable) */}
      {mlRisk && (
        <div className={`mt-4 flex items-center justify-between rounded-lg border ${mlRiskStyles[mlRisk].border} ${mlRiskStyles[mlRisk].bg} px-2.5 py-1.5`}>
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
              RF Classifier
            </span>
          </div>
          <span className={`text-[11px] font-extrabold tracking-wide ${mlRiskStyles[mlRisk].text}`}>
            ML PREDICTED RISK: {mlRisk}
          </span>
        </div>
      )}

      {/* Flood Risk Engine Sub-Badge for Weather card */}
      {icon === 'weather' && (
        <div className="mt-4">
          <div className={`flex items-center justify-between rounded-lg border ${floodRiskStyles[flood.riskLevel].border} ${floodRiskStyles[flood.riskLevel].bg} px-2.5 py-1.5`}>
            <div className="flex items-center gap-1.5">
              <CloudRain className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
                Flood Risk Engine
              </span>
            </div>
            <span className={`text-[11px] font-extrabold tracking-wide ${floodRiskStyles[flood.riskLevel].text}`}>
              FLOOD RISK: {flood.riskLevel}
            </span>
          </div>

          {/* Predictive trend forecast line */}
          {forecastText && (
            <div className="mt-2 text-right">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <TrendingUp className="h-3 w-3" />
                {forecastText}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
