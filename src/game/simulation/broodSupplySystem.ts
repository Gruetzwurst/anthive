import type {WorldPoint} from '../world/worldTypes.ts';
import type {GatheringNavigation} from '../world/collectorNavigation.ts';
import type {ResourceAmount} from './resourceTypes.ts';
import type {BroodRoom,QueenSystem} from './queenSystem.ts';
import type {ResourceSystem} from './resourceSystem.ts';
import {LARVAL_SUPPLY_CONFIG} from './simulationConfig.ts';
import type {LarvalSupplyConfig} from './simulationConfig.ts';
import {nonNegativeFinite, positiveFinite} from './validation.ts';

type Kind = 'food' | 'water';
const KINDS: Kind[] = ['food', 'water'], EPS = 1e-9;
export type LarvalRoom = BroodRoom & {larvae: number};
type Stock = {amount: number; target: number; capacity: number; refilling: boolean; consumed: number; unmet: number};
type Room = LarvalRoom & Record<Kind, Stock>;
type Job = {kind: 'pickup' | 'delivery' | 'return' | 'eggPickup' | 'eggDelivery'; phase: 'walking' | 'interaction';
  path: WorldPoint[]; index: number; progress: number; amount: number; resource?: Kind; roomId?: string; storeId?: string;eggId?:string};
type Nurse = {id: string; position: WorldPoint; load: ResourceAmount | null;eggId:string|null; targetRoomId?: string; enabled: boolean; job: Job | null; retry: number};
type Drop = {id: string; position: WorldPoint; load: ResourceAmount};
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x-b.x, a.y-b.y);
const empty = (): Stock => ({amount: 0, target: 0, capacity: 0, refilling: false, consumed: 0, unmet: 0});

/** Small private larval reservoirs and physical nurse deliveries, not general stores. */
export class BroodSupplySystem {
  private resources: ResourceSystem;
  private navigation: GatheringNavigation;
  private config: LarvalSupplyConfig;
  private rooms = new Map<string, Room>();
  private nurses = new Map<string, Nurse>();
  private drops: Drop[] = [];
  private withdrawn = {food: 0, water: 0};
  private returned = {food: 0, water: 0};
  private eggTransport?: QueenSystem;
  setEggTransport(queen:QueenSystem):void {this.eggTransport=queen;}
  constructor(resources: ResourceSystem, navigation: GatheringNavigation, config: LarvalSupplyConfig = LARVAL_SUPPLY_CONFIG) {
    for (const key of ['reserveDays','carryCapacity','speed','interactionSeconds','retrySeconds','maxStepSeconds'] as const) positiveFinite(config[key], key);
    for (const kind of KINDS) nonNegativeFinite(config.perLarvaPerDay[kind], kind);
    nonNegativeFinite(config.refillFraction, 'refillFraction');if (config.refillFraction > 1) throw new RangeError('Invalid refill fraction');
    this.resources = resources;this.navigation = navigation;this.config = {...config, perLarvaPerDay: {...config.perLarvaPerDay}};
  }
  syncRooms(definitions: readonly LarvalRoom[]): void {
    const ids = new Set<string>();
    for (const definition of definitions) {
      if (!definition.id.trim() || ids.has(definition.id) || !Number.isInteger(definition.larvae) || definition.larvae < 0 || !Number.isInteger(definition.capacity) || definition.capacity < definition.larvae || typeof definition.operational !== 'boolean') throw new RangeError('Invalid larval room');
      ids.add(definition.id);
    }
    for (const room of this.rooms.values()) if (!ids.has(room.id)) room.operational = false;
    for (const definition of definitions) {
      let room = this.rooms.get(definition.id);
      if (!room) {room = {...definition, food: empty(), water: empty()};this.rooms.set(room.id, room);}
      Object.assign(room, {id:definition.id,specialization:definition.specialization,larvae:definition.larvae,capacity:definition.capacity,
        operational:definition.operational,position:definition.position?{...definition.position}:undefined});
      for (const kind of KINDS) {
        room[kind].target = definition.larvae * this.config.perLarvaPerDay[kind] * this.config.reserveDays;
        room[kind].capacity = definition.capacity * this.config.perLarvaPerDay[kind] * this.config.reserveDays;
        this.refreshRefill(room[kind]);
      }
    }
  }
  private refreshRefill(stock: Stock): void {
    if (stock.target <= EPS || stock.amount >= stock.target-EPS) stock.refilling = false;
    else if (stock.amount <= stock.target * this.config.refillFraction + EPS) stock.refilling = true;
  }
  private inTransit(roomId: string, resource: Kind): number {
    let amount = 0;
    for (const nurse of this.nurses.values()) {
      if (nurse.load?.resource === resource && nurse.targetRoomId === roomId) amount += nurse.load.amount;
      else if (!nurse.load && nurse.job?.kind === 'pickup' && nurse.job.roomId === roomId && nurse.job.resource === resource) amount += nurse.job.amount;
    }
    return amount;
  }
  getRooms() {
    return [...this.rooms.values()].map(room => ({...room, position: room.position ? {...room.position} : undefined,
      food: {...room.food, inTransit: this.inTransit(room.id,'food')}, water: {...room.water, inTransit: this.inTransit(room.id,'water')}}));
  }
  consume(gameDays: number, rooms: readonly LarvalRoom[]): void {
    nonNegativeFinite(gameDays, 'gameDays');this.syncRooms(rooms);
    for (const room of this.rooms.values()) if (room.operational) for (const kind of KINDS) {
      const requested = room.larvae * this.config.perLarvaPerDay[kind] * gameDays;
      const amount = Math.min(room[kind].amount, requested);
      room[kind].amount -= amount;room[kind].consumed += amount;room[kind].unmet += requested - amount;this.refreshRefill(room[kind]);
    }
  }
  addNurse(id: string, position: WorldPoint): void {
    if (!id.trim() || this.nurses.has(id)) throw new Error('Nurse requires a unique ID');
    nonNegativeFinite(position.x, 'position.x');nonNegativeFinite(position.y, 'position.y');
    this.nurses.set(id, {id, position: {...position}, load: null,eggId:null, enabled: true, job: null, retry: 0});
  }
  setNursingEnabled(id: string, enabled: boolean): void {
    const nurse = this.nurses.get(id);if (!nurse) throw new Error('Unknown nurse');
    nurse.enabled = enabled;
    if (!enabled && !nurse.load && !nurse.eggId && nurse.job?.phase === 'walking') {
      if(nurse.job.eggId)this.eggTransport?.releaseEgg(nurse.job.eggId,id,nurse.position);
      nurse.job = null;
    }
    if (!enabled) nurse.retry = 0;
  }
  removeNurse(id: string): void {
    const nurse = this.nurses.get(id);if (!nurse) return;
    if (nurse.load) this.drops.push({id: `care-drop-${this.drops.length+1}`, position: {...nurse.position}, load: {...nurse.load}});
    const eggId=nurse.eggId??nurse.job?.eggId;if(eggId)this.eggTransport?.releaseEgg(eggId,id,nurse.position);
    this.nurses.delete(id);
  }
  getNurses() {
    return [...this.nurses.values()].map(nurse => ({id: nurse.id, position: {...nurse.position}, load: nurse.load ? {...nurse.load} : null,
      eggId:nurse.eggId,readyToLeave: !nurse.load && !nurse.eggId && !nurse.job, active: !!nurse.job, job: nurse.job ? {kind: nurse.job.kind, phase: nurse.job.phase, resource: nurse.job.resource, roomId: nurse.job.roomId, storeId: nurse.job.storeId} : null}));
  }
  getDroppedLoads(): Drop[] {return this.drops.map(drop => ({...drop, position: {...drop.position}, load: {...drop.load}}));}
  get balance() {
    const result = {} as Record<Kind, {withdrawn: number; atChambers: number; carried: number; consumed: number; dropped: number; returned: number}>;
    for (const kind of KINDS) result[kind] = {withdrawn: this.withdrawn[kind], returned: this.returned[kind],
      atChambers: [...this.rooms.values()].reduce((s,r) => s+r[kind].amount,0), consumed: [...this.rooms.values()].reduce((s,r) => s+r[kind].consumed,0),
      carried: [...this.nurses.values()].reduce((s,n) => s+(n.load?.resource===kind?n.load.amount:0),0), dropped: this.drops.reduce((s,d) => s+(d.load.resource===kind?d.load.amount:0),0)};
    return result;
  }
  private travel(path: WorldPoint[]): number {return this.navigation.travelSeconds?.(path,this.config.speed) ?? path.reduce((s,p,i) => s+(i?distance(path[i-1],p)/this.config.speed:0),0);}
  private start(kind: Job['kind'], path: WorldPoint[], resource: Kind|undefined, amount: number, roomId?: string, storeId?: string): Job {
    return {kind,path,index:0,phase:'walking',progress:0,resource,amount,roomId,storeId};
  }
  private assign(nurse: Nurse): boolean {
    if(nurse.eggId){
      const room=this.eggTransport?.snapshot.chambers.find(room=>room.id===nurse.targetRoomId);
      const path=room?.operational&&room.position?this.navigation.findPath(nurse.position,room.position):null;
      if(!path)return false;nurse.job={...this.start('eggDelivery',path,undefined,1,room!.id),eggId:nurse.eggId};return true;
    }
    if (nurse.load) {
      const resource = nurse.load.resource as Kind, room = this.rooms.get(nurse.targetRoomId ?? '');
      const path = room?.operational && room.position && room[resource].capacity-room[resource].amount > EPS ? this.navigation.findPath(nurse.position,room.position) : null;
      if (path) {nurse.job = this.start('delivery',path,resource,nurse.load.amount,room!.id);return true;}
      const choices = this.resources.listStores().filter(s => s.resource===resource && s.status==='operational' && s.reachable && s.capacity-s.amount>EPS)
        .map(store => ({store,path:this.navigation.findPath(nurse.position,store.position)})).filter(c => c.path!==null).sort((a,b) => this.travel(a.path!)-this.travel(b.path!) || a.store.id.localeCompare(b.store.id));
      if (choices[0]) {nurse.job = this.start('return',choices[0].path!,resource,nurse.load.amount,undefined,choices[0].store.id);return true;}return false;
    }
    if (!nurse.enabled) return false;
    const choices: Array<{room: Room;resource: Kind;storeId: string;amount: number;path: WorldPoint[];coverage: number;cost: number}> = [];
    for (const room of this.rooms.values()) if (room.operational && room.position) for (const resource of KINDS) {
      const stock = room[resource], inFlight = this.inTransit(room.id,resource), need = stock.target-stock.amount-inFlight;
      if (!stock.refilling || need<=EPS) continue;
      for (const store of this.resources.listStores()) {
        if (store.resource!==resource || store.status!=='operational' || !store.reachable) continue;
        const reserved = [...this.nurses.values()].reduce((s,n) => s+(!n.load && n.job?.kind==='pickup' && n.job.storeId===store.id?n.job.amount:0),0);
        const amount = Math.min(this.config.carryCapacity,need,store.amount-reserved);if (amount<=EPS) continue;
        const path = this.navigation.findPath(nurse.position,store.position), delivery = this.navigation.findPath(store.position,room.position);
        if (path && delivery) choices.push({room,resource,storeId:store.id,amount,path,coverage:(stock.amount+inFlight)/stock.target,cost:this.travel(path)+this.travel(delivery)});
      }
    }
    choices.sort((a,b) => a.coverage-b.coverage || a.cost-b.cost || a.room.id.localeCompare(b.room.id) || a.resource.localeCompare(b.resource) || a.storeId.localeCompare(b.storeId));
    const choice = choices[0];if (!choice) {
      const eggs=this.eggTransport?.getEggRequests().map(request=>({request,path:this.navigation.findPath(nurse.position,request.position),delivery:this.navigation.findPath(request.position,request.destination)}))
        .filter(candidate=>candidate.path&&candidate.delivery).sort((a,b)=>this.travel(a.path!)+this.travel(a.delivery!)-this.travel(b.path!)-this.travel(b.delivery!) || a.request.eggId.localeCompare(b.request.eggId));
      for(const egg of eggs??[])if(this.eggTransport!.claimEgg(egg.request.eggId,nurse.id)){
        nurse.job={...this.start('eggPickup',egg.path!,undefined,1,egg.request.roomId),eggId:egg.request.eggId};return true;
      }
      return false;
    }
    nurse.job = this.start('pickup',choice.path,choice.resource,choice.amount,choice.room.id,choice.storeId);return true;
  }
  private finish(nurse: Nurse, job: Job): void {
    if(job.kind==='eggPickup' || job.kind==='eggDelivery'){
      if(job.kind==='eggPickup'){
        if(this.eggTransport?.pickUpEgg(job.eggId!,nurse.id)){nurse.eggId=job.eggId!;nurse.targetRoomId=job.roomId;}
        else this.eggTransport?.releaseEgg(job.eggId!,nurse.id,nurse.position);
      }else if(this.eggTransport?.deliverEgg(job.eggId!,nurse.id)){nurse.eggId=null;nurse.targetRoomId=undefined;}
      nurse.job=null;return;
    }
    const resource=job.resource!;
    if (job.kind==='pickup') {
      const room = this.rooms.get(job.roomId!);
      const need = room?.operational ? Math.max(0,room[resource].target-room[resource].amount-this.inTransit(room.id,resource)+job.amount) : 0;
      const load = this.resources.takeFromStore(job.storeId!,Math.min(job.amount,need));
      if (load.amount>EPS) {nurse.load=load;nurse.targetRoomId=job.roomId;this.withdrawn[resource]+=load.amount;}
    } else if (job.kind==='delivery' && nurse.load) {
      const room = this.rooms.get(job.roomId!);
      if (room?.operational) {const stock=room[resource],amount=Math.min(nurse.load.amount,Math.max(0,stock.capacity-stock.amount));stock.amount+=amount;nurse.load.amount-=amount;this.refreshRefill(stock);}
    } else if (job.kind==='return' && nurse.load) {
      const amount=this.resources.depositInStore(job.storeId!,nurse.load);nurse.load.amount-=amount;this.returned[resource]+=amount;
    }
    if (nurse.load && nurse.load.amount<=EPS) {nurse.load=null;nurse.targetRoomId=undefined;}
    nurse.job=null;
  }
  advanceWorkers(seconds: number, workFactor=1, efficiency: (id: string)=>number=()=>1): void {
    nonNegativeFinite(seconds,'seconds');nonNegativeFinite(workFactor,'workFactor');if (workFactor>1) throw new RangeError('Invalid work factor');
    const slices=Math.ceil(seconds/this.config.maxStepSeconds),step=slices?seconds/slices:0;
    for (let i=0;i<slices;i++) for (const nurse of this.nurses.values()) {
      const individual=efficiency(nurse.id);positiveFinite(individual,'efficiency');if (individual>1) throw new RangeError('Invalid nurse efficiency');
      let remaining=step*workFactor*individual;
      while (remaining>EPS) {
        if (nurse.retry>0) {const spent=Math.min(remaining,nurse.retry);remaining-=spent;nurse.retry-=spent;if(remaining<=EPS)break;}
        if (!nurse.job && !this.assign(nurse)) {nurse.retry=this.config.retrySeconds;break;}
        const job=nurse.job!;
        if (job.phase==='walking') {
          const target=job.path[job.index];if (!target) {job.phase='interaction';continue;}
          if (!this.navigation.canMove(nurse.position,target)) {nurse.job=null;nurse.retry=this.config.retrySeconds;break;}
          const speed=this.config.speed*Math.min(this.navigation.speedFactor?.(nurse.position)??1,this.navigation.speedFactor?.(target)??1);
          const length=distance(nurse.position,target),spent=Math.min(remaining,length/speed),fraction=length>0?Math.min(1,spent*speed/length):1;
          nurse.position.x+=(target.x-nurse.position.x)*fraction;nurse.position.y+=(target.y-nurse.position.y)*fraction;remaining-=spent;
          if(fraction>=1-EPS){nurse.position={...target};job.index++;}
        } else {const spent=Math.min(remaining,this.config.interactionSeconds-job.progress);remaining-=spent;job.progress+=spent;if(job.progress>=this.config.interactionSeconds-EPS)this.finish(nurse,job);}
      }
    }
  }
}
