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
