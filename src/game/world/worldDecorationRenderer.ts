import Phaser from 'phaser';
import type { WorldDecoration, WorldDecorationKind } from './worldTypes.ts';

const COLORS = {
  trunk: 0x70432b,
  trunkLight: 0x98613a,
  leafDark: 0x28502c,
  leaf: 0x39703a,
  leafLight: 0x609447,
  flower: 0xf1cf67,
  pond: 0x2d94b2,
  pondLight: 0x71d0d5,
  mountain: 0x626877,
  mountainLight: 0x9297a0,
  snow: 0xe8e9e5,
  ruin: 0x88877d,
  ruinLight: 0xb0aa96,
  mineral: 0x9d8364,
  gold: 0xe7a62b,
  crystal: 0x873ff1,
  fossil: 0xd7c9a4,
} as const;

export function drawWorldDecorations(
  graphics: Phaser.GameObjects.Graphics,
  decorations: WorldDecoration[],
  tileSize: number,
): void {
  decorations.forEach((decoration) => {
    const scale = decoration.scale ?? 1;
    drawDecoration(graphics, decoration.kind, decoration.position.x, decoration.position.y, tileSize, scale);
  });
}

function drawDecoration(
  graphics: Phaser.GameObjects.Graphics,
  kind: WorldDecorationKind,
  x: number,
  y: number,
  tile: number,
  scale: number,
): void {
  switch (kind) {
    case 'forest':
      drawTree(graphics, x - 4 * tile * scale, y, tile, 4.6 * scale, 0.85 * scale);
      drawTree(graphics, x, y, tile, 6 * scale, 1.05 * scale);
      drawTree(graphics, x + 4 * tile * scale, y, tile, 4 * scale, 0.78 * scale);
      return;
    case 'flowerPatch':
      for (let index = 0; index < 15; index += 1) {
        const flowerX = x + ((index % 5) - 2) * tile * 0.65 * scale;
        const flowerY = y - ((index * 7) % 5) * tile * 0.22 * scale;
        graphics.fillStyle(COLORS.leaf, 1);
        graphics.fillRect(flowerX, flowerY - tile * 0.5 * scale, 2 * scale, tile * 0.5 * scale);
        graphics.fillStyle(index % 3 === 0 ? 0xf29f9d : COLORS.flower, 1);
        graphics.fillCircle(flowerX + tile * 0.1 * scale, flowerY - tile * 0.5 * scale, tile * 0.16 * scale);
      }
      return;
    case 'pond':
      graphics.fillStyle(0x796140, 1);
      graphics.fillEllipse(x, y - tile * 0.12, tile * 13 * scale, tile * 3.1 * scale);
      graphics.fillStyle(COLORS.pond, 1);
      graphics.fillEllipse(x, y - tile * 0.32, tile * 11.6 * scale, tile * 2.4 * scale);
      graphics.fillStyle(COLORS.pondLight, 0.8);
      graphics.fillEllipse(x - tile * 1.7 * scale, y - tile * 0.75, tile * 2.6 * scale, tile * 0.2 * scale);
      return;
    case 'mountain':
      drawMountain(graphics, x - tile * 7 * scale, y, tile, 7 * scale, 0.9);
      drawMountain(graphics, x - tile * 1 * scale, y, tile, 10 * scale, 1.05);
      drawMountain(graphics, x + tile * 6 * scale, y, tile, 7.5 * scale, 0.85);
      return;
    case 'treeStump':
      graphics.fillStyle(COLORS.trunk, 1);
      graphics.fillRect(x - tile * scale, y - tile * 3.2 * scale, tile * 2 * scale, tile * 3.2 * scale);
      graphics.fillStyle(COLORS.trunkLight, 1);
      graphics.fillEllipse(x, y - tile * 3.2 * scale, tile * 2.2 * scale, tile * 0.5 * scale);
      graphics.fillStyle(0xb88a53, 1);
      graphics.fillEllipse(x, y - tile * 3.2 * scale, tile * 1.15 * scale, tile * 0.23 * scale);
      graphics.lineStyle(tile * 0.13 * scale, COLORS.trunk, 1);
      graphics.beginPath();
      graphics.moveTo(x, y - tile * 0.2); graphics.lineTo(x - tile * 2, y + tile * 1.7 * scale);
      graphics.moveTo(x, y - tile * 0.2); graphics.lineTo(x + tile * 2.2 * scale, y + tile * 1.3 * scale);
      graphics.strokePath();
      return;
    case 'ruins':
      graphics.fillStyle(COLORS.ruin, 1);
      graphics.fillRect(x - tile * 4 * scale, y - tile * 4 * scale, tile * 1.2 * scale, tile * 4 * scale);
      graphics.fillRect(x + tile * 2.8 * scale, y - tile * 3.4 * scale, tile * 1.2 * scale, tile * 3.4 * scale);
      graphics.fillRect(x - tile * 4.4 * scale, y - tile * 4.2 * scale, tile * 8.8 * scale, tile * 0.9 * scale);
      graphics.fillRect(x - tile * 5 * scale, y - tile * 0.7 * scale, tile * 10 * scale, tile * 0.7 * scale);
      graphics.fillStyle(COLORS.ruinLight, 1);
      graphics.fillRect(x - tile * 3.7 * scale, y - tile * 3.8 * scale, tile * 0.35 * scale, tile * 2.7 * scale);
      graphics.fillRect(x + tile * 3.1 * scale, y - tile * 3.1 * scale, tile * 0.35 * scale, tile * 2.3 * scale);
      return;
    case 'watchtower':
      graphics.lineStyle(tile * 0.25 * scale, COLORS.trunk, 1);
      graphics.beginPath();
      graphics.moveTo(x - tile * 2.5 * scale, y); graphics.lineTo(x - tile * 1.4 * scale, y - tile * 7 * scale);
      graphics.moveTo(x + tile * 2.5 * scale, y); graphics.lineTo(x + tile * 1.4 * scale, y - tile * 7 * scale);
      graphics.moveTo(x - tile * 2 * scale, y - tile * 3.5 * scale); graphics.lineTo(x + tile * 2 * scale, y - tile * 3.5 * scale);
      graphics.strokePath();
      graphics.fillStyle(COLORS.trunkLight, 1);
      graphics.fillRect(x - tile * 2.1 * scale, y - tile * 7.4 * scale, tile * 4.2 * scale, tile * 1.3 * scale);
      graphics.fillRect(x - tile * 2.8 * scale, y - tile * 8 * scale, tile * 5.6 * scale, tile * 0.7 * scale);
      graphics.fillTriangle(x - tile * 2.5 * scale, y - tile * 8 * scale, x + tile * 2.5 * scale, y - tile * 8 * scale, x, y - tile * 9.3 * scale);
      return;
    case 'roots':
      graphics.lineStyle(tile * 0.23 * scale, 0x70401f, 1);
      graphics.beginPath();
      graphics.moveTo(x, y); graphics.lineTo(x - tile * 2 * scale, y + tile * 5 * scale); graphics.lineTo(x - tile * 5 * scale, y + tile * 7 * scale);
      graphics.moveTo(x, y); graphics.lineTo(x + tile * 2 * scale, y + tile * 4 * scale); graphics.lineTo(x + tile * 6 * scale, y + tile * 5 * scale);
      graphics.moveTo(x - tile * 2 * scale, y + tile * 5 * scale); graphics.lineTo(x - tile * 3 * scale, y + tile * 10 * scale);
      graphics.moveTo(x + tile * 2 * scale, y + tile * 4 * scale); graphics.lineTo(x + tile * 1 * scale, y + tile * 9 * scale);
      graphics.moveTo(x + tile * 2 * scale, y + tile * 4 * scale); graphics.lineTo(x + tile * 5 * scale, y + tile * 10 * scale);
      graphics.strokePath();
      return;
    case 'mineral':
    case 'gold':
      drawRockDeposit(graphics, x, y, tile, scale, kind === 'gold' ? COLORS.gold : COLORS.mineral);
      return;
    case 'mushrooms':
      for (let index = 0; index < 5; index += 1) {
        const mushroomX = x + (index - 2) * tile * 0.55 * scale;
        const height = (0.45 + (index % 3) * 0.13) * tile * scale;
        graphics.fillStyle(0xe4d6bd, 1);
        graphics.fillRect(mushroomX - tile * 0.08 * scale, y - height, tile * 0.16 * scale, height);
        graphics.fillStyle(index % 2 === 0 ? 0xb64e36 : 0xd2aa49, 1);
        graphics.fillEllipse(mushroomX, y - height, tile * 0.5 * scale, tile * 0.25 * scale);
      }
      return;
    case 'crystal':
      drawCrystalCluster(graphics, x, y, tile, scale);
      return;
    case 'fossil':
      graphics.lineStyle(tile * 0.12 * scale, COLORS.fossil, 1);
      graphics.beginPath();
      graphics.moveTo(x - tile * 2.6 * scale, y); graphics.lineTo(x + tile * 2.6 * scale, y);
      graphics.moveTo(x - tile * 1.4 * scale, y - tile * 0.6 * scale); graphics.lineTo(x - tile * 1.4 * scale, y + tile * 0.6 * scale);
      graphics.moveTo(x - tile * 0.5 * scale, y - tile * 0.9 * scale); graphics.lineTo(x - tile * 0.5 * scale, y + tile * 0.9 * scale);
      graphics.moveTo(x + tile * 0.5 * scale, y - tile * 0.9 * scale); graphics.lineTo(x + tile * 0.5 * scale, y + tile * 0.9 * scale);
      graphics.moveTo(x + tile * 1.4 * scale, y - tile * 0.6 * scale); graphics.lineTo(x + tile * 1.4 * scale, y + tile * 0.6 * scale);
      graphics.strokePath();
      graphics.fillCircle(x - tile * 3 * scale, y, tile * 0.32 * scale);
      graphics.fillCircle(x + tile * 3 * scale, y, tile * 0.32 * scale);
      return;
  }
}

function drawTree(graphics: Phaser.GameObjects.Graphics, x: number, groundY: number, tile: number, height: number, width: number): void {
  graphics.fillStyle(COLORS.trunk, 1);
  graphics.fillRect(x - tile * 0.22 * width, groundY - tile * height, tile * 0.44 * width, tile * height);
  graphics.fillStyle(COLORS.leafDark, 1);
  graphics.fillCircle(x, groundY - tile * height, tile * 1.4 * width);
  graphics.fillCircle(x - tile * width, groundY - tile * (height - 0.8), tile * width);
  graphics.fillCircle(x + tile * width, groundY - tile * (height - 0.7), tile * width);
  graphics.fillCircle(x, groundY - tile * (height + 1.1), tile * 1.15 * width);
  graphics.fillStyle(COLORS.leaf, 1);
  graphics.fillCircle(x - tile * 0.5 * width, groundY - tile * (height + 0.3), tile * 0.82 * width);
  graphics.fillCircle(x + tile * 0.5 * width, groundY - tile * (height + 1), tile * 0.76 * width);
  graphics.fillStyle(COLORS.leafLight, 1);
  graphics.fillCircle(x - tile * 0.35 * width, groundY - tile * (height + 1.3), tile * 0.36 * width);
}

function drawMountain(graphics: Phaser.GameObjects.Graphics, x: number, groundY: number, tile: number, height: number, width: number): void {
  graphics.fillStyle(COLORS.mountain, 1);
  graphics.fillTriangle(x - tile * 5 * width, groundY, x + tile * 5 * width, groundY, x, groundY - tile * height);
  graphics.fillStyle(COLORS.mountainLight, 1);
  graphics.fillTriangle(x - tile * 2.4 * width, groundY, x + tile * 5 * width, groundY, x, groundY - tile * height);
  graphics.fillStyle(COLORS.snow, 1);
  graphics.fillTriangle(x - tile * 1.5 * width, groundY - tile * (height - 2.4), x + tile * 1.5 * width, groundY - tile * (height - 2.4), x, groundY - tile * height);
}

function drawRockDeposit(graphics: Phaser.GameObjects.Graphics, x: number, y: number, tile: number, scale: number, accent: number): void {
  graphics.fillStyle(0x59514d, 1);
  graphics.fillEllipse(x, y, tile * 3.7 * scale, tile * 1.2 * scale);
  graphics.fillStyle(accent, 1);
  graphics.fillTriangle(x - tile * 1.25 * scale, y, x - tile * 0.35 * scale, y - tile * 1.1 * scale, x + tile * 0.35 * scale, y);
  graphics.fillTriangle(x - tile * 0.1 * scale, y, x + tile * 0.8 * scale, y - tile * 1.4 * scale, x + tile * 1.45 * scale, y);
  graphics.fillTriangle(x + tile * 0.9 * scale, y, x + tile * 1.7 * scale, y - tile * 0.8 * scale, x + tile * 2 * scale, y);
}

function drawCrystalCluster(graphics: Phaser.GameObjects.Graphics, x: number, y: number, tile: number, scale: number): void {
  graphics.fillStyle(0x5127a6, 1);
  graphics.fillTriangle(x - tile * 2 * scale, y, x - tile * 1.2 * scale, y - tile * 2.3 * scale, x - tile * 0.2 * scale, y);
  graphics.fillTriangle(x - tile * 0.6 * scale, y, x + tile * 0.25 * scale, y - tile * 3.6 * scale, x + tile * 1.2 * scale, y);
  graphics.fillTriangle(x + tile * 0.6 * scale, y, x + tile * 1.6 * scale, y - tile * 2.5 * scale, x + tile * 2.5 * scale, y);
  graphics.fillStyle(0xb28bff, 0.9);
  graphics.fillTriangle(x - tile * 1.15 * scale, y - tile * 0.3 * scale, x - tile * 1.2 * scale, y - tile * 2.3 * scale, x - tile * 0.65 * scale, y - tile * 0.3 * scale);
  graphics.fillTriangle(x + tile * 0.15 * scale, y - tile * 0.3 * scale, x + tile * 0.25 * scale, y - tile * 3.6 * scale, x + tile * 0.75 * scale, y - tile * 0.3 * scale);
}
