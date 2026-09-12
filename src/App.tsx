import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SCENARIOS, SCENARIO_ORDER, type ZoneData, type StatusLevel, type Advisory } from '@/data/scenarios';
import CityMap from '@/components/CityMap';
import MetricCardView from '@/components/MetricCardView';
import AdvisoryPanel from '@/components/AdvisoryPanel';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import ZoneDetail from '@/components/ZoneDetail';
import IoTSensorPanel from '@/components/IoTSensorPanel';
import MLRiskCard from '@/components/MLRiskCard';
import HistoricalTrendChart, { type TrendDataPoint } from '@/components/HistoricalTrendChart';
import CitizenReportModal, { type CitizenReport } from '@/components/CitizenReportModal';
import DemoModeOverlay from '@/components/DemoModeOverlay';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useWeather } from '@/hooks/useWeather';
import { useGuidedDemo } from '@/hooks/useGuidedDemo';
import { useFloodForecast } from '@/hooks/useFloodForecast';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { defaultIotState, type IotSensorState, hasValidSupabaseConfig } from '@/lib/supabase';
import { predictCityRisk } from '@/lib/mlRiskModel';
import { FloodRiskProvider, useFloodRisk } from '@/context/FloodRiskContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { ViewModeProvider, useViewMode } from '@/context/ViewModeContext';
import type { SmsStatus } from '@/components/AdvisoryPanel';
import {
  Activity,
  MapPin,
  Gauge,
  Cpu,
  Languages,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  WifiOff,
  Eye,
  Shield,
} from 'lucide-react';

const healthStyles: Record<StatusLevel, { ring: string; text: string; bg: string; bar: string }> = {
  good: {
    ring: 'ring-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'from-emerald-500/10',
    bar: 'bg-emerald-500',
  },
  caution: {
    ring: 'ring-amber-500/30',
    text: 'text-amber-400',
    bg: 'from-amber-500/10',
    bar: 'bg-amber-500',
  },
  warning: {
    ring: 'ring-red-500/30',
    text: 'text-red-400',
    bg: 'from-red-500/10',
    bar: 'bg-red-500',
  },
};

interface DashboardContentProps {
  activeScenario: string;
  setActiveScenario: (id: string) => void;
  selectedZone: ZoneData | null;
  setSelectedZone: (z: ZoneData | null) => void;
  liveMode: boolean;
  setLiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  throttledSimState: IotSensorState | null;
  citizenReports: CitizenReport[];
  setCitizenReports: React.Dispatch<React.SetStateAction<CitizenReport[]>>;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  showTrendChart: boolean;
  setShowTrendChart: React.Dispatch<React.SetStateAction<boolean>>;
  trendBuffer: TrendDataPoint[];
  setTrendBuffer: React.Dispatch<React.SetStateAction<TrendDataPoint[]>>;
  handleScenarioChange: (id: string) => void;
  handleToggleMode: () => void;
  displayIotState: IotSensorState;
  liveError: string | null;
  irSmsStatus: SmsStatus;
  inactivitySmsStatus: SmsStatus;
}

function DashboardContent({
  activeScenario,
  selectedZone,
  setSelectedZone,
  liveMode,
  citizenReports,
  setCitizenReports,
  isReportModalOpen,
  setIsReportModalOpen,
  showTrendChart,
  setShowTrendChart,
  trendBuffer,
  handleScenarioChange,
  handleToggleMode,
  displayIotState,
  liveError,
  irSmsStatus,
  inactivitySmsStatus,
}: DashboardContentProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const { viewMode, toggleViewMode } = useViewMode();
  const { isOffline, lastKnownTimestamp } = useOfflineStatus();
  const floodRisk = useFloodRisk();
  const forecast = useFloodForecast(trendBuffer);
  const { weatherData } = useWeather();

  const scenario = SCENARIOS[activeScenario];
  const scenarioList = SCENARIO_ORDER.map((id) => SCENARIOS[id]);
  const hs = healthStyles[scenario.healthLevel];

  const { isDemoActive, currentStep, startDemo, stopDemo } = useGuidedDemo(handleScenarioChange);

  // SMS Alert dispatch on MEDIUM -> HIGH flood risk transition
  const [smsSent, setSmsSent] = useState(false);
  const prevRiskRef = useRef(floodRisk.riskLevel);

  useEffect(() => {
    const currentRisk = floodRisk.riskLevel;
    const prevRisk = prevRiskRef.current;

    if (currentRisk === 'HIGH' && prevRisk !== 'HIGH' && !smsSent) {
      fetch('http://localhost:3001/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: '+19876543210',
          message: `[TVM CITY PULSE CRITICAL ALERT] High Flood Risk detected in Trivandrum. Water level & rainfall threshold exceeded! Take immediate precaution.`,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success) {
            setSmsSent(true);
          } else {
            setSmsSent(false);
          }
        })
        .catch(() => {
          setSmsSent(false);
        });
    } else if (currentRisk !== 'HIGH') {
      setSmsSent(false);
    }
    prevRiskRef.current = currentRisk;
  }, [floodRisk.riskLevel, smsSent]);

  const activeZone = selectedZone ?? scenario.zones[0];

  const handleMapZoneSelect = useCallback(
    (zone: ZoneData) => {
      if (isDemoActive) stopDemo();
      setSelectedZone(zone);
    },
    [isDemoActive, stopDemo, setSelectedZone]
  );

  const cityPrediction = useMemo(
    () => predictCityRisk(scenario, displayIotState),
    [scenario, displayIotState]
  );

  const handleAddReport = useCallback(
    (report: CitizenReport) => {
      setCitizenReports((prev) => [report, ...prev]);
    },
    [setCitizenReports]
  );

  // Merge citizen reports into advisories feed
  const combinedAdvisories: Advisory[] = useMemo(() => {
    const citizenAdvisories: Advisory[] = citizenReports.map((r) => ({
      level: r.issueType === 'waterlogging' ? 'warning' : 'caution',
      emoji: r.issueType === 'waterlogging' ? '🌊' : r.issueType === 'traffic' ? '🚗' : '⚠️',
      text: `${t('citizenReportPrefix')} ${r.description} (${r.zoneName})`,
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    return [...citizenAdvisories, ...scenario.advisories];
  }, [citizenReports, scenario.advisories, t]);

  // Weather card metric: use real Open-Meteo API when available
  const weatherMetricData = useMemo(() => {
    if (weatherData) {
      return {
        level: scenario.weather.level,
        value: `${weatherData.temperature}°C`,
        label: weatherData.description,
        sublabel: `Rain: ${weatherData.rainMmPerHr}mm/hr · Wind: ${weatherData.windSpeed}km/h`,
      };
    }
    return scenario.weather;
  }, [weatherData, scenario.weather]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-center text-xs font-semibold text-amber-200 backdrop-blur-md">
            <WifiOff className="h-4 w-4 text-amber-400" />
            <span>
              {t('offlineBanner')}{' '}
              {lastKnownTimestamp ? lastKnownTimestamp : 'cached state'}
            </span>
          </div>
        )}

        {/* Header Controls Bar */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 ring-1 ring-slate-700/50">
                <Activity className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
                  {t('appTitle')}
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">{t('appSubtitle')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Switcher (Citizen vs Control Room) */}
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                {viewMode === 'citizen' ? (
                  <>
                    <Eye className="h-4 w-4 text-sky-400" />
                    <span>{t('citizenView')}</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span>{t('controlRoomView')}</span>
                  </>
                )}
              </button>

              {/* Guided Demo Button */}
              <button
                onClick={isDemoActive ? stopDemo : startDemo}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${isDemoActive
                    ? 'border-red-500/50 bg-red-500/20 text-red-300 ring-2 ring-red-500/40'
                    : 'border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  }`}
              >
                <Sparkles className="h-4 w-4" />
                {isDemoActive ? t('exitDemo') : t('demoMode')}
              </button>

              {/* Citizen Report Button */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all"
              >
                <AlertTriangle className="h-4 w-4" />
                {t('reportIssue')}
              </button>

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <Languages className="h-4 w-4 text-sky-400" />
                <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
              </button>

              {/* City Health Score Banner */}
              <div className={`flex items-center gap-3 rounded-2xl border border-slate-800 bg-gradient-to-r ${hs.bg} to-transparent px-3 py-2 ring-1 ${hs.ring}`}>
                <div className="relative flex h-10 w-10 items-center justify-center">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                    <circle
                      cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                      className={hs.text}
                      strokeDasharray={`${(scenario.healthScore / 100) * 150.8} 150.8`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                  </svg>
                  <span className={`absolute text-sm font-bold ${hs.text}`}>{scenario.healthScore}</span>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{t('cityHealthScore')}</p>
                  <p className={`text-sm font-bold ${hs.text}`}>{scenario.healthScore}/100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Trend Chart Button */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setShowTrendChart((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showTrendChart ? t('hideTrend') : t('showTrend')}
            </button>
          </div>

          {/* Historical Trend Chart */}
          {showTrendChart && <HistoricalTrendChart data={trendBuffer} />}
        </header>

        {/* Machine Learning (Random Forest) Risk Prediction Banner - Control Room View Only */}
        {viewMode === 'control_room' && (
          <section className="mb-6">
            <MLRiskCard
              prediction={cityPrediction}
              dataSource={liveMode && displayIotState.connected ? 'live' : weatherData ? 'live' : 'simulated'}
            />
          </section>
        )}

        {/* Metric Cards Grid */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCardView title={t('crowdActivity')} icon="crowd" data={scenario.crowd} dataSource="simulated" />
          <MetricCardView
            title={t('trafficFlow')}
            icon="traffic"
            data={scenario.traffic}
            mlRisk={cityPrediction.riskLevel}
            dataSource="simulated"
          />
          <MetricCardView
            title={t('weatherRainfall')}
            icon="weather"
            data={weatherMetricData}
            dataSource={weatherData ? 'live' : 'simulated'}
            forecastText={forecast.forecastText}
          />
          <MetricCardView
            title={t('roadSafetyIndex')}
            icon="safety"
            data={scenario.roadSafety}
            mlRisk={cityPrediction.riskLevel}
            dataSource="simulated"
          />
        </section>

        {/* IoT Sensor Panel - Control Room View Only */}
        {viewMode === 'control_room' && (
          <section className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t('iotHardwareStatus')}</h2>
              <span className="text-xs text-slate-500">&middot; {t('esp32Node')}</span>
            </div>
            <IoTSensorPanel
              state={displayIotState}
              liveMode={liveMode}
              onToggleMode={handleToggleMode}
              liveError={liveError}
            />
          </section>
        )}

        {/* Map + Zone Detail */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t('interactiveMap')}</h2>
              <span className="text-xs text-slate-500">&middot; Click a marker for details</span>
            </div>
            <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
              <CityMap
                zones={scenario.zones}
                onZoneSelect={handleMapZoneSelect}
                selectedZoneId={selectedZone?.id ?? null}
                scenario={scenario}
                iotState={displayIotState}
                citizenReports={citizenReports}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="mb-2 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-300">{t('zoneDetails')}</h2>
            </div>
            <div className="h-[420px]">
              <ZoneDetail
                zone={activeZone}
                scenario={scenario}
                iotState={displayIotState}
              />
            </div>
          </div>
        </section>

        {/* Advisories + Scenario Simulator */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AdvisoryPanel
            advisories={combinedAdvisories}
            smsSent={smsSent}
            irSmsStatus={irSmsStatus}
            inactivitySmsStatus={inactivitySmsStatus}
          />
          <ScenarioSimulator
            scenarios={scenarioList}
            activeId={activeScenario}
            onSelect={(id) => {
              if (isDemoActive) stopDemo();
              handleScenarioChange(id);
            }}
          />
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-800/60 pt-4 text-center text-xs text-slate-600">
          Trivandrum City Pulse &middot; Digital Twin Competition Submission &middot; Data coexists with Live APIs &amp; Hardware Edge Sensors
        </footer>

        {/* Modals & Overlays */}
        <CitizenReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          zones={scenario.zones}
          onSubmitReport={handleAddReport}
        />

        <DemoModeOverlay
          isActive={isDemoActive}
          currentStep={currentStep}
          onStop={stopDemo}
        />
      </div>
    </div>
  );
}

function MainDashboard() {
  const [activeScenario, setActiveScenario] = useState('normal');
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [liveMode, setLiveMode] = useState(() => hasValidSupabaseConfig());
  const [throttledSimState, setThrottledSimState] = useState<IotSensorState | null>(null);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [trendBuffer, setTrendBuffer] = useState<TrendDataPoint[]>([]);

  const scenario = SCENARIOS[activeScenario];

  const handleTelemetryError = useCallback(() => {
    setLiveMode(false);
  }, []);

  const { iotState, setIotState, error: liveError } = useTelemetry({ liveMode, onError: handleTelemetryError });
  const { weatherData } = useWeather();

  // ── IR Detection SMS Alert ─────────────────────────────────────────────────
  // Sends one SMS per detection event (false→true transition). Cooldown prevents
  // repeated SMS during sustained detection. Resets when IR goes clear.
  const [irSmsStatus, setIrSmsStatus] = useState<SmsStatus>('idle');
  const prevIrDetectedRef = useRef(false);
  const irSmsCooldownRef = useRef(false);
  const irSmsCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Inactivity SMS Alert ───────────────────────────────────────────────────
  // Sends one SMS when no IR activity is detected for INACTIVITY_THRESHOLD_MS.
  // Does not repeat until IR activity resumes and resets the state.
  const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes (configurable)
  const [inactivitySmsStatus, setInactivitySmsStatus] = useState<SmsStatus>('idle');
  const lastIrActivityTimeRef = useRef<number>(Date.now());
  const inactivityAlertSentRef = useRef(false);

  // Helper: send SMS via the existing backend server
  const sendSms = useCallback(async (message: string): Promise<'sent' | 'failed'> => {
    try {
      const res = await fetch('http://localhost:3001/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      return data && data.success ? 'sent' : 'failed';
    } catch {
      return 'failed';
    }
  }, []);


  const handleScenarioChange = useCallback(
    (id: string) => {
      setActiveScenario(id);
      setSelectedZone(null);
      // In simulation mode, update iotState with scenario defaults.
      // In live mode, we keep the hardware data — merging happens in displayIotState.
      if (!liveMode) {
        const sc = SCENARIOS[id];
        setIotState({
          connected: false,
          pirDetected: sc.iot.pirDetected,
          temperature: sc.iot.temperature,
          humidity: sc.iot.humidity,
          lcdText: sc.iot.lcdText,
          ledState: sc.iot.ledState,
          buzzerActive: sc.iot.buzzerActive,
          nodeId: 'esp32-node-01',
          lastUpdated: new Date().toISOString(),
        });
      }
    },
    [liveMode, setIotState]
  );

  // Set simulated IoT sensor state when active scenario changes in demo mode
  useEffect(() => {
    if (liveMode) return;
    const sc = SCENARIOS[activeScenario];
    setThrottledSimState({
      connected: false,
      pirDetected: sc.iot.pirDetected,
      temperature: sc.iot.temperature,
      humidity: sc.iot.humidity,
      lcdText: sc.iot.lcdText,
      ledState: sc.iot.ledState,
      buzzerActive: sc.iot.buzzerActive,
      nodeId: 'esp32-node-01',
      lastUpdated: null,
    });
  }, [liveMode, activeScenario]);

  const handleToggleMode = useCallback(() => {
    setLiveMode((prev) => {
      const next = !prev;
      if (!next) {
        // Switching to Simulation mode: immediately sync both iotState and throttledSimState
        const sc = SCENARIOS[activeScenario];
        const simState: IotSensorState = {
          connected: false,
          pirDetected: sc.iot.pirDetected,
          temperature: sc.iot.temperature,
          humidity: sc.iot.humidity,
          lcdText: sc.iot.lcdText,
          ledState: sc.iot.ledState,
          buzzerActive: sc.iot.buzzerActive,
          nodeId: 'esp32-node-01',
          lastUpdated: new Date().toISOString(),
        };
        setIotState(simState);
        setThrottledSimState(simState);
      } else {
        setIotState(defaultIotState);
      }
      return next;
    });
  }, [activeScenario, setIotState]);

  // In live mode: merge scenario simulation with real hardware data.
  // Hardware sensor readings (temp, humidity, IR sensor) take priority when non-null;
  // scenario still drives the map, advisories, ML risk, and other metrics.
  // temperature and humidity are explicitly resolved so that a null from
  // defaultIotState never overwrites the scenario's simulated values.
  const displayIotState: IotSensorState = liveMode
    ? {
      ...{
        connected: false,
        pirDetected: scenario.iot.pirDetected,
        temperature: scenario.iot.temperature,
        humidity: scenario.iot.humidity,
        lcdText: scenario.iot.lcdText,
        ledState: scenario.iot.ledState,
        buzzerActive: scenario.iot.buzzerActive,
        nodeId: 'esp32-node-01',
        lastUpdated: null,
      },
      // Hardware overrides scenario defaults for actual sensor readings
      ...iotState,
      // Fall back to scenario values when hardware hasn't sent DHT11 data yet
      temperature: iotState.temperature !== null ? iotState.temperature : scenario.iot.temperature,
      humidity: iotState.humidity !== null ? iotState.humidity : scenario.iot.humidity,
      // Always reflect connection status from hardware
      connected: iotState.connected,
    }
    : (throttledSimState ?? {
      connected: false,
      pirDetected: scenario.iot.pirDetected,
      temperature: scenario.iot.temperature,
      humidity: scenario.iot.humidity,
      lcdText: scenario.iot.lcdText,
      ledState: scenario.iot.ledState,
      buzzerActive: scenario.iot.buzzerActive,
      nodeId: 'esp32-node-01',
      lastUpdated: null,
    });

  const activeZone = selectedZone ?? scenario.zones[0];
  const isLowLying = activeZone?.isLowLying ?? true;

  // ── IR Detection SMS Alert effect ──────────────────────────────────────────
  // Must be after displayIotState is declared so the closure captures the
  // fully-merged state (live hardware + scenario fallback).
  useEffect(() => {
    const currentIr = displayIotState.pirDetected;
    const prevIr = prevIrDetectedRef.current;

    if (currentIr && !prevIr && !irSmsCooldownRef.current) {
      // Transition false → true: send detection SMS
      irSmsCooldownRef.current = true;
      const zone = selectedZone ?? (SCENARIOS[activeScenario]?.zones[0] ?? null);
      const zoneName = zone?.name ?? 'monitored area';
      const tempStr = displayIotState.temperature !== null ? `${displayIotState.temperature}` : 'N/A';
      const msg = `UrbanTwin Alert: Object detected in ${zoneName}. Risk level: Elevated. Temperature: ${tempStr}\u00b0C.`;
      sendSms(msg).then((status) => {
        setIrSmsStatus(status);
      });
      // 5-minute cooldown before another IR detection SMS can be sent
      if (irSmsCooldownTimerRef.current) clearTimeout(irSmsCooldownTimerRef.current);
      irSmsCooldownTimerRef.current = setTimeout(() => {
        irSmsCooldownRef.current = false;
        irSmsCooldownTimerRef.current = null;
      }, 5 * 60 * 1000);
    }

    if (currentIr) {
      // IR is active — update last activity time and reset inactivity state
      lastIrActivityTimeRef.current = Date.now();
      if (inactivityAlertSentRef.current) {
        inactivityAlertSentRef.current = false;
        setInactivitySmsStatus('idle');
      }
    }

    if (!currentIr && prevIr) {
      // Transition true → false: clear the IR SMS status badge
      setIrSmsStatus('idle');
      // Cooldown timer keeps running to prevent rapid-oscillation spam
    }

    prevIrDetectedRef.current = currentIr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayIotState.pirDetected, displayIotState.temperature, activeScenario, selectedZone]);

  // ── Inactivity check — runs every 60 seconds ───────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (inactivityAlertSentRef.current) return; // already sent, wait for reset
      const elapsed = Date.now() - lastIrActivityTimeRef.current;
      if (elapsed >= INACTIVITY_THRESHOLD_MS) {
        inactivityAlertSentRef.current = true;
        const zone = selectedZone ?? (SCENARIOS[activeScenario]?.zones[0] ?? null);
        const zoneName = zone?.name ?? 'monitored area';
        const minutes = Math.round(elapsed / 60000);
        const msg = `UrbanTwin Alert: No IR activity detected in ${zoneName} for ${minutes} minute${minutes !== 1 ? 's' : ''}. Please check the monitored area.`;
        sendSms(msg).then((status) => {
          setInactivitySmsStatus(status);
        });
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario, selectedZone, INACTIVITY_THRESHOLD_MS]);

  // Cleanup IR cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (irSmsCooldownTimerRef.current) clearTimeout(irSmsCooldownTimerRef.current);
    };
  }, []);


  // Signal Fusion: count citizen waterlogging reports for active zone
  const citizenWaterloggingCount = useMemo(
    () => citizenReports.filter((r) => r.zoneId === activeZone.id && r.issueType === 'waterlogging').length,
    [citizenReports, activeZone]
  );

  // Maintain rolling 20-step historical trend buffer
  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const floodScore = scenario.id === 'monsoon' ? 5 : scenario.id === 'rush' ? 2 : 1;
      setTrendBuffer((prev) => {
        const next = [...prev, { time: nowStr, healthScore: scenario.healthScore, floodScore }];
        return next.slice(-20);
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [scenario]);

  return (
    <FloodRiskProvider
      rainfallMmPerHr={weatherData ? weatherData.rainMmPerHr : scenario.rainfallMmPerHr}
      sustainedMinutes={scenario.sustainedMinutes}
      lowLyingZone={isLowLying}
      citizenWaterloggingReportsCount={citizenWaterloggingCount}
    >
      <DashboardContent
        activeScenario={activeScenario}
        setActiveScenario={setActiveScenario}
        selectedZone={selectedZone}
        setSelectedZone={setSelectedZone}
        liveMode={liveMode}
        setLiveMode={setLiveMode}
        throttledSimState={throttledSimState}
        citizenReports={citizenReports}
        setCitizenReports={setCitizenReports}
        isReportModalOpen={isReportModalOpen}
        setIsReportModalOpen={setIsReportModalOpen}
        showTrendChart={showTrendChart}
        setShowTrendChart={setShowTrendChart}
        trendBuffer={trendBuffer}
        setTrendBuffer={setTrendBuffer}
        handleScenarioChange={handleScenarioChange}
        handleToggleMode={handleToggleMode}
        displayIotState={displayIotState}
        liveError={liveError}
        irSmsStatus={irSmsStatus}
        inactivitySmsStatus={inactivitySmsStatus}
      />
    </FloodRiskProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ViewModeProvider>
        <MainDashboard />
      </ViewModeProvider>
    </LanguageProvider>
  );
}
