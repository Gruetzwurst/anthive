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
