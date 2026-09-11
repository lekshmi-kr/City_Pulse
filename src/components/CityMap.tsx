import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type ZoneData, type StatusLevel, type Scenario, FLOOD_PRONE_ZONES } from '@/data/scenarios';
import type { IotSensorState } from '@/lib/supabase';
import type { CitizenReport } from '@/components/CitizenReportModal';
import { predictZoneRisk } from '@/lib/mlRiskModel';
import { useFloodRisk } from '@/context/FloodRiskContext';
import { useRouteGuidance } from '@/hooks/useRouteGuidance';
import { Navigation } from 'lucide-react';

interface CityMapProps {
  zones: ZoneData[];
  onZoneSelect?: (zone: ZoneData) => void;
  selectedZoneId?: string | null;
  scenario?: Scenario;
  iotState?: IotSensorState | null;
  citizenReports?: CitizenReport[];
}

const levelColors: Record<StatusLevel, string> = {
  good: '#22c55e',
  caution: '#f59e0b',
  warning: '#ef4444',
};

const levelGlow: Record<StatusLevel, string> = {
  good: 'rgba(34, 197, 94, 0.5)',
  caution: 'rgba(245, 158, 11, 0.5)',
  warning: 'rgba(239, 68, 68, 0.5)',
};

const mlRiskColorMap = {
  LOW: '#16a34a',
  MEDIUM: '#d97706',
  HIGH: '#dc2626',
};

const floodRiskColors = {
  LOW: { color: '#22c55e', fill: '#22c55e', fillOpacity: 0.15 },
  MEDIUM: { color: '#f59e0b', fill: '#f59e0b', fillOpacity: 0.25 },
  HIGH: { color: '#ef4444', fill: '#ef4444', fillOpacity: 0.35 },
};

function createReportIcon(issueType: string): L.DivIcon {
  const emoji = issueType === 'waterlogging' ? '🌊' : issueType === 'traffic' ? '🚗' : '⚠️';
  return L.divIcon({
    className: 'citizen-report-marker',
    html: `
      <div style="
        position:relative;width:24px;height:24px;border-radius:50%;
        background:#f59e0b;border:2px solid #ffffff;
        box-shadow:0 0 10px rgba(245,158,11,0.8);
        display:flex;align-items:center;justify-content:center;
        font-size:12px;
      ">${emoji}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function createIcon(level: StatusLevel, isSelected: boolean, floodLevel: 'LOW' | 'MEDIUM' | 'HIGH', isLowLying?: boolean): L.DivIcon {
  let color = levelColors[level];
  if (isLowLying && floodLevel === 'HIGH') {
    color = '#ef4444';
  } else if (isLowLying && floodLevel === 'MEDIUM' && level === 'good') {
    color = '#f59e0b';
  }

  const glow = levelGlow[level];
  const size = isSelected ? 26 : 20;
  return L.divIcon({
    className: 'city-zone-marker',
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.35;
          animation:pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:3px;border-radius:50%;
          background:${color};
          box-shadow:0 0 12px 2px ${glow};
          border:2px solid rgba(255,255,255,0.85);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function CityMap({ zones, onZoneSelect, selectedZoneId, scenario, iotState, citizenReports = [] }: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const reportMarkersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const onSelectRef = useRef(onZoneSelect);
  onSelectRef.current = onZoneSelect;

  const flood = useFloodRisk();
  const isHighFlood = flood.riskLevel === 'HIGH';
  const { detourPolyline, detourName, distanceKm, isDetourActive } = useRouteGuidance(isHighFlood);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [8.495, 76.955],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    // Fix tile rendering after container becomes visible
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      reportMarkersRef.current = [];
      circlesRef.current = [];
      polylineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers, report markers, circles, and polyline
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    reportMarkersRef.current.forEach((rm) => rm.remove());
    reportMarkersRef.current = [];

    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Render Flood-Prone Zone Circle Overlays
    const floodStyle = floodRiskColors[flood.riskLevel];
    FLOOD_PRONE_ZONES.forEach((area) => {
      const circle = L.circle(area.position, {
        radius: area.radiusMeters,
        color: floodStyle.color,
        weight: flood.riskLevel === 'HIGH' ? 2 : 1,
        fillColor: floodStyle.fill,
        fillOpacity: floodStyle.fillOpacity,
      }).addTo(map);

      circle.bindTooltip(`
        <div style="font-weight:700;font-size:11px;color:#0f172a;">${area.name}</div>
        <div style="font-size:10px;color:#475569;">Basin: ${area.riverBasin}</div>
        <div style="font-size:10px;font-weight:800;color:${floodStyle.color};margin-top:2px;">
          FLOOD RISK: ${flood.riskLevel}
        </div>
      `, { direction: 'top', opacity: 0.9 });

      circlesRef.current.push(circle);
    });

    // Render OSRM Alternate Detour Polyline when flood risk is HIGH
    if (isDetourActive && detourPolyline.length > 0) {
      const pLine = L.polyline(detourPolyline, {
        color: '#38bdf8',
        weight: 5,
        dashArray: '8, 8',
        lineCap: 'round',
      }).addTo(map);

      pLine.bindTooltip(`
        <div style="font-weight:700;font-size:11px;color:#0369a1;">OSRM Alternate Detour Corridor</div>
        <div style="font-size:10px;color:#0f172a;">${detourName} (${distanceKm} km)</div>
      `, { direction: 'center', opacity: 0.95 });

      polylineRef.current = pLine;
    }

    // Render Citizen Incident Report Markers
    citizenReports.forEach((rep) => {
      const rMarker = L.marker(rep.position, {
        icon: createReportIcon(rep.issueType),
      }).addTo(map);

      rMarker.bindTooltip(`
        <div style="font-weight:700;font-size:11px;color:#b45309;">Citizen Report: ${rep.issueType.toUpperCase()}</div>
        <div style="font-size:11px;color:#0f172a;">${rep.zoneName}</div>
        <div style="font-size:10px;color:#475569;">"${rep.description}"</div>
        <div style="font-size:9px;color:#64748b;margin-top:2px;">${new Date(rep.timestamp).toLocaleTimeString()}</div>
      `, { direction: 'top', opacity: 0.95 });

      reportMarkersRef.current.push(rMarker);
    });

    // Render Zone Markers
    zones.forEach((zone) => {
      const isSelected = zone.id === selectedZoneId;
      const marker = L.marker(zone.position, {
        icon: createIcon(zone.level, isSelected, flood.riskLevel, zone.isLowLying),
      }).addTo(map);

      const zonePred = scenario ? predictZoneRisk(zone, scenario, iotState) : null;
      const mlRiskColor = zonePred ? mlRiskColorMap[zonePred.riskLevel] : '#64748b';

      const tooltipContent = `
        <div style="font-weight:700;font-size:13px;color:#0f172a;">${zone.name}</div>
        <div style="font-size:12px;color:#475569;margin-top:2px;">${zone.summary}</div>
        ${zone.isLowLying ? `<div style="font-size:10px;font-weight:700;color:#0284c7;margin-top:2px;">&bull; Low-Lying Flood Zone</div>` : ''}
        ${
          zonePred
            ? `<div style="margin-top:6px;padding-top:4px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:11px;font-weight:800;color:${mlRiskColor};letter-spacing:0.02em;">
                  ML PREDICTED RISK: ${zonePred.riskLevel}
                </span>
                <span style="font-size:10px;color:#64748b;font-family:monospace;">${zonePred.confidence}%</span>
               </div>`
            : ''
        }
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -12],
        opacity: 0.95,
        className: 'city-tooltip',
      });

      marker.on('click', () => {
        onSelectRef.current?.(zone);
      });

      markersRef.current[zone.id] = marker;
    });
  }, [zones, selectedZoneId, scenario, iotState, flood, citizenReports, isDetourActive, detourPolyline, detourName, distanceKm]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-2xl" />

      {/* Suggested Detour Panel Overlay */}
      {isDetourActive && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2.5 rounded-xl border border-sky-500/50 bg-slate-900/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 ring-1 ring-sky-400">
            <Navigation className="h-4 w-4 text-sky-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              OSRM Alternate Detour
            </p>
            <p className="text-xs font-medium text-slate-200">{detourName}</p>
            <p className="text-[10px] text-slate-400">Distance: {distanceKm} km &middot; Bypasses Flooded Zone</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CityMap);

