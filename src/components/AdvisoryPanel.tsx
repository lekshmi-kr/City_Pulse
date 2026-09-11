import type { Advisory } from '@/data/scenarios';
import { useFloodRisk } from '@/context/FloodRiskContext';
import { CheckCircle2 } from 'lucide-react';

interface AdvisoryPanelProps {
  advisories: Advisory[];
  smsSent?: boolean;
}

const borderStyles: Record<string, string> = {
  good: 'border-l-emerald-500',
  caution: 'border-l-amber-500',
  warning: 'border-l-red-500',
};

const bgStyles: Record<string, string> = {
  good: 'bg-emerald-500/5',
  caution: 'bg-amber-500/5',
  warning: 'bg-red-500/5',
};

export default function AdvisoryPanel({ advisories, smsSent = false }: AdvisoryPanelProps) {
  const flood = useFloodRisk();

  const floodAlert: Advisory | null = flood.riskLevel === 'HIGH' ? {
    level: 'warning',
    emoji: '⚠️',
    text: 'Flood risk HIGH near Killi River — avoid underpasses & low-lying areas',
    time: 'Just now',
  } : flood.riskLevel === 'MEDIUM' ? {
    level: 'caution',
    emoji: '🟡',
    text: 'Flood risk MEDIUM near river basins — monitor local water accumulation',
    time: 'Just now',
  } : null;

  const displayAdvisories = floodAlert ? [floodAlert, ...advisories] : advisories;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h3 className="text-base font-semibold text-slate-100">Live Updates &amp; Alerts</h3>
        </div>

        {smsSent && flood.riskLevel === 'HIGH' && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Twilio SMS Sent ✓
          </span>
        )}
      </div>


      <div className="space-y-3">
        {displayAdvisories.map((adv, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-xl border border-slate-800 border-l-4 ${borderStyles[adv.level]} ${bgStyles[adv.level]} p-3.5`}
          >
            <span className="text-lg leading-none">{adv.emoji}</span>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-snug text-slate-200">{adv.text}</p>
                {i === 0 && flood.riskLevel === 'HIGH' && smsSent && (
                  <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    SMS Sent ✓
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">{adv.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
