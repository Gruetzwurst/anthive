import Phaser from 'phaser';
import groundVariantsUrl from '../../../assets/prototypes/world-tile-expansion/ground-variants-24px.png';
import layerTransitionsUrl from '../../../assets/prototypes/world-tile-expansion/layer-transitions-24px.png';
import groundEdgesUrl from '../../../assets/prototypes/world-tile-expansion/ground-edges-24px.png';
import groundCornersUrl from '../../../assets/prototypes/world-tile-expansion/ground-corners-24px.png';
import groundEdgeVariantsUrl from '../../../assets/prototypes/world-tile-expansion/ground-edge-variants-24px.png';
import layerCornerTransitionsUrl from '../../../assets/prototypes/world-tile-expansion/layer-corner-transitions-24px.png';
import grassEarthTransitionUrl from '../../../assets/prototypes/world-tile-sample/tiles/grass-earth-transition.png';
import irregularSurfaceEdgeUrl from '../../../assets/prototypes/world-tile-sample/tiles/irregular-surface-edge.png';
import type { WorldTile } from './worldTypes.ts';
import {
  getTileArtInstruction,
  getTilemapAtlasFrame,
  TILEMAP_ART_ATLAS_COLUMNS,
  TILEMAP_ART_ATLAS_FRAME_COUNT,
} from './worldTileArtLayout.ts';

const ATLAS_KEYS = {
  ground: 'anthive-ground-variants',
  transitions: 'anthive-layer-transitions',
  edges: 'anthive-ground-edges',
  corners: 'anthive-ground-corners',
  edgeVariants: 'anthive-ground-edge-variants',
  layerCorners: 'anthive-layer-corner-transitions',
  grassEarth: 'anthive-grass-earth-transition',
  irregularSurface: 'anthive-irregular-surface-edge',
  composed: 'anthive-world-tile-art-atlas',
} as const;

type TileArtMap = {
  layer: Phaser.Tilemaps.TilemapLayer;
};

const sceneTileMaps = new WeakMap<Phaser.Scene, TileArtMap>();

export function preloadWorldTileArt(scene: Phaser.Scene): void {
  scene.load.spritesheet(ATLAS_KEYS.ground, groundVariantsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.transitions, layerTransitionsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.edges, groundEdgesUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.corners, groundCornersUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.edgeVariants, groundEdgeVariantsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.layerCorners, layerCornerTransitionsUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.grassEarth, grassEarthTransitionUrl, { frameWidth: 24, frameHeight: 24 });
  scene.load.spritesheet(ATLAS_KEYS.irregularSurface, irregularSurfaceEdgeUrl, { frameWidth: 24, frameHeight: 24 });
}

function copyAtlasFrame(
  context: CanvasRenderingContext2D,
  scene: Phaser.Scene,
  sourceKey: string,
  sourceFrame: number,
  destinationFrame: number,
  rotation = 0,
  flipX = false,
): void {
  const sourceTexture = scene.textures.get(sourceKey);
  const frame = sourceTexture.get(sourceFrame);
  const sourceImage = sourceTexture.getSourceImage(sourceFrame) as CanvasImageSource;
  const destinationX = (destinationFrame % TILEMAP_ART_ATLAS_COLUMNS) * 24;
  const destinationY = Math.floor(destinationFrame / TILEMAP_ART_ATLAS_COLUMNS) * 24;

  context.save();
  context.translate(destinationX + 12, destinationY + 12);
  context.rotate(Phaser.Math.DegToRad(rotation));
  if (flipX) context.scale(-1, 1);
  context.drawImage(sourceImage, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, -12, -12, 24, 24);
  context.restore();
}

function createComposedAtlas(scene: Phaser.Scene): void {
  const atlasHeight = Math.ceil(TILEMAP_ART_ATLAS_FRAME_COUNT / TILEMAP_ART_ATLAS_COLUMNS) * 24;
  const texture = scene.textures.createCanvas(
    ATLAS_KEYS.composed,
    TILEMAP_ART_ATLAS_COLUMNS * 24,
    atlasHeight,
  );
  if (!texture) throw new Error('Kachelgrafik-Atlas konnte nicht angelegt werden.');

  const context = texture.context;
  context.imageSmoothingEnabled = false;

  for (let frame = 0; frame < 15; frame += 1) {
    copyAtlasFrame(context, scene, ATLAS_KEYS.ground, frame, frame);
  }
  for (let frame = 0; frame < 4; frame += 1) {
    copyAtlasFrame(context, scene, ATLAS_KEYS.transitions, frame, 15 + frame);
  }
  for (let variant = 0; variant < 3; variant += 1) {
    for (let material = 0; material < 5; material += 1) {
      const key = variant === 0 ? ATLAS_KEYS.edges : ATLAS_KEYS.edgeVariants;
      const sourceFrame = variant === 0 ? material : (variant - 1) * 5 + material;
      const orientations = [
        { rotation: 0, flipX: false },
        { rotation: 90, flipX: false },
        { rotation: 0, flipX: true },
        { rotation: 270, flipX: false },
      ];
      orientations.forEach(({ rotation, flipX }, orientation) => {
        const destinationFrame = 19 + (variant * 5 + material) * 4 + orientation;
        copyAtlasFrame(context, scene, key, sourceFrame, destinationFrame, rotation, flipX);
      });
    }
  }
  for (let corner = 0; corner < 10; corner += 1) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      copyAtlasFrame(context, scene, ATLAS_KEYS.corners, corner, 79 + corner * 4 + rotation, rotation * 90);
    }
  }
  for (let transition = 0; transition < 4; transition += 1) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      copyAtlasFrame(
        context,
        scene,
        ATLAS_KEYS.layerCorners,
        transition,
        119 + transition * 4 + rotation,
        rotation * 90,
      );
    }
  }
  copyAtlasFrame(context, scene, ATLAS_KEYS.grassEarth, 0, 135);
  copyAtlasFrame(context, scene, ATLAS_KEYS.irregularSurface, 0, 136);

  texture.update();
}

function tileIndicesForWorld(tiles: WorldTile[][]): number[][] {
  return tiles.map((row, rowIndex) => row.map((_, column) =>
    getTilemapAtlasFrame(getTileArtInstruction(tiles, column, rowIndex)),
  ));
}

export function drawWorldTileArt(
  scene: Phaser.Scene,
  tiles: WorldTile[][],
  tileSize: number,
): Phaser.Tilemaps.TilemapLayer {
  createComposedAtlas(scene);
  const map = scene.make.tilemap({ data: tileIndicesForWorld(tiles), tileWidth: tileSize, tileHeight: tileSize });
  const tileset = map.addTilesetImage('anthive-world-art', ATLAS_KEYS.composed, tileSize, tileSize, 0, 0, 0);
  if (!tileset) throw new Error('Kachelgrafik-Atlas konnte nicht als Tileset eingebunden werden.');
  const layer = map.createLayer(0, tileset, 0, 0);
  if (!layer) throw new Error('Kachelkarte für die Bodengrafiken konnte nicht erstellt werden.');

  layer.setName('anthive-world-tile-art').setDepth(0);
  sceneTileMaps.set(scene, { layer });
  return layer;
}

export function updateWorldTileArt(
  scene: Phaser.Scene,
  tiles: WorldTile[][],
  changedCell: { column: number; row: number },
): void {
  const tileMap = sceneTileMaps.get(scene);
  if (!tileMap) return;

  for (let row = changedCell.row - 1; row <= changedCell.row + 1; row += 1) {
    for (let column = changedCell.column - 1; column <= changedCell.column + 1; column += 1) {
      const instruction = getTileArtInstruction(tiles, column, row);
      tileMap.layer.putTileAt(getTilemapAtlasFrame(instruction), column, row, false);
    }
  }
}
