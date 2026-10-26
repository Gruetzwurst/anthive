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
  cost?: (cell: WorldCellCoordinate, from: WorldCellCoordinate) => number,
): WorldCellCoordinate[] | null {
  if (!isPassable(start) || !isPassable(goal)) return null;
  if (cost) return weightedPath(start, goal, isPassable, cost);
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

// A* uses the same cardinal topology; optional costs must be finite and >= 1.
function weightedPath(start: WorldCellCoordinate, goal: WorldCellCoordinate,
  passable: (cell: WorldCellCoordinate) => boolean, cost: (cell: WorldCellCoordinate, from: WorldCellCoordinate) => number): WorldCellCoordinate[] | null {
  type Entry = {cell: WorldCellCoordinate; distance: number; score: number; order: number};
  const heap: Entry[] = [], previous = new Map<string, WorldCellCoordinate>(), distances = new Map([[cellKey(start), 0]]);
  let order = 0;
  const less = (a: Entry, b: Entry) => a.score < b.score || (a.score === b.score && a.order < b.order);
  const push = (entry: Entry) => {
    heap.push(entry);let index = heap.length - 1;
    while (index > 0) {const parent = (index - 1) >> 1;if (!less(heap[index], heap[parent])) break;
      [heap[index], heap[parent]] = [heap[parent], heap[index]];index = parent;}
  };
  const pop = (): Entry => {
    const first = heap[0], last = heap.pop()!;
    if (heap.length) {heap[0] = last;let index = 0;
      while (true) {let child = index * 2 + 1;if (child >= heap.length) break;
        if (child + 1 < heap.length && less(heap[child + 1], heap[child])) child++;
        if (!less(heap[child], heap[index])) break;
        [heap[index], heap[child]] = [heap[child], heap[index]];index = child;}}
    return first;
  };
  const heuristic = (cell: WorldCellCoordinate) => Math.abs(cell.column-goal.column)+Math.abs(cell.row-goal.row);
  push({cell: start, distance: 0, score: heuristic(start), order: order++});
  while (heap.length) {
    const current = pop(), key = cellKey(current.cell);
    if (current.distance !== distances.get(key)) continue;
    if (key === cellKey(goal)) {
      const result = [{...current.cell}];let parent = previous.get(key);
      while (parent) {result.push({...parent});parent = previous.get(cellKey(parent));}return result.reverse();
    }
    for (const next of cardinalNeighbors(current.cell)) {
      if (!passable(next)) continue;
      const weight = cost(next, current.cell);
      if (!Number.isFinite(weight) || weight < 1) throw new RangeError('Path costs must be finite and >= 1');
      const distance = current.distance + weight, nextKey = cellKey(next);
      if (distance >= (distances.get(nextKey) ?? Infinity)) continue;
      distances.set(nextKey, distance);previous.set(nextKey, current.cell);
      push({cell: next, distance, score: distance + heuristic(next), order: order++});
    }
  }
  return null;
}
