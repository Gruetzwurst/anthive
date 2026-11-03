import type {StartingWorld,WorldCellCoordinate} from './worldTypes.ts';
import type {PlanType} from '../simulation/constructionPlanning.ts';

export type FurnishingVisualOrder = {
  id:number; type:PlanType|'queen'; storeId?:string; cells:readonly WorldCellCoordinate[]; materialRequired:number;
  stock?: {amount:number; capacity:number};
  installedByCell:readonly (WorldCellCoordinate & {amount:number})[];
};
export type FurnishingMark = WorldCellCoordinate & {
  x:number; y:number; progress:number; stockFraction:number; kind:Exclude<PlanType,'tunnel'>|'queen';
  edges:('top'|'right'|'bottom'|'left')[];
};
/** Furniture represents installed work only, never resource stock or inhabitants. */
export function chamberFurnishingLayout(order:FurnishingVisualOrder,tileSize:number):FurnishingMark[] {
  if(order.type==='tunnel'||order.materialRequired<=0||order.cells.length===0||!Number.isFinite(tileSize)||tileSize<=0)return [];
  const selected=new Set(order.cells.map(cell=>`${cell.column},${cell.row}`));
  const installed=new Map(order.installedByCell.map(cell=>[`${cell.column},${cell.row}`,cell.amount]));
  const cost=order.materialRequired/order.cells.length;
  const marks:FurnishingMark[]=[];
  for(const cell of order.cells){
    const amount=installed.get(`${cell.column},${cell.row}`)??0;
    if(!Number.isFinite(amount)||amount<=0)continue;
    const edges:FurnishingMark['edges']=[];
    if(!selected.has(`${cell.column},${cell.row-1}`))edges.push('top');
    if(!selected.has(`${cell.column+1},${cell.row}`))edges.push('right');
    if(!selected.has(`${cell.column},${cell.row+1}`))edges.push('bottom');
    if(!selected.has(`${cell.column-1},${cell.row}`))edges.push('left');
    marks.push({...cell,x:(cell.column+.5)*tileSize,y:(cell.row+.5)*tileSize,progress:Math.min(1,amount/cost),stockFraction:order.stock && Number.isFinite(order.stock.amount) && order.stock.capacity>0 ? Math.max(0,Math.min(1,order.stock.amount/order.stock.capacity)) : 0,kind:order.type,edges});
  }
  return marks;
}

/** Existing furnished start rooms, using authoritative footprints and store IDs. */
export function startingFurnishingOrders(world:StartingWorld):FurnishingVisualOrder[] {
  const rooms:FurnishingVisualOrder[]=[];
  const size=world.dimensions.tileSize;
  const footprint=(point:{x:number;y:number})=>world.chamberFootprints?.find(cells=>cells.some(cell=>cell.column===Math.floor(point.x/size)&&cell.row===Math.floor(point.y/size)));
  const add=(type:FurnishingVisualOrder['type'],cells:WorldCellCoordinate[]|undefined,storeId?:string)=>{
    if(!cells?.length)return;
    rooms.push({id:-rooms.length-1,type,cells:cells.map(cell=>({...cell})),storeId,materialRequired:cells.length,installedByCell:cells.map(cell=>({...cell,amount:1}))});
  };
  add('queen',footprint(world.landmarks.queenChamberCenter));
  for(const store of world.storageChambers)add(store.resource,footprint(store.position),store.id);
  for(const room of world.broodChambers??[])add(`brood-${room.specialization}`,room.cells);
  return rooms;
}

// User-selected direction: material-themed surfaces clearly separate from earth.
export const ROOM_APPEARANCE = {
  queen:{inside:0x5a5362,wall:0x978aa2},
  food:{inside:0x5c604c,wall:0xaaa381},
  water:{inside:0x455d64,wall:0x8ba5ae},
  buildingMaterial:{inside:0x4b5666,wall:0x929da9},
  rest:{inside:0x696b70,wall:0xc6c4ba},
  'brood-gathering':{inside:0x4a5d54,wall:0x90a99b},
  'brood-building':{inside:0x50576d,wall:0x929bae},
  'brood-care':{inside:0x66555e,wall:0xaf949e},
  'brood-combat':{inside:0x62515a,wall:0xa18490},
} as const;
