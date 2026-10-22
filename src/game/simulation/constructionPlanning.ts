import type { WorldCellCoordinate as Cell } from '../world/worldTypes.ts';
import { cardinalNeighbors, cellKey } from '../world/gridPathfinding.ts';
import { CONSTRUCTION_CONFIG } from './simulationConfig.ts';

export const PLAN_TYPES = ['tunnel', 'food', 'water', 'buildingMaterial', 'brood-gathering', 'brood-building', 'brood-care', 'brood-combat', 'rest'] as const;
export type PlanType = typeof PLAN_TYPES[number];
export const PLAN_LABELS: Record<PlanType, string> = {
  tunnel: 'Tunnel', food: 'Nahrungslager', water: 'Wasserlager', buildingMaterial: 'Baustofflager',
  'brood-gathering': 'Brutkammer · Sammeln', 'brood-building': 'Brutkammer · Bauen',
  'brood-care': 'Brutkammer · Pflege', 'brood-combat': 'Brutkammer · Kampf', rest: 'Ruhekammer',
};
function validate(cell: Cell): void {
  if (!Number.isInteger(cell.column) || !Number.isInteger(cell.row) || cell.column < 0 || cell.row < 0) throw new RangeError('Ungültige Kachelkoordinaten');
}
/** A one-tile brush fills pointer jumps using the existing cardinal topology. */
export function lineSelection(start: Cell, end: Cell): Cell[] {
  validate(start); validate(end);
  const cells = [{ ...start }];
  let column = start.column, row = start.row;
  while (column !== end.column || row !== end.row) {
    if (column !== end.column) { column += Math.sign(end.column - column); cells.push({ column, row }); }
    if (row !== end.row) { row += Math.sign(end.row - row); cells.push({ column, row }); }
  }
  return cells;
}
export function rectangleSelection(start: Cell, end: Cell): Cell[] {
  validate(start); validate(end);
  const cells: Cell[] = [];
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
    for (let column = Math.min(start.column, end.column); column <= Math.max(start.column, end.column); column++) cells.push({ column, row });
  }
  return cells;
}
export function mergeSelection(...groups: Cell[][]): Cell[] {
  const cells = new Map<string, Cell>();
  for (const group of groups) for (const cell of group) { validate(cell); cells.set(cellKey(cell), { ...cell }); }
  return [...cells.values()];
}
export function isConnectedSelection(cells: Cell[]): boolean {
  if (!cells.length) return false;
  const keys = new Set(cells.map(cellKey)), seen = new Set([cellKey(cells[0])]), queue = [cells[0]];
  for (let index = 0; index < queue.length; index++) for (const next of cardinalNeighbors(queue[index])) {
    const key = cellKey(next);
    if (keys.has(key) && !seen.has(key)) { seen.add(key); queue.push(next); }
  }
  return seen.size === keys.size;
}
export function constructionMaterialEstimate(type: PlanType, area: number): number {
  if (!PLAN_TYPES.includes(type) || !Number.isInteger(area) || area < 0) throw new RangeError('Ungültiger Bauplan');
  return CONSTRUCTION_CONFIG.materialPerTile[type] * area;
}
