import {LARVAL_SHORTAGE_CONFIG} from './simulationConfig.ts';
import type {LarvalShortageConfig} from './simulationConfig.ts';
import {nonNegativeFinite, positiveFinite} from './validation.ts';
const EPS=1e-10;
type State={larvae:number;coverage:number;shortageDays:number;severeDays:number;nonSevereDays:number;restoredDays:number;
  recoveryStart:number;lossCredit:number;losses:number;warnings:number};
export type LarvalLoss={roomId:string;count:number};

/** Per-room history; no resources or independent clock live here. */
export class LarvalShortageSystem {
  private rooms=new Map<string,State>();
  private config:LarvalShortageConfig;
  constructor(config:LarvalShortageConfig=LARVAL_SHORTAGE_CONFIG){
    for(const key of ['warningDays','recoveryDays','minimumFactor','severeGraceDays'] as const)positiveFinite(config[key],key);
    for(const key of ['severeCoverageBelow','lossFractionPerDay'] as const)nonNegativeFinite(config[key],key);
    if(config.minimumFactor>1 || config.severeCoverageBelow>1 || config.lossFractionPerDay>1)throw new RangeError('Invalid larval shortage config');
    this.config={...config};
  }
  observe(id:string,larvae:number,foodCoverage:number,waterCoverage:number):void {
    if(!id || !Number.isInteger(larvae) || larvae<0)throw new RangeError('Invalid larvae');
    for(const coverage of [foodCoverage,waterCoverage])if(!Number.isFinite(coverage)||coverage<0||coverage>1)throw new RangeError('Invalid coverage');
    let s=this.rooms.get(id);
    if(!s){s={larvae:0,coverage:1,shortageDays:0,severeDays:0,nonSevereDays:0,restoredDays:0,recoveryStart:1,lossCredit:0,losses:0,warnings:0};this.rooms.set(id,s);}
    const before=this.factor(s),coverage=larvae?Math.min(foodCoverage,waterCoverage):1;
    if(!larvae){s.shortageDays=0;s.severeDays=0;s.nonSevereDays=0;s.restoredDays=0;s.recoveryStart=1;s.lossCredit=0;}
    else if(coverage<1-EPS){
      if(s.coverage>=1-EPS && s.shortageDays<=EPS)s.warnings++;
      s.restoredDays=0;
    }else if(s.coverage<1-EPS){s.recoveryStart=before;s.restoredDays=0;}
    if(coverage<this.config.severeCoverageBelow)s.nonSevereDays=0;
    s.larvae=larvae;s.coverage=coverage;
  }
  private factor(s:State):number {
    if(!s.larvae)return 1;
    if(s.coverage<1-EPS)return s.shortageDays+EPS<this.config.warningDays?1:Math.max(this.config.minimumFactor,s.coverage);
    return Math.min(1,s.recoveryStart+(1-s.recoveryStart)*s.restoredDays/this.config.recoveryDays);
  }
  get(id:string){
    const s=this.rooms.get(id);
    return s?{...s,factor:this.factor(s),recovering:s.coverage>=1-EPS&&this.factor(s)<1-EPS}:undefined;
  }
  /** Exact integral of MIN(care, resource factor) until the next event. */
  progress(id:string,days:number,care:number):number {
    const s=this.rooms.get(id);if(!s)return days*care;
    const from=this.factor(s);
    if(s.coverage<1-EPS || from>=1-EPS)return days*Math.min(care,from);
    const slope=(1-s.recoveryStart)/this.config.recoveryDays;
    const rising=Math.min(days,Math.max(0,(care-from)/slope));
    return from>=care?days*care:from*rising+slope*rising*rising/2+care*(days-rising);
  }
  nextEventDays():number {
    let next=Infinity;
    for(const s of this.rooms.values()){
      if(!s.larvae)continue;
      if(s.coverage<1-EPS && s.shortageDays+EPS<this.config.warningDays)next=Math.min(next,this.config.warningDays-s.shortageDays);
      if(s.coverage<this.config.severeCoverageBelow){
        if(s.severeDays+EPS<this.config.severeGraceDays)next=Math.min(next,this.config.severeGraceDays-s.severeDays);
        else if(this.config.lossFractionPerDay>0)next=Math.min(next,(1-s.lossCredit)/(s.larvae*this.config.lossFractionPerDay));
      }else if(s.severeDays>0 && s.nonSevereDays+EPS<this.config.recoveryDays)next=Math.min(next,this.config.recoveryDays-s.nonSevereDays);
      if(s.coverage>=1-EPS && s.restoredDays+EPS<this.config.recoveryDays)next=Math.min(next,this.config.recoveryDays-s.restoredDays);
    }
    return next;
  }
  advance(days:number):LarvalLoss[]{
    nonNegativeFinite(days,'days');const losses=new Map<string,number>();let remaining=days;
    while(remaining>EPS){
      const step=Math.min(remaining,this.nextEventDays());
      if(step<=0)throw new Error('Nonpositive shortage interval');
      for(const [id,s] of this.rooms){
        if(!s.larvae)continue;
        if(s.coverage<1-EPS)s.shortageDays+=step;
        else {s.restoredDays=Math.min(this.config.recoveryDays,s.restoredDays+step);if(s.restoredDays+EPS>=this.config.recoveryDays){s.shortageDays=0;s.recoveryStart=1;}}
        if(s.coverage<this.config.severeCoverageBelow){
          if(s.severeDays+EPS>=this.config.severeGraceDays)s.lossCredit+=s.larvae*this.config.lossFractionPerDay*step;
          s.severeDays+=step;
          const count=Math.min(s.larvae,Math.floor(s.lossCredit+EPS));
          if(count){s.lossCredit=Math.max(0,s.lossCredit-count);s.losses+=count;losses.set(id,(losses.get(id)??0)+count);}
        }else {
          s.nonSevereDays=Math.min(this.config.recoveryDays,s.nonSevereDays+step);
          if(s.nonSevereDays+EPS>=this.config.recoveryDays){s.severeDays=0;s.lossCredit=0;}
        }
      }
      remaining=Math.max(0,remaining-step);
    }
    return [...losses].map(([roomId,count])=>({roomId,count}));
  }
}
