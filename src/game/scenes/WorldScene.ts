import Phaser from 'phaser';
import {
  buildingMaterialStoreCenter,
  waterStoreCenter,
  broodChamberCenters,
  BROOD_CHAMBER_SIZE,
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
} from '../world/worldTileArtRenderer';
import type { TerrainKind } from '../world/worldTypes';
import { startingWorld } from '../world/worldGenerator';
import { ExcavationSystem, requiredDiggingGrade } from '../simulation/excavationSystem';
import { createWorkforceSimulation } from '../simulation/workforceSimulation';
import { WorkforcePanel } from '../ui/WorkforcePanel';
import { ConstructionPanel, constructionStatusLabel } from '../ui/ConstructionPanel';
import type { DrawingTool } from '../ui/ConstructionPanel';
import { lineSelection, rectangleSelection, mergeSelection } from '../simulation/constructionPlanning';
import type { PlanType } from '../simulation/constructionPlanning';
import { CONSTRUCTION_CONFIG } from '../simulation/simulationConfig';
import { cellKey } from '../world/gridPathfinding';
import { EconomyHud, isEconomyHudPoint } from '../ui/EconomyHud';
import { buildEconomyOverview } from '../ui/economyOverview';

const COLORS = {
  ...TERRAIN_PALETTE,
  text: '#f4efd9',
};

const LAYER_COLORS: Partial<Record<TerrainKind, number>> = {
  topsoil: COLORS.topsoil,
  compactEarth: COLORS.compactEarth,
  clay: COLORS.clay,
};

type DigCell = { column: number; row: number };
export class WorldScene extends Phaser.Scene {
  private dragMode: 'none' | 'camera' | 'dig' = 'none';
  private lastPointerX = 0;
  private lastPointerY = 0;
  private gathering!: ReturnType<typeof createWorkforceSimulation>;
  private ants: Array<{ id: string; body: Phaser.GameObjects.Container; load: Phaser.GameObjects.Ellipse }> = [];
  private economyHud!: EconomyHud;
  private workforcePanel!: WorkforcePanel;
  private constructionPanel!: ConstructionPanel;
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
  private foodMarkers?: Phaser.GameObjects.Graphics;
  private foodStockLabel?: Phaser.GameObjects.Text;
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

  preload(): void {
    preloadWorldTileArt(this);
  }

  create(): void {
    this.gathering = createWorkforceSimulation(startingWorld, resources => {
      resources.depositInStore('building-material-store', { resource: 'buildingMaterial', amount: CONSTRUCTION_CONFIG.startingMaterial });
      this.excavation = new ExcavationSystem(startingWorld, resources);
      const home = this.cellAt(nestChamberCenter.x, nestChamberCenter.y)!;
      for (let index = 0; index < 2; index++) this.excavation.addBuilder(`builder-${index}`, {
        x: (home.column + 0.35 + index * 0.3) * TILE_SIZE, y: (home.row + 0.5) * TILE_SIZE,
      });
      return {
        workers: () => this.excavation.getBuilders(),
        addWorker: (id, position) => this.excavation.addBuilder(id, position),
        removeWorker: id => this.excavation.removeBuilder(id),
        retireWorker: id => this.excavation.removeBuilder(id),
        advanceWorkers: (seconds, factor) => this.excavation.advance(seconds, factor,
          id => this.gathering.workforce.getWorker(id).assignment === 'building',
          id => this.gathering.workforce.efficiency(id, 'building')),
      };
    });
    this.drawWorld();
    this.excavationGraphics = this.add.graphics().setDepth(2);
    this.digPreviewGraphics = this.add.graphics().setDepth(4);
    this.constructionGraphics = this.add.graphics().setDepth(3);
    this.drawFoodMarkers();
    this.buildingMaterialPileGraphics = this.add.graphics().setDepth(4);
    this.drawBuildingMaterialPile();
    this.drawLabels();
    this.createDigControls();
    this.createAnts();
    this.syncBuilderVisuals();
    this.workforcePanel = new WorkforcePanel(
      document.querySelector('#game')!,
      (specialization, from, to, count) => {
        this.gathering.moveWorkers(specialization, from, to, count);
        this.updateEconomyHud();
      },
    );
    this.constructionPanel = new ConstructionPanel(document.querySelector('#game')!, {
      start: type => this.startDraft(type),
      tool: tool => { this.drawingTool = tool; },
      confirm: () => this.confirmDraft(), discard: () => this.discardDraft(),
      pause: id => { this.excavation.pauseOrder(id); this.updateConstruction(); },
      resume: id => { this.excavation.resumeOrder(id); this.updateConstruction(); },
      cancel: id => { this.excavation.cancelOrder(id); this.updateConstruction(); },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.workforcePanel.destroy(); this.constructionPanel.destroy(); });
    this.economyHud = new EconomyHud(this, priority => {
      this.gathering.gathering.setPriority(priority);
      this.updateEconomyHud();
    }, () => this.workforcePanel.open(), () => this.constructionPanel.open());
    this.refreshSourceReachability();
    this.updateEconomyHud();
    this.frameWorld();
    this.enableCameraDrag();
  }

  update(_time: number, delta: number): void {
    this.gathering.advance(delta / 1000);
    const changedCells = this.excavation.drainChangedCells();
    for (const cell of changedCells) { this.dugCells.push(cell); this.renderExcavatedTiles(cell); }
    if (changedCells.length) this.refreshSourceReachability();
    this.syncBuilderVisuals();
    this.syncMaterialPiles();
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
      const carried = collectors.get(ant.id)?.load;
      ant.load.setVisible((carried?.amount ?? 0) > 0);
      ant.load.setFillStyle(carried?.resource === 'water' ? 0x71d0d5 : 0xe3aa4e);
    });
    this.ants = this.ants.filter(ant => visibleWorkers.has(ant.id));
    this.foodStockLabel?.setText(`NAHRUNG: ${this.gathering.resources.getStore('food-store').amount.toFixed(1)}`);
    this.waterStockLabel?.setText(`WASSER: ${this.gathering.resources.getStore('water-store').amount.toFixed(1)}`);
    this.drawFoodMarkers();
    this.drawBuildingMaterialPile();
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

  private refreshSourceReachability(): void {
    this.sourceReachability.clear();
    for (const source of this.gathering.resources.listSources()) {
      const reachable = this.gathering.navigation.sourceAccessPoints(source).some(access =>
        this.gathering.navigation.findPath(nestChamberCenter, access) !== null);
      this.sourceReachability.set(source.id, reachable);
    }
  }

  private updateEconomyHud(): void {
    this.workforcePanel.update(this.gathering.getWorkers());
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

    worldMap.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
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
      });
    });

    drawWorldTileArt(this, worldMap, TILE_SIZE);

    const landmarkGraphics = this.add.graphics().setDepth(1);
    const chamberLeft = nestChamberCenter.x - 5.5 * TILE_SIZE;
    const chamberWidth = 11 * TILE_SIZE;
    landmarkGraphics.fillStyle(0x6a503b, 1);
    landmarkGraphics.fillRect(chamberLeft, nestChamberCenter.y + 1.5 * TILE_SIZE, chamberWidth, 4);

    const storeLeft = foodStoreCenter.x - 4.5 * TILE_SIZE;
    const storeFloor = nestChamberCenter.y + 3 * TILE_SIZE;
    landmarkGraphics.fillStyle(0x6a503b, 1);
    landmarkGraphics.fillRect(storeLeft, storeFloor, 9 * TILE_SIZE, 4);

    const materialStoreLeft = buildingMaterialStoreCenter.x - 4 * TILE_SIZE;
    const materialStoreFloor = buildingMaterialStoreCenter.y + 2.5 * TILE_SIZE;
    landmarkGraphics.fillStyle(0x6a503b, 1);
    landmarkGraphics.fillRect(materialStoreLeft, materialStoreFloor, 8 * TILE_SIZE, 4);
    landmarkGraphics.fillRect(waterStoreCenter.x - 4.5 * TILE_SIZE, waterStoreCenter.y + 2.5 * TILE_SIZE, 9 * TILE_SIZE, 4);

    Object.values(broodChamberCenters).forEach((center) => {
      const chamberLeft = center.x - BROOD_CHAMBER_SIZE.width * TILE_SIZE / 2;
      const chamberFloor = center.y + (BROOD_CHAMBER_SIZE.height / 2 - 0.5) * TILE_SIZE;
      landmarkGraphics.fillStyle(0x6a503b, 1);
      landmarkGraphics.fillRect(chamberLeft, chamberFloor, BROOD_CHAMBER_SIZE.width * TILE_SIZE, 4);
    });

    drawWorldDecorations(landmarkGraphics, worldDecorations, TILE_SIZE);
  }

  private drawFoodMarkers(): void {
    const graphics = this.foodMarkers ??= this.add.graphics().setDepth(2);
    graphics.clear();
    const source = this.gathering.resources.getSource('surface-food-source');
    if (source.kind === 'unlimited' || source.amount > 0) {
      graphics.fillStyle(0xe3aa4e, 1);
      graphics.fillEllipse(surfaceFoodSource.x - 8, surfaceFoodSource.y + 1, 7, 5);
      graphics.fillEllipse(surfaceFoodSource.x + 1, surfaceFoodSource.y - 1, 8, 6);
      graphics.fillEllipse(surfaceFoodSource.x + 10, surfaceFoodSource.y + 1, 6, 5);
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
    for (const collector of this.gathering.getWorkers().filter(worker => worker.actualWork !== 'building')) {
      if (this.ants.some(ant => ant.id === collector.id)) continue;
      const body = this.add.container(collector.position.x, collector.position.y).setDepth(4);
      const shape = this.add.graphics();
      shape.fillStyle(0x261b17, 1);
      shape.fillEllipse(-3, 0, 7, 5);
      shape.fillCircle(1, 0, 2.2);
      shape.fillCircle(5, -0.5, 2.2);
      shape.lineStyle(1, 0x261b17, 1);
      shape.beginPath();
      shape.moveTo(-3, 1); shape.lineTo(-5, 4);
      shape.moveTo(0, 1); shape.lineTo(-1, 4);
      shape.moveTo(2, 1); shape.lineTo(3, 4);
      shape.moveTo(5, -2); shape.lineTo(7, -4);
      shape.strokePath();
      body.add(shape);

      const load = this.add.ellipse(9, -4, 6, 5, 0xe3aa4e).setVisible(false);
      body.add(load);
      this.ants.push({ id: collector.id, body, load });
    }
  }

  private drawLabels(): void {
    this.add
      .text(queenChamberCenter.x, queenChamberCenter.y, 'KÖNIGINNENKAMMER', {
        color: '#c8d1cd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '8px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.65);

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
          color: '#c8d1cd',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '7px',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5)
        .setAlpha(0.85);
    });

    this.add
      .text(surfaceFoodSource.x, surfaceFoodSource.y - 18, 'FUTTER', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.foodStockLabel = this.add
      .text(foodStoreCenter.x, foodStoreCenter.y - 22, 'NAHRUNG: 0.0', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.waterStockLabel = this.add.text(waterStoreCenter.x, waterStoreCenter.y - 22, 'WASSER: 0.0', {
      color: COLORS.text, fontFamily: 'system-ui, sans-serif', fontSize: '9px', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.9);

    this.add
      .text(buildingMaterialStoreCenter.x + 3 * TILE_SIZE, buildingMaterialStoreCenter.y - 22, 'BAUSTOFFLAGER', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.add
      .text(stoneOutcropCenter.x, stoneOutcropCenter.y - 5 * TILE_SIZE, 'STEIN', {
        color: '#f1e6d5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
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

    this.add.text(18, 337, 'Karte ziehen: verschieben · Bauen: Pinsel / Rechteck', {
      color: COLORS.text, fontFamily: 'system-ui, sans-serif', fontSize: '9px',
    }).setScrollFactor(0).setDepth(10);

    this.upgradeButton = this.add
      .text(622, 329, 'GRABKRAFT · TEST 0', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        backgroundColor: '#66513c',
        padding: { x: 7, y: 5 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    this.upgradeButton.on(
      Phaser.Input.Events.POINTER_DOWN,
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.diggingGrade = (this.diggingGrade + 1) % 4;
        this.updateUpgradeLabel();
        this.excavation.setDiggingGrade(this.diggingGrade);
        this.digStatus?.setText(`Test-Grabkraft ${this.diggingGrade}: Grabaufträge prüfen jetzt härtere Schichten.`);
        this.renderDigPreview();
      },
    );
  }

  private createBuilderWorker(id: string, position: { x: number; y: number }): void {
    const cell = this.cellAt(position.x, position.y);
    if (!cell) throw new Error('Builder position is outside the world');
    const body = this.add.container(position.x, position.y).setDepth(5);
    const shape = this.add.graphics();
    shape.fillStyle(0x261b17, 1);
    shape.fillEllipse(-3, 0, 8, 6);
    shape.fillCircle(2, 0, 2.4);
    shape.fillCircle(6, -0.5, 2.3);
    shape.lineStyle(1, 0x261b17, 1);
    shape.beginPath();
    shape.moveTo(-3, 1); shape.lineTo(-5, 4);
    shape.moveTo(0, 1); shape.lineTo(-1, 4);
    shape.moveTo(3, 1); shape.lineTo(4, 1);
    shape.moveTo(6, -2); shape.lineTo(8, -4);
    shape.strokePath();
    body.add(shape);
    const load = this.createMaterialVisual(position.x, position.y);
    load.removeFromDisplayList(); body.add(load); load.setPosition(8, -6).setVisible(false);
    this.builderWorkers.push({ id, body, load });
  }

  private updateUpgradeLabel(): void {
    this.upgradeButton?.setText(`GRABKRAFT · TEST ${this.diggingGrade}`);
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

  private startDraft(type: PlanType): void {
    this.planType = type; this.planning = true; this.drawingTool = 'brush';
    this.draftCells = []; this.previewCells = []; this.dragMode = 'none';
    this.renderDigPreview(); this.constructionPanel.showDraft(type);
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
      || isEconomyHudPoint(pointer.x, pointer.y) || pointer.y >= 310) return;
    const cell = this.pointerCell(pointer);
    this.dragMoved = false;
    this.dragOrigin = { x: pointer.x, y: pointer.y };
    if (this.planning && this.drawingTool !== 'pan' && cell) {
      this.dragMode = 'dig'; this.digStart = cell; this.lastBrushCell = cell; this.previewCells = [cell];
      this.renderDigPreview(); this.input.setDefaultCursor('crosshair'); return;
    }
    this.dragMode = 'camera'; this.lastPointerX = pointer.x; this.lastPointerY = pointer.y;
    this.input.setDefaultCursor('grabbing');
  }
  private moveCamera(pointer: Phaser.Input.Pointer): void {
    if (this.dragMode === 'dig' && this.digStart && pointer.isDown) {
      if (isEconomyHudPoint(pointer.x, pointer.y) || pointer.y >= 310) return;
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
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX + dx, 0, Math.max(0, worldSize.width - camera.width));
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY + dy, 0, Math.max(0, worldSize.height - camera.height));
    this.lastPointerX = pointer.x; this.lastPointerY = pointer.y;
  }
  private stopDrag(pointer: Phaser.Input.Pointer): void {
    const insideMap = pointer.x >= 0 && pointer.x < 640 && pointer.y > 110 && pointer.y < 310;
    if (this.dragMode === 'dig' && insideMap) {
      this.draftCells = mergeSelection(this.draftCells, this.previewCells);
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
    const cells = mergeSelection(this.draftCells, this.previewCells);
    cells.forEach(({ column, row }, index) => {
      const cell = worldMap[row][column];
      const invalid = !terrainDefinitions[cell.terrain].diggable;
      const blockedByHardness = isDiggableTile(cell)
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
    this.constructionPanel.update(orders);
    const signature = orders.map(order => `${order.id}:${order.status}:${order.blockReason}:${order.excavated}`).join('|');
    if (signature === this.constructionSignature) return;
    this.constructionSignature = signature; this.constructionGraphics.clear();
    const visible = new Set<number>();
    for (const order of orders) {
      if (order.status === 'cancelled' || order.status === 'completed') continue;
      visible.add(order.id);
      const color = order.status === 'blocked' ? 0xd86654 : order.paused ? 0xb99d65
        : order.status === 'awaitingFurnishing' ? 0x80ccd4 : 0xf0c66d;
      this.constructionGraphics.fillStyle(color, .12).lineStyle(1, color, .8);
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
      label.setText(`#${order.id} ${constructionStatusLabel(order)}`);
    }
    for (const [id, label] of this.constructionLabels) if (!visible.has(id)) { label.destroy(); this.constructionLabels.delete(id); }
  }

  private syncBuilderVisuals(): void {
    const workers = new Map(this.excavation.getBuilders().map(worker => [worker.id, worker]));
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
