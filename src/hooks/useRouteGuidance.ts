import { useState, useEffect } from 'react';

export interface RouteGuidanceResult {
  detourPolyline: [number, number][];
  detourName: string;
  distanceKm: number;
  isDetourActive: boolean;
}

// Default fallback detour polyline around East Fort & Thampanoor low-lying zones (via Kowdiar / Palayam corridor)
const FALLBACK_DETOUR_POLYLINE: [number, number][] = [
  [8.4825, 76.9450], // East Fort Start
  [8.4875, 76.9500], // Palayam Bypass
  [8.4980, 76.9600], // Museum Junction
  [8.5100, 76.9700], // Kowdiar Junction
  [8.5020, 76.9780], // Vellayambalam Bypass
];

export function useRouteGuidance(isHighFlood: boolean): RouteGuidanceResult {
  const [polyline, setPolyline] = useState<[number, number][]>(FALLBACK_DETOUR_POLYLINE);
  const [distanceKm, setDistanceKm] = useState<number>(4.2);

  useEffect(() => {
    if (!isHighFlood) return;

    // Fetch live route from OSRM Public Demo API
    const fetchOSRMRoute = async () => {
      try {
        // Start: East Fort [8.4825, 76.9450], End: Kowdiar [8.5100, 76.9700]
        const url = 'https://router.project-osrm.org/route/v1/driving/76.9450,8.4825;76.9700,8.5100?overview=full&geometries=geojson';
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM API request failed');
        const json = await res.json();
        if (json.routes && json.routes[0]) {
          const coordsGeoJSON = json.routes[0].geometry.coordinates; // [[lng, lat], ...]
          const latLngCoords: [number, number][] = coordsGeoJSON.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setPolyline(latLngCoords);
          setDistanceKm(Math.round((json.routes[0].distance / 1000) * 10) / 10);
        }
      } catch (err) {
        // Fallback to static detour corridor if OSRM is offline / rate limited
        setPolyline(FALLBACK_DETOUR_POLYLINE);
        setDistanceKm(4.2);
      }
    };

    fetchOSRMRoute();
  }, [isHighFlood]);

  return {
    detourPolyline: polyline,
    detourName: 'Bypass Thampanoor via Kowdiar-Palayam Corridor',
    distanceKm,
    isDetourActive: isHighFlood,
  };
}
