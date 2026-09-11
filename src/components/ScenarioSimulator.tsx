import type { Scenario } from '@/data/scenarios';
import { Sun, CloudRain, Moon, BrainCircuit } from 'lucide-react';

interface ScenarioSimulatorProps {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

const iconFor = (id: string) => {
  if (id === 'normal') return Sun;
  if (id === 'monsoon') return CloudRain;
  return Moon;
};

const scenarioMLRiskTag: Record<string, { label: string; badge: string }> = {
  normal: {
    label: 'ML: LOW',
    badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  },
  monsoon: {
    label: 'ML: HIGH',
    badge: 'border-red-500/30 bg-red-500/15 text-red-400',
  },
  rush: {
    label: 'ML: MEDIUM',
    badge: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  },
};

export default function ScenarioSimulator({ scenarios, activeId, onSelect }: ScenarioSimulatorProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-100">What-If Scenario Simulator</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">Student Demo</span>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Pick a scenario to see how the Random Forest ML model and digital twin respond dynamically.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {scenarios.map((sc) => {
          const Icon = iconFor(sc.id);
          const isActive = sc.id === activeId;
          const mlTag = scenarioMLRiskTag[sc.id] ?? {
            label: 'ML: N/A',
            badge: 'border-slate-700 bg-slate-800 text-slate-400',
          };

          return (
            <button
              key={sc.id}
              onClick={() => onSelect(sc.id)}
              className={`group flex flex-col items-start justify-between gap-2 rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30'
                  : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/70'
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className={`font-semibold ${isActive ? 'text-sky-300' : 'text-slate-200'}`}>
                      {sc.name}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{sc.description}</p>
              </div>

              {/* Dynamic ML Risk Tag */}
              <div className="mt-2 flex w-full items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <BrainCircuit className="h-3 w-3 text-sky-400" />
                  <span>RF Model</span>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${mlTag.badge}`}>
                  {mlTag.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
