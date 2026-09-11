export type StatusLevel = 'good' | 'caution' | 'warning';

export interface ZoneData {
  id: string;
  name: string;
  position: [number, number];
  level: StatusLevel;
  summary: string;
  details: string[];
  isLowLying?: boolean;
}

export interface FloodProneArea {
  id: string;
  name: string;
  position: [number, number];
  riverBasin: string;
  radiusMeters: number;
}

export const FLOOD_PRONE_ZONES: FloodProneArea[] = [
  {
    id: 'killi-river',
    name: 'Killi River Basin (Pazhavangadi / Thampanoor)',
    position: [8.4880, 76.9510],
    riverBasin: 'Killi River',
    radiusMeters: 600,
  },
  {
    id: 'parvathy-puthanar',
    name: 'Parvathy Puthanar Canal (Vallakkadavu)',
    position: [8.4720, 76.9320],
    riverBasin: 'Parvathy Puthanar',
    radiusMeters: 700,
  },
  {
    id: 'karamana-river',
    name: 'Karamana River Basin (Attukal / Karamana)',
    position: [8.4750, 76.9650],
    riverBasin: 'Karamana River',
    radiusMeters: 800,
  },
  {
    id: 'amayizhanchan-canal',
    name: 'Amayizhanchan Canal / Thampanoor Basin',
    position: [8.4900, 76.9525],
    riverBasin: 'Amayizhanchan Canal',
    radiusMeters: 500,
  },
  {
    id: 'kannammoola-drain',
    name: 'Kannammoola Canal Basin',
    position: [8.5020, 76.9380],
    riverBasin: 'Kannammoola Drain',
    radiusMeters: 550,
  },
];

export interface MetricCard {
  level: StatusLevel;
  value: string;
  label: string;
  sublabel: string;
  percent?: number;
}

export interface Advisory {
  level: StatusLevel;
  emoji: string;
  text: string;
  time: string;
}

export interface IotSimulation {
  pirDetected: boolean;
  temperature: number;
  humidity: number;
  lcdText: string;
  ledState: 'green' | 'red';
  buzzerActive: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  healthScore: number;
  healthLabel: string;
  healthLevel: StatusLevel;
  rainfallMmPerHr: number;
  sustainedMinutes: number;
  crowd: MetricCard;
  traffic: MetricCard;
  weather: MetricCard;
  roadSafety: MetricCard;
  zones: ZoneData[];
  advisories: Advisory[];
  iot: IotSimulation;
}

const good: StatusLevel = 'good';
const caution: StatusLevel = 'caution';
const warning: StatusLevel = 'warning';

export const SCENARIOS: Record<string, Scenario> = {
  normal: {
    id: 'normal',
    name: 'Normal Day',
    description: 'Typical weekday conditions across the city',
    healthScore: 85,
    healthLabel: 'Normal Conditions',
    healthLevel: good,
    rainfallMmPerHr: 0,
    sustainedMinutes: 0,
    crowd: {
      level: caution,
      value: '62%',
      label: 'Moderate',
      sublabel: 'Bus stands moderately busy',
      percent: 62,
    },
    traffic: {
      level: good,
      value: 'Smooth',
      label: 'Low Risk',
      sublabel: 'MG Road flowing freely',
      percent: 25,
    },
    weather: {
      level: good,
      value: '29°C',
      label: 'Clear Sky',
      sublabel: 'No flood warning',
    },
    roadSafety: {
      level: good,
      value: 'Good',
      label: 'Safe Roads',
      sublabel: 'No major incidents reported',
      percent: 88,
    },
    zones: [
      {
        id: 'statue',
        name: 'Statue / East Fort',
        position: [8.4825, 76.9450],
        level: good,
        summary: 'All clear in the heritage area',
        isLowLying: true,
        details: [
          'Pedestrian traffic is light',
          'Parking availability is good',
          'No weather-related risks',
        ],
      },
      {
        id: 'thampanoor',
        name: 'Thampanoor',
        position: [8.4900, 76.9525],
        level: caution,
        summary: 'Busy around the central bus station',
        isLowLying: true,
        details: [
          'Bus stand crowds are moderate',
          'Auto-rickshaw queues are manageable',
          'Traffic is moving but slow near the station',
        ],
      },
      {
        id: 'kowdiar',
        name: 'Kowdiar',
        position: [8.5100, 76.9700],
        level: good,
        summary: 'Calm residential zone',
        isLowLying: false,
        details: [
          'Traffic is light on Kowdiar Road',
          'No congestion at the junction',
          'Road conditions are good',
        ],
      },
      {
        id: 'palayam',
        name: 'Palayam',
        position: [8.4875, 76.9500],
        level: caution,
        summary: 'Moderate activity near the market',
        isLowLying: true,
        details: [
          'Market crowd is moderate',
          'Street vendors are active',
          'Parking is filling up',
        ],
      },
    ],
    iot: {
      pirDetected: false,
      temperature: 29,
      humidity: 55,
      lcdText: 'Showing: City Health Score',
      ledState: 'green',
      buzzerActive: false,
    },
    advisories: [
      {
        level: good,
        emoji: '🟢',
        text: 'Traffic moving normally at East Fort',
        time: 'Just now',
      },
      {
        level: good,
        emoji: '🟢',
        text: 'All city bus services running on schedule',
        time: '5 min ago',
      },
      {
        level: caution,
        emoji: '🟡',
        text: 'Expect moderate crowds at Thampanoor bus stand',
        time: '12 min ago',
      },
      {
        level: good,
        emoji: '🟢',
        text: 'Weather is clear, no rain expected in the next few hours',
        time: '20 min ago',
      },
    ],
  },
  monsoon: {
    id: 'monsoon',
    name: 'Heavy Monsoon Rain',
    description: 'Intense rainfall affecting the city',
    healthScore: 48,
    healthLabel: 'Difficult Conditions',
    healthLevel: warning,
    rainfallMmPerHr: 65,
    sustainedMinutes: 90,
    crowd: {
      level: warning,
      value: '88%',
      label: 'Very High',
      sublabel: 'Bus stands overcrowded with stranded commuters',
      percent: 88,
    },
    traffic: {
      level: warning,
      value: 'Heavy Slowdown',
      label: 'High Risk',
      sublabel: 'MG Road and East Fort heavily congested',
      percent: 78,
    },
    weather: {
      level: warning,
      value: '24°C',
      label: 'Heavy Rain',
      sublabel: 'Flood warning active in low-lying areas',
    },
    roadSafety: {
      level: warning,
      value: 'Poor',
      label: 'Hazardous',
      sublabel: 'Waterlogging and poor visibility on major roads',
      percent: 35,
    },
    zones: [
      {
        id: 'statue',
        name: 'Statue / East Fort',
        position: [8.4825, 76.9450],
        level: warning,
        summary: 'Waterlogging reported near East Fort',
        isLowLying: true,
        details: [
          'Roads are waterlogged near the fort entrance',
          'Visibility is very poor for drivers',
          'Pedestrians are advised to avoid the area',
        ],
      },
      {
        id: 'thampanoor',
        name: 'Thampanoor',
        position: [8.4900, 76.9525],
        level: warning,
        summary: 'Severe flooding near the bus station',
        isLowLying: true,
        details: [
          'Bus stand area is flooded with standing water',
          'Many buses are delayed or cancelled',
          'Commuters are stranded — seek shelter',
        ],
      },
      {
        id: 'kowdiar',
        name: 'Kowdiar',
        position: [8.5100, 76.9700],
        level: caution,
        summary: 'Heavy rain but roads are draining',
        isLowLying: false,
        details: [
          'Rain is heavy but Kowdiar Road is passable',
          'Some water pooling near the junction',
          'Drive slowly and keep headlights on',
        ],
      },
      {
        id: 'palayam',
        name: 'Palayam',
        position: [8.4875, 76.9500],
        level: warning,
        summary: 'Market area is flooded',
        isLowLying: true,
        details: [
          'Palayam market is under water in sections',
          'Street vendors have cleared out',
          'Avoid this route — find alternate roads',
        ],
      },
    ],
    iot: {
      pirDetected: true,
      temperature: 24,
      humidity: 88,
      lcdText: 'ALERT: High crowd + humidity',
      ledState: 'red',
      buzzerActive: true,
    },
    advisories: [
      {
        level: warning,
        emoji: '⚠️',
        text: 'Flood alert near Kowdiar area — consider alternate route',
        time: 'Just now',
      },
      {
        level: warning,
        emoji: '🔴',
        text: 'Thampanoor bus stand flooded — buses delayed or cancelled',
        time: '3 min ago',
      },
      {
        level: warning,
        emoji: '⚠️',
        text: 'Waterlogging on MG Road — drive very slowly',
        time: '8 min ago',
      },
      {
        level: caution,
        emoji: '🟡',
        text: 'Carry an umbrella and avoid low-lying areas today',
        time: '15 min ago',
      },
    ],
  },
  rush: {
    id: 'rush',
    name: 'Evening Rush Hour',
    description: 'Peak commuter traffic between 5 PM and 8 PM',
    healthScore: 62,
    healthLabel: 'Congested Conditions',
    healthLevel: caution,
    rainfallMmPerHr: 5,
    sustainedMinutes: 15,
    crowd: {
      level: warning,
      value: '91%',
      label: 'Very High',
      sublabel: 'Bus stands packed with evening commuters',
      percent: 91,
    },
    traffic: {
      level: warning,
      value: 'Heavy Congestion',
      label: 'High Risk',
      sublabel: 'MG Road at a near standstill',
      percent: 72,
    },
    weather: {
      level: good,
      value: '27°C',
      label: 'Partly Cloudy',
      sublabel: 'No flood warning',
    },
    roadSafety: {
      level: caution,
      value: 'Moderate',
      label: 'Caution',
      sublabel: 'Increased accident risk due to heavy traffic',
      percent: 58,
    },
    zones: [
      {
        id: 'statue',
        name: 'Statue / East Fort',
        position: [8.4825, 76.9450],
        level: caution,
        summary: 'Heavy pedestrian and vehicle traffic',
        isLowLying: true,
        details: [
          'Large crowds around the heritage area',
          'Traffic is crawling near East Fort junction',
          'Parking is completely full',
        ],
      },
      {
        id: 'thampanoor',
        name: 'Thampanoor',
        position: [8.4900, 76.9525],
        level: warning,
        summary: 'Gridlock around the central bus station',
        isLowLying: true,
        details: [
          'Bus stand is packed with commuters',
          'Traffic is at a standstill on Station Road',
          'Expect long waits for buses and autos',
        ],
      },
      {
        id: 'kowdiar',
        name: 'Kowdiar',
        position: [8.5100, 76.9700],
        level: caution,
        summary: 'Slow-moving traffic at the junction',
        isLowLying: false,
        details: [
          'Kowdiar junction is congested',
          'Vehicles are moving but very slowly',
          'Allow extra time for your journey',
        ],
      },
      {
        id: 'palayam',
        name: 'Palayam',
        position: [8.4875, 76.9500],
        level: caution,
        summary: 'Busy market area with slow traffic',
        isLowLying: true,
        details: [
          'Evening shoppers are crowding the market',
          'Traffic is slow on Palayam Road',
          'Auto-rickshaws are in high demand',
        ],
      },
    ],
    iot: {
      pirDetected: true,
      temperature: 27,
      humidity: 65,
      lcdText: 'Crowd activity detected',
      ledState: 'green',
      buzzerActive: false,
    },
    advisories: [
      {
        level: warning,
        emoji: '🔴',
        text: 'Heavy congestion at Thampanoor — expect 20+ minute delays',
        time: 'Just now',
      },
      {
        level: caution,
        emoji: '🟡',
        text: 'MG Road is slow-moving — consider public transport',
        time: '4 min ago',
      },
      {
        level: warning,
        emoji: '⚠️',
        text: 'Bus stands are overcrowded — be patient while boarding',
        time: '10 min ago',
      },
      {
        level: caution,
        emoji: '🟡',
        text: 'Drive carefully — increased traffic accident risk this evening',
        time: '18 min ago',
      },
    ],
  },
};

export const SCENARIO_ORDER: string[] = ['normal', 'monsoon', 'rush'];
