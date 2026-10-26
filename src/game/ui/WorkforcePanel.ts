import { SPECIALIZATIONS, WORK_ASSIGNMENTS } from '../simulation/workforceSystem.ts';
import type { Specialization, WorkAssignment } from '../simulation/workforceSystem.ts';
import type { WorkforceSnapshot } from '../simulation/workforceSimulation.ts';
import { WORKFORCE_CONFIG } from '../simulation/simulationConfig.ts';
import type { EggQuotas, QueenSnapshot } from '../simulation/queenSystem';

const SPECIALTY_LABELS: Record<Specialization, string> = {
  gathering: 'Sammlerinnen', building: 'Baumeisterinnen', care: 'Brutpflegerinnen', combat: 'Kämpferinnen',
};
const WORK_LABELS: Record<WorkAssignment, string> = {
  gathering: 'Sammeln', building: 'Bauen', care: 'Pflegen', combat: 'Kämpfen', rest: 'Ruhe',
};

/** Native modal handles quantities, never individual ant orders. */
export class WorkforcePanel {
  private dialog = document.createElement('dialog');
  private summary = document.createElement('p');
  private tableBody = document.createElement('tbody');
  private specialization = document.createElement('select');
  private from = document.createElement('select');
  private to = document.createElement('select');
  private count = document.createElement('input');
  private submit = document.createElement('button');
  private feedback = document.createElement('p');
  private workers: WorkforceSnapshot[] = [];
  private queenSummary = document.createElement('p');
  private broodRooms = document.createElement('div');
  private queenState?: () => QueenSnapshot;

  constructor(parent: HTMLElement, moveWorkers: (specialization: Specialization, from: WorkAssignment, to: WorkAssignment, count: number) => void,
    queen?: {snapshot: () => QueenSnapshot; setQuotas: (quotas: EggQuotas) => void}) {
    this.dialog.id = 'workforce-panel';
    this.dialog.setAttribute('aria-labelledby', 'workforce-title');
    const heading = document.createElement('h2'); heading.id = 'workforce-title'; heading.textContent = 'Arbeitsgruppen';
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Schließen';
    close.dataset.action = 'close-workforce'; close.addEventListener('click', () => this.dialog.close());
    const header = document.createElement('div'); header.className = 'workforce-header'; header.append(heading, close);
    const explanation = document.createElement('p');
    explanation.textContent = `Spezialisierungen bleiben dauerhaft. Fachfremder Einsatz: ${WORKFORCE_CONFIG.foreignWorkEfficiency * 100} % Leistung. Die Tabelle zeigt die zugewiesenen Einsätze.`;
    this.summary.dataset.role = 'workforce-summary';
    const table = document.createElement('table');
    const caption = document.createElement('caption'); caption.textContent = 'Spezialisierung und zugewiesene Arbeitsgruppe';
    const head = document.createElement('thead'), row = document.createElement('tr');
    for (const title of ['Spezialisierung', ...WORK_ASSIGNMENTS.map(work => WORK_LABELS[work])]) {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; row.append(cell);
    }
    head.append(row); table.append(caption, head, this.tableBody);
    const tableScroll = document.createElement('div'); tableScroll.className = 'workforce-table'; tableScroll.append(table);
    const form = document.createElement('form'); form.className = 'workforce-form';
    for (const specialty of SPECIALIZATIONS) this.specialization.add(new Option(SPECIALTY_LABELS[specialty], specialty));
    for (const work of WORK_ASSIGNMENTS) {
      this.from.add(new Option(WORK_LABELS[work], work)); this.to.add(new Option(WORK_LABELS[work], work));
    }
    this.to.value = 'building';
    this.specialization.name = 'specialization'; this.from.name = 'from'; this.to.name = 'to';
    this.count.name = 'count'; this.count.type = 'number'; this.count.min = '1'; this.count.step = '1'; this.count.value = '1'; this.count.required = true;
    for (const [title, control] of [['Spezialisierung', this.specialization], ['Von', this.from], ['Nach', this.to], ['Anzahl', this.count]] as const) {
      const label = document.createElement('label'); label.append(title, control); form.append(label);
    }
    this.submit.type = 'submit'; this.submit.textContent = 'Zuweisen'; form.append(this.submit);
    this.feedback.setAttribute('role', 'status'); this.feedback.dataset.role = 'assignment-feedback';
    const updateLimit = () => this.updateLimit();
    this.specialization.addEventListener('change', updateLimit); this.from.addEventListener('change', updateLimit);
    form.addEventListener('submit', event => {
      event.preventDefault();
      try {
        const count = this.count.valueAsNumber;
        moveWorkers(this.specialization.value as Specialization, this.from.value as WorkAssignment, this.to.value as WorkAssignment, count);
        this.feedback.textContent = `${count} zugewiesen. Laufende Ladungen und Aushub werden vor dem Wechsel abgeschlossen.`;
      } catch {
        this.feedback.textContent = 'Nicht genügend Arbeiterinnen in der gewählten Ausgangsgruppe. Bitte Anzahl und Einsatz prüfen.';
      }
    });
    const note = document.createElement('p'); note.className = 'workforce-note';
    note.textContent = 'Ohne passende Arbeit wird geruht. Pflege unterstützt die vorhandene Brut; Kampfaufgaben sind noch nicht verfügbar. Bei ausstehendem Wechsel werden Ladungen noch abgeliefert oder der Rückweg ins Nest beendet.';
    this.dialog.append(header, explanation, this.summary, tableScroll, form, this.feedback, note);
    if (queen) {
      this.queenState = queen.snapshot;
      const title = document.createElement('h3');title.textContent = 'Königin und Eier';
      this.queenSummary.dataset.role = 'queen-summary';this.broodRooms.dataset.role = 'brood-rooms';
      const quotas = document.createElement('form');quotas.className = 'workforce-form';quotas.dataset.role = 'egg-quotas';
      const inputs = new Map<Specialization, HTMLInputElement>(), current = queen.snapshot().quotas;
      for (const kind of SPECIALIZATIONS) {
        const label = document.createElement('label'), input = document.createElement('input');
        input.type = 'number';input.min = '0';input.max = '100';input.step = '0.01';input.required = true;
        input.name = `eggQuota-${kind}`;input.value = String(current[kind]);
        label.append(`${SPECIALTY_LABELS[kind]} (%)`, input);quotas.append(label);inputs.set(kind, input);
      }
      const apply = document.createElement('button');apply.type = 'submit';apply.textContent = 'Zielanteile übernehmen';apply.dataset.action = 'apply-egg-quotas';
      const result = document.createElement('p');result.setAttribute('role', 'status');result.dataset.role = 'egg-quota-feedback';
      quotas.append(apply);quotas.addEventListener('submit', event => {
        event.preventDefault();
        try {queen.setQuotas(Object.fromEntries([...inputs].map(([kind, input]) => [kind, input.valueAsNumber])) as EggQuotas);result.textContent = 'Zielanteile für neue Eier übernommen.';this.updateQueen();}
        catch (error) {result.textContent = (error as Error).message;}
      });
      const hint = document.createElement('p');hint.className = 'workforce-note';
      hint.textContent = 'Zusammen 100 %. Die Automatik verteilt Eier auf passende freie Brutplätze. Wartende Eier behalten ihr bisheriges Ziel und entwickeln sich im Puffer nicht. Ei → Larve → Puppe → Ameise; Pflegemangel verlangsamt, tötet aber keine Brut. Larvenfütterung ist in dieser Vorschau noch nicht aktiv.';
      this.dialog.append(title, this.queenSummary, quotas, result, hint, this.broodRooms);this.updateQueen();
    }
    parent.append(this.dialog);
  }

  get isOpen(): boolean { return this.dialog.open; }
  open(): void { if (!this.dialog.open) this.dialog.showModal(); }
  destroy(): void { this.dialog.close(); this.dialog.remove(); }

  update(workers: WorkforceSnapshot[]): void {
    this.workers = workers;
    this.summary.textContent = `${workers.length} Arbeiterinnen · ${workers.filter(worker => worker.resting).length} ruhen · ${workers.filter(worker => worker.pending).length} Wechsel ausstehend`;
    this.tableBody.replaceChildren();
    for (const specialty of SPECIALIZATIONS) {
      const row = document.createElement('tr');
      const native = workers.filter(worker => worker.specialization === specialty);
      const name = document.createElement('th'); name.scope = 'row'; name.textContent = `${SPECIALTY_LABELS[specialty]} (${native.length})`; row.append(name);
      for (const assignment of WORK_ASSIGNMENTS) {
        const cell = document.createElement('td'); cell.textContent = String(native.filter(worker => worker.assignment === assignment).length);
        cell.dataset.specialization = specialty; cell.dataset.assignment = assignment; row.append(cell);
      }
      this.tableBody.append(row);
    }
    this.updateLimit();
    this.updateQueen();
  }

  private updateQueen(): void {
    const state = this.queenState?.();if (!state) return;
    this.queenSummary.textContent = `Eierpuffer: ${state.bufferCount} / ${state.bufferCapacity} · zugewiesen: ${state.assignedCount} · Eiablage: ${state.effectiveEggsPerDay.toLocaleString('de-DE', {maximumFractionDigits: 2})} / Spieltag`;
    this.queenSummary.textContent += ` · Eier ${state.stageCounts.egg} · Larven ${state.stageCounts.larva} · Puppen ${state.stageCounts.pupa} · geschlüpft ${state.bornCount} · Pflegetempo ${Math.round(state.careFactor * 100)} %`;
    this.broodRooms.replaceChildren();
    for (const [index, room] of state.chambers.entries()) {
      const row = document.createElement('p');row.textContent = `${SPECIALTY_LABELS[room.specialization]} · Kammer ${index + 1}: ${room.occupied} / ${room.capacity} Brutplätze · ${room.operational ? 'betriebsbereit' : 'nicht erreichbar oder noch nicht nutzbar'}`;
      const brood = state.eggs.filter(egg => egg.chamberId === room.id);
      row.textContent += ` · ${brood.filter(egg => egg.stage === 'egg').length} Eier / ${brood.filter(egg => egg.stage === 'larva').length} Larven / ${brood.filter(egg => egg.stage === 'pupa').length} Puppen`;
      this.broodRooms.append(row);
    }
  }

  private updateLimit(): void {
    const available = this.workers.filter(worker => worker.specialization === this.specialization.value && worker.assignment === this.from.value).length;
    this.count.max = String(available);
    this.submit.disabled = available === 0;
  }
}
