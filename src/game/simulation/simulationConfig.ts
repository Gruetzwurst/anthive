// All numbers here are provisional A1 test values, not final game balance.
export const SIMULATION_CONFIG = {
  secondsPerGameDay: 600,
  foodSource: {
    capacity: 200,
    initialAmount: 200,
    regenerationPerDay: 20,
    recoveryDays: 2,
  },
  storageCapacityPerTile: {
    food: 10,
    water: 10,
    buildingMaterial: 8,
  },
};

export type SimulationConfig = typeof SIMULATION_CONFIG;

// A2 transport heuristics; provisional values, not final colony balance.
export const GATHERING_CONFIG = {
  speed: 78,
  carryCapacity: 5,
  interactionSeconds: 0.25,
  retrySeconds: 1,
  priorityWeight: 2,
  storeCongestionSeconds: 1,
  storeFullnessSeconds: 1,
};
export type GatheringConfig = typeof GATHERING_CONFIG;
export const GATHERING_PREVIEW_COUNT = 7;
export const GATHERING_MAX_STEP_SECONDS = 0.1;

// A3 provisional balance. Only the 5% worker loss from day 7 was explicitly
// selected by the user; the other numbers remain adjustable testing defaults.
export const ADULT_SUPPLY_CONFIG = {
  workerPerDay: { food: 1, water: 1 },
  queenPerDay: { food: 1, water: 1 },
  restingConsumptionFactor: 0.8,
  warningDays: 2,
  severeAfterDays: 4,
  mortalityAfterDays: 6,
  reducedWorkFactor: 0.85,
  reducedEggFactor: 0.75,
  severeWorkFactor: 0.65,
  severeEggFactor: 0,
  recoveryDays: 1,
  workerLossFractionPerDay: 0.05,
};
export type AdultSupplyConfig = typeof ADULT_SUPPLY_CONFIG;

// B1 user-selected provisional efficiency for explicitly assigned foreign work.
export const WORKFORCE_CONFIG = { foreignWorkEfficiency: 0.5 };

// B2 editable test values. Deep rock: user selected highest + lowest existing
// values in each column (30+6 seconds, 4+1 material) on 2026-10-22.
export const EXCAVATION_CONFIG = {
  speed: 78,
  carryCapacity: 5,
  interactionSeconds: 0.3,
  maxStepSeconds: 0.1,
  terrain: {
    soil: { seconds: 6, yield: 1 },
    topsoil: { seconds: 6, yield: 1 },
    compactEarth: { seconds: 12, yield: 2 },
    clay: { seconds: 18, yield: 3 },
    stone: { seconds: 30, yield: 4 },
    stoneLayer: { seconds: 30, yield: 4 },
    deepRock: { seconds: 36, yield: 5 },
  },
};
export type ExcavationConfig = typeof EXCAVATION_CONFIG;

// Approved construction test values; capacities are activated separately in B5.
export const CONSTRUCTION_CONFIG = {
  startingMaterial: 24,
  furnishingSecondsPerUnit: 2,
  materialPerTile: {
    tunnel: 0, food: 2, water: 2, buildingMaterial: 2,
    'brood-gathering': 3, 'brood-building': 3, 'brood-care': 3, 'brood-combat': 3, rest: 2,
  },
  noticeSeconds: 4,
};

// B5 user-selected, editable test values (2026-10-22).
export const CHAMBER_CONFIG = {
  minimumArea: {
    tunnel: 1, food: 12, water: 12, buildingMaterial: 12,
    'brood-gathering': 20, 'brood-building': 20, 'brood-care': 20, 'brood-combat': 20, rest: 16,
  },
  broodPlacesPerTile: 2,
  restPlacesPerTile: 2,
};

// B6 provisional traffic test values; movement only, never work/capacity bonuses.
export const TRAFFIC_CONFIG = {
  segmentTiles: 4, freeAgentsPerSegment: 4, delayPerExtraAgent: 0.15,
  minimumSpeedFactor: 0.6, refreshSeconds: 0.5,
};
export type TrafficConfig = typeof TRAFFIC_CONFIG;

// C1: user-confirmed provisional egg rate, buffer and allocation test values.
export const QUEEN_CONFIG = {
  eggsPerGameDay: 5,
  bufferCapacity: 50,
  initialQuotas: {gathering: 25, building: 25, care: 25, combat: 25},
  bufferSlowdown: [{fill: 0.75, factor: 0.5}, {fill: 0.9, factor: 0.25}, {fill: 1, factor: 0}],
};
export type QueenConfig = typeof QUEEN_CONFIG;
