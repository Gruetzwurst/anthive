import Phaser from 'phaser';
import type { GatheringPriority } from '../simulation/gatheringSystem.ts';
import { describeSources, describeSupply, formatAmount } from './economyOverview.ts';
import type { EconomyOverview } from './economyOverview.ts';

export const ECONOMY_HUD_BOUNDS = { x: 8, y: 6, width: 624, height: 104 };
export function isEconomyHudPoint(x: number, y: number): boolean {
  const bounds = ECONOMY_HUD_BOUNDS;
  return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
}
const INK = '#f4efd9';

/** Fixed Phaser view; all resource facts come from the read-only overview. */
export class EconomyHud {
  private header: Phaser.GameObjects.Text;
  private food: Phaser.GameObjects.Text;
  private water: Phaser.GameObjects.Text;
  private material: Phaser.GameObjects.Text;
  private foodSource: Phaser.GameObjects.Text;
  private waterSource: Phaser.GameObjects.Text;
  private warning: Phaser.GameObjects.Text;
  private buttons: Array<{ priority: GatheringPriority; body: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }> = [];

  constructor(scene: Phaser.Scene, onPriority: (priority: GatheringPriority) => void) {
    const bounds = ECONOMY_HUD_BOUNDS;
    scene.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0x211e19, 0.96)
      .setOrigin(0).setStrokeStyle(1, 0x71604a).setScrollFactor(0).setDepth(20);
    const text = (x: number, y: number, content: string, size = 10) => scene.add.text(x, y, content, {
      color: INK, fontFamily: 'system-ui, sans-serif', fontSize: `${size}px`,
    }).setScrollFactor(0).setDepth(21);
    text(18, 12, 'ANTHIVE', 11).setFontStyle('bold');
    this.header = text(110, 13, '', 9);
    this.food = text(18, 31, '', 11).setColor('#e5bd77');
    this.water = text(225, 31, '', 11).setColor('#80ccd4');
    this.material = text(438, 31, '', 11);
    this.foodSource = text(18, 50, '', 9);
    this.waterSource = text(400, 50, '', 9);
    text(18, 75, 'Sammelpriorität', 9);
    const choices: Array<[GatheringPriority, string]> = [['food', 'Nahrung'], ['balanced', 'Ausgeglichen'], ['water', 'Wasser']];
    choices.forEach(([priority, title], index) => {
      const x = 139 + index * 161;
      const body = scene.add.rectangle(x, 68, 151, 25, 0x39352e).setOrigin(0)
        .setScrollFactor(0).setDepth(21).setStrokeStyle(1, 0x71604a).setInteractive({ useHandCursor: true });
      const label = text(x + 75.5, 80.5, title, 10).setOrigin(0.5);
      body.on(Phaser.Input.Events.POINTER_DOWN,
        (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          onPriority(priority);
        });
      this.buttons.push({ priority, body, label });
    });
    this.warning = text(18, 97, '', 9);
  }

  update(overview: EconomyOverview): void {
    this.header.setText(`Tag ${overview.day} · ${Math.floor(overview.dayProgress * 100)} %  |  Arbeiterinnen ${overview.workerCount} (${overview.collectorCount} sammeln)  |  Arbeit ${Math.round(overview.workFactor * 100)} %  |  Verluste ${overview.workerLosses}`);
    this.food.setText(`Nahrung ${formatAmount(overview.stocks.food.amount)} / ${overview.stocks.food.capacity}`);
    this.water.setText(`Wasser ${formatAmount(overview.stocks.water.amount)} / ${overview.stocks.water.capacity}`);
    this.material.setText(`Baustoff ${overview.buildingMaterial}`);
    this.foodSource.setText(`Nahrungsquelle: ${describeSources(overview.sources.food)}`);
    this.waterSource.setText(`Wasserquelle: ${describeSources(overview.sources.water)}`);
    const states = overview.supply;
    this.warning.setText(`Nahrung: ${describeSupply(states.food)}   |   Wasser: ${describeSupply(states.water)}`);
    this.warning.setColor([states.food, states.water].some(state => state.level === 'risk') ? '#f29883'
      : [states.food, states.water].every(state => state.level === 'stable') ? '#bed0a1' : '#f4cc79');
    for (const button of this.buttons) {
      const selected = button.priority === overview.priority;
      button.body.setFillStyle(selected ? 0xb99d65 : 0x39352e);
      button.label.setColor(selected ? '#211e19' : INK).setFontStyle(selected ? 'bold' : 'normal');
    }
  }
}
