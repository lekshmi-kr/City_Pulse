import type { Advisory } from '@/data/scenarios';
import { useFloodRisk } from '@/context/FloodRiskContext';
import { CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';

interface SmsAlertState {
  sent: boolean;
  simulated: boolean;
  sid: string | null;
  timestamp: string | null;
  retries: number;
}

interface AdvisoryPanelProps {
  advisories: Advisory[];
  smsState?: SmsAlertState;
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

export default function AdvisoryPanel({ advisories, smsState }: AdvisoryPanelProps) {
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

  // Derived helpers
  const smsSent      = smsState?.sent ?? false;
  const smsSimulated = smsState?.simulated ?? true;
  const smsTime      = smsState?.timestamp
    ? new Date(smsState.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  const sidSnippet   = smsState?.sid?.startsWith('SIMULATED')
    ? 'DEMO'
    : smsState?.sid?.slice(-8) ?? null;
  const isHighFlood  = flood.riskLevel === 'HIGH';

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

        {/* SMS status badge — top-right of panel */}
        {isHighFlood && (
          smsSent ? (
            <div className="flex flex-col items-end gap-0.5">
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                smsSimulated
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              }`}>
                <CheckCircle2 className="h-3 w-3" />
                {smsSimulated ? 'SMS Simulated ✓' : 'Twilio SMS Sent ✓'}
              </span>
              {smsTime && (
                <span className="text-[9px] text-slate-500 font-mono pr-0.5">
                  {smsTime}{sidSnippet ? ` · SID …${sidSnippet}` : ''}
                  {(smsState?.retries ?? 0) > 0 && ` · retry ${smsState!.retries}`}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sending SMS…
            </span>
          )
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
                {/* Per-advisory inline SMS badge for the top flood alert item */}
                {i === 0 && isHighFlood && smsSent && (
                  <span className={`shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    smsSimulated
                      ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    <MessageSquare className="h-2.5 w-2.5" />
                    {smsSimulated ? 'SMS Demo ✓' : 'SMS Sent ✓'}
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
