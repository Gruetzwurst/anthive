import type { WorldCellCoordinate } from './worldTypes.ts';

export const cellKey = ({ column, row }: WorldCellCoordinate): string => `${column},${row}`;
export const cardinalNeighbors = ({ column, row }: WorldCellCoordinate): WorldCellCoordinate[] => [
  { column: column - 1, row }, { column: column + 1, row },
  { column, row: row - 1 }, { column, row: row + 1 },
];

// Extracted from WorldScene's existing BFS, preserving neighbor order and paths.
export function findGridPath(
  start: WorldCellCoordinate,
  goal: WorldCellCoordinate,
  isPassable: (cell: WorldCellCoordinate) => boolean,
): WorldCellCoordinate[] | null {
  if (!isPassable(start) || !isPassable(goal)) return null;
  const startKey = cellKey(start), goalKey = cellKey(goal);
  const previous = new Map<string, WorldCellCoordinate | null>([[startKey, null]]);
  const queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (cellKey(current) === goalKey) {
      const path = [{ ...current }];
      let parent = previous.get(cellKey(current));
      while (parent) { path.push({ ...parent }); parent = previous.get(cellKey(parent)); }
      return path.reverse();
    }
    for (const next of cardinalNeighbors(current)) {
      if (previous.has(cellKey(next)) || !isPassable(next)) continue;
      previous.set(cellKey(next), current);
      queue.push(next);
    }
  }
  return null;
}
