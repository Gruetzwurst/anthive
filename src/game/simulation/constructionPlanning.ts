import type { WorldCellCoordinate as Cell } from '../world/worldTypes.ts';
import { cardinalNeighbors, cellKey } from '../world/gridPathfinding.ts';
import { CONSTRUCTION_CONFIG, CHAMBER_BUILD_CONFIG } from './simulationConfig.ts';

export const PLAN_TYPES = ['tunnel', 'food', 'water', 'buildingMaterial', 'brood-gathering', 'brood-building', 'brood-care', 'brood-combat', 'rest','queen'] as const;
export type PlanType = typeof PLAN_TYPES[number];
export const PLAN_LABELS: Record<PlanType, string> = {
  tunnel: 'Tunnel', food: 'Nahrungslager', water: 'Wasserlager', buildingMaterial: 'Baustofflager',
  'brood-gathering': 'Brutkammer · Sammeln', 'brood-building': 'Brutkammer · Bauen',
  'brood-care': 'Brutkammer · Pflege', 'brood-combat': 'Brutkammer · Kampf', rest: 'Ruhekammer',queen:'Königinnenkammer',
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

export type TemplateSize = 'small' | 'medium' | 'large' | 'free';
export function squareTemplate(type: PlanType, size: Exclude<TemplateSize, 'free'>, anchor: Cell): Cell[] {
  if (!PLAN_TYPES.includes(type) || type === 'tunnel') throw new RangeError('Tunnel frei zeichnen');
  if(type==='queen')return rectangleSelection(anchor,{column:anchor.column+10,row:anchor.row+3});
  const side = (type.startsWith('brood-') ? CHAMBER_BUILD_CONFIG.broodSides : CHAMBER_BUILD_CONFIG.standardSides)[size];
  if (!side) throw new RangeError('Ungültige Vorlagengröße');
  return rectangleSelection(anchor, {column: anchor.column + side - 1, row: anchor.row + side - 1});
}
export function maximumChamberArea(type: PlanType): number {
  return type === 'tunnel' ? Infinity : type.startsWith('brood-')
    ? CHAMBER_BUILD_CONFIG.broodMaximumArea : CHAMBER_BUILD_CONFIG.standardMaximumArea;
}
/** The actual neighboring room cells, for both validation and conflict highlighting. */
export function chamberDistanceConflicts(cells: Cell[], footprints: readonly (readonly Cell[])[]): Cell[] {
  const nearby = new Set<string>();
  const radius = CHAMBER_BUILD_CONFIG.minimumCellDistance - 1;
  for (const cell of cells) for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++)
    nearby.add(cellKey({column: cell.column + dx, row: cell.row + dy}));
  const conflicts = new Map<string, Cell>();
  for (const room of footprints) for (const cell of room) if (nearby.has(cellKey(cell))) conflicts.set(cellKey(cell), {...cell});
  return [...conflicts.values()];
}

export function extendBrushStroke(stroke: Cell[], end: Cell): Cell[] {
  validate(end);
  const existing = stroke.findIndex(cell => cellKey(cell) === cellKey(end));
  if (existing >= 0) return stroke.slice(0, existing + 1).map(cell => ({...cell}));
  const result = stroke.map(cell => ({...cell}));
  if (!result.length) return [{...end}];
  for (const cell of lineSelection(result[result.length - 1], end).slice(1)) {
    const index = result.findIndex(previous => cellKey(previous) === cellKey(cell));
    if (index >= 0) result.length = index + 1;
    else result.push(cell);
  }
  return result;
}
export function subtractSelection(cells: Cell[], removed: Cell[]): Cell[] {
  const keys = new Set(removed.map(cellKey));
  return cells.filter(cell => !keys.has(cellKey(cell))).map(cell => ({...cell}));
}
