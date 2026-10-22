import { SPECIALIZATIONS, WORK_ASSIGNMENTS } from '../simulation/workforceSystem.ts';
import type { Specialization, WorkAssignment } from '../simulation/workforceSystem.ts';
import type { WorkforceSnapshot } from '../simulation/workforceSimulation.ts';
import { WORKFORCE_CONFIG } from '../simulation/simulationConfig.ts';

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

  constructor(parent: HTMLElement, moveWorkers: (specialization: Specialization, from: WorkAssignment, to: WorkAssignment, count: number) => void) {
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
    note.textContent = 'Ohne passende Arbeit wird geruht. Aktuell sind keine Pflege- oder Kampfaufgaben verfügbar. Bei ausstehendem Wechsel werden Ladungen noch abgeliefert oder der Rückweg ins Nest beendet.';
    this.dialog.append(header, explanation, this.summary, tableScroll, form, this.feedback, note);
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
  }

  private updateLimit(): void {
    const available = this.workers.filter(worker => worker.specialization === this.specialization.value && worker.assignment === this.from.value).length;
    this.count.max = String(available);
    this.submit.disabled = available === 0;
  }
}
