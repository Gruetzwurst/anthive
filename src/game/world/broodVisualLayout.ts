import type {WorldCellCoordinate,WorldPoint} from './worldTypes.ts';

/** Deterministic real-cell slots; two brood places per tile in the current test balance. */
export function broodSlot(cells:readonly WorldCellCoordinate[],index:number,tileSize:number):WorldPoint|null {
  if(!cells.length || index<0 || !Number.isInteger(index))return null;
  const cell=cells[Math.floor(index/2)%cells.length];
  return {x:(cell.column+.5)*tileSize+(index%2?5:-5),y:(cell.row+.5)*tileSize+4};
}
export function queenEggSlot(origin:WorldPoint,index:number):WorldPoint {
  return {x:origin.x+14+(index%6)*6,y:origin.y+5+Math.floor(index/6)*5};
}
