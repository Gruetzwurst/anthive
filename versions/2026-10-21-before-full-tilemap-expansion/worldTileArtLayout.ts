import type { WorldTile } from './worldTypes.ts';

export const WORLD_TILE_ART_AREA = { firstColumn: 144, endColumn: 176 } as const;

const MATERIAL_INDEX: Partial<Record<WorldTile['terrain'], number>> = {
  topsoil: 0,
  compactEarth: 1,
  clay: 2,
  stoneLayer: 3,
  deepRock: 4,
};

const TRANSITION_FRAME: Partial<Record<string, number>> = {
  'topsoil>compactEarth': 0,
  'compactEarth>clay': 1,
  'clay>stoneLayer': 2,
  'stoneLayer>deepRock': 3,
};

export type WallOpenSide = 'left' | 'right' | 'up' | 'down';
export type TileArtInstruction = {
  materialIndex: number | null;
  groundFrame: number | null;
  transitionFrame: number | null;
  wall: { materialIndex: number; variant: number; openSide: WallOpenSide } | null;
  corner: { materialIndex: number; kind: 'inner' | 'outer'; rotation: number } | null;
};

const CARDINALS: Array<{ side: WallOpenSide; dx: number; dy: number }> = [
  { side: 'left', dx: -1, dy: 0 },
  { side: 'right', dx: 1, dy: 0 },
  { side: 'up', dx: 0, dy: -1 },
  { side: 'down', dx: 0, dy: 1 },
];

function isOpen(tile: WorldTile | undefined): boolean {
  return tile?.state === 'open' || tile?.state === 'rubble';
}

function cornerRotation(sides: WallOpenSide[]): number {
  const pair = new Set(sides);
  if (pair.has('up') && pair.has('left')) return 0;
  if (pair.has('up') && pair.has('right')) return 90;
  if (pair.has('down') && pair.has('right')) return 180;
  return 270;
}

export function getTileArtInstruction(
  tiles: WorldTile[][],
  column: number,
  row: number,
): TileArtInstruction {
  const tile = tiles[row]?.[column];
  const materialIndex = tile ? MATERIAL_INDEX[tile.terrain] ?? null : null;
  const empty: TileArtInstruction = {
    materialIndex,
    groundFrame: null,
    transitionFrame: null,
    wall: null,
    corner: null,
  };

  if (materialIndex === null || isOpen(tile)) return empty;

  const upper = tiles[row - 1]?.[column];
  const transitionFrame = upper
    ? TRANSITION_FRAME[`${upper.terrain}>${tile?.terrain}`] ?? null
    : null;
  const openSides = CARDINALS.filter(({ dx, dy }) => isOpen(tiles[row + dy]?.[column + dx]));

  if (openSides.length >= 2) {
    const cornerPair = openSides
      .map(({ side }) => side)
      .flatMap((side, index, sides) => sides.slice(index + 1).map((otherSide) => [side, otherSide] as const))
      .find(([first, second]) => (first === 'left' || first === 'right') !== (second === 'left' || second === 'right'));

    if (cornerPair) {
      const [first, second] = cornerPair;
      const diagonal = first === 'left' && second === 'up' ? tiles[row - 1]?.[column - 1]
        : first === 'up' && second === 'right' ? tiles[row - 1]?.[column + 1]
          : first === 'right' && second === 'down' ? tiles[row + 1]?.[column + 1]
            : first === 'down' && second === 'left' ? tiles[row + 1]?.[column - 1]
              : undefined;
      return {
        ...empty,
        transitionFrame,
        corner: {
          materialIndex,
          kind: isOpen(diagonal) ? 'inner' : 'outer',
          rotation: cornerRotation([first, second]),
        },
      };
    }
  }

  if (openSides.length > 0) {
    const { side } = openSides[0];
    return {
      ...empty,
      transitionFrame,
      wall: {
        materialIndex,
        variant: ((column + row) % 3 + 3) % 3,
        openSide: side,
      },
    };
  }

  const variant = ((column * 17 + row * 31) % 3 + 3) % 3;
  return {
    ...empty,
    groundFrame: variant * 5 + materialIndex,
    transitionFrame,
  };
}
