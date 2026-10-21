import Phaser from 'phaser';
import {
  buildingMaterialStoreCenter,
  foodStoreCenter,
  diggingGradeAt,
  initialCameraY,
  nestChamberCenter,
  surfaceFoodSource,
  surfaceRow,
  stoneOutcropCenter,
  TILE_SIZE,
  worldMap,
  worldSize,
} from '../world/worldMap';

const COLORS = {
  sky: 0x83c9df,
  open: 0xb68a5b,
  soil: 0x493c39,
  soilLine: 0x5d4b44,
  deepSoil: 0x39343a,
  bottomSoil: 0x2d2e37,
  grass: 0x78a843,
  grassLight: 0x9bc85a,
  text: '#f4efd9',
};
const SOIL_BY_GRADE = [0x584738, 0x51443b, 0x48444b, 0x3d3e49];

type DigCell = { column: number; row: number };
type DigOrder = { cells: DigCell[]; index: number };
type MaterialLoad = {
  id: number;
  cell: DigCell;
  state: 'waiting' | 'carried' | 'stored';
  visual: Phaser.GameObjects.Container;
};
type BuilderWorkerRole = 'builderGroup' | 'borrowedTransport';
type DigJob = {
  kind: 'dig';
  phase: 'walking' | 'digging' | 'loading';
  path: DigCell[];
  pathIndex: number;
  target: DigCell;
  order: DigOrder;
  orderIndex: number;
  duration: number;
  progress: number;
  load?: MaterialLoad;
};
type HaulJob = {
  kind: 'haul';
  phase: 'store';
  path: DigCell[];
  pathIndex: number;
  load: MaterialLoad;
};
type BuilderWorker = {
  role: BuilderWorkerRole;
  body: Phaser.GameObjects.Container;
  cell: DigCell;
  job: DigJob | HaulJob | null;
};

export class WorldScene extends Phaser.Scene {
  private dragMode: 'none' | 'camera' | 'dig' = 'none';
  private lastPointerX = 0;
  private lastPointerY = 0;
  private antPath?: Phaser.Curves.Path;
  private ants: Array<{ body: Phaser.GameObjects.Container; food: Phaser.GameObjects.Ellipse; offset: number }> = [];
  private elapsed = 0;
  private excavationGraphics!: Phaser.GameObjects.Graphics;
  private digPreviewGraphics!: Phaser.GameObjects.Graphics;
  private buildingMaterialPileGraphics!: Phaser.GameObjects.Graphics;
  private digStart: DigCell | null = null;
  private previewCells: DigCell[] = [];
  private dugCells: DigCell[] = [];
  private digOrders: DigOrder[] = [];
  private digReservations = new Set<string>();
  private reachableOpenCells = new Set<string>();
  private materialLoads: MaterialLoad[] = [];
  private builderWorkers: BuilderWorker[] = [];
  private nextMaterialLoadId = 1;
  private storedBuildingMaterial = 0;
  private diggingGrade = 0;
  private upgradeButton?: Phaser.GameObjects.Text;
  private digStatus?: Phaser.GameObjects.Text;
  private buildingMaterialCount?: Phaser.GameObjects.Text;

  constructor() {
    super('WorldScene');
  }

  create(): void {
    this.drawWorld();
    this.initializeReachability();
    this.excavationGraphics = this.add.graphics().setDepth(2);
    this.digPreviewGraphics = this.add.graphics().setDepth(3);
    this.drawFoodMarkers();
    this.buildingMaterialPileGraphics = this.add.graphics().setDepth(4);
    this.drawBuildingMaterialPile();
    this.drawLabels();
    this.createDigControls();
    this.createBuilderWorkers();
    this.createAnts();
    this.frameWorld();
    this.enableCameraDrag();
  }

  update(_time: number, delta: number): void {
    if (this.antPath) {
      this.elapsed += delta;
      const tripDuration = 18_000;
      this.ants.forEach((ant) => {
        const tripPhase = ((this.elapsed / tripDuration + ant.offset) % 1 + 1) % 1;
        const carryingFood = tripPhase < 0.5;
        const pathProgress = carryingFood ? tripPhase * 2 : 2 - tripPhase * 2;
        const position = this.antPath?.getPoint(pathProgress);
        if (!position) return;

        ant.body.setPosition(position.x, position.y);
        ant.body.setScale(carryingFood ? 1 : -1, 1);
        ant.food.setVisible(carryingFood);
      });
    }

    this.updateBuilderWorkers(delta);
  }

  private drawWorld(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.sky, 1);
    graphics.fillRect(0, 0, worldSize.width, worldSize.height);

    worldMap.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell === 'sky') return;

        const x = columnIndex * TILE_SIZE;
        const y = rowIndex * TILE_SIZE;

        if (cell === 'surface') {
          graphics.fillStyle(COLORS.soil, 1);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          graphics.fillStyle(COLORS.grass, 1);
          graphics.fillRect(x, y, TILE_SIZE, 7);
          graphics.fillStyle(COLORS.grassLight, 1);
          graphics.fillRect(x, y, TILE_SIZE, 2);
          graphics.fillStyle(COLORS.soilLine, 1);
          graphics.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
          return;
        }

        if (cell === 'stone') {
          graphics.fillStyle(0x77736d, 1);
          graphics.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          graphics.lineStyle(1, 0xaaa49a, 0.8);
          graphics.beginPath();
          graphics.moveTo(x + 5, y + 2);
          graphics.lineTo(x + 10, y + 11);
          graphics.lineTo(x + 7, y + 18);
          graphics.moveTo(x + 17, y + 8);
          graphics.lineTo(x + 21, y + 14);
          graphics.strokePath();
          return;
        }

        if (cell === 'unknown') {
          const grade = diggingGradeAt(columnIndex, rowIndex);
          const baseColor = rowIndex > worldMap.length - 6
            ? COLORS.bottomSoil
            : SOIL_BY_GRADE[grade] ?? COLORS.deepSoil;
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

    const chamberLeft = nestChamberCenter.x - 5.5 * TILE_SIZE;
    const chamberWidth = 11 * TILE_SIZE;
    graphics.fillStyle(0x6a503b, 1);
    graphics.fillRect(chamberLeft, nestChamberCenter.y + 1.5 * TILE_SIZE, chamberWidth, 4);

    const storeLeft = foodStoreCenter.x - 4.5 * TILE_SIZE;
    const storeFloor = nestChamberCenter.y + 3 * TILE_SIZE;
    graphics.fillStyle(0x6a503b, 1);
    graphics.fillRect(storeLeft, storeFloor, 9 * TILE_SIZE, 4);

    const materialStoreLeft = buildingMaterialStoreCenter.x - 4 * TILE_SIZE;
    const materialStoreFloor = buildingMaterialStoreCenter.y + 2.5 * TILE_SIZE;
    graphics.fillStyle(0x6a503b, 1);
    graphics.fillRect(materialStoreLeft, materialStoreFloor, 8 * TILE_SIZE, 4);
  }

  private drawFoodMarkers(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xe3aa4e, 1);
    graphics.fillEllipse(surfaceFoodSource.x - 8, surfaceFoodSource.y + 1, 7, 5);
    graphics.fillEllipse(surfaceFoodSource.x + 1, surfaceFoodSource.y - 1, 8, 6);
    graphics.fillEllipse(surfaceFoodSource.x + 10, surfaceFoodSource.y + 1, 6, 5);

    graphics.fillStyle(0xc88b38, 1);
    graphics.fillEllipse(foodStoreCenter.x - 27, foodStoreCenter.y + 11, 10, 7);
    graphics.fillEllipse(foodStoreCenter.x - 17, foodStoreCenter.y + 8, 11, 8);
    graphics.fillEllipse(foodStoreCenter.x - 7, foodStoreCenter.y + 12, 9, 6);
    graphics.fillEllipse(foodStoreCenter.x + 4, foodStoreCenter.y + 9, 11, 8);

  }

  private createAnts(): void {
    const surfaceY = surfaceFoodSource.y;
    const path = new Phaser.Curves.Path(surfaceFoodSource.x, surfaceY);
    path.lineTo(nestChamberCenter.x, surfaceY);
    path.lineTo(nestChamberCenter.x, nestChamberCenter.y + TILE_SIZE);
    path.lineTo(foodStoreCenter.x, foodStoreCenter.y);
    this.antPath = path;

    for (let index = 0; index < 7; index += 1) {
      const body = this.add.container(0, 0).setDepth(4);
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

      const food = this.add.ellipse(9, -4, 6, 5, 0xe3aa4e).setVisible(false);
      body.add(food);
      this.ants.push({ body, food, offset: index / 7 });
    }
  }

  private drawLabels(): void {
    this.add
      .text(18, 14, 'ANTHIVE', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0);

    this.add
      .text(18, 38, 'WELT & GRABEN · VORSCHAU', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
      })
      .setAlpha(0.8)
      .setScrollFactor(0);

    this.add
      .text(622, 342, 'Tunnel ziehen: Grabauftrag · freie Fläche: Kamera', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
      })
      .setOrigin(1, 1)
      .setAlpha(0.9)
      .setScrollFactor(0);

    this.add
      .text(nestChamberCenter.x, nestChamberCenter.y, 'NEST', {
        color: '#c8d1cd',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.65);

    this.add
      .text(surfaceFoodSource.x, surfaceFoodSource.y - 18, 'FUTTER', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.add
      .text(foodStoreCenter.x, foodStoreCenter.y - 22, 'VORRÄTE', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

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
    [24, 48, 72].forEach((depth, index) => {
      this.add
        .text(
          (centerColumn + 7) * TILE_SIZE,
          (surface + depth) * TILE_SIZE,
          `BODENSTUFE ${index + 1} · HÄRTER`,
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
    this.digStatus = this.add
      .text(18, 62, 'Zieh vom Tunnel in die Erde, um einen Grabweg zu beauftragen.', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px',
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.buildingMaterialCount = this.add
      .text(400, 14, 'BAUSTOFF: 0', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        backgroundColor: '#4b3b30',
        padding: { x: 7, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.upgradeButton = this.add
      .text(622, 64, 'GRABKRAFT · TEST 0', {
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
        this.builderWorkers.forEach((worker) => {
          const job = worker.job;
          if (!job || job.kind !== 'dig' || this.requiredGrade(job.target) <= this.diggingGrade) return;
          this.digReservations.delete(this.cellKey(job.target));
          worker.job = null;
        });
        this.digStatus?.setText(`Test-Grabkraft ${this.diggingGrade}: Grabaufträge prüfen jetzt härtere Schichten.`);
        this.renderDigPreview();
      },
    );
  }

  private createBuilderWorkers(): void {
    const home = this.cellAt(nestChamberCenter.x, nestChamberCenter.y);
    if (!home) return;

    for (let index = 0; index < 2; index += 1) {
      const body = this.add.container(
        (home.column + 0.35 + index * 0.3) * TILE_SIZE,
        (home.row + 0.5) * TILE_SIZE,
      ).setDepth(5);
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
      this.builderWorkers.push({ role: 'builderGroup', body, cell: { ...home }, job: null });
    }
  }

  private updateUpgradeLabel(): void {
    this.upgradeButton?.setText(`GRABKRAFT · TEST ${this.diggingGrade}`);
  }

  private frameWorld(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, worldSize.width, worldSize.height);
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

  private startDrag(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return;
    const cell = this.pointerCell(pointer);
    if (cell && worldMap[cell.row][cell.column] === 'open') {
      this.dragMode = 'dig';
      this.digStart = cell;
      this.previewCells = [cell];
      this.renderDigPreview();
      this.input.setDefaultCursor('crosshair');
      return;
    }

    this.dragMode = 'camera';
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
    this.input.setDefaultCursor('grabbing');
  }

  private moveCamera(pointer: Phaser.Input.Pointer): void {
    if (this.dragMode === 'dig' && this.digStart && pointer.isDown) {
      const endpoint = this.pointerCell(pointer);
      if (endpoint) {
        this.previewCells = this.lineCells(this.digStart, endpoint);
        this.renderDigPreview();
      }
      return;
    }
    if (this.dragMode !== 'camera' || !pointer.isDown) return;

    const camera = this.cameras.main;
    const maxX = Math.max(0, worldSize.width - camera.width);
    const maxY = Math.max(0, worldSize.height - camera.height);
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX + this.lastPointerX - pointer.x, 0, maxX);
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY + this.lastPointerY - pointer.y, 0, maxY);
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
  }

  private stopDrag(): void {
    if (this.dragMode === 'dig') this.commitDigOrder();
    this.dragMode = 'none';
    this.digStart = null;
    this.previewCells = [];
    this.digPreviewGraphics.clear();
    this.input.setDefaultCursor('grab');
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

  private cellKey(cell: DigCell): string {
    return `${cell.column},${cell.row}`;
  }

  private initializeReachability(): void {
    const home = this.cellAt(nestChamberCenter.x, nestChamberCenter.y);
    if (home) this.expandReachability(home, true);
  }

  private expandReachability(start: DigCell, seed = false): boolean {
    if (worldMap[start.row]?.[start.column] !== 'open') return false;
    const key = this.cellKey(start);
    if (this.reachableOpenCells.has(key)) return true;

    const neighbors = [
      { column: start.column - 1, row: start.row },
      { column: start.column + 1, row: start.row },
      { column: start.column, row: start.row - 1 },
      { column: start.column, row: start.row + 1 },
    ];
    if (!seed && !neighbors.some((cell) => this.reachableOpenCells.has(this.cellKey(cell)))) return false;

    const queue = [start];
    let queueIndex = 0;
    this.reachableOpenCells.add(key);
    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const nextCells = [
        { column: current.column - 1, row: current.row },
        { column: current.column + 1, row: current.row },
        { column: current.column, row: current.row - 1 },
        { column: current.column, row: current.row + 1 },
      ];
      nextCells.forEach((next) => {
        if (worldMap[next.row]?.[next.column] !== 'open') return;
        const nextKey = this.cellKey(next);
        if (this.reachableOpenCells.has(nextKey)) return;
        this.reachableOpenCells.add(nextKey);
        queue.push(next);
      });
    }
    return true;
  }

  private requiredGrade(cell: DigCell): number {
    if (worldMap[cell.row]?.[cell.column] === 'stone') return 3;
    return diggingGradeAt(cell.column, cell.row);
  }

  private lineCells(start: DigCell, end: DigCell): DigCell[] {
    const cells: DigCell[] = [];
    let x = start.column;
    let y = start.row;
    const dx = Math.abs(end.column - start.column);
    const dy = Math.abs(end.row - start.row);
    const stepX = start.column < end.column ? 1 : -1;
    const stepY = start.row < end.row ? 1 : -1;
    let error = dx - dy;

    while (true) {
      const cell = worldMap[y]?.[x];
      if (!cell || cell === 'sky' || cell === 'surface') break;
      if (cell === 'rubble') break;
      cells.push({ column: x, row: y });
      if ((cell === 'unknown' || cell === 'stone') && this.requiredGrade({ column: x, row: y }) > this.diggingGrade) break;
      if (x === end.column && y === end.row) break;

      const doubledError = 2 * error;
      if (doubledError > -dy) {
        error -= dy;
        x += stepX;
      }
      if (doubledError < dx) {
        error += dx;
        y += stepY;
      }
    }
    return cells;
  }

  private renderDigPreview(): void {
    this.digPreviewGraphics.clear();
    this.previewCells.forEach(({ column, row }, index) => {
      const cell = worldMap[row][column];
      if (cell === 'open') return;
      const blockedByHardness = (cell === 'unknown' || cell === 'stone')
        && this.requiredGrade({ column, row }) > this.diggingGrade;
      this.digPreviewGraphics.fillStyle(blockedByHardness ? 0xd86654 : 0xf0c66d, 0.8);
      this.digPreviewGraphics.fillRect(
        column * TILE_SIZE + 3,
        row * TILE_SIZE + 3,
        TILE_SIZE - 6,
        TILE_SIZE - 6,
      );
      if (index === this.previewCells.length - 1 && blockedByHardness) {
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
      return cell === 'unknown' || cell === 'stone';
    });
    if (!hasDiggableTile) return;

    this.digOrders.push({ cells: [...this.previewCells], index: 1 });
    this.digStatus?.setText('Grabauftrag erteilt: Die Ameisen graben den Weg nach und nach.');
  }

  private updateBuilderWorkers(delta: number): void {
    this.builderWorkers.forEach((worker) => this.advanceBuilderJob(worker, delta));
    this.builderWorkers.forEach((worker) => {
      if (!worker.job) this.assignBuilderWork(worker);
    });
  }

  private assignBuilderWork(worker: BuilderWorker): void {
    if (worker.role === 'borrowedTransport') return;

    for (const order of this.digOrders) {
      while (order.index < order.cells.length) {
        const target = order.cells[order.index];
        const material = worldMap[target.row]?.[target.column];
        if (material === 'open') {
          order.index += 1;
          continue;
        }
        if (material === 'rubble') break;
        if (material !== 'unknown' && material !== 'stone') {
          order.index += 1;
          continue;
        }

        const reservationKey = this.cellKey(target);
        if (this.digReservations.has(reservationKey)) break;
        const grade = this.requiredGrade(target);
        if (grade > this.diggingGrade) {
          this.digStatus?.setText(material === 'stone'
            ? `Stein braucht Test-Grabkraft ${grade}; die Ameise bleibt im freien Gang.`
            : `Diese Erdschicht braucht Test-Grabkraft ${grade}; die Ameise bleibt im freien Gang.`);
          break;
        }

        const approaches = [
          { column: target.column - 1, row: target.row },
          { column: target.column + 1, row: target.row },
          { column: target.column, row: target.row - 1 },
          { column: target.column, row: target.row + 1 },
        ].filter((cell) => this.reachableOpenCells.has(this.cellKey(cell)));
        const routeOptions = approaches
          .map((cell) => ({ cell, path: this.findPath(worker.cell, cell) }))
          .filter((option): option is { cell: DigCell; path: DigCell[] } => option.path !== null)
          .sort((left, right) => left.path.length - right.path.length);
        const approach = routeOptions[0];
        if (!approach) {
          this.digStatus?.setText('Der Grabweg berührt den freien Tunnel nur diagonal. Zieh einen zweiten Gang daneben.');
          break;
        }

        this.digReservations.add(reservationKey);
        worker.job = {
          kind: 'dig',
          phase: 'walking',
          path: approach.path,
          pathIndex: 0,
          target,
          order,
          orderIndex: order.index,
          duration: 650 + grade * 450,
          progress: 0,
        };
        return;
      }
      if (order.index >= order.cells.length) this.digOrders.splice(this.digOrders.indexOf(order), 1);
    }
  }

  private advanceBuilderJob(worker: BuilderWorker, delta: number): void {
    const job = worker.job;
    if (!job) return;

    if (job.kind === 'dig') {
      if (job.phase === 'walking') {
        job.pathIndex = this.walkAlongPath(worker, job.path, job.pathIndex, delta);
        if (job.pathIndex >= job.path.length) {
          job.phase = 'digging';
          job.progress = 0;
        }
        return;
      }

      if (job.phase === 'loading') {
        job.progress += Math.min(delta, 100);
        if (job.progress < 300 || !job.load) return;
        const storeCell = this.cellAt(buildingMaterialStoreCenter.x, buildingMaterialStoreCenter.y);
        const route = storeCell ? this.findPath(worker.cell, storeCell) : null;
        if (!route) {
          this.digStatus?.setText('Das Baustofflager ist über freie Tunnel nicht erreichbar.');
          return;
        }

        job.load.state = 'carried';
        job.load.visual.removeFromDisplayList();
        worker.body.add(job.load.visual);
        job.load.visual.setPosition(8, -6).setDepth(1);
        worldMap[job.target.row][job.target.column] = 'open';
        this.expandReachability(job.target);
        this.renderExcavatedTiles();
        worker.job = { kind: 'haul', phase: 'store', path: route, pathIndex: 0, load: job.load };
        this.digStatus?.setText('Der Haufen ist weg; die Ameise bringt genau diese Ladung ins Baustofflager.');
        return;
      }

      job.progress += Math.min(delta, 100);
      if (job.progress < job.duration) return;
      worldMap[job.target.row][job.target.column] = 'rubble';
      this.dugCells.push(job.target);
      job.load = this.createMaterialLoad(job.target);
      job.phase = 'loading';
      job.progress = 0;
      this.digReservations.delete(this.cellKey(job.target));
      job.order.index = Math.max(job.order.index, job.orderIndex + 1);
      this.renderExcavatedTiles();
      this.digStatus?.setText('Der Erdhaufen blockiert den neuen Tunnel, bis die grabende Ameise ihn aufnimmt.');
      return;
    }

    job.pathIndex = this.walkAlongPath(worker, job.path, job.pathIndex, delta);
    if (job.pathIndex < job.path.length) return;

    job.load.state = 'stored';
    job.load.visual.destroy();
    this.storedBuildingMaterial += 1;
    this.buildingMaterialCount?.setText(`BAUSTOFF: ${this.storedBuildingMaterial}`);
    worker.job = null;
    this.digStatus?.setText('Eine Baustoffladung ist im separaten Lager angekommen.');
  }

  private walkAlongPath(worker: BuilderWorker, path: DigCell[], pathIndex: number, delta: number): number {
    if (pathIndex >= path.length) return pathIndex;
    const target = path[pathIndex];
    const targetX = (target.column + 0.5) * TILE_SIZE;
    const targetY = (target.row + 0.5) * TILE_SIZE;
    const dx = targetX - worker.body.x;
    const dy = targetY - worker.body.y;
    const distance = Math.hypot(dx, dy);
    const step = 78 * Math.min(delta, 100) / 1000;
    if (distance <= step || distance === 0) {
      worker.body.setPosition(targetX, targetY);
      worker.cell = { ...target };
      return pathIndex + 1;
    }
    worker.body.setPosition(worker.body.x + dx / distance * step, worker.body.y + dy / distance * step);
    if (dx !== 0) worker.body.setScale(dx < 0 ? -1 : 1, 1);
    return pathIndex;
  }

  private findPath(start: DigCell, goal: DigCell): DigCell[] | null {
    const startKey = this.cellKey(start);
    const goalKey = this.cellKey(goal);
    if (!this.reachableOpenCells.has(startKey) || !this.reachableOpenCells.has(goalKey)) return null;
    if (startKey === goalKey) return [{ ...start }];

    const previous = new Map<string, string | null>([[startKey, null]]);
    const queue = [start];
    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const current = queue[queueIndex];
      const neighbors = [
        { column: current.column - 1, row: current.row },
        { column: current.column + 1, row: current.row },
        { column: current.column, row: current.row - 1 },
        { column: current.column, row: current.row + 1 },
      ];
      for (const neighbor of neighbors) {
        const neighborKey = this.cellKey(neighbor);
        if (!this.reachableOpenCells.has(neighborKey) || previous.has(neighborKey)) continue;
        previous.set(neighborKey, this.cellKey(current));
        if (neighborKey === goalKey) {
          const route: DigCell[] = [goal];
          let routeKey: string | null = this.cellKey(current);
          while (routeKey) {
            const [column, row] = routeKey.split(',').map(Number);
            route.push({ column, row });
            routeKey = previous.get(routeKey) ?? null;
          }
          return route.reverse();
        }
        queue.push(neighbor);
      }
    }
    return null;
  }

  private createMaterialLoad(cell: DigCell): MaterialLoad {
    const visual = this.add.container(
      (cell.column + 0.5) * TILE_SIZE,
      (cell.row + 0.5) * TILE_SIZE,
    ).setDepth(6);
    const clods = this.add.graphics();
    clods.fillStyle(0x77573d, 1);
    clods.fillEllipse(-4, 2, 9, 6);
    clods.fillEllipse(2, -2, 9, 7);
    clods.fillEllipse(6, 3, 7, 5);
    visual.add(clods);
    const load: MaterialLoad = { id: this.nextMaterialLoadId++, cell: { ...cell }, state: 'waiting', visual };
    this.materialLoads.push(load);
    return load;
  }

  private drawBuildingMaterialPile(): void {
    const graphics = this.buildingMaterialPileGraphics;
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

  private renderExcavatedTiles(): void {
    this.excavationGraphics.clear();
    this.excavationGraphics.fillStyle(COLORS.open, 1);
    this.dugCells.forEach(({ column, row }) => {
      this.excavationGraphics.fillRect(column * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
  }
}
