import Phaser from 'phaser';
import {
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
type DigOrder = { cells: DigCell[]; index: number; accumulator: number };

export class WorldScene extends Phaser.Scene {
  private dragMode: 'none' | 'camera' | 'dig' = 'none';
  private lastPointerX = 0;
  private lastPointerY = 0;
  private antPath?: Phaser.Curves.Path;
  private ants: Array<{ body: Phaser.GameObjects.Container; food: Phaser.GameObjects.Ellipse; offset: number }> = [];
  private elapsed = 0;
  private excavationGraphics!: Phaser.GameObjects.Graphics;
  private digPreviewGraphics!: Phaser.GameObjects.Graphics;
  private digStart: DigCell | null = null;
  private previewCells: DigCell[] = [];
  private dugCells: DigCell[] = [];
  private digOrders: DigOrder[] = [];
  private digGoals: DigCell[] = [];
  private reachableOpenCells = new Set<string>();
  private diggingGrade = 0;
  private upgradeButton?: Phaser.GameObjects.Text;
  private digStatus?: Phaser.GameObjects.Text;
  private digWorker?: Phaser.GameObjects.Container;

  constructor() {
    super('WorldScene');
  }

  create(): void {
    this.drawWorld();
    this.initializeReachability();
    this.excavationGraphics = this.add.graphics().setDepth(2);
    this.digPreviewGraphics = this.add.graphics().setDepth(3);
    this.drawFoodMarkers();
    this.drawLabels();
    this.createDigControls();
    this.createDigWorker();
    const home = this.cellAt(nestChamberCenter.x, nestChamberCenter.y);
    if (home) this.digWorker?.setPosition((home.column + 0.5) * TILE_SIZE, (home.row + 0.5) * TILE_SIZE).setVisible(true);
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

    this.updateDigOrder(delta);
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
        this.digOrders.forEach((order) => { order.accumulator = 0; });
        this.digStatus?.setText(`Test-Grabkraft ${this.diggingGrade}: Grabaufträge prüfen jetzt härtere Schichten.`);
        this.renderDigPreview();
      },
    );
  }

  private createDigWorker(): void {
    const body = this.add.container(0, 0).setDepth(5).setVisible(false);
    const shape = this.add.graphics();
    shape.fillStyle(0x261b17, 1);
    shape.fillEllipse(-3, 0, 8, 6);
    shape.fillCircle(2, 0, 2.4);
    shape.fillCircle(6, -0.5, 2.3);
    shape.lineStyle(1, 0x261b17, 1);
    shape.beginPath();
    shape.moveTo(-3, 1); shape.lineTo(-5, 4);
    shape.moveTo(0, 1); shape.lineTo(-1, 4);
    shape.moveTo(3, 1); shape.lineTo(4, 4);
    shape.moveTo(6, -2); shape.lineTo(8, -4);
    shape.strokePath();
    body.add(shape);
    this.digWorker = body;
  }

  private updateUpgradeLabel(): void {
    this.upgradeButton?.setText(`GRABKRAFT · TEST ${this.diggingGrade}`);
  }

  private frameWorld(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, worldSize.width, worldSize.height);
    const routeCenterX = (surfaceFoodSource.x + foodStoreCenter.x) / 2;
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

  private isReachableOrNextToReachable(cell: DigCell): boolean {
    if (this.reachableOpenCells.has(this.cellKey(cell))) return true;
    return [
      { column: cell.column - 1, row: cell.row },
      { column: cell.column + 1, row: cell.row },
      { column: cell.column, row: cell.row - 1 },
      { column: cell.column, row: cell.row + 1 },
    ].some((neighbor) => this.reachableOpenCells.has(this.cellKey(neighbor)));
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

    const goal = this.previewCells[this.previewCells.length - 1];
    if (goal) this.digGoals.push(goal);
    this.digOrders.push({ cells: [...this.previewCells], index: 1, accumulator: 0 });
    const start = this.previewCells[0];
    if (start && this.reachableOpenCells.has(this.cellKey(start))) {
      this.digWorker?.setPosition((start.column + 0.5) * TILE_SIZE, (start.row + 0.5) * TILE_SIZE).setVisible(true);
    }
    this.digStatus?.setText('Grabauftrag erteilt: Die Ameisen graben den Weg nach und nach.');
  }

  private updateDigOrder(delta: number): void {
    for (let orderPosition = this.digOrders.length - 1; orderPosition >= 0; orderPosition -= 1) {
      const order = this.digOrders[orderPosition];
      order.accumulator += Math.min(delta, 100);

      while (true) {
        const target = order.cells[order.index];
        if (!target) {
          this.digOrders.splice(orderPosition, 1);
          this.digStatus?.setText('Grabauftrag erledigt.');
          break;
        }

        const material = worldMap[target.row]?.[target.column];
        const targetReachable = this.isReachableOrNextToReachable(target);
        if (material === 'open') {
          if (!this.reachableOpenCells.has(this.cellKey(target))) {
            order.accumulator = 0;
            this.digStatus?.setText('Der Weg berührt sich nur diagonal. Zieh einen zweiten Gang daneben.');
            break;
          }
          order.index += 1;
          this.digWorker?.setPosition((target.column + 0.5) * TILE_SIZE, (target.row + 0.5) * TILE_SIZE).setVisible(true);
          continue;
        }
        if (material !== 'unknown' && material !== 'stone') {
          this.digOrders.splice(orderPosition, 1);
          this.digStatus?.setText('Grabweg endet hier.');
          break;
        }
        if (!targetReachable) {
          order.accumulator = 0;
          this.digStatus?.setText('Der Weg berührt sich nur diagonal. Zieh einen zweiten Gang daneben.');
          break;
        }

        const grade = this.requiredGrade(target);
        if (grade > this.diggingGrade) {
          order.accumulator = 0;
          this.digStatus?.setText(material === 'stone'
            ? `Stein braucht Test-Grabkraft ${grade}; die Ameise bleibt im freien Gang.`
            : `Diese Erdschicht braucht Test-Grabkraft ${grade}; die Ameise bleibt im freien Gang.`);
          break;
        }

        const digDuration = 650 + grade * 450;
        if (order.accumulator < digDuration) break;
        order.accumulator -= digDuration;
        worldMap[target.row][target.column] = 'open';
        this.dugCells.push(target);
        this.expandReachability(target);
        order.index += 1;
        this.renderExcavatedTiles();
        this.updateBuilderPosition(target);
        this.digStatus?.setText(grade > 0
          ? `Grabkraft ${grade}: härtere Erdschicht wird langsam freigelegt.`
          : 'Die Ameisen graben den markierten Weg.');
      }
    }
    if (this.digOrders.length === 0) this.digGoals = [];
  }

  private updateBuilderPosition(lastOpened: DigCell): void {
    if (this.reachableOpenCells.has(this.cellKey(lastOpened))) {
      this.digWorker
        ?.setPosition((lastOpened.column + 0.5) * TILE_SIZE, (lastOpened.row + 0.5) * TILE_SIZE)
        .setVisible(true);
      return;
    }

    for (let index = this.digGoals.length - 1; index >= 0; index -= 1) {
      const goal = this.digGoals[index];
      if (!this.reachableOpenCells.has(this.cellKey(goal))) continue;
      this.digWorker
        ?.setPosition((goal.column + 0.5) * TILE_SIZE, (goal.row + 0.5) * TILE_SIZE)
        .setVisible(true);
      return;
    }
  }

  private renderExcavatedTiles(): void {
    this.excavationGraphics.clear();
    this.excavationGraphics.fillStyle(COLORS.open, 1);
    this.dugCells.forEach(({ column, row }) => {
      this.excavationGraphics.fillRect(column * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
  }
}
