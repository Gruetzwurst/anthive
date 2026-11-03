import Phaser from 'phaser';
import type { GatheringPriority } from '../simulation/gatheringSystem.ts';
import { describeSources, describeSupply, formatAmount } from './economyOverview.ts';
import type { EconomyOverview } from './economyOverview.ts';

export const ECONOMY_HUD_BOUNDS = { x: 8, y: 6, width: 624, height: 104 };
export function isEconomyHudPoint(x: number, y: number, collapsed = false): boolean {
  const bounds = ECONOMY_HUD_BOUNDS;
  return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + (collapsed ? 28 : bounds.height);
}
const INK = '#f4efd9';

/** Fixed Phaser view; all resource facts come from the read-only overview. */
export class EconomyHud {
  private saveButton?: Phaser.GameObjects.Text;
  private saveHint?: Phaser.GameObjects.Text;
  private compact = false;
  private background!: Phaser.GameObjects.Rectangle;
  private details: Array<Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle> = [];
  private collapseToggle!: Phaser.GameObjects.Text;
  private header: Phaser.GameObjects.Text;
  private food: Phaser.GameObjects.Text;
  private water: Phaser.GameObjects.Text;
  private material: Phaser.GameObjects.Text;
  private foodSource: Phaser.GameObjects.Text;
  private waterSource: Phaser.GameObjects.Text;
  private warning: Phaser.GameObjects.Text;
  private buttons: Array<{ priority: GatheringPriority; body: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }> = [];

  constructor(scene: Phaser.Scene, onPriority: (priority: GatheringPriority) => void, onWorkforce?: () => void, onConstruction?: () => void, onSave?: () => void, onMenu?: () => void) {
    const bounds = ECONOMY_HUD_BOUNDS;
    this.background = scene.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, 0x211e19, 0.96)
      .setOrigin(0).setStrokeStyle(1, 0x71604a).setScrollFactor(0).setDepth(20);
    const text = (x: number, y: number, content: string, size = 10) => {
      const label = scene.add.text(x, y, content, {color: INK, fontFamily: 'system-ui, sans-serif', fontSize: `${size}px`}).setScrollFactor(0).setDepth(21);
      if (y >= 31) this.details.push(label);
      return label;
    };
    if(onSave){
      this.saveButton=text(18,12,'Speichern',10).setFontStyle('bold').setInteractive({useHandCursor:true});
      this.saveHint=text(18,114,'',9).setBackgroundColor('#211e19').setPadding(5).setWordWrapWidth(590).setDepth(25).setVisible(false);
      this.saveButton.on(Phaser.Input.Events.POINTER_DOWN,(_p:Phaser.Input.Pointer,_x:number,_y:number,event:Phaser.Types.Input.EventData)=>{event.stopPropagation();onSave();});
      this.details=this.details.filter(object=>object!==this.saveHint);
      this.saveButton.on('pointerover',()=>this.saveHint?.setVisible(true));
      this.saveButton.on('pointerout',()=>this.saveHint?.setVisible(false));
    }else text(18, 12, 'ANTHIVE', 11).setFontStyle('bold');
    this.header = text(onMenu?150:110, 13, '', 9);
    if(onMenu){
      const menu=scene.add.rectangle(100,9,40,21,0x39352e).setOrigin(0).setScrollFactor(0).setDepth(21).setInteractive({useHandCursor:true});
      text(120,19.5,'Menü',10).setOrigin(.5);
      menu.on(Phaser.Input.Events.POINTER_DOWN,(_p:Phaser.Input.Pointer,_x:number,_y:number,event:Phaser.Types.Input.EventData)=>{event.stopPropagation();onMenu();});
    }
    if (onWorkforce) {
      const groups = scene.add.rectangle(548, 9, 56, 21, 0x39352e).setOrigin(0).setScrollFactor(0)
        .setDepth(21).setStrokeStyle(1, 0x71604a).setInteractive({ useHandCursor: true });
      text(576, 19.5, 'Gruppen', 10).setOrigin(0.5);
      groups.on(Phaser.Input.Events.POINTER_DOWN,
        (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); onWorkforce();
        });
    }
    if (onConstruction) {
      const build = scene.add.rectangle(478, 9, 65, 21, 0x39352e).setOrigin(0).setScrollFactor(0)
        .setDepth(21).setStrokeStyle(1, 0x71604a).setInteractive({ useHandCursor: true });
      text(510.5, 19.5, 'Bauen', 10).setOrigin(.5);
      build.on(Phaser.Input.Events.POINTER_DOWN,
        (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation(); onConstruction();
        });
    }
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
      this.details.push(body);
      this.buttons.push({ priority, body, label });
    });
    this.warning = text(18, 97, '', 9);
    this.collapseToggle = text(616, 19, '−', 14).setOrigin(.5).setBackgroundColor('#39352e').setPadding(3, 0).setInteractive({useHandCursor: true});
    this.collapseToggle.on(Phaser.Input.Events.POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {event.stopPropagation();this.setCollapsed(!this.compact);});
  }

  setSaveStatus(kind:string,message:string):void {
    this.saveButton?.setText(kind==='saving'?'Speichert …':kind==='saved'?'Gespeichert':kind==='error'?'Nicht gesichert':kind==='readonly'?'Nur Lesen':'Speichern')
      .setColor(kind==='error'||kind==='readonly'?'#f29883':'#f4efd9').setData('status',message);
    this.saveHint?.setText(message);
  }

  get collapsed(): boolean {return this.compact;}
  setCollapsed(value: boolean): void {
    this.compact=value;
    this.background.setSize(ECONOMY_HUD_BOUNDS.width, value ? 28 : ECONOMY_HUD_BOUNDS.height);
    for (const object of this.details) object.setVisible(!value);
    this.collapseToggle.setText(value ? '+' : '−');
  }

  update(overview: EconomyOverview): void {
    this.header.setText(`Tag ${overview.day} · ${Math.floor(overview.dayProgress * 100)} %  |  Arbeiterinnen ${overview.workerCount} |  Arbeit ${Math.round(overview.workFactor * 100)} %  |  Verluste ${overview.workerLosses}`);
    this.food.setText(`Nahrung ${formatAmount(overview.stocks.food.amount)} / ${overview.stocks.food.capacity}`);
    this.water.setText(`Wasser ${formatAmount(overview.stocks.water.amount)} / ${overview.stocks.water.capacity}`);
    this.material.setText(`Baustoff ${formatAmount(overview.stocks.buildingMaterial.amount)} / ${overview.stocks.buildingMaterial.capacity}`);
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
