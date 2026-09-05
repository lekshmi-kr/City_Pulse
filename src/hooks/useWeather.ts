import { useState, useEffect, useCallback } from 'react';

export interface LiveWeatherData {
  temperature: number; // °C
  weatherCode: number;
  windSpeed: number; // km/h
  isDay: boolean;
  rainMmPerHr: number;
  description: string;
  source: 'OPEN_METEO_API';
}

const TRIVANDRUM_LAT = 8.5241;
const TRIVANDRUM_LNG = 76.9366;

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 80 && code <= 82) return 'Heavy Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Overcast';
}

export function useWeather() {
  const [data, setData] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${TRIVANDRUM_LAT}&longitude=${TRIVANDRUM_LNG}&current_weather=true&hourly=rain`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather API returned status ${res.status}`);
      }
      const json = await res.json();
      const current = json.current_weather;
      const hourlyRain = json.hourly?.rain?.[0] ?? 0;

      setData({
        temperature: Math.round(current.temperature),
        weatherCode: current.weathercode,
        windSpeed: Math.round(current.windspeed),
        isDay: current.is_day === 1,
        rainMmPerHr: Math.max(0, Math.round(hourlyRain * 10) / 10),
        description: getWeatherDescription(current.weathercode),
        source: 'OPEN_METEO_API',
      });
      setError(null);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Poll every 5 minutes (300,000 ms)
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weatherData: data, loading, error, lastFetched, refetch: fetchWeather };
}
