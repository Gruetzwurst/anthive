import Phaser from 'phaser';
import groundVariantsUrl from '../../../assets/prototypes/world-tile-expansion/ground-variants-24px.png';
import layerTransitionsUrl from '../../../assets/prototypes/world-tile-expansion/layer-transitions-24px.png';
import groundEdgesUrl from '../../../assets/prototypes/world-tile-expansion/ground-edges-24px.png';
import groundCornersUrl from '../../../assets/prototypes/world-tile-expansion/ground-corners-24px.png';
import groundEdgeVariantsUrl from '../../../assets/prototypes/world-tile-expansion/ground-edge-variants-24px.png';
import layerCornerTransitionsUrl from '../../../assets/prototypes/world-tile-expansion/layer-corner-transitions-24px.png';
import type { WorldTile } from './worldTypes.ts';
import {
  getTileArtInstruction,
  WORLD_TILE_ART_AREA,
  type WallOpenSide,
} from './worldTileArtLayout.ts';

const ATLAS_KEYS = {
  ground: 'anthive-ground-variants',
  transitions: 'anthive-layer-transitions',
  edges: 'anthive-ground-edges',
  corners: 'anthive-ground-corners',
  edgeVariants: 'anthive-ground-edge-variants',
  layerCorners: 'anthive-layer-corner-transitions',
  composed: 'anthive-world-tile-art-area',
} as const;

export function isWorldTileArtColumn(column: number): boolean {
  return column >= WORLD_TILE_ART_AREA.firstColumn && column < WORLD_TILE_ART_AREA.endColumn;
}

export function preloadWorldTileArt(scene: Phaser.Scene): void {
  scene.load.spritesheet(ATLAS_KEYS.ground, groundVariantsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.transitions, layerTransitionsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.edges, groundEdgesUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.corners, groundCornersUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.edgeVariants, groundEdgeVariantsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.layerCorners, layerCornerTransitionsUrl, { frameWidth: 24, frameHeight: 24 });
}

function drawAtlasFrame(
  context: CanvasRenderingContext2D,
  scene: Phaser.Scene,
  atlasKey: string,
  frameIndex: number,
  x: number,
  y: number,
  rotation = 0,
): void {
  const texture = scene.textures.get(atlasKey);
  const frame = texture.get(frameIndex);
  const source = texture.getSourceImage(frameIndex) as CanvasImageSource;
  context.save();
  context.translate(x + 12, y + 12);
  context.rotate(Phaser.Math.DegToRad(rotation));
  context.drawImage(source, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, -12, -12, 24, 24);
  context.restore();
}

function edgeRotation(side: WallOpenSide): number {
  if (side === 'right') return 180;
  if (side === 'up') return 90;
  if (side === 'down') return 270;
  return 0;
}

function asHexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}

export function drawWorldTileArt(
  scene: Phaser.Scene,
  tiles: WorldTile[][],
  tileSize: number,
  openColor: number,
): void {
  const areaWidth = (WORLD_TILE_ART_AREA.endColumn - WORLD_TILE_ART_AREA.firstColumn) * tileSize;
  const areaHeight = tiles.length * tileSize;
  let canvasTexture = scene.textures.exists(ATLAS_KEYS.composed)
    ? scene.textures.get(ATLAS_KEYS.composed) as Phaser.Textures.CanvasTexture
    : scene.textures.createCanvas(ATLAS_KEYS.composed, areaWidth, areaHeight);
  if (!canvasTexture) return;

  if (canvasTexture.width !== areaWidth || canvasTexture.height !== areaHeight) {
    canvasTexture.setSize(areaWidth, areaHeight);
  }

  const context = canvasTexture.context;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, areaWidth, areaHeight);

  tiles.forEach((row, rowIndex) => {
    for (let column = WORLD_TILE_ART_AREA.firstColumn; column < WORLD_TILE_ART_AREA.endColumn; column += 1) {
      const tile = row[column];
      const x = (column - WORLD_TILE_ART_AREA.firstColumn) * tileSize;
      const y = rowIndex * tileSize;
      if (!tile || tile.terrain === 'air' || tile.terrain === 'surface') continue;

      if (tile.state === 'open' || tile.state === 'rubble') {
        context.fillStyle = asHexColor(openColor);
        context.fillRect(x, y, tileSize, tileSize);
        continue;
      }

      const instruction = getTileArtInstruction(tiles, column, rowIndex);
      if (instruction.groundFrame !== null) {
        drawAtlasFrame(context, scene, ATLAS_KEYS.ground, instruction.groundFrame, x, y);
      }

      if (instruction.materialIndex !== null) {
        const corner = instruction.corner;
        if (instruction.transitionFrame !== null) {
          const transitionAtlas = corner ? ATLAS_KEYS.layerCorners : ATLAS_KEYS.transitions;
          drawAtlasFrame(
            context,
            scene,
            transitionAtlas,
            instruction.transitionFrame,
            x,
            y,
            corner?.rotation ?? 0,
          );
        }

        const wall = instruction.wall;
        if (wall) {
          const key = wall.variant === 0 ? ATLAS_KEYS.edges : ATLAS_KEYS.edgeVariants;
          const frame = wall.variant === 0
            ? wall.materialIndex
            : (wall.variant - 1) * 5 + wall.materialIndex;
          drawAtlasFrame(context, scene, key, frame, x, y, edgeRotation(wall.openSide));
        } else if (corner && instruction.transitionFrame === null) {
          const frame = corner.materialIndex + (corner.kind === 'outer' ? 5 : 0);
          drawAtlasFrame(context, scene, ATLAS_KEYS.corners, frame, x, y, corner.rotation);
        }
      }
    }
  });

  canvasTexture.update();
  const x = WORLD_TILE_ART_AREA.firstColumn * tileSize;
  const image = scene.children.getByName(ATLAS_KEYS.composed) as Phaser.GameObjects.Image | null;
  if (image) {
    image.setPosition(x, 0).setTexture(ATLAS_KEYS.composed).setOrigin(0, 0).setDepth(0);
  } else {
    scene.add.image(x, 0, ATLAS_KEYS.composed)
      .setName(ATLAS_KEYS.composed)
      .setOrigin(0, 0)
      .setDepth(0);
  }
}
