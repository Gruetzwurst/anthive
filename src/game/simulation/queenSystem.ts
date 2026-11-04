import {QUEEN_CONFIG, BROOD_CONFIG,CARE_DEVELOPMENT} from './simulationConfig.ts';
import type {QueenConfig, BroodConfig} from './simulationConfig.ts';
import {SPECIALIZATIONS} from './workforceSystem.ts';
import type {Specialization} from './workforceSystem.ts';
import {nonNegativeFinite, positiveFinite} from './validation.ts';
import type {WorldPoint} from '../world/worldTypes.ts';
import {ROYAL_STAGE_DAYS} from './royalBroodSystem.ts';
import type {RoyalEgg,RoyalBroodSystem} from './royalBroodSystem.ts';

export type EggQuotas = Record<Specialization, number>;
export type BroodRoom = {id: string; specialization: Specialization; capacity: number; operational: boolean; position?: WorldPoint};
export type BirthEvent = {id: string; eggId: string; specialization: Specialization; chamberId: string; position?: WorldPoint};
type ActiveStage = 'egg' | 'larva' | 'pupa';
type Stage = ActiveStage | 'adult' | 'dead';
export type LarvalEnvironment = {syncRooms: (rooms: readonly (BroodRoom & {larvae:number})[]) => void; nextEventDays: () => number; progress: (roomId:string, days:number, care:number) => number};
type ExtraQueen={id:string;roomId:string;position:WorldPoint;progress:number;credits:EggQuotas;operational:boolean};
type Egg = {sourceQueenId:string;id: string; targetSpecialization: Specialization; chamberId: string | null; stage: Stage; stageProgressDays: number;
  arrived:boolean;carrierId:string|null;carried:boolean;origin:WorldPoint|null};
const EPS = 1e-9;

/** Queen, individual brood stages and atomic allocation share one event timeline. */
export class QueenSystem {
  /** Complete internal state, detached from the live simulation; not a HUD snapshot. */
  exportState() { return structuredClone({ additionalQueens:this.additionalQueens,developmentLevel:this.stage,config: this.config, quotas: this.quotas, credits: this.credits, rooms: this.rooms, eggs: this.eggs, buffer: this.buffer, progress: this.progress, eggFactor: this.eggFactor, broodConfig: this.broodConfig, births: this.births, effectiveNurses: this.effectiveNurses, queenOrigin: this.queenOrigin }); }
  restoreState(state: ReturnType<QueenSystem['exportState']>): void {
    const copy = structuredClone(state);
    this.additionalQueens=copy.additionalQueens;this.stage=copy.developmentLevel;
    this.config = copy.config;
    this.quotas = copy.quotas;
    this.credits = copy.credits;
    this.rooms = copy.rooms;
    this.eggs = copy.eggs;
    this.buffer = copy.buffer;
    this.progress = copy.progress;
    this.eggFactor = copy.eggFactor;
    this.broodConfig = copy.broodConfig;
    this.births = copy.births;
    this.effectiveNurses = copy.effectiveNurses;
    this.queenOrigin = copy.queenOrigin;
    this.buffer = copy.buffer.map(egg => this.eggs.find(item => item.id === egg.id)!);
  }

  private config: QueenConfig;
  private quotas: EggQuotas;
  private credits: EggQuotas = {gathering: 0, building: 0, care: 0, combat: 0};
  private rooms = new Map<string, BroodRoom>();
  private eggs: Egg[] = [];
  private buffer: Egg[] = [];
  private progress = 0;
  private eggFactor = 1;
  private broodConfig: BroodConfig;
  private births: BirthEvent[] = [];
  private effectiveNurses = 0;
  private stage=0;
  private additionalQueens=new Map<string,ExtraQueen>();
  private royal?:RoyalBroodSystem;
  setRoyalBrood(royal:RoyalBroodSystem):void{this.royal=royal;}
  get queenCount():number{return 1+this.additionalQueens.size;}
  getQueens(){return [{id:'queen-1',roomId:'starting-queen',position:this.queenOrigin?{...this.queenOrigin}:null,progress:this.progress,operational:true},...[...this.additionalQueens.values()].map(q=>({...q,position:{...q.position},credits:{...q.credits}}))];}
  addQueen(id:string,roomId:string,position:WorldPoint):void{
    if(this.additionalQueens.has(id))return;
    this.additionalQueens.set(id,{id,roomId,position:{...position},progress:0,credits:{gathering:0,building:0,care:0,combat:0},operational:true});
  }
  setQueenOperational(id:string,operational:boolean):void{const q=this.additionalQueens.get(id);if(q)q.operational=operational;}

  layRoyalEgg(id:string,roomId:string):RoyalEgg{
    if(!this.queenOrigin)throw new Error('Königinnen-Ei benötigt eine lebende Quellkönigin im Nest.');
    return {stage:'egg',stageProgressDays:0,id,roomId,sourceQueenId:'queen-1',position:{...this.queenOrigin},carrierId:null,carried:false,arrived:false};
  }
  get developmentStage():number{return this.stage;}
  get broodPerNurse():number{return this.broodConfig.broodPerNurse/BROOD_CONFIG.broodPerNurse*CARE_DEVELOPMENT[this.stage].broodPerNurse;}
  setDevelopmentLevel(level:number):void{
    if(!Number.isInteger(level)||level<0||level>=CARE_DEVELOPMENT.length)throw new RangeError('Invalid care development stage');this.stage=level;
  }
  private queenOrigin: WorldPoint | null = null;

  requireEggTransport(origin:WorldPoint):void {
    if(this.eggs.length)throw new Error('Egg transport must be configured before laying');
    nonNegativeFinite(origin.x,'queen.x');nonNegativeFinite(origin.y,'queen.y');this.queenOrigin={...origin};
  }
  getEggRequests() {
    return this.buffer.filter(egg=>egg.chamberId && !egg.carrierId && this.rooms.get(egg.chamberId)?.operational)
      .flatMap(egg=>{const destination=this.rooms.get(egg.chamberId!)?.position;return destination?[{eggId:egg.id,roomId:egg.chamberId!,position:{...egg.origin!},destination:{...destination}}]:[];});
  }
  claimEgg(id:string,carrierId:string):boolean {
    const egg=this.buffer.find(egg=>egg.id===id);
    if(!carrierId.trim() || !egg?.chamberId || egg.carrierId || !this.rooms.get(egg.chamberId)?.operational)return false;
    egg.carrierId=carrierId;return true;
  }
  pickUpEgg(id:string,carrierId:string):boolean {
    const egg=this.buffer.find(egg=>egg.id===id);if(!egg || egg.carrierId!==carrierId || egg.carried)return false;
    egg.carried=true;return true;
  }
  deliverEgg(id:string,carrierId:string):boolean {
    const egg=this.buffer.find(egg=>egg.id===id);
    if(!egg?.chamberId || egg.carrierId!==carrierId || !egg.carried || !this.rooms.get(egg.chamberId)?.operational)return false;
    egg.arrived=true;egg.carried=false;egg.carrierId=null;egg.origin=null;this.buffer=this.buffer.filter(other=>other!==egg);return true;
  }
  releaseEgg(id:string,carrierId:string,position:WorldPoint):void {
    const egg=this.buffer.find(egg=>egg.id===id);if(!egg || egg.carrierId!==carrierId)return;
    if(egg.carried)egg.origin={...position};egg.carrierId=null;egg.carried=false;
  }

  constructor(config: QueenConfig = QUEEN_CONFIG, broodConfig: BroodConfig = BROOD_CONFIG) {
    for (const days of Object.values(broodConfig.stageDays)) positiveFinite(days, 'stageDays');
    positiveFinite(broodConfig.broodPerNurse, 'broodPerNurse');positiveFinite(broodConfig.minimumCareFactor, 'minimumCareFactor');
    if (broodConfig.minimumCareFactor > 1) throw new RangeError('Minimum care factor must not exceed one');
    this.broodConfig = {...broodConfig, stageDays: {...broodConfig.stageDays}};
    nonNegativeFinite(config.eggsPerGameDay, 'eggsPerGameDay');positiveFinite(config.bufferCapacity, 'bufferCapacity');
    if (!Number.isInteger(config.bufferCapacity)) throw new RangeError('Buffer capacity must be an integer');
    let fill = 0, factor = 1;
    for (const level of config.bufferSlowdown) {
      if (!Number.isFinite(level.fill) || level.fill <= fill || level.fill > 1 || !Number.isFinite(level.factor) || level.factor < 0 || level.factor > factor) throw new RangeError('Invalid egg buffer slowdown');
      fill = level.fill;factor = level.factor;
    }
    this.config = {...config, initialQuotas: {...config.initialQuotas}, bufferSlowdown: config.bufferSlowdown.map(level => ({...level}))};
    this.quotas = {...config.initialQuotas};this.setQuotas(this.quotas);
  }

  setQuotas(quotas: EggQuotas): void {
    for (const kind of SPECIALIZATIONS) if (!Number.isFinite(quotas[kind]) || quotas[kind] < 0 || quotas[kind] > 100) throw new RangeError('Zielanteile müssen zwischen 0 und 100 % liegen');
    if (Math.abs(SPECIALIZATIONS.reduce((sum, kind) => sum + quotas[kind], 0) - 100) > EPS) throw new RangeError('Zielanteile müssen zusammen 100 % ergeben');
    // Reapplying unchanged controls must not reset fractional fairness credits.
    if (SPECIALIZATIONS.every(kind => quotas[kind] === this.quotas[kind])) return;
    this.quotas = {...quotas};this.credits = {gathering: 0, building: 0, care: 0, combat: 0};
    for(const q of this.additionalQueens.values())q.credits={gathering:0,building:0,care:0,combat:0};
  }

  private bufferFactor(sourceQueenId='queen-1'): number {
    const count=this.buffer.filter(e=>e.sourceQueenId===sourceQueenId).length;
    if (count >= this.config.bufferCapacity) return 0;
    let factor = 1;
    for (const level of this.config.bufferSlowdown) if (count / this.config.bufferCapacity >= level.fill) factor = level.factor;
    return factor;
  }

  private syncRooms(rooms: readonly BroodRoom[]): void {
    const ids = new Set<string>();
    for (const room of rooms) {
      if (!room.id.trim() || ids.has(room.id) || !SPECIALIZATIONS.includes(room.specialization) || !Number.isInteger(room.capacity) || room.capacity < 0 || typeof room.operational !== 'boolean') throw new RangeError('Invalid brood room');
      if (this.rooms.has(room.id) && this.rooms.get(room.id)!.specialization !== room.specialization) throw new Error('Brutkammer-Spezialisierung bleibt unverändert');
      ids.add(room.id);
    }
    for (const room of this.rooms.values()) if (!ids.has(room.id)) room.operational = false;
    for (const room of rooms) this.rooms.set(room.id, {...room, position: room.position ? {...room.position} : undefined});
  }

  private occupied(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const egg of this.eggs) if (egg.chamberId && egg.stage !== 'adult' && egg.stage !== 'dead') counts.set(egg.chamberId, (counts.get(egg.chamberId) ?? 0) + 1);
    return counts;
  }

  private allocate(): void {
    if (!this.buffer.length) return;
    const counts = this.occupied(), waiting: Egg[] = [];
    for (const egg of this.buffer) {
      if(this.queenOrigin && egg.chamberId){waiting.push(egg);continue;}
      const candidates = [...this.rooms.values()].filter(room => room.operational && room.specialization === egg.targetSpecialization && (counts.get(room.id) ?? 0) < room.capacity);
      candidates.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0) || a.id.localeCompare(b.id));
      const room = candidates[0];
      if (!room) {waiting.push(egg);continue;}
      egg.chamberId = room.id;egg.arrived=!this.queenOrigin;counts.set(room.id, (counts.get(room.id) ?? 0) + 1);
      if(this.queenOrigin)waiting.push(egg);
    }
    this.buffer = waiting;
  }

  private nextTarget(credits=this.credits): Specialization {
    let best: Specialization | null = null;
    for (const kind of SPECIALIZATIONS) {
      credits[kind] += this.quotas[kind];
      if (this.quotas[kind] > 0 && (best === null || credits[kind] > credits[best] + EPS)) best = kind;
    }
    credits[best!] -= 100;return best!;
  }

  private developing(): Egg[] {
    return this.eggs.filter(egg => egg.arrived && egg.chamberId && egg.stage !== 'adult' && egg.stage !== 'dead' && this.rooms.get(egg.chamberId)?.operational);
  }
  get hasDevelopingBrood(): boolean {return !!this.royal?.hasDevelopingBrood || this.eggs.some(egg => egg.arrived && egg.chamberId && egg.stage !== 'adult' && egg.stage !== 'dead' && this.rooms.get(egg.chamberId)?.operational);}
  getLarvalRooms() {
    const larvae = new Map<string,number>();
    for (const egg of this.eggs) if (egg.chamberId && egg.stage==='larva') larvae.set(egg.chamberId,(larvae.get(egg.chamberId)??0)+1);
    return [...[...this.rooms.values()].map(room => ({...room, position:room.position?{...room.position}:undefined, larvae:larvae.get(room.id)??0})),...this.royal?.getLarvalRooms()??[]];
  }
  private careFactor(count: number): number {
    count+=2*(this.royal?.getDevelopingBrood().length??0);
    return count ? Math.max(this.broodConfig.minimumCareFactor, Math.min(1, this.effectiveNurses * this.broodPerNurse / count)) : 1;
  }
  loseLarvae(roomId: string, count: number): void {
    if (!Number.isInteger(count) || count < 0) throw new RangeError('Invalid larval loss count');
    for (const egg of this.eggs) if (count && egg.arrived && egg.chamberId === roomId && egg.stage === 'larva') {
      egg.stage = 'dead';count--;
    }
  }
  drainBirths(): BirthEvent[] {const births = this.births;this.births = [];return births.map(birth => ({...birth, position: birth.position ? {...birth.position} : undefined}));}

  advance(gameDays: number, eggFactor: number, rooms: readonly BroodRoom[], effectiveNurses = 0, onBroodInterval?: (gameDays:number)=>void, environment?: LarvalEnvironment): void {
    nonNegativeFinite(gameDays, 'gameDays');nonNegativeFinite(eggFactor, 'eggFactor');
    nonNegativeFinite(effectiveNurses, 'effectiveNurses');this.effectiveNurses = effectiveNurses;
    if (eggFactor > 1) throw new RangeError('Egg factor must not exceed one');
    this.syncRooms(rooms);this.eggFactor = eggFactor;this.allocate();
    let remaining = gameDays;
    while (remaining > EPS) {
      const rate = this.config.eggsPerGameDay * eggFactor * this.bufferFactor();
      const developing = this.developing(), factor = this.careFactor(developing.length);
      const royals=this.royal?.getDevelopingBrood()??[],demand=developing.length+royals.length*2;
      const royalCare=demand?Math.min(1,this.effectiveNurses*this.broodPerNurse/demand):1;
      const extraRates=[...this.additionalQueens.values()].map(q=>({q,rate:q.operational?this.config.eggsPerGameDay*eggFactor*this.bufferFactor(q.id):0}));
      const untilEgg = rate > 0 ? (1 - this.progress) / rate : Infinity;
      environment?.syncRooms(this.getLarvalRooms());
      let step = Math.min(remaining, untilEgg, ...extraRates.map(({q,rate})=>rate>0?(1-q.progress)/rate:Infinity), environment?.nextEventDays() ?? Infinity);
      const increment = (egg: Egg, days: number) => egg.stage === 'larva' && environment
        ? environment.progress(egg.chamberId!, days, factor) : days * factor;
      for (const egg of developing) {
        const needed = Math.max(0, this.broodConfig.stageDays[egg.stage as ActiveStage] - egg.stageProgressDays);
        if (increment(egg, step) < needed) continue;
        if (egg.stage !== 'larva' || !environment) step = Math.min(step, needed / factor);
        else {
          let low = 0, high = step;
          for (let i = 0; i < 48; i++) {const middle = (low + high) / 2;if (increment(egg, middle) < needed) low = middle;else high = middle;}
          step = high;
        }
      }
      const royalIncrement=(egg:RoyalEgg,days:number)=>egg.stage==='larva'&&environment?environment.progress(egg.roomId,days,royalCare):days*royalCare;
      for(const egg of royals){
        const needed=Math.max(0,ROYAL_STAGE_DAYS[egg.stage as keyof typeof ROYAL_STAGE_DAYS]-egg.stageProgressDays);
        if(royalIncrement(egg,step)<needed)continue;
        let low=0,high=step;
        for(let i=0;i<48;i++){const middle=(low+high)/2;if(royalIncrement(egg,middle)<needed)low=middle;else high=middle;}
        step=high;
      }
      const royalIncrements=royals.map(egg=>royalIncrement(egg,step));
      const increments = developing.map(egg => increment(egg, step));
      if (step>0) onBroodInterval?.(step);
      this.progress += step * rate;
      for(const {q,rate:extraRate}of extraRates)q.progress+=step*extraRate;
      for (const [index, egg] of developing.entries()) egg.stageProgressDays += increments[index];
      remaining = Math.max(0, remaining - step);
      for (const egg of developing) {
        if (egg.stage === 'dead') continue;
        if (egg.stageProgressDays + EPS < this.broodConfig.stageDays[egg.stage as ActiveStage]) continue;
        egg.stageProgressDays = 0;
        egg.stage = egg.stage === 'egg' ? 'larva' : egg.stage === 'larva' ? 'pupa' : 'adult';
        if (egg.stage === 'adult') {
          const room = this.rooms.get(egg.chamberId!)!;
          this.births.push({id: `born-${egg.id}`, eggId: egg.id, chamberId: egg.chamberId!, specialization: room.specialization, position: room.position ? {...room.position} : undefined});
        }
      }
      for(const [index,egg]of royals.entries())this.royal!.advanceDevelopment(egg.id,royalIncrements[index]);
      this.allocate();
      if (rate > 0 && this.progress >= 1 - EPS) {
        this.progress = 0;
        this.layWorkerEgg('queen-1',this.queenOrigin,this.credits);
      }
      for(const {q,rate:extraRate}of extraRates)if(extraRate>0&&q.progress>=1-EPS){q.progress=0;this.layWorkerEgg(q.id,q.position,q.credits);}

    }
  }

  private layWorkerEgg(sourceQueenId:string,origin:WorldPoint|null,credits:EggQuotas):void{
    const egg:Egg={id:`egg-${this.eggs.length+1}`,sourceQueenId,targetSpecialization:this.nextTarget(credits),chamberId:null,stage:'egg',stageProgressDays:0,
      arrived:!origin,carrierId:null,carried:false,origin:origin?{...origin}:null};
    this.eggs.push(egg);this.buffer.push(egg);this.allocate();
  }

  get snapshot() {
    const counts = this.occupied(), bufferRateFactor = this.bufferFactor(), developing = this.developing();
    const queens=this.getQueens().map(q=>{
      const rate=q.operational?this.config.eggsPerGameDay*this.eggFactor*this.bufferFactor(q.id):0;
      return {...q,bufferCount:this.buffer.filter(e=>e.sourceQueenId===q.id).length,bufferCapacity:this.config.bufferCapacity,
        effectiveEggsPerDay:rate,daysUntilNextEgg:rate>0?(1-q.progress)/rate:null};
    });
    const nextEgg=Math.min(...queens.map(q=>q.daysUntilNextEgg??Infinity));
    const bornCount = this.eggs.filter(egg => egg.stage === 'adult').length;
    const lostCount = this.eggs.filter(egg => egg.stage === 'dead').length;
    const stageCounts = {egg: 0, larva: 0, pupa: 0};
    for (const egg of this.eggs) if (egg.arrived && egg.chamberId && egg.stage !== 'adult' && egg.stage !== 'dead') stageCounts[egg.stage]++;
    return {
      queenCount:this.queenCount,queens,
      laidEggs: this.eggs.length, bufferCount: this.buffer.length, bufferCapacity: this.config.bufferCapacity*this.queenCount,
      assignedCount: this.eggs.length - this.buffer.length - bornCount - lostCount, bornCount, lostCount, stageCounts, layingProgress: this.progress,
      broodPerNurse:this.broodPerNurse,careCapacity: this.effectiveNurses * this.broodPerNurse, careFactor: this.careFactor(developing.length),
      eggFactor: this.eggFactor, bufferRateFactor, effectiveEggsPerDay: queens.reduce((sum,q)=>sum+q.effectiveEggsPerDay,0),
      daysUntilNextEgg: Number.isFinite(nextEgg)?nextEgg:null,
      quotas: {...this.quotas},
      eggs: this.eggs.map(egg => ({...egg, origin:egg.origin?{...egg.origin}:null,specialization: egg.arrived && egg.chamberId ? this.rooms.get(egg.chamberId)!.specialization : null,
        developmentProgress: egg.stage === 'adult' ? 1 : egg.stage === 'dead' ? 0 : egg.stageProgressDays / this.broodConfig.stageDays[egg.stage]})),
      chambers: [...this.rooms.values()].map(room => ({...room, position: room.position ? {...room.position} : undefined, occupied: counts.get(room.id) ?? 0})),
    };
  }
}
export type QueenSnapshot = QueenSystem['snapshot'];
