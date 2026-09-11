import React, { createContext, useContext, useMemo } from 'react';

export type FloodRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FloodRiskParams {
  rainfallMmPerHr: number;
  sustainedMinutes: number;
  lowLyingZone: boolean;
  citizenWaterloggingReportsCount?: number;
}

export interface FloodRiskResult {
  riskLevel: FloodRiskLevel;
  score: number;
  rainfallMmPerHr: number;
  sustainedMinutes: number;
  lowLyingZone: boolean;
  signalFusionBoosted: boolean;
}

export function computeFloodRisk({
  rainfallMmPerHr,
  sustainedMinutes,
  lowLyingZone,
  citizenWaterloggingReportsCount = 0,
}: FloodRiskParams): FloodRiskResult {
  let score = 0;

  // Rainfall threshold scoring
  if (rainfallMmPerHr > 50) {
    score += 3;
  } else if (rainfallMmPerHr > 20) {
    score += 2;
  } else if (rainfallMmPerHr > 10) {
    score += 1;
  }

  // Duration scoring
  if (sustainedMinutes > 60) {
    score += 1;
  }

  // Zone elevation scoring
  if (lowLyingZone) {
    score += 1;
  }

  // Signal Fusion Heuristic: If 2+ citizen reports of "waterlogging" exist for the zone,
  // bump flood risk score by +1 level (fusion of crowdsourced citizen sensor data).
  const signalFusionBoosted = citizenWaterloggingReportsCount >= 2;
  if (signalFusionBoosted) {
    score += 1;
  }

  // Classify risk level
  let riskLevel: FloodRiskLevel = 'LOW';
  if (score >= 4) {
    riskLevel = 'HIGH';
  } else if (score >= 2) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    score,
    rainfallMmPerHr,
    sustainedMinutes,
    lowLyingZone,
    signalFusionBoosted,
  };
}

const FloodRiskContext = createContext<FloodRiskResult | null>(null);

export interface FloodRiskProviderProps extends FloodRiskParams {
  children: React.ReactNode;
}

export function FloodRiskProvider({
  rainfallMmPerHr,
  sustainedMinutes,
  lowLyingZone,
  citizenWaterloggingReportsCount = 0,
  children,
}: FloodRiskProviderProps) {
  // Performance optimization: memoize calculated flood risk based ONLY on exact input primitives
  const floodRisk = useMemo(
    () => computeFloodRisk({ rainfallMmPerHr, sustainedMinutes, lowLyingZone, citizenWaterloggingReportsCount }),
    [rainfallMmPerHr, sustainedMinutes, lowLyingZone, citizenWaterloggingReportsCount]
  );

  return (
    <FloodRiskContext.Provider value={floodRisk}>
      {children}
    </FloodRiskContext.Provider>
  );
}

export function useFloodRisk(): FloodRiskResult {
  const context = useContext(FloodRiskContext);
  if (!context) {
    // Default fallback if used outside provider
    return computeFloodRisk({ rainfallMmPerHr: 0, sustainedMinutes: 0, lowLyingZone: false });
  }
  return context;
}
