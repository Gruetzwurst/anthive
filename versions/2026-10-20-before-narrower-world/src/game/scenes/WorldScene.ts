import Phaser from 'phaser';
import { initialCameraY, nestChamberCenter, surfaceRow, TILE_SIZE, worldMap, worldSize } from '../world/worldMap';

const COLORS = {
  sky: 0x83c9df,
  open: 0x26323a,
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

  constructor() {
    super('WorldScene');
  }

  create(): void {
    this.drawWorld();
    this.drawLabels();
    this.frameWorld();
    this.enableCameraDrag();
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
  }

  private frameWorld(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, worldSize.width, worldSize.height);
    camera.setScroll(nestChamberCenter.x - camera.width / 2, initialCameraY);
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
