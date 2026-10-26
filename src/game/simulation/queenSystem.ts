import {QUEEN_CONFIG} from './simulationConfig.ts';
import type {QueenConfig} from './simulationConfig.ts';
import {SPECIALIZATIONS} from './workforceSystem.ts';
import type {Specialization} from './workforceSystem.ts';
import {nonNegativeFinite, positiveFinite} from './validation.ts';

export type EggQuotas = Record<Specialization, number>;
export type BroodRoom = {id: string; specialization: Specialization; capacity: number; operational: boolean};
type Egg = {id: string; targetSpecialization: Specialization; chamberId: string | null};
const EPS = 1e-9;

/** C1 only: real egg identities and atomic allocation; development starts in C2. */
export class QueenSystem {
  private config: QueenConfig;
  private quotas: EggQuotas;
  private credits: EggQuotas = {gathering: 0, building: 0, care: 0, combat: 0};
  private rooms = new Map<string, BroodRoom>();
  private eggs: Egg[] = [];
  private buffer: Egg[] = [];
  private progress = 0;
  private eggFactor = 1;

  constructor(config: QueenConfig = QUEEN_CONFIG) {
    nonNegativeFinite(config.eggsPerGameDay, 'eggsPerGameDay');positiveFinite(config.bufferCapacity, 'bufferCapacity');
    if (!Number.isInteger(config.bufferCapacity)) throw new RangeError('Buffer capacity must be an integer');
    let fill = 0, factor = 1;
    for (const level of config.bufferSlowdown) {
      if (!Number.isFinite(level.fill) || level.fill <= fill || level.fill > 1 || !Number.isFinite(level.factor) || level.factor < 0 || level.factor > factor) throw new RangeError('Invalid egg buffer slowdown');
      fill = level.fill;factor = level.factor;
    }
    this.config = {...config, initialQuotas: {...config.initialQuotas}, bufferSlowdown: config.bufferSlowdown.map(level => ({...level}))};
    this.quotas = {...config.initialQuotas};this.setQuotas(this.quotas);
  }

  setQuotas(quotas: EggQuotas): void {
    for (const kind of SPECIALIZATIONS) if (!Number.isFinite(quotas[kind]) || quotas[kind] < 0 || quotas[kind] > 100) throw new RangeError('Zielanteile müssen zwischen 0 und 100 % liegen');
    if (Math.abs(SPECIALIZATIONS.reduce((sum, kind) => sum + quotas[kind], 0) - 100) > EPS) throw new RangeError('Zielanteile müssen zusammen 100 % ergeben');
    // Reapplying unchanged controls must not reset fractional fairness credits.
    if (SPECIALIZATIONS.every(kind => quotas[kind] === this.quotas[kind])) return;
    this.quotas = {...quotas};this.credits = {gathering: 0, building: 0, care: 0, combat: 0};
  }

  private bufferFactor(): number {
    if (this.buffer.length >= this.config.bufferCapacity) return 0;
    let factor = 1;
    for (const level of this.config.bufferSlowdown) if (this.buffer.length / this.config.bufferCapacity >= level.fill) factor = level.factor;
    return factor;
  }

  private syncRooms(rooms: readonly BroodRoom[]): void {
    const ids = new Set<string>();
    for (const room of rooms) {
      if (!room.id.trim() || ids.has(room.id) || !SPECIALIZATIONS.includes(room.specialization) || !Number.isInteger(room.capacity) || room.capacity < 0 || typeof room.operational !== 'boolean') throw new RangeError('Invalid brood room');
      if (this.rooms.has(room.id) && this.rooms.get(room.id)!.specialization !== room.specialization) throw new Error('Brutkammer-Spezialisierung bleibt unverändert');
      ids.add(room.id);
    }
    for (const room of this.rooms.values()) if (!ids.has(room.id)) room.operational = false;
    for (const room of rooms) this.rooms.set(room.id, {...room});
  }

  private occupied(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const egg of this.eggs) if (egg.chamberId) counts.set(egg.chamberId, (counts.get(egg.chamberId) ?? 0) + 1);
    return counts;
  }

  private allocate(): void {
    if (!this.buffer.length) return;
    const counts = this.occupied(), waiting: Egg[] = [];
    for (const egg of this.buffer) {
      const candidates = [...this.rooms.values()].filter(room => room.operational && room.specialization === egg.targetSpecialization && (counts.get(room.id) ?? 0) < room.capacity);
      candidates.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || a.id.localeCompare(b.id));
      const room = candidates[0];
      if (!room) {waiting.push(egg);continue;}
      egg.chamberId = room.id;counts.set(room.id, (counts.get(room.id) ?? 0) + 1);
    }
    this.buffer = waiting;
  }

  private nextTarget(): Specialization {
    let best: Specialization | null = null;
    for (const kind of SPECIALIZATIONS) {
      this.credits[kind] += this.quotas[kind];
      if (this.quotas[kind] > 0 && (best === null || this.credits[kind] > this.credits[best] + EPS)) best = kind;
    }
    this.credits[best!] -= 100;return best!;
  }

  advance(gameDays: number, eggFactor: number, rooms: readonly BroodRoom[]): void {
    nonNegativeFinite(gameDays, 'gameDays');nonNegativeFinite(eggFactor, 'eggFactor');
    if (eggFactor > 1) throw new RangeError('Egg factor must not exceed one');
    this.syncRooms(rooms);this.eggFactor = eggFactor;this.allocate();
    let remaining = gameDays;
    while (remaining > EPS) {
      const rate = this.config.eggsPerGameDay * eggFactor * this.bufferFactor();
      if (rate <= 0) break;
      const untilEgg = (1 - this.progress) / rate;
      if (remaining + EPS < untilEgg) {this.progress += remaining * rate;break;}
      remaining = Math.max(0, remaining - untilEgg);this.progress = 0;
      const egg: Egg = {id: `egg-${this.eggs.length + 1}`, targetSpecialization: this.nextTarget(), chamberId: null};
      this.eggs.push(egg);this.buffer.push(egg);this.allocate();
    }
  }

  get snapshot() {
    const counts = this.occupied(), bufferRateFactor = this.bufferFactor();
    return {
      laidEggs: this.eggs.length, bufferCount: this.buffer.length, bufferCapacity: this.config.bufferCapacity,
      assignedCount: this.eggs.length - this.buffer.length, layingProgress: this.progress,
      eggFactor: this.eggFactor, bufferRateFactor, effectiveEggsPerDay: this.config.eggsPerGameDay * this.eggFactor * bufferRateFactor,
      quotas: {...this.quotas},
      eggs: this.eggs.map(egg => ({...egg, specialization: egg.chamberId ? this.rooms.get(egg.chamberId)!.specialization : null, stage: 'egg' as const, developmentProgress: 0})),
      chambers: [...this.rooms.values()].map(room => ({...room, occupied: counts.get(room.id) ?? 0})),
    };
  }
}
export type QueenSnapshot = QueenSystem['snapshot'];
