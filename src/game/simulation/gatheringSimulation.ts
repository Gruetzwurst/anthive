import type { StartingWorld } from '../world/worldTypes.ts';
import { CollectorNavigation } from '../world/collectorNavigation.ts';
import { createResourceSimulation } from './resourceSimulation.ts';
import { GatheringSystem } from './gatheringSystem.ts';
import { GATHERING_CONFIG, GATHERING_MAX_STEP_SECONDS, GATHERING_PREVIEW_COUNT, SIMULATION_CONFIG } from './simulationConfig.ts';
import type { GatheringConfig, SimulationConfig } from './simulationConfig.ts';
import { nonNegativeFinite } from './validation.ts';

export function createGatheringSimulation(
  world: StartingWorld,
  config: SimulationConfig = SIMULATION_CONFIG,
  gatheringConfig: GatheringConfig = GATHERING_CONFIG,
) {
  const simulation = createResourceSimulation(world, config);
  const navigation = new CollectorNavigation(world);
  const gathering = new GatheringSystem(simulation.resources, navigation, gatheringConfig);
  for (let index = 0; index < GATHERING_PREVIEW_COUNT; index++) {
    gathering.addCollector(`collector-${index}`, {
      x: world.landmarks.nestChamberCenter.x + (index - 3) * 3,
      y: world.landmarks.nestChamberCenter.y + (index % 2) * 3,
    });
  }
  return {
    clock: simulation.clock, resources: simulation.resources, gathering, navigation,
    advance(realSeconds: number) {
      nonNegativeFinite(realSeconds, 'realSeconds');
      // Interleave real regeneration and movement rather than regenerating the
      // whole interval before harvesting. This is still the single A1 clock.
      const slices = Math.ceil(realSeconds / GATHERING_MAX_STEP_SECONDS);
      const stepSeconds = slices ? realSeconds / slices : 0;
      const before = simulation.clock.totalGameDays;
      for (let index = 0; index < slices; index++) {
        const step = simulation.advance(stepSeconds);
        if (step.elapsedGameDays === 0) break;
        gathering.advance(step.elapsedGameDays * simulation.clock.secondsPerGameDay);
      }
      return {
        elapsedGameDays: simulation.clock.totalGameDays - before,
        totalGameDays: simulation.clock.totalGameDays,
        daysCrossed: Math.floor(simulation.clock.totalGameDays) - Math.floor(before),
        dayFraction: simulation.clock.dayFraction,
      };
    },
  };
}
