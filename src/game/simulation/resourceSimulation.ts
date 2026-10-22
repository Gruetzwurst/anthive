import { RESOURCE_KINDS } from '../world/worldTypes.ts';
import type { StartingWorld } from '../world/worldTypes.ts';
import { GameClock } from './gameClock.ts';
import { ResourceSystem } from './resourceSystem.ts';
import { SIMULATION_CONFIG } from './simulationConfig.ts';
import type { SimulationConfig } from './simulationConfig.ts';
import { nonNegativeFinite } from './validation.ts';

// Data adapter only. A2 will connect real transport events to these operations;
// until then no demo ant movement or legacy material counter writes into it.
export function createResourceSimulation(
  world: StartingWorld,
  config: SimulationConfig = SIMULATION_CONFIG,
  initialStocks: Readonly<Record<string, number>> = {},
) {
  const clock = new GameClock(config.secondsPerGameDay);
  const resources = new ResourceSystem();
  for (const resource of RESOURCE_KINDS) {
    nonNegativeFinite(config.storageCapacityPerTile[resource], `storageCapacityPerTile.${resource}`);
  }
  for (const id of Object.keys(initialStocks)) {
    if (!world.storageChambers.some(chamber => chamber.id === id)) {
      throw new Error(`Unknown initial-stock chamber: ${id}`);
    }
  }
  for (const source of world.resources) {
    if (source.kind !== 'foodSource') continue;
    resources.addSource({
      id: source.id, resource: 'food', position: source.position, kind: 'finite',
      capacity: config.foodSource.capacity,
      amount: config.foodSource.initialAmount,
      regenerationPerDay: config.foodSource.regenerationPerDay,
      recoveryDays: config.foodSource.recoveryDays,
    });
  }
  for (const pond of world.decorations.filter(decoration => decoration.kind === 'pond')) {
    resources.addSource({ id: pond.id, resource: 'water', kind: 'unlimited', position: pond.position });
  }
  for (const chamber of world.storageChambers) {
    nonNegativeFinite(chamber.areaTiles, 'areaTiles');
    resources.addStore({
      id: chamber.id,
      resource: chamber.resource,
      position: chamber.position,
      capacity: chamber.areaTiles * config.storageCapacityPerTile[chamber.resource],
      amount: initialStocks[chamber.id] ?? 0,
      status: 'operational',
      reachable: true,
    });
  }
  return {
    clock,
    resources,
    advance(realSeconds: number) {
      const step = clock.advance(realSeconds);
      resources.advance(step.elapsedGameDays);
      return step;
    },
  };
}
