import { useMemo } from 'react';
import type { TrendDataPoint } from '@/components/HistoricalTrendChart';

export interface FloodForecastResult {
  forecastText: string | null;
  targetRisk: 'MEDIUM' | 'HIGH' | null;
  estimatedMinutes: number | null;
  slope: number;
}

export function useFloodForecast(trendBuffer: TrendDataPoint[]): FloodForecastResult {
  return useMemo(() => {
    if (!trendBuffer || trendBuffer.length < 3) {
      return { forecastText: null, targetRisk: null, estimatedMinutes: null, slope: 0 };
    }

    const n = trendBuffer.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = trendBuffer[i].floodScore;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
      return { forecastText: null, targetRisk: null, estimatedMinutes: null, slope: 0 };
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const currentScore = trendBuffer[n - 1].floodScore;

    // Only show forecast if there is a clear positive upward trend (slope > 0.05)
    if (slope <= 0.05) {
      return { forecastText: null, targetRisk: null, estimatedMinutes: null, slope };
    }

    let targetRisk: 'MEDIUM' | 'HIGH' | null = null;
    let targetScore = 0;

    if (currentScore < 2) {
      targetRisk = 'MEDIUM';
      targetScore = 2;
    } else if (currentScore < 4) {
      targetRisk = 'HIGH';
      targetScore = 4;
    } else {
      // Already at maximum HIGH risk
      return { forecastText: null, targetRisk: null, estimatedMinutes: null, slope };
    }

    // Extrapolate time to next threshold: each step in trendBuffer represents ~3 minutes
    const stepsNeeded = (targetScore - currentScore) / slope;
    const estimatedMinutes = Math.max(5, Math.round(stepsNeeded * 3));

    let timeStr = `${estimatedMinutes}m`;
    if (estimatedMinutes >= 60) {
      const hrs = (estimatedMinutes / 60).toFixed(1);
      timeStr = `${hrs}h`;
    }

    const forecastText = `Trending toward ${targetRisk} in ~${timeStr}`;

    return {
      forecastText,
      targetRisk,
      estimatedMinutes,
      slope,
    };
  }, [trendBuffer]);
}
