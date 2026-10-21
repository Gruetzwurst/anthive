import Phaser from 'phaser';
import {
  foodStoreCenter,
  initialCameraY,
  nestChamberCenter,
  surfaceFoodSource,
  surfaceRow,
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

export class WorldScene extends Phaser.Scene {
  private dragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private antPath?: Phaser.Curves.Path;
  private ants: Array<{ body: Phaser.GameObjects.Container; food: Phaser.GameObjects.Ellipse; offset: number }> = [];
  private elapsed = 0;

  constructor() {
    super('WorldScene');
  }

  create(): void {
    this.drawWorld();
    this.drawFoodMarkers();
    this.drawLabels();
    this.createAnts();
    this.frameWorld();
    this.enableCameraDrag();
  }

  update(_time: number, delta: number): void {
    if (!this.antPath) return;

    this.elapsed += delta;
    const tripDuration = 12_000;
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

        if (cell === 'unknown') {
          const localSurface = surfaceRow(columnIndex);
          const depth = rowIndex - localSurface;
          const baseColor = rowIndex > worldMap.length - 6
            ? COLORS.bottomSoil
            : depth > 70
              ? COLORS.deepSoil
              : COLORS.soil;
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
      .text(18, 38, 'WELT & KAMERA · ENTWURF', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
      })
      .setAlpha(0.8)
      .setScrollFactor(0);

    this.add
      .text(622, 342, 'Ziehen zum Umsehen', {
        color: COLORS.text,
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
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
    this.dragging = true;
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
    this.input.setDefaultCursor('grabbing');
  }

  private moveCamera(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || !pointer.isDown) return;

    const camera = this.cameras.main;
    const maxX = Math.max(0, worldSize.width - camera.width);
    const maxY = Math.max(0, worldSize.height - camera.height);
    camera.scrollX = Phaser.Math.Clamp(camera.scrollX + this.lastPointerX - pointer.x, 0, maxX);
    camera.scrollY = Phaser.Math.Clamp(camera.scrollY + this.lastPointerY - pointer.y, 0, maxY);
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
  }

  private stopDrag(): void {
    this.dragging = false;
    this.input.setDefaultCursor('grab');
  }
}
