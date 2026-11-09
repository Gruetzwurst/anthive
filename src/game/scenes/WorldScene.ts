import {createAntBody} from '../world/antBodyTexture';
import {ColonyRepository} from '../persistence/colonyRepository';
import {PersistenceController} from '../persistence/persistenceController';
import {BrowserColonyWriteLock} from '../persistence/colonyWriteLock';
import {SaveErrorDialog} from '../ui/SaveErrorDialog';
import {downloadColonyFile} from '../ui/colonyDownload';
import {createColonySession,captureColony} from '../persistence/colonySession';
import type {ColonySession} from '../persistence/colonySession';
import Phaser from 'phaser';
import {
  buildingMaterialStoreCenter,
  waterStoreCenter,
  broodChamberCenters,
  foodStoreCenter,
  diggingGradeAt,
  isOpenTile,
  isDiggableTile,
  initialCameraY,
  nestChamberCenter,
  queenChamberCenter,
  surfaceFoodSource,
  surfaceRow,
  stoneOutcropCenter,
  TILE_SIZE,
  terrainDefinitions,
  TERRAIN_PALETTE,
  worldMap,
  worldDecorations,
  worldSize,
} from '../world/worldMap';
import { drawWorldDecorations } from '../world/worldDecorationRenderer';
import {
  drawWorldTileArt,
  preloadWorldTileArt,
  updateWorldTileArt,
  setSmoothRoomArt,
} from '../world/worldTileArtRenderer';
import type { TerrainKind } from '../world/worldTypes';
import {activateWorld} from '../world/worldMap';
import { ExcavationSystem, requiredDiggingGrade } from '../simulation/excavationSystem';
import { createWorkforceSimulation } from '../simulation/workforceSimulation';
import { WorkforcePanel } from '../ui/WorkforcePanel';
import { ConstructionPanel, constructionStatusLabel } from '../ui/ConstructionPanel';
import type { DrawingTool } from '../ui/ConstructionPanel';
import { lineSelection, rectangleSelection, mergeSelection, squareTemplate, constructionMaterialEstimate, PLAN_LABELS } from '../simulation/constructionPlanning';
import type { PlanType, TemplateSize } from '../simulation/constructionPlanning';
import { CONSTRUCTION_CONFIG, PLAYABLE_COLONY_CONFIG } from '../simulation/simulationConfig';
import { cellKey } from '../world/gridPathfinding';
import { EconomyHud, isEconomyHudPoint } from '../ui/EconomyHud';
import { buildEconomyOverview } from '../ui/economyOverview';
import { closestWorldZoom, nextWorldZoom, planningEdgePan } from '../world/worldZoom';
import { chamberCapacity } from '../simulation/chamberSystem';
import {startingFurnishingOrders} from '../world/chamberFurnishingLayout';
import type {FurnishingVisualOrder} from '../world/chamberFurnishingLayout';
import { ChamberFurnishingRenderer } from '../world/ChamberFurnishingRenderer';
import { BroodRenderer } from '../world/BroodRenderer';
import { ViewportGraphics } from '../world/ViewportGraphics';
import type {WorldTile} from '../world/worldTypes';

const COLORS = {
  ...TERRAIN_PALETTE,
  text: '#f4efd9',
};

const ROOM_LABEL_STYLE = {color: COLORS.text, backgroundColor: '', fontFamily: 'system-ui, sans-serif', fontSize: '9px', fontStyle: 'bold', align: 'center', padding: {x: 0, y: 0}};

const LAYER_COLORS: Partial<Record<TerrainKind, number>> = {
  topsoil: COLORS.topsoil,
  compactEarth: COLORS.compactEarth,
  clay: COLORS.clay,
};

type DigCell = { column: number; row: number };
export class WorldScene extends Phaser.Scene {
  private persistence?: PersistenceController;
  private persistenceReady?: Promise<void>;
  private saveErrorPanel?:SaveErrorDialog;
  private storageErrorReported=false;
  private leaving=false;
  private saveSession?: ColonySession;
  private dragMode: 'none' | 'camera' | 'dig' = 'none';
  private lastPointerX = 0;
  private lastPointerY = 0;
  private gathering!: ReturnType<typeof createWorkforceSimulation>;
  private ants: Array<{ id: string; body: Phaser.GameObjects.Container; load: Phaser.GameObjects.Ellipse }> = [];
  private economyHud!: EconomyHud;
  private workforcePanel!: WorkforcePanel;
  private constructionPanel!: ConstructionPanel;
  private broodRenderer!:BroodRenderer;
  private broodRefreshMs=100;
  private startingFurnishings: FurnishingVisualOrder[] = [];
  private furnishingRenderer!: ChamberFurnishingRenderer;
  private templateSize: TemplateSize = 'free';
  private hudCamera!: Phaser.Cameras.Scene2D.Camera;
  private zoomLabel!: Phaser.GameObjects.Text;
  private panFrameTime = 0;
  private planning = false;
  private drawingTool: DrawingTool = 'brush';
  private planType: PlanType = 'tunnel';
  private draftCells: DigCell[] = [];
  private dragMoved = false;
  private dragOrigin = { x: 0, y: 0 };
  private lastBrushCell: DigCell | null = null;
  private constructionGraphics!: Phaser.GameObjects.Graphics;
  private constructionLabels = new Map<number, Phaser.GameObjects.Text>();
  private constructionSignature = '';
  private constructionNotice = '';
  private constructionNoticeSeconds = 0;
  private overviewRefreshSeconds = 0;
  private sourceReachability = new Map<string, boolean>();
  private renderedDroppedLoads = new Set<string>();
  private royalEggGraphics?:Phaser.GameObjects.Graphics;
  private foodMarkers?: Phaser.GameObjects.Graphics;
  private foodStockLabel?: Phaser.GameObjects.Text;
  private materialStockLabel?: Phaser.GameObjects.Text;
  private waterStockLabel?: Phaser.GameObjects.Text;
  private excavationGraphics!: Phaser.GameObjects.Graphics;
  private digPreviewGraphics!: Phaser.GameObjects.Graphics;
  private buildingMaterialPileGraphics!: Phaser.GameObjects.Graphics;
  private digStart: DigCell | null = null;
  private previewCells: DigCell[] = [];
  private dugCells: DigCell[] = [];
  private excavation!: ExcavationSystem;
  private builderWorkers: Array<{ id: string; body: Phaser.GameObjects.Container; load: Phaser.GameObjects.Container }> = [];
  private materialPiles = new Map<string, { body: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text }>();
  private diggingGrade = 0;
  private upgradeButton?: Phaser.GameObjects.Text;
  private digStatus?: Phaser.GameObjects.Text;

  constructor() {
    super('WorldScene');
  }

  init(data:{session?:ColonySession}={}):void {
    this.saveSession=data.session??createColonySession({id:crypto.randomUUID(),name:'Neue Kolonie'});
    this.ants=[];this.builderWorkers=[];this.materialPiles=new Map();this.constructionLabels=new Map();
    this.sourceReachability=new Map();this.renderedDroppedLoads=new Set();this.royalEggGraphics=undefined;this.draftCells=[];this.previewCells=[];this.dugCells=[];
    this.constructionSignature='';this.constructionNotice='';this.constructionNoticeSeconds=0;this.overviewRefreshSeconds=0;
    this.foodMarkers=undefined;this.foodStockLabel=undefined;this.waterStockLabel=undefined;this.materialStockLabel=undefined;
    this.dragMode='none';this.planning=false;this.dragMoved=false;this.digStart=null;this.lastBrushCell=null;
    this.panFrameTime=0;this.broodRefreshMs=100;this.leaving=false;this.persistence=undefined;this.storageErrorReported=false;
  }

  preload(): void {
    preloadWorldTileArt(this);
  }

  create(): void {
    const session=this.saveSession!;
    this.gathering=session.simulation;this.excavation=session.excavation;
    this.diggingGrade=this.excavation.exportState().grade;
    activateWorld(session.world);
    this.drawWorld();
    this.excavationGraphics = this.add.graphics().setDepth(2);
    this.digPreviewGraphics = this.add.graphics().setDepth(4);
    this.constructionGraphics = this.add.graphics().setDepth(3);
    this.furnishingRenderer = new ChamberFurnishingRenderer(this, TILE_SIZE, (column,row) => worldMap[row]?.[column]?.state === 'open');
    this.startingFurnishings = startingFurnishingOrders(this.saveSession!.world);
    this.drawFoodMarkers();
    this.buildingMaterialPileGraphics = this.add.graphics().setDepth(4);
    this.drawBuildingMaterialPile();
    this.drawLabels();
    this.broodRenderer=new BroodRenderer(this,queenChamberCenter);
    this.createDigControls();
    this.updateUpgradeLabel();
    this.createAnts();
    this.syncBuilderVisuals();
    this.workforcePanel = new WorkforcePanel(
      document.querySelector('#game')!,
      (specialization, from, to, count) => {
        this.gathering.moveWorkers(specialization, from, to, count);
        this.updateEconomyHud();
      },
      {snapshot: () => this.gathering.queen.snapshot, setQuotas: quotas => this.gathering.queen.setQuotas(quotas), supply:()=>this.gathering.broodSupply.getRooms()},
    );
    this.constructionPanel = new ConstructionPanel(document.querySelector('#game')!, {
      start: (type, size) => this.startDraft(type, size),
      tool: tool => { this.drawingTool = tool; this.previewCells = []; this.renderDigPreview(); },
      confirm: () => this.confirmDraft(), discard: () => this.discardDraft(),
      pause: id => { this.excavation.pauseOrder(id); this.updateConstruction(); },
      resume: id => { this.excavation.resumeOrder(id); this.updateConstruction(); },
      cancel: id => { this.excavation.cancelOrder(id); this.updateConstruction(); },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.workforcePanel.destroy(); this.constructionPanel.destroy();this.broodRenderer.destroy();this.furnishingRenderer.destroy(); });
    this.economyHud = new EconomyHud(this, priority => {
      this.gathering.gathering.setPriority(priority);
      this.updateEconomyHud();
    }, () => this.workforcePanel.open(), () => this.constructionPanel.open(), () => {void this.persistence?.manual().catch(error=>this.saveErrorPanel?.show(String(error)));}, () => {void this.returnToMenu();});
    this.installPersistence();
    this.refreshSourceReachability();
    this.updateEconomyHud();
    this.frameWorld();
    this.createZoomControls();
    this.separateHudCamera();
    this.enableCameraDrag();
    this.renderBrood(0);
  }

  update(_time: number, delta: number): void {
    const now=performance.now();
    this.panWhileDrawing(this.panFrameTime ? Math.min((now-this.panFrameTime)/1000,.25) : 0);
    this.panFrameTime=now;
    if(!this.leaving)this.gathering.advance(delta / 1000);
    this.saveSession!.syncConstruction();
    if(this.diggingGrade!==this.excavation.diggingGrade){
      this.diggingGrade=this.excavation.diggingGrade;this.updateUpgradeLabel();this.renderDigPreview();
    }
    this.persistence?.tick(now,this.gathering.clock.exportState().paused);
    const changedCells = this.excavation.drainChangedCells();
    for (const cell of changedCells) { this.dugCells.push(cell); this.renderExcavatedTiles(cell); }
    if (changedCells.length) this.refreshSourceReachability();
    this.syncBuilderVisuals();
    this.syncMaterialPiles();
    this.renderBrood(delta);
    const notices = this.excavation.drainConstructionNotices();
    if (notices.length) {
      this.constructionNotice = notices.map(notice => notice.message).join(' · ');
      this.constructionNoticeSeconds = CONSTRUCTION_CONFIG.noticeSeconds;
    }
    if (this.constructionNoticeSeconds > 0) {
      this.constructionNoticeSeconds -= delta / 1000;
      this.digStatus?.setText(this.constructionNotice);
    }
    const collectors = new Map(this.gathering.gathering.getCollectors().map(ant => [ant.id, ant]));
    const visibleWorkers = new Map(this.gathering.getWorkers().filter(worker => worker.actualWork !== 'building').map(worker => [worker.id, worker]));
    this.createAnts();
    this.ants.forEach(ant => {
      const state = visibleWorkers.get(ant.id);
      if (!state) { ant.body.destroy(); return; }
      if (state.position.x !== ant.body.x) ant.body.setScale(state.position.x < ant.body.x ? -1 : 1, 1);
      ant.body.setPosition(state.position.x, state.position.y);
      const carried = state.load ?? collectors.get(ant.id)?.load;
      ant.load.setVisible(!!state.eggId || (carried?.amount ?? 0) > 0);
      const royal=state.eggId?.startsWith('royal-');
      ant.load.setFillStyle(royal?0xf5dca0:state.eggId?0xfff2cf:carried?.resource === 'water' ? 0x71d0d5 : 0xe3aa4e);
      ant.load.setDisplaySize(royal?7:state.eggId?5:6,royal?10:state.eggId?8:5);
    });
    this.ants = this.ants.filter(ant => visibleWorkers.has(ant.id));
    this.foodStockLabel?.setText(`NAHRUNG: ${this.gathering.resources.getStore('food-store').amount.toFixed(1)}`);
    this.materialStockLabel?.setText(`BAUSTOFFLAGER: ${this.gathering.resources.getStore('building-material-store').amount.toFixed(1)}`);
    this.waterStockLabel?.setText(`WASSER: ${this.gathering.resources.getStore('water-store').amount.toFixed(1)}`);
    this.drawFoodMarkers();
    this.drawBuildingMaterialPile();
    this.refreshMapText();
    this.overviewRefreshSeconds -= delta / 1000;
    if (this.overviewRefreshSeconds <= 0) {
      this.overviewRefreshSeconds = 0.25;
      this.updateEconomyHud();
    }
    for (const drop of this.gathering.getDroppedLoads()) {
      if (this.renderedDroppedLoads.has(drop.id)) continue;
      this.renderedDroppedLoads.add(drop.id);
      this.add.ellipse(drop.position.x, drop.position.y, 7, 5,
        drop.load.resource === 'water' ? 0x71d0d5 : 0xe3aa4e).setDepth(5);
    }
  }

  private installPersistence():void {
    const repository=new ColonyRepository();
    const lock=new BrowserColonyWriteLock();
    this.saveErrorPanel=new SaveErrorDialog(document.querySelector('#game')!,{
      exportCurrent:()=>downloadColonyFile(captureColony(this.saveSession!)),
      retry:async()=>{await this.persistenceReady;await this.persistence!.manual();},
      manage:()=>{if(window.confirm('Nicht gesicherter Fortschritt bleibt nur in dieser laufenden Ansicht. Ohne weiteres Speichern zur Kolonienverwaltung zurückkehren?')){this.saveErrorPanel?.close();void this.returnToMenu(true);}},
    });
    const controller=new PersistenceController(this.saveSession!,repository,lock,status=>{
      this.economyHud.setSaveStatus(status.kind,status.message);
      if(status.kind==='saved'){this.storageErrorReported=false;this.saveErrorPanel?.close();}
      if(status.kind==='error'&&!this.storageErrorReported){this.storageErrorReported=true;this.saveErrorPanel?.show(status.message);}
    });
    this.persistence=controller;controller.resetTime(performance.now());
    this.persistenceReady=controller.start().then(async()=>{
      if(lock.held)await repository.markPlayed(this.saveSession!.id,()=>lock.held);
      controller.resetTime(performance.now());
    }).catch(error=>this.economyHud.setSaveStatus('error',String(error)));
    const visibility=()=>{controller.setVisible(!document.hidden);if(document.hidden)void controller.background().catch(()=>{});};
    document.addEventListener('visibilitychange',visibility);
    const saveKey=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void controller.manual().catch(error=>this.saveErrorPanel?.show(String(error)));}};
    window.addEventListener('keydown',saveKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',saveKey);
      this.saveErrorPanel?.destroy();
      void controller.close().finally(()=>repository.close()).catch(()=>{});
      if(this.persistence===controller)this.persistence=undefined;
    });
  }

  private async returnToMenu(discardConfirmed=false):Promise<void>{
    if(this.leaving)return;this.leaving=true;
    const wasPaused=this.gathering.clock.exportState().paused;
    this.persistence?.setVisible(false);
    try{if(!discardConfirmed){await this.persistenceReady;await this.persistence?.manual();}}
    catch(error){
      this.gathering.clock.setPaused(wasPaused);this.persistence?.setVisible(!document.hidden);this.leaving=false;
      this.saveErrorPanel?.show(String(error));return;
    }
    // Pause only the departing view; saved games resume their original pause state.
    this.gathering.clock.setPaused(wasPaused);
    await this.persistence?.close();this.scene.start('MainMenuScene');
  }

  private refreshSourceReachability(): void {
    this.sourceReachability.clear();
    for (const source of this.gathering.resources.listSources()) {
      const reachable = this.gathering.navigation.sourceAccessPoints(source).some(access =>
        this.gathering.navigation.findPath(nestChamberCenter, access) !== null);
      this.sourceReachability.set(source.id, reachable);
    }
  }
  private renderBrood(delta:number):void {
    this.broodRefreshMs+=delta;if(this.broodRefreshMs<100)return;
    const elapsed=this.broodRefreshMs;this.broodRefreshMs=0;
    const royal=this.saveSession!.royal.getEggs();
    if(royal.length||this.royalEggGraphics){
      const graphics=this.royalEggGraphics??=this.add.graphics().setDepth(7);graphics.clear();
      for(const egg of royal){
        if(egg.carried)continue;const p=egg.position;graphics.lineStyle(1,0xc69a45);
        if(egg.stage==='adult'){
          graphics.fillStyle(0x1b1512).fillEllipse(p.x-15,p.y,30,19).strokeEllipse(p.x-15,p.y,30,19).fillEllipse(p.x+5,p.y,16,12).fillCircle(p.x+17,p.y-1,6);
          for(const x of [-3,4,10]){graphics.lineBetween(p.x+x,p.y+3,p.x+x-8,p.y+12);graphics.lineBetween(p.x+x,p.y-4,p.x+x-8,p.y-12);}
          graphics.lineBetween(p.x+20,p.y-5,p.x+27,p.y-12).lineBetween(p.x+22,p.y-2,p.x+31,p.y-6);
        }else if(egg.stage==='larva'){
          graphics.fillStyle(0xe9d9a6);for(let i=0;i<4;i++)graphics.fillCircle(p.x-6+i*4,p.y+Math.sin(i)*2,4).strokeCircle(p.x-6+i*4,p.y+Math.sin(i)*2,4);
        }else graphics.fillStyle(egg.stage==='pupa'?0xb99462:0xf5dca0).fillEllipse(p.x,p.y,egg.stage==='pupa'?11:7,egg.stage==='pupa'?17:10).strokeEllipse(p.x,p.y,egg.stage==='pupa'?11:7,egg.stage==='pupa'?17:10);
      }
    }
    const rooms=new Map((this.saveSession!.world.broodChambers??[]).map(room=>[room.id,room.cells]));
    for(const order of this.excavation.getConstructionOrders())if(order.type.startsWith('brood-'))rooms.set(`built-${order.id}`,order.cells);
    this.broodRenderer.update(elapsed,this.gathering.queen.snapshot,rooms,this.gathering.broodSupply.getRooms(),TILE_SIZE,this.gathering.clock.secondsPerGameDay);
  }

  private updateEconomyHud(): void {
    this.workforcePanel.update(this.gathering.getWorkers(),this.gathering.getProgression(),{carryCapacity:this.gathering.gathering.carryCapacity,speed:this.gathering.gathering.speed},{carryCapacity:this.gathering.broodSupply.carryCapacity,speed:this.gathering.broodSupply.speed});
    this.updateConstruction();
    this.economyHud.update(buildEconomyOverview(this.gathering, {
      otherWorkerCount: this.gathering.getWorkers().filter(worker => worker.actualWork !== 'gathering').length,
      sourceReachability: this.sourceReachability,
    }));
  }

  private drawWorld(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.sky, 1);
    graphics.fillRect(0, 0, worldSize.width, worldSize.height);

    const drawTile=(graphics:Phaser.GameObjects.Graphics,cell:WorldTile,columnIndex:number,rowIndex:number)=>{
        const visualKey = terrainDefinitions[cell.terrain].visualKey;
        if (visualKey === 'sky') return;

        const x = columnIndex * TILE_SIZE;
        const y = rowIndex * TILE_SIZE;

        if (visualKey === 'surface') {
          return;
        }

        if (visualKey === 'deepRock' && cell.state !== 'open' && cell.state !== 'rubble') {
          graphics.fillStyle(COLORS.deepRock, 1);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          graphics.fillStyle(COLORS.stoneLine, 0.35);
          graphics.fillRect(x + 4, y + 7, 4, 2);
          graphics.fillRect(x + 16, y + 17, 3, 2);
          return;
        }

        if (visualKey === 'stone' && cell.state !== 'open' && cell.state !== 'rubble') {
          graphics.fillStyle(cell.terrain === 'stoneLayer' ? COLORS.stoneLayer : COLORS.stone, 1);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          graphics.lineStyle(1, COLORS.stoneLine, 0.8);
          graphics.beginPath();
          graphics.moveTo(x + 5, y + 2);
          graphics.lineTo(x + 10, y + 11);
          graphics.lineTo(x + 7, y + 18);
          graphics.moveTo(x + 17, y + 8);
          graphics.lineTo(x + 21, y + 14);
          graphics.strokePath();
          return;
        }

        if (cell.state !== 'open' && cell.state !== 'rubble') {
          const grade = diggingGradeAt(columnIndex, rowIndex);
          const baseColor = LAYER_COLORS[cell.terrain]
            ?? (rowIndex > worldMap.length - 6 ? COLORS.bottomSoil : COLORS.gradeSoil[grade] ?? COLORS.deepSoil);
          const variation = (columnIndex * 17 + rowIndex * 31) % 9;
          const shade = Phaser.Display.Color.ValueToColor(baseColor);
          const adjustment = variation - 4;
          const tileColor = Phaser.Display.Color.GetColor(
            Phaser.Math.Clamp(shade.red + adjustment, 0, 255),
            Phaser.Math.Clamp(shade.green + adjustment, 0, 255),
            Phaser.Math.Clamp(shade.blue + adjustment, 0, 255),
          );
          graphics.fillStyle(tileColor, 1);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          if (variation === 0 || variation === 5) {
            graphics.fillStyle(COLORS.soilLine, 0.75);
            graphics.fillRect(x + 5, y + 8, 3, 2);
            graphics.fillRect(x + 15, y + 17, 2, 3);
          }
          return;
        }

        graphics.fillStyle(COLORS.open, 1);
        graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    };
    const chunkTiles=16;
    for(let row=0;row<worldMap.length;row+=chunkTiles){
      for(let column=0;column<worldMap[0].length;column+=chunkTiles){
        const bounds=new Phaser.Geom.Rectangle(column*TILE_SIZE,row*TILE_SIZE,chunkTiles*TILE_SIZE,chunkTiles*TILE_SIZE);
        this.add.existing(new ViewportGraphics(this,bounds,chunk=>{
          for(let r=row;r<Math.min(row+chunkTiles,worldMap.length);r++)
            for(let c=column;c<Math.min(column+chunkTiles,worldMap[r].length);c++)drawTile(chunk,worldMap[r][c],c,r);
        }));
      }
    }

    drawWorldTileArt(this, worldMap, TILE_SIZE);

    const landmarkGraphics = this.add.graphics().setDepth(1);
    drawWorldDecorations(landmarkGraphics, worldDecorations, TILE_SIZE);
  }

  private drawFoodMarkers(): void {
    const graphics = this.foodMarkers ??= this.add.graphics().setDepth(2);
    graphics.clear();
    for(const source of this.gathering.resources.listSources().filter(source=>source.resource==='food')) {
      const {x,y}=source.position;
      graphics.lineStyle(1,0x8a956a,.7).strokeEllipse(x,y+3,28,9);
      if(source.kind==='unlimited'||source.amount>0){
        graphics.fillStyle(0xe3aa4e,1);
        graphics.fillEllipse(x-8,y+1,7,5);graphics.fillEllipse(x+1,y-1,8,6);graphics.fillEllipse(x+10,y+1,6,5);
      }
    }

    if (this.gathering.resources.getStore('food-store').amount > 0) {
      graphics.fillStyle(0xc88b38, 1);
      graphics.fillEllipse(foodStoreCenter.x - 27, foodStoreCenter.y + 11, 10, 7);
      graphics.fillEllipse(foodStoreCenter.x - 17, foodStoreCenter.y + 8, 11, 8);
      graphics.fillEllipse(foodStoreCenter.x - 7, foodStoreCenter.y + 12, 9, 6);
      graphics.fillEllipse(foodStoreCenter.x + 4, foodStoreCenter.y + 9, 11, 8);
    }
    const water = this.gathering.resources.getStore('water-store');
    graphics.lineStyle(2, 0x657b7c, 1);
    graphics.strokeRect(waterStoreCenter.x - 32, waterStoreCenter.y + 6, 64, 14);
    if (water.amount > 0) {
      const height = 12 * water.amount / water.capacity;
      graphics.fillStyle(0x71d0d5, 1);
      graphics.fillRect(waterStoreCenter.x - 30, waterStoreCenter.y + 18 - height, 60, height);
    }
  }

  private createAnts(): void {
    const existing=new Set(this.ants.map(ant=>ant.id));
    for (const collector of this.gathering.getWorkers().filter(worker => worker.actualWork !== 'building')) {
      if (existing.has(collector.id)) continue;
      const body = this.add.container(collector.position.x, collector.position.y).setDepth(4);
      const shape=createAntBody(this);
      body.add(shape);

      const load = this.add.ellipse(9, -4, 6, 5, 0xe3aa4e).setVisible(false);
      body.add(load);
      this.ants.push({ id: collector.id, body, load });
    }
  }

  private drawLabels(): void {
    this.add
      .text(queenChamberCenter.x, queenChamberCenter.y-28, 'KÖNIGINNENKAMMER', {
        ...ROOM_LABEL_STYLE,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(7)
      .setAlpha(1);

    const broodLabels: Array<[keyof typeof broodChamberCenters, string]> = [
      ['gathering', 'BRUTKAMMER\nSAMMELN'],
      ['building', 'BRUTKAMMER\nABBAUEN / BAUEN'],
      ['care', 'BRUTKAMMER\nPFLEGEN'],
      ['combat', 'BRUTKAMMER\nKÄMPFEN'],
    ];
    broodLabels.forEach(([kind, label]) => {
      const center = broodChamberCenters[kind];
      this.add
        .text(center.x, center.y, label, {
          ...ROOM_LABEL_STYLE,
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5).setDepth(7)
        .setAlpha(1);
    });

    this.add
      .text(surfaceFoodSource.x, surfaceFoodSource.y - 18, 'FUTTER', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(7)
      .setAlpha(0.9);

    this.foodStockLabel = this.add
      .text(foodStoreCenter.x, foodStoreCenter.y - 22, 'NAHRUNG: 0.0', {
        ...ROOM_LABEL_STYLE,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(7)
      .setAlpha(1);

    this.waterStockLabel = this.add.text(waterStoreCenter.x, waterStoreCenter.y - 22, 'WASSER: 0.0', {
      ...ROOM_LABEL_STYLE, fontFamily: 'system-ui, sans-serif', fontSize: '9px', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7).setAlpha(1);

    this.materialStockLabel = this.add
      .text(buildingMaterialStoreCenter.x, buildingMaterialStoreCenter.y, 'BAUSTOFFLAGER: 0.0', {
        ...ROOM_LABEL_STYLE,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(7)
      .setAlpha(1);

    this.add
      .text(stoneOutcropCenter.x, stoneOutcropCenter.y - 5 * TILE_SIZE, 'STEIN', {
        color: '#f1e6d5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5).setDepth(7)
      .setAlpha(0.9);

    const centerColumn = Math.floor(nestChamberCenter.x / TILE_SIZE);
    const surface = surfaceRow(centerColumn);
    const soilLayers: Array<[number, string]> = [
      [10, 'OBERBODEN'],
      [30, 'KOMPAKTE ERDE'],
      [54, 'LEHM'],
      [78, 'STEINSCHICHT'],
      [100, 'TIEFENGESTEIN'],
    ];
    soilLayers.forEach(([depth, label]) => {
      this.add
        .text(
          (centerColumn + 7) * TILE_SIZE,
          (surface + depth) * TILE_SIZE,
          label,
          {
            color: '#eee2cf',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '9px',
            fontStyle: 'bold',
          },
        )
        .setAlpha(0.85);
    });
  }

  private createDigControls(): void {
    this.add.rectangle(8, 310, 624, 44, 0x211e19, 0.94).setOrigin(0).setScrollFactor(0).setDepth(9);
    this.digStatus = this.add
      .text(18, 315, 'Bauen: Plan zeichnen · Baustelle anklicken: Details', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
      })
      .setScrollFactor(0)
      .setDepth(10).setWordWrapWidth(600);

    this.add.text(18, 337, 'Karte ziehen · Beim Zeichnen am Kartenrand halten: weiterrollen', {
      color: COLORS.text, fontFamily: 'system-ui, sans-serif', fontSize: '9px',
    }).setScrollFactor(0).setDepth(10);

    this.upgradeButton = this.add
      .text(622, 329, '', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        backgroundColor: '#66513c',
        padding: { x: 7, y: 5 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);
    this.updateUpgradeLabel();
  }

  private createBuilderWorker(id: string, position: { x: number; y: number }): void {
    const cell = this.cellAt(position.x, position.y);
    if (!cell) throw new Error('Builder position is outside the world');
    const body = this.add.container(position.x, position.y).setDepth(5);
    const shape=createAntBody(this,true);
    body.add(shape);
    const load = this.createMaterialVisual(position.x, position.y);
    load.removeFromDisplayList(); body.add(load); load.setPosition(8, -6).setVisible(false);
    this.builderWorkers.push({ id, body, load });
  }

  private updateUpgradeLabel(): void {
    const terrain=['Oberboden','Kompakte Erde','Lehm','Steinschicht','Tiefengestein'][this.diggingGrade];
    this.upgradeButton?.setText(`GRABKRAFT · ${terrain}`);
  }

  private frameWorld(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, worldSize.width, worldSize.height);
    if (new URLSearchParams(window.location.search).get('view') === 'pond') {
      const pond = worldDecorations.find(decoration => decoration.kind === 'pond');
      if (pond) {
        camera.centerOn(pond.position.x, pond.position.y + TILE_SIZE * 1.5);
        return;
      }
    }
    const routeCenterX = (buildingMaterialStoreCenter.x + foodStoreCenter.x) / 2;
    camera.setScroll(routeCenterX - camera.width / 2, initialCameraY);
  }

  private refreshMapText(): void {
    for (const object of this.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text) || object.scrollFactorX === 0) continue;
      // Keep the original world font size; the camera scales room text naturally.
      object.setScale(1).setVisible(true);
    }
  }

  private separateHudCamera(): void {
    const worldCamera = this.cameras.main;
    this.hudCamera = this.cameras.add(0, 0, 640, 360, false, 'hud');
    const classify = (object: Phaser.GameObjects.GameObject) => {
      const fixed = object as Phaser.GameObjects.GameObject & {scrollFactorX?: number; scrollFactorY?: number};
      if (fixed.scrollFactorX === 0 && fixed.scrollFactorY === 0) worldCamera.ignore(object);
      else this.hudCamera.ignore(object);
    };
    this.children.list.forEach(classify);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, classify);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, classify));
  }
  private setWorldZoom(value: number, x = 320, y = 210): void {
    const camera = this.cameras.main;
    const before = camera.getWorldPoint(x, y);
    camera.setZoom(closestWorldZoom(value));
    camera.preRender();
    const after = camera.getWorldPoint(x, y);
    camera.scrollX = camera.clampX(camera.scrollX + before.x - after.x);
    camera.scrollY = camera.clampY(camera.scrollY + before.y - after.y);
    camera.scrollX = Math.round(camera.scrollX * camera.zoom) / camera.zoom;
    camera.scrollY = Math.round(camera.scrollY * camera.zoom) / camera.zoom;
    camera.preRender();
    this.zoomLabel.setText(`${Math.round(camera.zoom * 100)} %`);
    this.refreshMapText();
    this.renderDigPreview();
  }
  private createZoomControls(): void {
    this.zoomLabel = this.add.text(566, 293, '100 %', {color: COLORS.text, fontFamily: 'system-ui, sans-serif', fontSize: '10px', backgroundColor: '#25231e'})
      .setOrigin(.5).setScrollFactor(0).setDepth(22);
    for (const [x, text, zoom] of [[524, '−', -1], [609, '+', 1]] as const) {
      const button = this.add.text(x, 293, text, {color: COLORS.text, backgroundColor: '#39352e', fontFamily: 'system-ui, sans-serif', fontSize: '16px', padding: {x: 8, y: 1}})
        .setOrigin(.5).setScrollFactor(0).setDepth(22).setInteractive({useHandCursor: true});
      button.on(Phaser.Input.Events.POINTER_DOWN, (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation(); this.setWorldZoom(nextWorldZoom(this.cameras.main.zoom, zoom));
      });
    }
    this.zoomLabel.setInteractive({useHandCursor: true}).on(Phaser.Input.Events.POINTER_DOWN,
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {event.stopPropagation();this.setWorldZoom(1);});
    const wheel = (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (pointer.y > (this.economyHud.collapsed ? 34 : 110) && pointer.y < 310 && !this.constructionPanel.isOpen && !this.workforcePanel.isOpen)
        this.setWorldZoom(nextWorldZoom(this.cameras.main.zoom, dy > 0 ? -1 : 1), pointer.x, pointer.y);
    };
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, wheel);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off(Phaser.Input.Events.POINTER_WHEEL, wheel));
  }

  private enableCameraDrag(): void {
    this.input.setDefaultCursor('grab');
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.startDrag, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.moveCamera, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.stopDrag, this);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.stopDrag, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.startDrag, this);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.moveCamera, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, this.stopDrag, this);
      this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.stopDrag, this);
    });
  }

  private startDraft(type: PlanType, size: TemplateSize = 'free'): void {
    this.templateSize = type === 'tunnel' ? 'free' : size;
    this.planType = type; this.planning = true; this.drawingTool = this.templateSize === 'free' ? 'brush' : 'template';
    this.draftCells = []; this.previewCells = []; this.dragMode = 'none';
    this.constructionPanel.showDraft(type, this.templateSize); this.renderDigPreview();
  }
  private confirmDraft(): void {
    const id = this.excavation.addOrder(this.draftCells, this.planType);
    this.discardDraft(); this.updateConstruction(); this.constructionPanel.selectOrder(id);
  }
  private discardDraft(): void {
    this.planning = false; this.draftCells = []; this.previewCells = []; this.dragMode = 'none';
    this.digStart = null; this.lastBrushCell = null; this.digPreviewGraphics.clear(); this.constructionPanel.hideDraft(); this.input.setDefaultCursor('grab');
  }
  private startDrag(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown || pointer.event?.target !== this.game.canvas || this.workforcePanel.isOpen || this.constructionPanel.isOpen
      || isEconomyHudPoint(pointer.x, pointer.y, this.economyHud.collapsed) || pointer.y >= 310) return;
    const cell = this.pointerCell(pointer);
    this.dragMoved = false;
    this.dragOrigin = { x: pointer.x, y: pointer.y };
    if (this.planning && this.drawingTool !== 'pan' && cell) {
      this.dragMode = 'dig'; this.digStart = cell; this.lastBrushCell = cell;
      this.previewCells = this.drawingTool === 'template' && this.templateSize !== 'free' ? squareTemplate(this.planType, this.templateSize, cell) : [cell];
      this.renderDigPreview(); this.input.setDefaultCursor('crosshair'); return;
    }
    this.dragMode = 'camera'; this.lastPointerX = pointer.x; this.lastPointerY = pointer.y;
    this.input.setDefaultCursor('grabbing');
  }
  private panWhileDrawing(seconds: number): void {
    const pointer=this.input.activePointer;
    if(!this.planning || this.dragMode!=='dig' || !pointer.isDown || this.drawingTool==='pan'
      || this.constructionPanel.isOpen || this.workforcePanel.isOpen)return;
    const velocity=planningEdgePan(pointer.x,pointer.y,this.economyHud.collapsed?34:110);
    if(!velocity.x && !velocity.y)return;
    const camera=this.cameras.main,step=Math.min(seconds,.25)/camera.zoom;
    camera.scrollX=camera.clampX(camera.scrollX+velocity.x*step);
    camera.scrollY=camera.clampY(camera.scrollY+velocity.y*step);
    camera.scrollX=Math.round(camera.scrollX*camera.zoom)/camera.zoom;
    camera.scrollY=Math.round(camera.scrollY*camera.zoom)/camera.zoom;
    camera.preRender();
    this.moveCamera(pointer);
  }

  private moveCamera(pointer: Phaser.Input.Pointer): void {
    if (this.planning && this.drawingTool === 'template' && this.templateSize !== 'free'
      && this.dragMode !== 'camera' && !this.constructionPanel.isOpen && !this.workforcePanel.isOpen
      && pointer.y > (this.economyHud.collapsed ? 34 : 110) && pointer.y < 310 && (!this.draftCells.length || pointer.isDown)) {
      const cell = this.pointerCell(pointer);
      if (cell) { this.previewCells = squareTemplate(this.planType, this.templateSize, cell); this.renderDigPreview(); }
      return;
    }
    if (this.dragMode === 'dig' && this.digStart && pointer.isDown) {
      if (isEconomyHudPoint(pointer.x, pointer.y, this.economyHud.collapsed) || pointer.y >= 310) return;
      const endpoint = this.pointerCell(pointer);
      if (endpoint) {
        this.previewCells = this.drawingTool === 'rectangle' ? rectangleSelection(this.digStart, endpoint)
          : mergeSelection(this.previewCells, lineSelection(this.lastBrushCell!, endpoint));
        this.lastBrushCell = endpoint;
        this.renderDigPreview();
      }
      return;
    }
    if (this.dragMode !== 'camera' || !pointer.isDown) return;
    const dx = this.lastPointerX - pointer.x, dy = this.lastPointerY - pointer.y;
    if (Math.hypot(pointer.x - this.dragOrigin.x, pointer.y - this.dragOrigin.y) > 3) this.dragMoved = true;
    const camera = this.cameras.main;
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX + dx / camera.zoom, (camera.width / camera.zoom - camera.width) / 2, worldSize.width - (camera.width / camera.zoom + camera.width) / 2);
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY + dy / camera.zoom, (camera.height / camera.zoom - camera.height) / 2, worldSize.height - (camera.height / camera.zoom + camera.height) / 2);
    camera.scrollX = Math.round(camera.scrollX * camera.zoom) / camera.zoom;
    camera.scrollY = Math.round(camera.scrollY * camera.zoom) / camera.zoom;
    this.lastPointerX = pointer.x; this.lastPointerY = pointer.y;
  }
  private stopDrag(pointer: Phaser.Input.Pointer): void {
    const insideMap = pointer.x >= 0 && pointer.x < 640 && pointer.y > (this.economyHud.collapsed ? 34 : 110) && pointer.y < 310;
    if (this.dragMode === 'dig' && insideMap) {
      this.draftCells = this.drawingTool === 'template' ? this.previewCells.map(cell => ({...cell})) : mergeSelection(this.draftCells, this.previewCells);
      this.constructionPanel.updateDraft(this.draftCells.length);
    } else if (this.dragMode === 'camera' && !this.dragMoved && !this.planning && insideMap) {
      const cell = this.pointerCell(pointer);
      const order = cell && this.excavation.getConstructionOrders().find(order => order.status !== 'cancelled'
        && order.status !== 'completed' && order.cells.some(candidate => cellKey(candidate) === cellKey(cell)));
      if (order) { this.updateConstruction(); this.constructionPanel.selectOrder(order.id); }
    }
    this.dragMode = 'none'; this.digStart = null; this.lastBrushCell = null; this.previewCells = [];
    this.renderDigPreview(); this.input.setDefaultCursor(this.planning && this.drawingTool !== 'pan' ? 'crosshair' : 'grab');
  }

  private pointerCell(pointer: Phaser.Input.Pointer): DigCell | null {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return this.cellAt(worldPoint.x, worldPoint.y);
  }

  private cellAt(x: number, y: number): DigCell | null {
    const column = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (row < 0 || row >= worldMap.length || column < 0 || column >= worldMap[row].length) return null;
    return { column, row };
  }

  private requiredGrade(cell: DigCell): number {
    return requiredDiggingGrade(cell, worldMap[cell.row][cell.column]);
  }

  private renderDigPreview(): void {
    this.digPreviewGraphics.clear();
    const cells = this.drawingTool === 'template' && this.previewCells.length ? this.previewCells : mergeSelection(this.draftCells, this.previewCells);
    const validation = this.excavation.validateOrder(cells, this.planType);
    if (this.planning) {
      const unit = this.planType.startsWith('brood-') ? 'Brutplätze' : this.planType === 'rest' ? 'Ruheplätze' : 'Einheiten';
      const summary = `${cells.length} Kacheln · ${chamberCapacity(this.planType, cells.length)} ${unit} · ${constructionMaterialEstimate(this.planType, cells.length)} Baumaterial`;
      this.constructionPanel.updateDraft(cells.length, validation.valid ? summary : validation.message, validation.valid && this.draftCells.length > 0);
    }
    this.digPreviewGraphics.lineStyle(2, 0xf27260, 1);
    for (const conflict of validation.conflicts) this.digPreviewGraphics.strokeRect(conflict.column*TILE_SIZE+1, conflict.row*TILE_SIZE+1,TILE_SIZE-2,TILE_SIZE-2);
    cells.forEach(({ column, row }, index) => {
      const cell = worldMap[row]?.[column];
      const invalid = !validation.valid || !cell;
      const blockedByHardness = !!cell && isDiggableTile(cell)
        && this.requiredGrade({ column, row }) > this.diggingGrade;
      this.digPreviewGraphics.fillStyle(blockedByHardness || invalid ? 0xd86654 : 0xf0c66d, 0.45);
      this.digPreviewGraphics.fillRect(
        column * TILE_SIZE + 3,
        row * TILE_SIZE + 3,
        TILE_SIZE - 6,
        TILE_SIZE - 6,
      );
      if (index === cells.length - 1 && blockedByHardness) {
        this.digPreviewGraphics.lineStyle(2, 0xf3ddd0, 1);
        this.digPreviewGraphics.strokeRect(
          column * TILE_SIZE + 2,
          row * TILE_SIZE + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4,
        );
      }
    });
  }

  private commitDigOrder(): void {
    const hasDiggableTile = this.previewCells.some(({ column, row }) => {
      const cell = worldMap[row][column];
      return isDiggableTile(cell);
    });
    if (!hasDiggableTile) return;

    this.excavation.addOrder(this.previewCells);
    this.digStatus?.setText('Grabauftrag erteilt: Die Ameisen graben den Weg nach und nach.');
  }

  private updateConstruction(): void {
    const orders = this.excavation.getConstructionOrders();
    const royalStatus=new Map(this.saveSession!.royal.getEggs().map(e=>{
      const stage={egg:'Königinnen-Ei',larva:'Königinnenlarve',pupa:'Königinnenpuppe',adult:'Königin'}[e.stage];
      const phaseDays={egg:.2,larva:.6,pupa:.4,adult:1}[e.stage];
      const queen=this.gathering.queen.snapshot.queens.find(q=>q.roomId===e.roomId);
      const status=e.stage==='adult'?`Königin · ${(queen?.effectiveEggsPerDay??0)>0?'eigene Eiablage aktiv':'Eiablage pausiert'} · Eierpuffer ${queen?.bufferCount??0} / ${queen?.bufferCapacity??0}`
        :e.arrived?`${stage} · ${Math.floor(e.stageProgressDays/phaseDays*100)} % · 2 Pflegeplätze · Entwicklung bei voller Versorgung insgesamt 12 Minuten`
        :e.carried?'Königinnen-Ei wird transportiert.':'Königinnen-Ei wartet auf Abholung.';
      return [Number(e.roomId.slice(6)),status] as const;
    }));
    this.constructionPanel.update(orders,this.excavation.queenSlotsAvailable,royalStatus);
    const storeIds = new Map(this.excavation.chambers.getChambers().filter(room => room.storeId).map(room => [room.id, room.storeId!]));
    setSmoothRoomArt(this,worldMap,worldMap.flatMap((tiles,row)=>tiles.flatMap((tile,column)=>tile.state==='open'?[{column,row}]:[])));
    this.furnishingRenderer.update([...this.startingFurnishings.map(room=>({...room,stock:room.storeId?this.gathering.resources.getStore(room.storeId):undefined})), ...orders.filter(order => order.status !== 'cancelled').map(order => ({...order,
      stock: storeIds.has(order.id) ? this.gathering.resources.getStore(storeIds.get(order.id)!) : undefined,
    }))]);
    if (this.planning) this.renderDigPreview();
    const signature = orders.map(order => `${order.id}:${order.status}:${order.blockReason}:${order.excavated}:${order.materialUsed}:${storeIds.has(order.id) ? this.gathering.resources.getStore(storeIds.get(order.id)!).amount : ''}`).join('|');
    if (signature === this.constructionSignature) return;
    this.constructionSignature = signature; this.constructionGraphics.clear();
    const visible = new Set<number>();
    for (const order of orders) {
      if (order.status === 'cancelled' || order.status === 'completed') continue;
      visible.add(order.id);
      const color = order.operational ? 0x8ebc83 : order.status === 'blocked' ? 0xd86654 : order.paused ? 0xb99d65
        : order.status === 'awaitingFurnishing' ? 0x80ccd4 : 0xf0c66d;
      this.constructionGraphics.fillStyle(color, order.status === 'furnished' ? 0 : .08).lineStyle(1, color, order.status === 'furnished' ? 0 : .55);
      for (const cell of order.cells) {
        this.constructionGraphics.fillRect(cell.column * TILE_SIZE + 1, cell.row * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        this.constructionGraphics.strokeRect(cell.column * TILE_SIZE + 1, cell.row * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }
      let label = this.constructionLabels.get(order.id);
      if (!label) {
        const cell = order.cells[0];
        label = this.add.text((cell.column + .5) * TILE_SIZE, cell.row * TILE_SIZE - 12, '', {
          color: COLORS.text, backgroundColor: '#25231e', fontFamily: 'system-ui, sans-serif', fontSize: '8px', padding: { x: 3, y: 2 },
        }).setOrigin(.5, 1).setDepth(7); this.constructionLabels.set(order.id, label);
      }
      if (order.status === 'furnished') {
        const storeId = storeIds.get(order.id);
        const stock = storeId ? this.gathering.resources.getStore(storeId) : undefined;
        const centerX = (Math.min(...order.cells.map(cell => cell.column)) + Math.max(...order.cells.map(cell => cell.column)) + 1) * TILE_SIZE / 2;
        const centerY = (Math.min(...order.cells.map(cell => cell.row)) + Math.max(...order.cells.map(cell => cell.row)) + 1) * TILE_SIZE / 2;
        label.setStyle(ROOM_LABEL_STYLE).setPadding(0).setPosition(centerX, centerY - 22).setOrigin(.5).setText(PLAN_LABELS[order.type].toLocaleUpperCase('de-DE') + (stock ? `\n${stock.amount.toFixed(1)} / ${stock.capacity}` : ''));
      } else label.setText(`#${order.id} ${constructionStatusLabel(order)}`);
    }
    for (const [id, label] of this.constructionLabels) if (!visible.has(id)) { label.destroy(); this.constructionLabels.delete(id); }
  }

  private syncBuilderVisuals(): void {
    const snapshots = new Map(this.gathering.getWorkers().map(worker => [worker.id, worker]));
    const workers = new Map(this.excavation.getBuilders().map(worker => [worker.id, {...worker, position: snapshots.get(worker.id)?.position ?? worker.position}]));
    for (const worker of workers.values()) {
      if (!this.builderWorkers.some(visual => visual.id === worker.id)) this.createBuilderWorker(worker.id, worker.position);
    }
    for (const visual of this.builderWorkers) {
      const worker = workers.get(visual.id);
      if (!worker) { visual.body.destroy(); continue; }
      if (worker.position.x !== visual.body.x) visual.body.setScale(worker.position.x < visual.body.x ? -1 : 1, 1);
      visual.body.setPosition(worker.position.x, worker.position.y);
      visual.load.setVisible(worker.load > 0);
    }
    this.builderWorkers = this.builderWorkers.filter(visual => workers.has(visual.id));
    const active = [...workers.values()].find(worker => worker.job) ?? [...workers.values()][0];
    if (active) this.digStatus?.setText(active.status);
  }

  private createMaterialVisual(x: number, y: number): Phaser.GameObjects.Container {
    const visual = this.add.container(x, y).setDepth(6);
    const clods = this.add.graphics();
    clods.fillStyle(0x77573d, 1);
    clods.fillEllipse(-4, 2, 9, 6); clods.fillEllipse(2, -2, 9, 7); clods.fillEllipse(6, 3, 7, 5);
    visual.add(clods);
    return visual;
  }

  private syncMaterialPiles(): void {
    const piles = new Map(this.excavation.materials.getGround().map(pile => [pile.id, pile]));
    for (const pile of piles.values()) {
      let visual = this.materialPiles.get(pile.id);
      if (!visual) {
        const body = this.createMaterialVisual(pile.position.x, pile.position.y);
        const label = this.add.text(0, -12, '', { color: COLORS.text, fontFamily: 'system-ui, sans-serif', fontSize: '7px' }).setOrigin(.5);
        body.add(label); visual = { body, label }; this.materialPiles.set(pile.id, visual);
      }
      visual.label.setText(pile.amount.toLocaleString('de-DE', { maximumFractionDigits: 1 }));
    }
    for (const [id, visual] of this.materialPiles) {
      if (!piles.has(id)) { visual.body.destroy(); this.materialPiles.delete(id); }
    }
  }

  private drawBuildingMaterialPile(): void {
    const graphics = this.buildingMaterialPileGraphics;
    graphics.clear();
    const stock = this.gathering.resources.getStoreTotals('buildingMaterial').amount;
    if (stock <= 0) return;
    const centerX = buildingMaterialStoreCenter.x;
    const baseY = buildingMaterialStoreCenter.y + 51;
    graphics.fillStyle(0x77573d, 1);
    graphics.lineStyle(2, 0x5b422e, 0.9);
    graphics.beginPath();
    graphics.moveTo(centerX - 54, baseY);
    graphics.lineTo(centerX - 43, baseY - 17);
    graphics.lineTo(centerX - 27, baseY - 30);
    graphics.lineTo(centerX - 9, baseY - 40);
    graphics.lineTo(centerX + 12, baseY - 37);
    graphics.lineTo(centerX + 31, baseY - 25);
    graphics.lineTo(centerX + 47, baseY - 12);
    graphics.lineTo(centerX + 54, baseY);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private renderExcavatedTiles(changedCell: DigCell): void {
    updateWorldTileArt(this, worldMap, changedCell);
    this.excavationGraphics.clear();
    this.excavationGraphics.fillStyle(COLORS.open, 1);
    this.dugCells.forEach(({ column, row }) => {
      this.excavationGraphics.fillRect(column * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
  }
}
