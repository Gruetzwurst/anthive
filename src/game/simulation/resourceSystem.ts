import { RESOURCE_KINDS } from '../world/worldTypes.ts';
import type { ResourceKind, WorldPoint } from '../world/worldTypes.ts';
import type { ResourceAmount, ResourceSource, ResourceStore, SourceDefinition } from './resourceTypes.ts';
import { nonNegativeFinite } from './validation.ts';

function validateResource(resource: ResourceKind): void {
  if (!(RESOURCE_KINDS as readonly string[]).includes(resource)) {
    throw new TypeError(`Unknown resource: ${resource}`);
  }
}

function validateLocation(location: { id: string; resource: ResourceKind; position: WorldPoint }): void {
  if (!location.id.trim()) throw new TypeError('Resource location needs a non-empty ID');
  validateResource(location.resource);
  nonNegativeFinite(location.position.x, 'position.x');
  nonNegativeFinite(location.position.y, 'position.y');
}

function usable(store: ResourceStore): boolean {
  return store.status === 'operational' && store.reachable;
}

export class ResourceSystem {
  private sources = new Map<string, ResourceSource>();
  private stores = new Map<string, ResourceStore>();

  addSource(definition: SourceDefinition): void {
    validateLocation(definition);
    if (this.sources.has(definition.id)) throw new Error(`Duplicate source ID: ${definition.id}`);
    if (definition.kind === 'finite') {
      for (const key of ['capacity', 'amount', 'regenerationPerDay', 'recoveryDays'] as const) {
        nonNegativeFinite(definition[key], key);
      }
      if (definition.amount > definition.capacity) throw new RangeError('Source stock exceeds capacity');
      this.sources.set(definition.id, {
        ...definition,
        position: { ...definition.position },
        recoveryDaysLeft: definition.amount === 0 ? definition.recoveryDays : 0,
      });
    } else if (definition.kind === 'unlimited') {
      this.sources.set(definition.id, { ...definition, position: { ...definition.position } });
    } else {
      throw new TypeError('Unknown source kind');
    }
  }

  addStore(definition: ResourceStore): void {
    validateLocation(definition);
    if (this.stores.has(definition.id)) throw new Error(`Duplicate store ID: ${definition.id}`);
    nonNegativeFinite(definition.capacity, 'capacity');
    nonNegativeFinite(definition.amount, 'amount');
    if (definition.amount > definition.capacity) throw new RangeError('Store stock exceeds capacity');
    if (!['planned', 'excavated', 'furnishing', 'operational'].includes(definition.status)) {
      throw new TypeError('Unknown store status');
    }
    if (typeof definition.reachable !== 'boolean') throw new TypeError('reachable must be boolean');
    if (definition.status !== 'operational' && definition.amount > 0) {
      throw new RangeError('Unfinished chambers cannot contain usable stock');
    }
    this.stores.set(definition.id, { ...definition, position: { ...definition.position } });
  }

  getSource(id: string): ResourceSource {
    const source = this.requireSource(id);
    return { ...source, position: { ...source.position } };
  }

  listSources(): ResourceSource[] { return [...this.sources.keys()].map(id => this.getSource(id)); }
  listStores(): ResourceStore[] { return [...this.stores.keys()].map(id => this.getStore(id)); }

  getStore(id: string): ResourceStore {
    const store = this.requireStore(id);
    return { ...store, position: { ...store.position } };
  }

  setStoreReachable(id: string, reachable: boolean): void {
    if (typeof reachable !== 'boolean') throw new TypeError('reachable must be boolean');
    this.requireStore(id).reachable = reachable;
  }

  getStoreTotals(resource: ResourceKind): { amount: number; capacity: number } {
    validateResource(resource);
    let amount = 0, capacity = 0;
    for (const store of this.stores.values()) {
      if (store.resource !== resource || !usable(store)) continue;
      amount += store.amount;
      capacity += store.capacity;
    }
    return { amount, capacity };
  }

  takeFromSource(id: string, requested: number): ResourceAmount {
    nonNegativeFinite(requested, 'requested');
    const source = this.requireSource(id);
    if (source.kind === 'unlimited') return { resource: source.resource, amount: requested };
    const amount = source.recoveryDaysLeft > 0 ? 0 : Math.min(requested, source.amount);
    source.amount -= amount;
    if (amount > 0 && source.amount === 0) source.recoveryDaysLeft = source.recoveryDays;
    return { resource: source.resource, amount };
  }

  depositInStore(id: string, load: ResourceAmount): number {
    nonNegativeFinite(load.amount, 'load.amount');
    validateResource(load.resource);
    const store = this.requireStore(id);
    if (!usable(store) || store.resource !== load.resource) return 0;
    const accepted = Math.min(load.amount, store.capacity - store.amount);
    store.amount += accepted;
    // The caller retains load.amount - accepted; no implicit disposal or transfer.
    return accepted;
  }

  takeFromStore(id: string, requested: number): ResourceAmount {
    nonNegativeFinite(requested, 'requested');
    const store = this.requireStore(id);
    const amount = usable(store) ? Math.min(requested, store.amount) : 0;
    store.amount -= amount;
    return { resource: store.resource, amount };
  }

  advance(gameDays: number): void {
    nonNegativeFinite(gameDays, 'gameDays');
    for (const source of this.sources.values()) {
      if (source.kind === 'unlimited') continue;
      const restingDays = Math.min(gameDays, source.recoveryDaysLeft);
      source.recoveryDaysLeft -= restingDays;
      const activeDays = gameDays - restingDays;
      source.amount = Math.min(source.capacity, source.amount + source.regenerationPerDay * activeDays);
    }
  }

  private requireSource(id: string): ResourceSource {
    const source = this.sources.get(id);
    if (!source) throw new Error(`Unknown source ID: ${id}`);
    return source;
  }

  private requireStore(id: string): ResourceStore {
    const store = this.stores.get(id);
    if (!store) throw new Error(`Unknown store ID: ${id}`);
    return store;
  }
}
