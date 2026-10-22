import type { WorldPoint } from '../world/worldTypes.ts';
import { ResourceSystem } from './resourceSystem.ts';
import { nonNegativeFinite, positiveFinite } from './validation.ts';

export type MaterialPile = { id: string; position: WorldPoint; amount: number };

/** Material at physical sites and on carriers; stocks remain in A1 stores. */
export class BuildingMaterialSystem {
  private resources: ResourceSystem;
  private capacity: number;
  private piles = new Map<string, MaterialPile>();
  private carriers = new Map<string, number>();
  private nextId = 1;
  private initial: number;
  private produced = 0;
  private consumed = 0;

  constructor(resources: ResourceSystem, capacity: number) {
    positiveFinite(capacity, 'carryCapacity');
    this.resources = resources; this.capacity = capacity;
    this.initial = this.stored;
  }
  private get stored(): number {
    return this.resources.listStores().filter(store => store.resource === 'buildingMaterial').reduce((sum, store) => sum + store.amount, 0);
  }
  get balance() {
    return { initial: this.initial, produced: this.produced, consumed: this.consumed, stored: this.stored,
      ground: [...this.piles.values()].reduce((sum, pile) => sum + pile.amount, 0),
      carried: [...this.carriers.values()].reduce((sum, amount) => sum + amount, 0) };
  }
  getGround(): MaterialPile[] { return [...this.piles.values()].map(pile => ({ ...pile, position: { ...pile.position } })); }
  getCarried(id: string): number { return this.carriers.get(id) ?? 0; }

  produce(position: WorldPoint, amount: number): string {
    const id = this.addPile(position, amount);
    this.produced += amount;
    return id;
  }
  private addPile(position: WorldPoint, amount: number): string {
    nonNegativeFinite(position.x, 'position.x'); nonNegativeFinite(position.y, 'position.y'); nonNegativeFinite(amount, 'amount');
    const id = `material-${this.nextId++}`;
    if (amount > 0) this.piles.set(id, { id, position: { ...position }, amount });
    return id;
  }
  pickUp(pileId: string, carrierId: string, requested: number): number {
    nonNegativeFinite(requested, 'requested');
    if (!carrierId.trim()) throw new TypeError('Carrier ID must not be empty');
    const pile = this.piles.get(pileId);
    if (!pile) return 0;
    const carried = this.getCarried(carrierId);
    const amount = Math.min(requested, pile.amount, this.capacity - carried);
    pile.amount -= amount; this.carriers.set(carrierId, carried + amount);
    if (pile.amount === 0) this.piles.delete(pileId);
    return amount;
  }
  deposit(carrierId: string, storeId: string): number {
    const amount = this.resources.depositInStore(storeId, { resource: 'buildingMaterial', amount: this.getCarried(carrierId) });
    this.carriers.set(carrierId, this.getCarried(carrierId) - amount);
    return amount;
  }
  dropCarrier(carrierId: string, position: WorldPoint): void {
    const amount = this.getCarried(carrierId);
    this.addPile(position, amount);
    this.carriers.delete(carrierId);
  }
  consumeFromStore(storeId: string, requested: number): number {
    nonNegativeFinite(requested, 'requested');
    if (this.resources.getStore(storeId).resource !== 'buildingMaterial') throw new TypeError('Expected a building-material store');
    const amount = this.resources.takeFromStore(storeId, requested).amount;
    this.consumed += amount;
    return amount;
  }
}
