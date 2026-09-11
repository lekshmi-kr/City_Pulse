import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface TrendDataPoint {
  time: string;
  healthScore: number; // 0-100
  floodScore: number;  // 0-5
}

interface HistoricalTrendChartProps {
  data: TrendDataPoint[];
}

export default function HistoricalTrendChart({ data }: HistoricalTrendChartProps) {
  const { t } = useLanguage();

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">{t('trendChart')}</h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-mono">
            Rolling 20-Step Buffer
          </span>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Area
              type="monotone"
              dataKey="healthScore"
              name="City Health Score (0-100)"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#healthGrad)"
            />
            <Area
              type="monotone"
              dataKey="floodScore"
              name="Flood Risk Index (0-5)"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#floodGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
