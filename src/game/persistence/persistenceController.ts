import type {ColonySession} from './colonySession.ts';
import type {ColonyRepository} from './colonyRepository.ts';

export const BACKUP_INTERVALS={1:900,2:3600,3:10800} as const;
export type BackupSlot=1|2|3;
export function newPersistenceTiming(){return {activeSeconds:0,lastAutosaveActiveSeconds:0,backupDue:{1:900,2:3600,3:10800}};}
export type PersistenceTiming=ReturnType<typeof newPersistenceTiming>;
export type SaveStatus={kind:'ready'|'saving'|'saved'|'error'|'readonly';message:string};
export interface ColonyWriteLock {readonly held?:boolean;acquire(id:string):Promise<boolean>;release():void|Promise<void>;}

/** Counts active real time only; writes are serialized and duplicate triggers coalesced. */
export class PersistenceController {
 private lastNow:number|null=0;
 private visible=true;
 private writable=false;
 private stopped=false;
 private retryAfter=0;
 private tail:Promise<void>=Promise.resolve();
 private pending=new Map<string,Promise<void>>();
 private session:ColonySession;
 private repository:Pick<ColonyRepository,'save'> & Partial<Pick<ColonyRepository,'ready'>>;
 private lock:ColonyWriteLock;
 private notify:(status:SaveStatus)=>void;
 constructor(session:ColonySession,repository:Pick<ColonyRepository,'save'> & Partial<Pick<ColonyRepository,'ready'>>,lock:ColonyWriteLock,notify:(status:SaveStatus)=>void){this.session=session;this.repository=repository;this.lock=lock;this.notify=notify;}
 async start():Promise<void>{
  try{await this.repository.ready?.();this.writable=await this.lock.acquire(this.session.id);}
  catch(error){this.writable=false;await this.lock.release();if(!this.stopped)this.notify({kind:'error',message:`Speichern nicht verfügbar: ${error instanceof Error?error.message:String(error)}`});return;}
  if(this.stopped){await this.lock.release();return;}
  this.notify(this.writable?{kind:'ready',message:'Speichern bereit'}:{kind:'readonly',message:'Kein Schreibzugriff: Kolonie in anderem Tab aktiv oder Tab-Schutz nicht verfügbar.'});
 }
 resetTime(now:number):void{this.lastNow=now;}
 setVisible(visible:boolean):void{this.visible=visible;this.lastNow=null;}
 tick(now:number,paused:boolean):void{
  const previous=this.lastNow;this.lastNow=now;
  if(previous===null||this.stopped||!this.writable||!this.visible||paused)return;
  const seconds=Math.max(0,(now-previous)/1000);
  if(!Number.isFinite(seconds))return;
  const t=this.session.persistenceTiming;t.activeSeconds+=seconds;
  if(t.activeSeconds-t.lastAutosaveActiveSeconds>=300 && t.activeSeconds>=this.retryAfter)void this.request('auto').catch(()=>{});
 }
 manual():Promise<void>{return this.request('manual');}
 background():Promise<void>{return this.request('background');}
 private request(kind:'manual'|'auto'|'background'):Promise<void>{
  if(this.writable&&this.lock.held===false){this.writable=false;this.notify({kind:'readonly',message:'Schreibrecht verloren. In diesem Tab wird nicht gespeichert.'});}
  if(this.stopped||!this.writable)return Promise.reject(new Error('Diese Kolonie kann in diesem Tab nicht gespeichert werden.'));
  const existing=this.pending.get(kind);if(existing)return existing;
  const job=this.tail.catch(()=>{}).then(async()=>{
   if(this.stopped||this.lock.held===false)throw new Error('Kolonie ist nicht mehr aktiv oder Schreibrecht verloren.');
   const timing=structuredClone(this.session.persistenceTiming);
   let backupSlot:BackupSlot|undefined;
   if(kind==='auto'){
    if(timing.activeSeconds-timing.lastAutosaveActiveSeconds<300)return;
    timing.lastAutosaveActiveSeconds=timing.activeSeconds;
    backupSlot=([3,2,1] as BackupSlot[]).find(slot=>timing.activeSeconds>=timing.backupDue[slot]);
    if(backupSlot){const interval=BACKUP_INTERVALS[backupSlot],due=timing.backupDue[backupSlot];timing.backupDue[backupSlot]=due+(Math.floor((timing.activeSeconds-due)/interval)+1)*interval;}
   }
   const projected={...this.session,persistenceTiming:timing};
   this.notify({kind:'saving',message:'Wird gespeichert …'});
   try{
    const result=await this.repository.save(projected,{backupSlot,canWrite:()=>!this.stopped&&this.lock.held!==false});
    this.session.revision=projected.revision;
    this.session.persistenceTiming.lastAutosaveActiveSeconds=timing.lastAutosaveActiveSeconds;
    this.session.persistenceTiming.backupDue=timing.backupDue;
    this.retryAfter=0;
    this.notify({kind:'saved',message:`Gespeichert ${new Date(result.savedAt).toLocaleTimeString('de-DE')}`});
   }catch(error){
    this.retryAfter=this.session.persistenceTiming.activeSeconds+30;
    this.notify({kind:'error',message:`Nicht gespeichert: ${error instanceof Error?error.message:String(error)}. Der bisherige Spielstand bleibt erhalten.`});
    throw error;
   }
  });
  this.tail=job.catch(()=>{});
  const tracked=job.finally(()=>this.pending.delete(kind));this.pending.set(kind,tracked);return tracked;
 }
 async flush():Promise<void>{await this.tail;}
 async close():Promise<void>{this.stopped=true;await this.flush();await this.lock.release();}
}
