import { PLAN_TYPES, PLAN_LABELS } from '../simulation/constructionPlanning';
import type { PlanType } from '../simulation/constructionPlanning';
import type { ConstructionOrderSnapshot, ConstructionStatus } from '../simulation/excavationSystem';

export type DrawingTool = 'brush' | 'rectangle' | 'pan';
const STATUS_LABELS: Record<ConstructionStatus, string> = {
  planned: 'Geplant', digging: 'Ausgraben', blocked: 'Blockiert', paused: 'Pausiert',
  awaitingFurnishing: 'Einrichtung ausstehend', furnishing: 'Einrichten', furnished: 'Fertig eingerichtet', completed: 'Abgeschlossen', cancelled: 'Abgebrochen',
};
export const constructionStatusLabel = (order: ConstructionOrderSnapshot) => order.status === 'blocked'
  ? `Blockiert · ${order.blockReason === 'hardness' ? 'Grabkraft fehlt' : order.blockReason === 'material' ? 'Baumaterial fehlt' : 'nicht erreichbar'}` : STATUS_LABELS[order.status];
type Actions = {
  start: (type: PlanType) => void; tool: (tool: DrawingTool) => void;
  confirm: () => void; discard: () => void;
  pause: (id: number) => void; resume: (id: number) => void; cancel: (id: number) => void;
};

/** Existing native dialog style; all state-changing actions go to the model. */
export class ConstructionPanel {
  private dialog = document.createElement('dialog');
  private list = document.createElement('div');
  private details = document.createElement('div');
  private feedback = document.createElement('p');
  private draft = document.createElement('aside');
  private draftStatus = document.createElement('span');
  private toolSelect = document.createElement('select');
  private toggle = document.createElement('button');
  private cancel = document.createElement('button');
  private orders: ConstructionOrderSnapshot[] = [];
  private selectedId: number | null = null;
  private listSignature = '';

  constructor(parent: HTMLElement, private actions: Actions) {
    this.dialog.id = 'construction-panel'; this.dialog.setAttribute('aria-labelledby', 'construction-title');
    const heading = document.createElement('h2'); heading.id = 'construction-title'; heading.textContent = 'Bauplanung';
    const close = this.button('Schließen', 'close-construction', () => this.dialog.close());
    const header = document.createElement('div'); header.className = 'workforce-header'; header.append(heading, close);
    const form = document.createElement('form'); form.className = 'construction-form';
    const type = document.createElement('select'); type.name = 'chamberType';
    for (const value of PLAN_TYPES) type.add(new Option(PLAN_LABELS[value], value));
    const label = document.createElement('label'); label.append('Neuen Plan zeichnen', type);
    const begin = this.button('Zeichnen', 'draw-plan', () => {}); begin.type = 'submit';
    form.append(label, begin);
    form.addEventListener('submit', event => {
      event.preventDefault(); this.actions.start(type.value as PlanType); this.dialog.close();
    });
    const explanation = document.createElement('p'); explanation.className = 'workforce-note';
    explanation.textContent = 'Pinsel und Rechteck lassen sich im selben Entwurf verbinden. Erst Bestätigen erteilt den Auftrag. Nach dem Aushub werden Kammern mit echtem Baumaterial eingerichtet. Ihr geplanter Typ bleibt fest.';
    this.list.className = 'construction-list'; this.list.dataset.role = 'construction-orders';
    this.details.dataset.role = 'construction-detail'; this.details.setAttribute('aria-live', 'polite');
    this.feedback.setAttribute('role', 'status');
    this.toggle = this.button('Pausieren', 'pause-order', () => this.withSelected(order => {
      if (order.paused) this.actions.resume(order.id); else this.actions.pause(order.id);
    }));
    this.cancel = this.button('Auftrag abbrechen', 'cancel-order', () => this.withSelected(order => this.actions.cancel(order.id)));
    const controls = document.createElement('div'); controls.className = 'construction-actions'; controls.append(this.toggle, this.cancel);
    this.dialog.append(header, form, explanation, this.list, this.details, controls, this.feedback);

    this.draft.id = 'construction-draft'; this.draft.hidden = true; this.draft.setAttribute('aria-label', 'Bauentwurf');
    this.toolSelect.name = 'draftTool'; this.toolSelect.setAttribute('aria-label', 'Zeichenwerkzeug');
    for (const [value, title] of [['brush', 'Pinsel'], ['rectangle', 'Rechteck'], ['pan', 'Karte verschieben']]) this.toolSelect.add(new Option(title, value));
    this.toolSelect.addEventListener('change', () => this.actions.tool(this.toolSelect.value as DrawingTool));
    this.draftStatus.dataset.role = 'draft-status'; this.draftStatus.setAttribute('role', 'status');
    this.draft.append(this.toolSelect, this.button('Bestätigen', 'confirm-plan', () => {
      try { this.actions.confirm(); } catch (error) { this.updateDraft(undefined, String((error as Error).message)); }
    }), this.button('Verwerfen', 'discard-plan', () => this.actions.discard()), this.draftStatus);
    parent.append(this.dialog, this.draft);
    this.update([]);
  }
  private button(text: string, action: string, handler: () => void): HTMLButtonElement {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.dataset.action = action;
    button.addEventListener('click', handler); return button;
  }
  private withSelected(action: (order: ConstructionOrderSnapshot) => void): void {
    const order = this.orders.find(order => order.id === this.selectedId);
    if (!order) return;
    try { action(order); this.feedback.textContent = ''; } catch (error) { this.feedback.textContent = (error as Error).message; }
  }
  get isOpen(): boolean { return this.dialog.open; }
  open(): void { if (!this.dialog.open) this.dialog.showModal(); }
  selectOrder(id: number): void { this.selectedId = id; this.renderDetails(); this.open(); }
  showDraft(type: PlanType): void {
    this.draft.hidden = false; this.toolSelect.value = 'brush'; this.updateDraft(0, `${PLAN_LABELS[type]} · Fläche markieren`);
  }
  hideDraft(): void { this.draft.hidden = true; }
  updateDraft(count?: number, feedback?: string): void {
    if (feedback) this.draftStatus.textContent = feedback;
    else if (count !== undefined) this.draftStatus.textContent = `${count} Kacheln · Werkzeuge kombinierbar`;
  }
  update(orders: ConstructionOrderSnapshot[]): void {
    this.orders = orders;
    const signature = orders.map(order => `${order.id}:${order.status}:${order.blockReason}:${order.excavated}`).join('|');
    if (signature !== this.listSignature || !this.list.childNodes.length) {
      this.listSignature = signature; this.list.replaceChildren();
      if (!orders.length) this.list.textContent = 'Noch keine Bauaufträge.';
      for (const order of orders) {
        const button = this.button(`#${order.id} ${PLAN_LABELS[order.type]} · ${constructionStatusLabel(order)}`, 'select-order', () => {
          this.selectedId = order.id; this.renderDetails();
        });
        button.dataset.orderId = String(order.id); this.list.append(button);
      }
    }
    this.renderDetails();
  }
  private renderDetails(): void {
    const order = this.orders.find(order => order.id === this.selectedId);
    this.details.replaceChildren();
    this.toggle.hidden = this.cancel.hidden = !order || ['completed', 'cancelled', 'furnished'].includes(order.status);
    if (!order) { this.details.textContent = 'Baustelle auf der Karte oder in der Liste auswählen.'; return; }
    for (const text of [
      `#${order.id} ${PLAN_LABELS[order.type]} · ${constructionStatusLabel(order)}`,
      `Aushub: ${order.excavated} / ${order.total} Kacheln${order.partialDigSeconds > 0 ? ` · ${order.partialDigSeconds.toFixed(1)} s angegraben` : ''}`,
      order.type === 'tunnel' ? 'Einrichtung: nicht erforderlich' : `Einrichtung: ${order.materialUsed} / ${order.materialRequired} Einheiten${order.status === 'furnished' ? ' · fertig eingerichtet' : ''} · noch keine nutzbare Kapazität`,
      order.type === 'tunnel' ? 'Baumaterial für Einrichtung: 0' : `Baumaterial für Einrichtung: ${order.materialRequired} benötigt · ${order.materialUsed} eingesetzt · ${order.materialAtSite} an Baustelle · ${order.materialInTransit} unterwegs · ${Math.max(0, order.materialRequired - order.materialUsed - order.materialAtSite - order.materialInTransit)} noch zu liefern`,
    ]) { const paragraph = document.createElement('p'); paragraph.textContent = text; this.details.append(paragraph); }
    this.toggle.textContent = order.paused ? 'Fortsetzen' : 'Pausieren';
    this.toggle.dataset.action = order.paused ? 'resume-order' : 'pause-order';
  }
  destroy(): void { this.dialog.close(); this.dialog.remove(); this.draft.remove(); }
}
