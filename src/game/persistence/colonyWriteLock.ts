import type {ColonyWriteLock} from './persistenceController.ts';
/** Lock held for the entire active session, never stolen from another writer. */
export class BrowserColonyWriteLock implements ColonyWriteLock {
 private holding=false;
 get held():boolean{return this.holding;}
 private unlock:(()=>void)|undefined;
 private request:Promise<unknown>|undefined;
 private locks:LockManager|undefined;
 constructor(locks:LockManager|undefined=globalThis.navigator?.locks){this.locks=locks;}
 async acquire(id:string):Promise<boolean>{
  if(!this.locks)throw new Error('Sicherer Tab-Schutz ist nicht verfügbar.');
  if(this.request)throw new Error('Schreibrecht wurde bereits angefragt.');
  return new Promise<boolean>((resolve,reject)=>{
   this.request=this.locks!.request(`anthive-colony:${id}`,{mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock){resolve(false);return;}
    await new Promise<void>(done=>{this.unlock=done;this.holding=true;resolve(true);});
   }).catch(error=>{this.holding=false;reject(error);});
  });
 }
 async release():Promise<void>{this.holding=false;this.unlock?.();this.unlock=undefined;await this.request;}
}
