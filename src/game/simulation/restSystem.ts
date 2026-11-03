import type { WorldPoint, WorldCellCoordinate } from '../world/worldTypes.ts';
import type { GatheringNavigation } from '../world/collectorNavigation.ts';

export const REST_CONFIG = { minimumArea: 16, placesPerCell: 2, activeConsumptionFactor: 1, outsideConsumptionFactor: .8, occupiedConsumptionFactor: .5, speed: 78 };
export type RestChamber = {id: string; cells: WorldCellCoordinate[]; operational: boolean};
export type RestSnapshot = {roomId: string; spotId: string; occupied: boolean};
type Reservation = RestSnapshot & {position: WorldPoint; target: WorldPoint; path: WorldPoint[]; index: number};
type IdleWorker = {id: string; position: WorldPoint};
const distance = (a: WorldPoint,b: WorldPoint) => Math.hypot(a.x-b.x,a.y-b.y);

/** Rest owns places and walking paths only; the work engines retain every ant. */
export class RestSystem {
  /** Complete internal state, detached from the live simulation; not a HUD snapshot. */
  exportState() { return structuredClone({ reservations: this.reservations, tileSize: this.tileSize }); }
  restoreState(state: ReturnType<RestSystem['exportState']>): void {
    const copy = structuredClone(state);
    this.reservations = copy.reservations;
    this.tileSize = copy.tileSize;
  }

  private reservations = new Map<string, Reservation>();
  private navigation: GatheringNavigation;
  private tileSize: number;
  constructor(navigation: GatheringNavigation, tileSize: number) {this.navigation=navigation;this.tileSize=tileSize;}
  get size(): number {return this.reservations.size;}
  release(id: string): void {this.reservations.delete(id);}
  get(id: string): RestSnapshot | undefined {
    const entry=this.reservations.get(id);
    return entry ? {roomId:entry.roomId,spotId:entry.spotId,occupied:entry.occupied} : undefined;
  }
  advance(seconds: number, chambers: RestChamber[], idle: IdleWorker[], move: (id:string,position:WorldPoint)=>boolean): void {
    const spots=new Map<string,{roomId:string;position:WorldPoint}>();
    for(const room of chambers) {
      const cells=[...new Map(room.cells.map(cell=>[`${cell.column},${cell.row}`,cell])).values()];
      if(!room.operational || cells.length<REST_CONFIG.minimumArea)continue;
      for(const cell of cells)for(let i=0;i<REST_CONFIG.placesPerCell;i++) {
        const spotId=`${room.id}:${cell.column},${cell.row}:${i}`;
        spots.set(spotId,{roomId:room.id,position:{x:(cell.column+(i===0?.35:.65))*this.tileSize,y:(cell.row+.5)*this.tileSize}});
      }
    }
    const eligible=new Map(idle.map(worker=>[worker.id,worker]));
    for(const [id,reservation] of this.reservations) {
      const worker=eligible.get(id);
      if(!worker || distance(worker.position,reservation.position)>1e-7 || !spots.has(reservation.spotId) || !this.navigation.findPath(worker.position,reservation.target))this.release(id);
    }
    const taken=new Set([...this.reservations.values()].map(reservation=>reservation.spotId));
    for(const worker of idle) {
      let entry=this.reservations.get(worker.id);
      if(!entry) {
        let best: {spotId:string;roomId:string;position:WorldPoint;path:WorldPoint[];cost:number}|undefined;
        for(const [spotId,spot] of spots) {
          if(taken.has(spotId))continue;
          const path=this.navigation.findPath(worker.position,spot.position);if(!path)continue;
          const cost=this.navigation.travelSeconds?.(path,REST_CONFIG.speed) ?? path.reduce((sum,p,i)=>sum+(i?distance(path[i-1],p):0),0);
          if(!best || cost<best.cost)best={spotId,...spot,path,cost};
        }
        if(!best)continue;
        entry={roomId:best.roomId,spotId:best.spotId,occupied:false,position:{...worker.position},target:best.position,path:best.path,index:0};
        this.reservations.set(worker.id,entry);taken.add(entry.spotId);
      }
      if(!move(worker.id,entry.position)){this.release(worker.id);continue;}
      let remaining=seconds;
      while(!entry.occupied && remaining>0) {
        const target=entry.path[entry.index];
        if(!target){entry.occupied=true;break;}
        if(!this.navigation.canMove(entry.position,target)){this.release(worker.id);break;}
        const length=distance(entry.position,target);
        const speed=REST_CONFIG.speed*Math.min(this.navigation.speedFactor?.(entry.position)??1,this.navigation.speedFactor?.(target)??1);
        if(speed<=0)break;
        const spent=Math.min(remaining,length/speed),fraction=length?Math.min(1,spent*speed/length):1;
        const position={x:entry.position.x+(target.x-entry.position.x)*fraction,y:entry.position.y+(target.y-entry.position.y)*fraction};
        if(!move(worker.id,position)){this.release(worker.id);break;}
        entry.position=position;remaining-=spent;
        if(fraction>=1-1e-9){entry.index++;if(entry.index>=entry.path.length)entry.occupied=true;}
      }
    }
  }
}
