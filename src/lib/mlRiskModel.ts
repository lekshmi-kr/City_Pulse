import type { Scenario, ZoneData } from '@/data/scenarios';
import type { IotSensorState } from '@/lib/supabase';
import trainedModel from './trainedModelData.json';

export type MLRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MLFeatureInput {
  trafficDensity: number; // 0-100
  crowdDensity: number; // 0-100
  rainfallIntensity: number; // 0-100 mm/hr
  roadHazardScore: number; // 0-100
  sustainedRainMinutes: number; // 0-180
  isLowLyingZone: boolean;
  pirMotion: boolean;
  temperature: number;
  humidity: number;
  sensorAlert: boolean;
  zoneId?: string;
  zoneVulnerability?: number;
}

export interface TreeVote {
  treeId: number;
  name: string;
  vote: MLRiskLevel;
  primaryFactor: string;
}

export interface MLPredictionResult {
  riskLevel: MLRiskLevel;
  displayLabel: string;
  confidence: number;
  votes: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  treeVotes: TreeVote[];
  topFactors: string[];
  featureImportance: {
    feature: string;
    weight: number;
    value: string;
  }[];
  modelName: string;
  evaluatedAt: string;
}

/**
 * Normalizes input scenario and IoT data into the ML Feature Vector
 */
export function extractMLFeatures(
  scenario: Scenario,
  iotState?: IotSensorState | null,
  zone?: ZoneData | null
): MLFeatureInput {
  const trafficDensity =
    typeof scenario.traffic.percent === 'number'
      ? scenario.traffic.percent
      : scenario.traffic.level === 'warning'
      ? 80
      : scenario.traffic.level === 'caution'
      ? 50
      : 25;

  const crowdDensity =
    typeof scenario.crowd.percent === 'number'
      ? scenario.crowd.percent
      : scenario.crowd.level === 'warning'
      ? 85
      : scenario.crowd.level === 'caution'
      ? 60
      : 30;

  const rainfallIntensity = scenario.rainfallMmPerHr ?? (scenario.id === 'monsoon' ? 65 : scenario.id === 'rush' ? 5 : 0);
  const sustainedRainMinutes = scenario.sustainedMinutes ?? (scenario.id === 'monsoon' ? 90 : scenario.id === 'rush' ? 15 : 0);

  const roadSafetyPercent =
    typeof scenario.roadSafety.percent === 'number'
      ? scenario.roadSafety.percent
      : scenario.roadSafety.level === 'warning'
      ? 35
      : scenario.roadSafety.level === 'caution'
      ? 60
      : 88;
  const roadHazardScore = 100 - roadSafetyPercent;

  const pirMotion = iotState?.pirDetected ?? scenario.iot.pirDetected;
  const temperature = iotState?.temperature ?? scenario.iot.temperature;
  const humidity = iotState?.humidity ?? scenario.iot.humidity;
  const sensorAlert =
    (iotState?.buzzerActive || iotState?.ledState === 'red') ??
    (scenario.iot.buzzerActive || scenario.iot.ledState === 'red');

  const isLowLyingZone = zone?.isLowLying ?? (scenario.zones[0]?.isLowLying ?? true);

  return {
    trafficDensity,
    crowdDensity,
    rainfallIntensity,
    roadHazardScore,
    sustainedRainMinutes,
    isLowLyingZone,
    pirMotion,
    temperature,
    humidity,
    sensorAlert,
    zoneId: zone?.id,
  };
}

/**
 * Traverse single trained Random Forest decision tree
 */
function evaluateTree(nodes: any[], X: number[]): { vote: MLRiskLevel; probabilities: number[] } {
  let curr = 0;
  while (curr >= 0 && curr < nodes.length) {
    const node = nodes[curr];
    if (node.feature === -2 || (node.left === -1 && node.right === -1)) {
      const val = node.value;
      const total = (val[0] || 0) + (val[1] || 0) + (val[2] || 0) || 1;
      const probs = [(val[0] || 0) / total, (val[1] || 0) / total, (val[2] || 0) / total];
      const maxIdx = probs.indexOf(Math.max(...probs));
      const vote: MLRiskLevel = maxIdx === 2 ? 'HIGH' : maxIdx === 1 ? 'MEDIUM' : 'LOW';
      return { vote, probabilities: probs };
    }

    const val = X[node.feature];
    if (val <= node.threshold) {
      curr = node.left;
    } else {
      curr = node.right;
    }
  }
  return { vote: 'LOW', probabilities: [1, 0, 0] };
}

const TREE_NAMES = [
  'Precipitation Threshold Tree',
  'Arterial Traffic Flow Tree',
  'Commuter Footfall Density Tree',
  'Sustained Duration Hydrology Tree',
  'Zone Elevation Topography Tree',
  'Compound Weather-Traffic Synergy Tree',
  'Micro-Zone Vulnerability Tree',
  'Commuter Bottleneck Pressure Tree',
  'Microclimate Temperature-Humidity Tree',
  'Multivariate Random Forest Tree',
];

/**
 * Runs the trained Random Forest Classifier on input features
 */
export function predictRisk(features: MLFeatureInput): MLPredictionResult {
  // Feature vector: [rainfallMmPerHr, trafficDensity, footfallActivity, sustainedRainMinutes, isLowLyingZone]
  const X = [
    features.rainfallIntensity,
    features.trafficDensity,
    features.crowdDensity,
    features.sustainedRainMinutes,
    features.isLowLyingZone ? 1 : 0,
  ];

  const votes = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const treeVotes: TreeVote[] = [];
  const cumulativeProbs = [0, 0, 0];

  trainedModel.trees.forEach((nodes, i) => {
    const { vote, probabilities } = evaluateTree(nodes, X);
    votes[vote]++;
    cumulativeProbs[0] += probabilities[0];
    cumulativeProbs[1] += probabilities[1];
    cumulativeProbs[2] += probabilities[2];

    let factor = 'Precipitation & Traffic within safe limits';
    if (vote === 'HIGH') {
      factor = features.rainfallIntensity > 40
        ? `Heavy precipitation (${features.rainfallIntensity}mm/hr) & low-lying elevation`
        : `Severe traffic gridlock (${features.trafficDensity}%) & crowd surge`;
    } else if (vote === 'MEDIUM') {
      factor = features.rainfallIntensity > 15
        ? `Moderate rainfall (${features.rainfallIntensity}mm/hr)`
        : `Moderate arterial congestion (${features.trafficDensity}%)`;
    }

    treeVotes.push({
      treeId: i + 1,
      name: TREE_NAMES[i % TREE_NAMES.length],
      vote,
      primaryFactor: factor,
    });
  });

  // Winning class prediction based on ensemble tree voting
  let riskLevel: MLRiskLevel = 'LOW';
  if (votes.HIGH > votes.MEDIUM && votes.HIGH > votes.LOW) {
    riskLevel = 'HIGH';
  } else if (votes.MEDIUM >= votes.HIGH && votes.MEDIUM > votes.LOW) {
    riskLevel = 'MEDIUM';
  } else if (votes.LOW >= votes.MEDIUM && votes.LOW >= votes.HIGH) {
    riskLevel = 'LOW';
  } else {
    riskLevel = votes.HIGH >= votes.MEDIUM ? 'HIGH' : 'MEDIUM';
  }

  // Model Confidence from ensemble probability distribution
  const totalTrees = trainedModel.nEstimators;
  const winnerProb = (votes[riskLevel] / totalTrees) * 100;
  const confidence = Math.round(winnerProb);

  // Dynamic Decision Drivers
  const dynamicDrivers: string[] = [];
  if (features.rainfallIntensity >= 50) {
    dynamicDrivers.push(`Monsoon precipitation threshold breached (${features.rainfallIntensity} mm/hr)`);
  } else if (features.rainfallIntensity >= 15) {
    dynamicDrivers.push(`Moderate rainfall showers (${features.rainfallIntensity} mm/hr)`);
  } else {
    dynamicDrivers.push('Precipitation within safe baseline limits');
  }

  if (features.sustainedRainMinutes >= 60) {
    dynamicDrivers.push(`Sustained rainfall duration exceeds threshold (${features.sustainedRainMinutes} mins)`);
  }

  if (features.isLowLyingZone) {
    dynamicDrivers.push('Target location is a designated low-lying flood-prone zone');
  }

  if (features.trafficDensity >= 70) {
    dynamicDrivers.push(`Severe traffic gridlock on MG Road corridor (${features.trafficDensity}% Density)`);
  } else if (features.trafficDensity >= 40) {
    dynamicDrivers.push(`Moderate vehicular congestion (${features.trafficDensity}% Density)`);
  }

  const topFactors = dynamicDrivers.slice(0, 3);

  // Real Scikit-Learn Feature Importances
  const fi = trainedModel.featureImportances as Record<string, number>;
  const featureImportance = [
    {
      feature: 'Precipitation Rate (mm/hr)',
      weight: Math.round(fi.rainfallMmPerHr * 100),
      value: `${features.rainfallIntensity} mm/hr`,
    },
    {
      feature: 'Sustained Duration (mins)',
      weight: Math.round(fi.sustainedRainMinutes * 100),
      value: `${features.sustainedRainMinutes} mins`,
    },
    {
      feature: 'Low-Lying Zone Elevation',
      weight: Math.round(fi.isLowLyingZone * 100),
      value: features.isLowLyingZone ? 'Yes (Flood-Prone)' : 'No (Elevated)',
    },
    {
      feature: 'Traffic Gridlock Density',
      weight: Math.round(fi.trafficDensity * 100),
      value: `${features.trafficDensity}%`,
    },
    {
      feature: 'Footfall Activity Level',
      weight: Math.round(fi.footfallActivity * 100),
      value: `${features.crowdDensity}%`,
    },
  ];

  return {
    riskLevel,
    displayLabel: `ML PREDICTED RISK: ${riskLevel}`,
    confidence,
    votes,
    treeVotes,
    topFactors,
    featureImportance,
    modelName: `${trainedModel.modelName} (${trainedModel.nEstimators}-Tree Bagging)`,
    evaluatedAt: new Date().toLocaleTimeString(),
  };
}

export function predictCityRisk(
  scenario: Scenario,
  iotState?: IotSensorState | null
): MLPredictionResult {
  const features = extractMLFeatures(scenario, iotState, null);
  return predictRisk(features);
}

export function predictZoneRisk(
  zone: ZoneData,
  scenario: Scenario,
  iotState?: IotSensorState | null
): MLPredictionResult {
  const features = extractMLFeatures(scenario, iotState, zone);
  return predictRisk(features);
}
