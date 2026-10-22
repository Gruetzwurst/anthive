import { WORKFORCE_CONFIG } from './simulationConfig.ts';
import { positiveFinite } from './validation.ts';

export const SPECIALIZATIONS = ['gathering', 'building', 'care', 'combat'] as const;
export type Specialization = typeof SPECIALIZATIONS[number];
export const WORK_ASSIGNMENTS = [...SPECIALIZATIONS, 'rest'] as const;
export type WorkAssignment = typeof WORK_ASSIGNMENTS[number];
export type WorkforceWorker = { id: string; specialization: Specialization; assignment: WorkAssignment };

function validSpecialization(value: Specialization): void {
  if (!(SPECIALIZATIONS as readonly string[]).includes(value)) throw new TypeError('Unknown specialization');
}
function validAssignment(value: WorkAssignment): void {
  if (!(WORK_ASSIGNMENTS as readonly string[]).includes(value)) throw new TypeError('Unknown work assignment');
}

/** Durable identity/specialization and player assignments, not a job scheduler. */
export class WorkforceSystem {
  private workers = new Map<string, WorkforceWorker>();
  private foreignEfficiency: number;

  constructor(foreignEfficiency = WORKFORCE_CONFIG.foreignWorkEfficiency) {
    positiveFinite(foreignEfficiency, 'foreignWorkEfficiency');
    if (foreignEfficiency >= 1) throw new RangeError('Foreign work must have an efficiency disadvantage');
    this.foreignEfficiency = foreignEfficiency;
  }

  addWorker(id: string, specialization: Specialization): void {
    validSpecialization(specialization);
    if (!id.trim() || this.workers.has(id)) throw new Error('Worker needs a unique non-empty ID');
    this.workers.set(id, { id, specialization, assignment: specialization });
  }

  getWorker(id: string): WorkforceWorker {
    const worker = this.workers.get(id);
    if (!worker) throw new Error(`Unknown worker: ${id}`);
    return { ...worker };
  }
  getWorkers(): WorkforceWorker[] { return [...this.workers.values()].map(worker => ({ ...worker })); }
  removeWorker(id: string): void { this.workers.delete(id); }

  moveWorkers(specialization: Specialization, from: WorkAssignment, to: WorkAssignment, count: number): void {
    validSpecialization(specialization); validAssignment(from); validAssignment(to);
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Worker count must be a nonnegative integer');
    const candidates = [...this.workers.values()].filter(worker => worker.specialization === specialization && worker.assignment === from)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (count > candidates.length) throw new RangeError('Not enough workers in the selected group');
    for (const worker of candidates.slice(0, count)) worker.assignment = to;
  }

  efficiency(id: string, actualWork: Specialization): number {
    validSpecialization(actualWork);
    return this.getWorker(id).specialization === actualWork ? 1 : this.foreignEfficiency;
  }
}
