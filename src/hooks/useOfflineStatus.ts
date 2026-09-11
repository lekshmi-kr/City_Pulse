import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'trivandrum_pulse_last_state';

export interface CachedState {
  timestamp: string;
  scenarioId: string;
  healthScore: number;
  floodRiskLevel: string;
}

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastKnownTimestamp, setLastKnownTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Read initial cached timestamp
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: CachedState = JSON.parse(raw);
        setLastKnownTimestamp(new Date(parsed.timestamp).toLocaleTimeString());
      }
    } catch (e) {
      // Ignore storage errors
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveStateToCache = useCallback((scenarioId: string, healthScore: number, floodRiskLevel: string) => {
    try {
      const stateObj: CachedState = {
        timestamp: new Date().toISOString(),
        scenarioId,
        healthScore,
        floodRiskLevel,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(stateObj));
      setLastKnownTimestamp(new Date(stateObj.timestamp).toLocaleTimeString());
    } catch (e) {
      // Storage quota or error
    }
  }, []);

  return {
    isOffline,
    lastKnownTimestamp,
    saveStateToCache,
  };
}
