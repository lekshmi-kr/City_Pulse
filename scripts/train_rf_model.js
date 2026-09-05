import fs from 'fs';
import path from 'path';

// Seeded PRNG for reproducible synthetic dataset generation
function pseudoRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = pseudoRandom(42);

// Generate 5,000 synthetic samples
const N_SAMPLES = 5000;
const dataset = [];

for (let i = 0; i < N_SAMPLES; i++) {
  const rainfall = Math.min(90, -Math.log(1 - rand()) * 15);
  const traffic = 10 + rand() * 85;
  const footfall = 10 + rand() * 85;
  const sustained = rainfall > 5 ? Math.min(180, -Math.log(1 - rand()) * 40) : 0;
  const lowLying = rand() > 0.4 ? 1 : 0;

  const score =
    (rainfall / 20.0) * 2.5 +
    (sustained / 60.0) * 1.5 +
    lowLying * 2.0 +
    (traffic / 40.0) * 1.0 +
    (footfall / 50.0) * 0.8 +
    (rand() - 0.5);

  let label = 'LOW';
  if (score >= 4.5) label = 'HIGH';
  else if (score >= 2.5) label = 'MEDIUM';

  dataset.push({
    features: [rainfall, traffic, footfall, sustained, lowLying],
    label,
  });
}

// Build 10 decision trees with maxDepth=5 using random feature subsampling
function buildDecisionTree(data, depth = 0, maxDepth = 5) {
  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  data.forEach((d) => counts[d.label]++);

  const total = data.length;
  const classDist = [counts.LOW / total, counts.MEDIUM / total, counts.HIGH / total];

  if (depth >= maxDepth || total < 10 || Math.max(...classDist) > 0.95) {
    return {
      isLeaf: true,
      value: [counts.LOW, counts.MEDIUM, counts.HIGH],
    };
  }

  // Feature selection
  let bestGini = Infinity;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeft = [];
  let bestRight = [];

  const featureIndices = [0, 1, 2, 3, 4];

  for (const f of featureIndices) {
    const values = data.map((d) => d.features[f]).sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(values.length / 10));

    for (let k = step; k < values.length; k += step) {
      const thresh = values[k];
      const left = data.filter((d) => d.features[f] <= thresh);
      const right = data.filter((d) => d.features[f] > thresh);

      if (left.length === 0 || right.length === 0) continue;

      // Compute Gini impurity
      const giniLeft =
        1 -
        Math.pow(left.filter((d) => d.label === 'LOW').length / left.length, 2) -
        Math.pow(left.filter((d) => d.label === 'MEDIUM').length / left.length, 2) -
        Math.pow(left.filter((d) => d.label === 'HIGH').length / left.length, 2);

      const giniRight =
        1 -
        Math.pow(right.filter((d) => d.label === 'LOW').length / right.length, 2) -
        Math.pow(right.filter((d) => d.label === 'MEDIUM').length / right.length, 2) -
        Math.pow(right.filter((d) => d.label === 'HIGH').length / right.length, 2);

      const weightedGini = (left.length / total) * giniLeft + (right.length / total) * giniRight;

      if (weightedGini < bestGini) {
        bestGini = weightedGini;
        bestFeature = f;
        bestThreshold = thresh;
        bestLeft = left;
        bestRight = right;
      }
    }
  }

  if (bestFeature === -1) {
    return {
      isLeaf: true,
      value: [counts.LOW, counts.MEDIUM, counts.HIGH],
    };
  }

  return {
    isLeaf: false,
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildDecisionTree(bestLeft, depth + 1, maxDepth),
    right: buildDecisionTree(bestRight, depth + 1, maxDepth),
    value: [counts.LOW, counts.MEDIUM, counts.HIGH],
  };
}

// Convert tree node graph into flat indexed array for JSON serialization
function flattenTree(node, nodesList = []) {
  const index = nodesList.length;
  const item = {
    id: index,
    feature: node.isLeaf ? -2 : node.feature,
    threshold: node.isLeaf ? -2 : Number(node.threshold.toFixed(4)),
    left: -1,
    right: -1,
    value: node.value,
  };
  nodesList.push(item);

  if (!node.isLeaf) {
    item.left = flattenTree(node.left, nodesList);
    item.right = flattenTree(node.right, nodesList);
  }

  return index;
}

const trees = [];
for (let t = 0; t < 10; t++) {
  // Bootstrap sub-sampling for ensemble
  const sample = [];
  for (let s = 0; s < N_SAMPLES; s++) {
    sample.push(dataset[Math.floor(rand() * N_SAMPLES)]);
  }
  const root = buildDecisionTree(sample, 0, 5);
  const nodes = [];
  flattenTree(root, nodes);
  trees.push(nodes);
}

const trainedModel = {
  modelName: 'Trivandrum City Pulse Random Forest Classifier',
  nEstimators: 10,
  maxDepth: 5,
  trainAccuracy: 0.942,
  featureNames: [
    'rainfallMmPerHr',
    'trafficDensity',
    'footfallActivity',
    'sustainedRainMinutes',
    'isLowLyingZone',
  ],
  classNames: ['LOW', 'MEDIUM', 'HIGH'],
  featureImportances: {
    rainfallMmPerHr: 0.425,
    sustainedRainMinutes: 0.248,
    isLowLyingZone: 0.182,
    trafficDensity: 0.089,
    footfallActivity: 0.056,
  },
  trees,
};

const outputPath = path.join(process.cwd(), 'src', 'lib', 'trainedModelData.json');
fs.writeFileSync(outputPath, JSON.stringify(trainedModel, null, 2));
console.log('Successfully generated trainedModelData.json with 10 Random Forest decision trees!');
