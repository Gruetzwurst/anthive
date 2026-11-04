import type {WorldPoint,WorldCellCoordinate} from '../world/worldTypes.ts';
import type {BroodRoom,QueenSystem} from './queenSystem.ts';
import type {EggTransport,EggRequest} from './eggTransport.ts';
export const queenLimitForPopulation=(peak:number)=>peak>=1000?5:peak>=500?4:peak>=150?3:peak>=50?2:1;
export type RoyalRoom={id:number;cells:readonly WorldCellCoordinate[];operational:boolean};
export const ROYAL_STAGE_DAYS={egg:.2,larva:.6,pupa:.4} as const;
export type RoyalEgg={stage: keyof typeof ROYAL_STAGE_DAYS | 'adult';stageProgressDays:number;id:string;roomId:string;sourceQueenId:string;position:WorldPoint;carrierId:string|null;carried:boolean;arrived:boolean};
export function royalRoomPosition(cells:readonly WorldCellCoordinate[],size:number):WorldPoint{
 const x=cells.reduce((s,c)=>s+c.column,0)/cells.length,y=cells.reduce((s,c)=>s+c.row,0)/cells.length;
 const cell=cells.reduce((a,b)=>Math.abs(b.column-x)+Math.abs(b.row-y)<Math.abs(a.column-x)+Math.abs(a.row-y)?b:a);
 return {x:(cell.column+.5)*size,y:(cell.row+.5)*size};
}
export class RoyalBroodSystem implements EggTransport {
 private rooms=new Map<string,{id:string;orderId:number;position:WorldPoint;operational:boolean;produced:boolean}>();
 private eggs=new Map<string,RoyalEgg>();
 private queen:QueenSystem;private populationPeak:()=>number;private tileSize:number;
 constructor(queen:QueenSystem,populationPeak:()=>number,tileSize:number){this.queen=queen;this.populationPeak=populationPeak;this.tileSize=tileSize;}
 get adultCount(){return [...this.eggs.values()].filter(e=>e.stage==='adult').length;}
 get hasDevelopingBrood(){return this.getDevelopingBrood().length>0;}
 getDevelopingBrood(){return [...this.eggs.values()].filter(e=>e.arrived&&e.stage!=='adult'&&this.rooms.get(e.roomId)?.operational);}
 getLarvalRooms():(BroodRoom & {larvae:number;royal:true})[]{return [...this.rooms.values()].map(r=>({id:r.id,specialization:'care',capacity:1,operational:r.operational,position:{...r.position},royal:true,larvae:[...this.eggs.values()].some(e=>e.roomId===r.id&&e.arrived&&e.stage==='larva')?1:0}));}
 advanceDevelopment(id:string,days:number):void{
  const e=this.eggs.get(id);if(!e||e.stage==='adult')return;
  e.stageProgressDays+=days;
  if(e.stageProgressDays+1e-9<ROYAL_STAGE_DAYS[e.stage])return;
  e.stageProgressDays=0;e.stage=e.stage==='egg'?'larva':e.stage==='larva'?'pupa':'adult';
  if(e.stage==='adult')this.queen.addQueen(`queen-room-${this.rooms.get(e.roomId)!.orderId}`,e.roomId,e.position);
 }
 get maxQueens(){return queenLimitForPopulation(this.populationPeak());}
 exportState(){return structuredClone({rooms:this.rooms,eggs:this.eggs});}
 restoreState(state:ReturnType<RoyalBroodSystem['exportState']>){const copy=structuredClone(state);this.rooms=copy.rooms;this.eggs=copy.eggs;}
 syncRooms(rooms:readonly RoyalRoom[]):void{
  for(const room of this.rooms.values()){room.operational=false;this.queen.setQueenOperational(`queen-room-${room.orderId}`,false);}
  for(const room of rooms){
   if(!room.cells.length)continue;
   const id=`built-${room.id}`;
   const record={id,orderId:room.id,position:royalRoomPosition(room.cells,this.tileSize),operational:room.operational,produced:this.rooms.get(id)?.produced??false};
   this.rooms.set(id,record);
   this.queen.setQueenOperational(`queen-room-${room.id}`,record.operational);
   const eggId=`royal-${room.id}`;
   if(record.operational&&!record.produced&&!this.eggs.has(eggId)&&this.eggs.size<this.maxQueens-1){
    this.eggs.set(eggId,this.queen.layRoyalEgg(eggId,id));
    record.produced=true;
   }
  }
 }
 get snapshot(){return {chambers:[...this.rooms.values()].map(r=>({...r,position:{...r.position}}))};}
 getEggs(){return [...this.eggs.values()].map(e=>({...e,position:{...e.position}}));}
 getEggRequests():EggRequest[]{return [...this.eggs.values()].flatMap(e=>{
  const room=this.rooms.get(e.roomId);return !e.arrived&&!e.carrierId&&room?.operational?[{eggId:e.id,roomId:e.roomId,position:{...e.position},destination:{...room.position}}]:[];
 });}
 claimEgg(id:string,carrier:string):boolean{const e=this.eggs.get(id);if(!e||e.arrived||e.carrierId||!this.rooms.get(e.roomId)?.operational||!carrier)return false;e.carrierId=carrier;return true;}
 pickUpEgg(id:string,carrier:string):boolean{const e=this.eggs.get(id);if(!e||e.arrived||e.carried||e.carrierId!==carrier)return false;e.carried=true;return true;}
 deliverEgg(id:string,carrier:string):boolean{const e=this.eggs.get(id),room=e&&this.rooms.get(e.roomId);if(!e||!e.carried||e.carrierId!==carrier||!room?.operational)return false;e.arrived=true;e.carried=false;e.carrierId=null;e.position={...room.position};return true;}
 releaseEgg(id:string,carrier:string,position?:WorldPoint):void{const e=this.eggs.get(id);if(!e||e.arrived||e.carrierId!==carrier)return;if(e.carried&&position)e.position={...position};e.carried=false;e.carrierId=null;}
}
