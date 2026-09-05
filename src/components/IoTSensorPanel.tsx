import type { IotSensorState } from '@/lib/supabase';
import type { StatusLevel } from '@/data/scenarios';
import { useFloodRisk } from '@/context/FloodRiskContext';
import { Cpu, Wifi, WifiOff, Thermometer, Droplets, Footprints, Monitor, Lightbulb, Volume2, VolumeX } from 'lucide-react';

interface IoTSensorPanelProps {
  state: IotSensorState;
  liveMode: boolean;
  onToggleMode: () => void;
}

const levelColor: Record<StatusLevel, string> = {
  good: 'text-emerald-400',
  caution: 'text-amber-400',
  warning: 'text-red-400',
};

const levelDot: Record<StatusLevel, string> = {
  good: 'bg-emerald-500',
  caution: 'bg-amber-500',
  warning: 'bg-red-500',
};

export default function IoTSensorPanel({ state, liveMode, onToggleMode }: IoTSensorPanelProps) {
  const flood = useFloodRisk();
  const pirLevel: StatusLevel = state.pirDetected ? 'warning' : 'good';
  const tempLevel: StatusLevel = state.temperature !== null && state.temperature > 32 ? 'warning' : state.temperature !== null && state.temperature > 28 ? 'caution' : 'good';
  const humidityLevel: StatusLevel = state.humidity !== null && state.humidity > 80 ? 'warning' : state.humidity !== null && state.humidity > 60 ? 'caution' : 'good';

  // Reactive LED and Buzzer status based on shared Flood Risk
  const isHighFlood = flood.riskLevel === 'HIGH';
  const isMedFlood = flood.riskLevel === 'MEDIUM';

  const ledStyle = isHighFlood
    ? { container: 'bg-red-500/20 ring-2 ring-red-500/50', text: 'text-red-400', label: 'Red Alert (High Flood)' }
    : isMedFlood
    ? { container: 'bg-amber-500/20 ring-2 ring-amber-500/50', text: 'text-amber-400', label: 'Yellow (Caution)' }
    : { container: 'bg-emerald-500/20 ring-2 ring-emerald-500/50', text: 'text-emerald-400', label: 'Green (Normal)' };

  const buzzerStyle = isHighFlood
    ? { container: 'bg-red-500/20 ring-2 ring-red-500/50', text: 'text-red-400', icon: Volume2, label: 'Active (Alarm)' }
    : isMedFlood
    ? { container: 'bg-amber-500/20 ring-2 ring-amber-500/50', text: 'text-amber-400', icon: Volume2, label: 'Intermittent Beep' }
    : { container: 'bg-slate-700/40 ring-2 ring-slate-600/30', text: 'text-slate-400', icon: VolumeX, label: 'Silent' };

  const BuzzerIcon = buzzerStyle.icon;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-sky-400" />
          <h3 className="text-base font-semibold text-slate-100">Live IoT Sensor Status</h3>
          {state.connected && liveMode ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold tracking-wider text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              LIVE DATA &middot; ESP32 Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-xs font-bold tracking-wider text-sky-400">
              DEMO DATA {liveMode && !state.connected ? '(Waiting for Hardware)' : ''}
            </span>
          )}
        </div>

        {/* Mode Toggle */}
        <button
          onClick={onToggleMode}
          className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800"
        >
          {liveMode ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-sky-400" />}
          <span>{liveMode ? 'Live Hardware Mode (ESP32 Wi-Fi)' : 'Simulation Mode'}</span>
          <span className="relative ml-1 inline-flex h-4 w-7 items-center rounded-full bg-slate-700 transition-colors">
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                liveMode ? 'translate-x-3.5 bg-emerald-400' : 'translate-x-0.5 bg-sky-400'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Node ID */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
        <Cpu className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">Node:</span>
        <span className="text-xs font-mono font-medium text-slate-300">{state.nodeId}</span>
        {state.lastUpdated && (
          <span className="ml-auto text-xs text-slate-600">
            {new Date(state.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Sensor Readouts Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* PIR Motion Sensor */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-400">PIR Motion Sensor</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              pirLevel === 'good' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' : 'border-red-500/30 bg-red-500/15 text-red-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${levelDot[pirLevel]}`} />
              {state.pirDetected ? 'Motion Detected' : 'No Motion'}
            </span>
          </div>
          <p className={`text-sm ${levelColor[pirLevel]}`}>
            {state.pirDetected ? 'Pedestrian crowd activity detected' : 'Area is quiet'}
          </p>
        </div>

        {/* DHT11 Temperature */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-400">DHT11 Temperature</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              tempLevel === 'good' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : tempLevel === 'caution' ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                : 'border-red-500/30 bg-red-500/15 text-red-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${levelDot[tempLevel]}`} />
              {tempLevel === 'good' ? 'Normal' : tempLevel === 'caution' ? 'Warm' : 'Hot'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${levelColor[tempLevel]}`}>
            {state.temperature !== null ? `${state.temperature}°C` : '--'}
          </p>
        </div>

        {/* DHT11 Humidity */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-400">DHT11 Humidity</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              humidityLevel === 'good' ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : humidityLevel === 'caution' ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                : 'border-red-500/30 bg-red-500/15 text-red-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${levelDot[humidityLevel]}`} />
              {humidityLevel === 'good' ? 'Comfortable' : humidityLevel === 'caution' ? 'Humid' : 'Very Humid'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${levelColor[humidityLevel]}`}>
            {state.humidity !== null ? `${state.humidity}%` : '--'}
          </p>
        </div>

        {/* Onboard Status: LCD */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">LCD Display</span>
          </div>
          <div className="rounded-lg border border-cyan-900/50 bg-cyan-950/30 px-3 py-2 font-mono text-xs text-cyan-300">
            {state.lcdText}
          </div>
        </div>
      </div>

      {/* Reactive LED + Buzzer Row */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${ledStyle.container}`}>
            <Lightbulb className={`h-5 w-5 ${ledStyle.text}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">LED Indicator</p>
            <p className={`text-sm font-semibold ${ledStyle.text}`}>
              {ledStyle.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${buzzerStyle.container}`}>
            <BuzzerIcon className={`h-5 w-5 ${buzzerStyle.text}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Buzzer Alert</p>
            <p className={`text-sm font-semibold ${buzzerStyle.text}`}>
              {buzzerStyle.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
