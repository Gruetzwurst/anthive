import {newPersistenceTiming} from './persistenceController.ts';
import {prepareNewImport,prepareBackupRestore,prepareReplacement} from './colonyTransfer.ts';
import type {RestoreTarget} from './colonyTransfer.ts';
import type {ColonySave} from './colonySession.ts';
import {sortColonies} from './colonyCatalog.ts';
import {captureColony,parseColony,serializeColony,restoreColony} from './colonySession.ts';
import type {BackupSlot} from './persistenceController.ts';
import type {ColonySession} from './colonySession.ts';

export type ColonyMetadata={id:string;name:string;revision:number;savedAt:string;gameDay:number;antCount:number;lastPlayedAt?:string;backupCount?:number};
type Backup={slot:BackupSlot;payload:string;checksum:string;savedAt:string;revision:number};
export type RecoveryMetadata={id:string;colonyId:string;name:string;revision:number;savedAt:string;originalSavedAt:string;reason:'restore'|'replace'|'migration';gameDay:number;antCount:number};
type Recovery=RecoveryMetadata & {payload:string;checksum:string};
type Row=ColonyMetadata & {payload:string;checksum:string;backups?:Partial<Record<BackupSlot,Backup>>;timing?:ColonySave['persistenceTiming'];highestPopulation?:number};
function metadataFor(row:Row):ColonyMetadata{
 const {payload:_payload,checksum:_checksum,backups,timing:_timing,...metadata}=row;
 return {...metadata,backupCount:Object.keys(backups??{}).length};
}
async function checksum(payload:string):Promise<string>{
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
 return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
/** A single read-write transaction checks revision and commits payload + metadata. */
export class ColonyRepository {
  private database:Promise<IDBDatabase>;
  constructor(name='anthive-colonies-v1',factory:IDBFactory=globalThis.indexedDB) {
    this.database=new Promise((resolve,reject)=>{
      if(!factory){reject(new Error('Browserspeicher ist nicht verfügbar.'));return;}
      const request=factory.open(name,3);
      request.onupgradeneeded=()=>{
        const db=request.result,tx=request.transaction!;
        if(!db.objectStoreNames.contains('colonies'))db.createObjectStore('colonies',{keyPath:'id'});
        if(!db.objectStoreNames.contains('metadata')){
          const metadata=db.createObjectStore('metadata',{keyPath:'id'});
          const cursor=tx.objectStore('colonies').openCursor();
          cursor.onsuccess=()=>{const current=cursor.result;if(current){metadata.put(metadataFor(current.value));current.continue();}};
        }
        if(!db.objectStoreNames.contains('preferences'))db.createObjectStore('preferences');
        for(const name of ['recoveryCopies','recoveryMetadata'])if(!db.objectStoreNames.contains(name)){
          db.createObjectStore(name,{keyPath:'id'}).createIndex('colonyId','colonyId');
        }
      };
      request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
      request.onerror=()=>reject(request.error ?? new Error('Browserspeicher konnte nicht geöffnet werden.'));
      request.onblocked=()=>reject(new Error('Speicheraktualisierung wird durch einen anderen Tab blockiert.'));
    });
    void this.database.catch(()=>{}); // readiness is reported by the controller; avoid an unhandled early open failure.
  }
  async ready():Promise<void>{await this.database;}
  async save(session:ColonySession,options:{backupSlot?:BackupSlot;canWrite?:()=>boolean}={}):Promise<ColonyMetadata> {
    // Capture before awaiting: no mixed-time snapshot while the live model advances.
    const save=captureColony(session),expected=save.revision;
    save.revision++;
    const payload=serializeColony(save),savedAt=new Date().toISOString();
    const digest=await checksum(payload);
    const row:Row={highestPopulation:save.state.progression.highestPopulation,timing:structuredClone(save.persistenceTiming),checksum:digest,id:save.id,name:save.name,revision:save.revision,savedAt,gameDay:save.state.clock.elapsedSeconds/save.state.clock.secondsPerGameDay,antCount:save.state.workforce.workers.size,payload};
    if(options.backupSlot!==undefined&&![1,2,3].includes(options.backupSlot))throw new Error('Ungültiger Backupplatz.');
    let migration:Recovery|undefined;
    const original=await this.readRow(save.id);
    if(original){
      let header:any;try{header=JSON.parse(original.payload);}catch{throw new Error('Vorhandener Spielstand ist nicht lesbar. Bitte exportieren oder eine Sicherung wiederherstellen.');}
      if(header.format!=='anthive-colony'||![1,2,3,4,5,6,7,8,9].includes(header.schemaVersion)||header.rulesVersion!==1||(header.schemaVersion>=2&&header.encoding!=='map-set-v1'))throw new Error('Vorhandene Spielstandversion wird nicht unterstützt. Original bleibt erhalten.');
      if(header.schemaVersion<9){
        const old=await this.snapshotFrom(original,save.id,original.revision);
        migration={id:crypto.randomUUID(),colonyId:save.id,name:old.name,revision:original.revision,savedAt,originalSavedAt:original.savedAt,reason:'migration',gameDay:original.gameDay,antCount:original.antCount,payload:original.payload,checksum:original.checksum};
      }
    }
    const db=await this.database;
    await new Promise<void>((resolve,reject)=>{

      const tx=db.transaction(['colonies','metadata','recoveryCopies','recoveryMetadata'],'readwrite'),store=tx.objectStore('colonies');
      let failure:Error|null=null;
      const request=store.get(save.id);
      request.onsuccess=()=>{
        const previous=request.result as Row|undefined;
        if(options.canWrite&&!options.canWrite()){failure=new Error('Schreibrecht verloren.');tx.abort();return;}
        if((previous?.revision??0)!==expected){failure=new Error('Spielstand wurde inzwischen geändert. Bitte erneut laden.');tx.abort();return;}
        if(migration){
          if(previous?.payload!==original!.payload||previous?.checksum!==original!.checksum){failure=new Error('Alter Spielstand wurde zwischenzeitlich geändert.');tx.abort();return;}
          const {payload:_payload,checksum:_checksum,...metadata}=migration;
          tx.objectStore('recoveryCopies').add(migration);tx.objectStore('recoveryMetadata').add(metadata);
        }
        row.lastPlayedAt=previous?.lastPlayedAt??savedAt;
        row.backups={...previous?.backups};
        if(options.backupSlot){
          row.backups[options.backupSlot]={slot:options.backupSlot,payload,checksum:digest,savedAt,revision:row.revision};
        }
        store.put(row);
        tx.objectStore('metadata').put(metadataFor(row));
      };
      tx.oncomplete=()=>resolve();
      tx.onabort=()=>reject(failure??tx.error??new Error('Speichern abgebrochen. Der bisherige Stand bleibt erhalten.'));
      tx.onerror=()=>{}; // onabort is authoritative; never report success before commit.
    });
    session.revision=save.revision;
    return metadataFor(row);
  }
  async load(id:string):Promise<ColonySession> {
    const db=await this.database;
    const row=await new Promise<Row|undefined>((resolve,reject)=>{
      const tx=db.transaction('colonies','readonly'),req=tx.objectStore('colonies').get(id);
      tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);
    });
    if(!row)throw new Error('Kolonie wurde nicht gefunden.');
    if(await checksum(row.payload)!==row.checksum)throw new Error('Spielstand ist beschädigt (Prüfsumme).');
    const data=parseColony(row.payload);
    if(data.id!==id||data.revision!==row.revision)throw new Error('Spielstand-Zuordnung ist beschädigt.');
    return restoreColony(data);
  }
  async list():Promise<ColonyMetadata[]> {
    const db=await this.database;
    const rows=await new Promise<ColonyMetadata[]>((resolve,reject)=>{
      const tx=db.transaction('metadata','readonly'),req=tx.objectStore('metadata').getAll();
      tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);
    });
    return sortColonies(rows);
  }
  async lastPlayedId():Promise<string|null>{
    const db=await this.database;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('preferences','readonly'),req=tx.objectStore('preferences').get('lastColonyId');
      tx.oncomplete=()=>resolve(req.result??null);tx.onabort=()=>reject(tx.error);
    });
  }
  async markPlayed(id:string,canWrite:()=>boolean=()=>true):Promise<void>{
    const db=await this.database;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['colonies','metadata','preferences'],'readwrite'),store=tx.objectStore('colonies'),req=store.get(id);
      let missing=false;
      req.onsuccess=()=>{const row=req.result as Row|undefined;if(!row||!canWrite()){missing=true;tx.abort();return;}
        row.lastPlayedAt=new Date().toISOString();store.put(row);tx.objectStore('metadata').put(metadataFor(row));tx.objectStore('preferences').put(id,'lastColonyId');};
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(missing?new Error('Kolonie wurde nicht gefunden.'):tx.error);
    });
  }
  async rename(id:string,name:string,canWrite:()=>boolean):Promise<void>{
    if(!name.trim())throw new Error('Bitte einen Kolonienamen eingeben.');
    const session=await this.load(id);session.name=name.trim();await this.save(session,{canWrite});
  }
  async remove(id:string,expectedRevision:number,canWrite:()=>boolean):Promise<void>{
    const db=await this.database;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['colonies','metadata','preferences','recoveryCopies','recoveryMetadata'],'readwrite'),store=tx.objectStore('colonies'),req=store.get(id);
      let failure:Error|null=null;
      req.onsuccess=()=>{const row=req.result as Row|undefined;
        if(!canWrite()||!row||row.revision!==expectedRevision){failure=new Error('Kolonie wurde inzwischen geändert oder ist in einem anderen Tab aktiv. Bitte Liste aktualisieren.');tx.abort();return;}
        store.delete(id);tx.objectStore('metadata').delete(id);
        const cursor=tx.objectStore('recoveryMetadata').index('colonyId').openKeyCursor(IDBKeyRange.only(id));
        cursor.onsuccess=()=>{const c=cursor.result;if(c){tx.objectStore('recoveryCopies').delete(c.primaryKey);tx.objectStore('recoveryMetadata').delete(c.primaryKey);c.continue();}};
        const pref=tx.objectStore('preferences'),last=pref.get('lastColonyId');
        last.onsuccess=()=>{if(last.result===id)pref.delete('lastColonyId');};
      };
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure??tx.error);
    });
  }
  async listBackups(id:string):Promise<Array<{slot:BackupSlot;savedAt:string;revision:number}>>{
    const db=await this.database;
    const row=await new Promise<Row|undefined>((resolve,reject)=>{
      const tx=db.transaction('colonies','readonly'),req=tx.objectStore('colonies').get(id);
      tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);
    });
    return Object.values(row?.backups??{}).map(({slot,savedAt,revision})=>({slot,savedAt,revision}));
  }
  async readBackup(id:string,slot:BackupSlot){
    const db=await this.database;
    const row=await new Promise<Row|undefined>((resolve,reject)=>{
      const tx=db.transaction('colonies','readonly'),req=tx.objectStore('colonies').get(id);
      tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);
    });
    const backup=row?.backups?.[slot];if(!backup)throw new Error('Sicherung noch nicht erstellt.');
    return this.snapshotFrom(backup,id,backup.revision);
  }
  async importNew(input:unknown,name:string,canWrite:()=>boolean=()=>true):Promise<ColonySession>{
    const snapshot=prepareNewImport(input,crypto.randomUUID(),name),session=restoreColony(snapshot);
    try{await this.save(session,{canWrite});}catch{throw new Error('Import konnte nicht gespeichert werden. Die Originaldatei und vorhandene Kolonien bleiben unverändert. Bitte prüfe den verfügbaren Browserspeicher.');}return session;
  }
  private async readRow(id:string):Promise<Row|undefined>{
    const db=await this.database;
    return new Promise((resolve,reject)=>{const tx=db.transaction('colonies','readonly'),req=tx.objectStore('colonies').get(id);tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);});
  }
  private async snapshotFrom(record:{payload:string;checksum:string},id:string,revision:number):Promise<ColonySave>{
    if(await checksum(record.payload)!==record.checksum)throw new Error('Spielstand ist beschädigt (Prüfsumme).');
    const save=parseColony(record.payload);
    if(save.id!==id||save.revision!==revision)throw new Error('Spielstand-Zuordnung ist beschädigt.');
    restoreColony(save);return save;
  }
  async listRecoveryCopies(colonyId:string):Promise<RecoveryMetadata[]>{
    const db=await this.database;
    const rows=await new Promise<RecoveryMetadata[]>((resolve,reject)=>{const tx=db.transaction('recoveryMetadata','readonly'),req=tx.objectStore('recoveryMetadata').index('colonyId').getAll(colonyId);tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);});
    return rows.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
  }
  async readRecoveryCopy(colonyId:string,copyId:string):Promise<ColonySave>{
    const db=await this.database;
    const row=await new Promise<Recovery|undefined>((resolve,reject)=>{const tx=db.transaction('recoveryCopies','readonly'),req=tx.objectStore('recoveryCopies').get(copyId);tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);});
    if(!row||row.colonyId!==colonyId)throw new Error('Sicherheitskopie gehört nicht zu dieser Kolonie.');
    return this.snapshotFrom(row,colonyId,row.revision);
  }
  async restoreBackup(id:string,slot:BackupSlot,expectedRevision:number,canWrite:()=>boolean):Promise<void>{
    await this.replaceCurrent(id,await this.readBackup(id,slot),expectedRevision,canWrite,'restore');
  }
  async restoreRecoveryCopy(id:string,copyId:string,expectedRevision:number,canWrite:()=>boolean):Promise<void>{
    await this.replaceCurrent(id,await this.readRecoveryCopy(id,copyId),expectedRevision,canWrite,'restore');
  }
  async replaceImported(id:string,input:unknown,expectedRevision:number,canWrite:()=>boolean):Promise<void>{
    // Full validation before inspecting or changing the target.
    const valid=parseColony(serializeColony(input as ColonySave));
    await this.replaceCurrent(id,valid,expectedRevision,canWrite,'replace');
  }
  private async replaceCurrent(id:string,source:ColonySave,expectedRevision:number,canWrite:()=>boolean,reason:'restore'|'replace'):Promise<void>{
    const previous=await this.readRow(id);
    if(!previous||previous.revision!==expectedRevision||!canWrite())throw new Error('Kolonie wurde inzwischen geändert oder ist in einem anderen Tab aktiv.');
    let header:any;try{header=JSON.parse(previous.payload);}catch{}
    if(header&&typeof header==='object'&&(
      header.format!==undefined&&header.format!=='anthive-colony'||
      header.schemaVersion!==undefined&&![1,2,3,4,5,6,7,8,9].includes(header.schemaVersion)||
      header.rulesVersion!==undefined&&header.rulesVersion!==1||
      header.schemaVersion>=2&&header.encoding!==undefined&&header.encoding!=='map-set-v1'
    ))throw new Error('Unbekannte Spielstandversion oder Kodierung. Original bleibt erhalten; bitte aktualisieren oder als neue Kolonie importieren.');
    let current:ColonySave|undefined;
    try{current=await this.snapshotFrom(previous,id,previous.revision);}catch{/* A corrupt main save is not a trustworthy protection copy. */}
    if(reason==='replace'&&!current)throw new Error('Beschädigter Zielstand kann nicht sicher ersetzt werden. Bitte zuerst eine Sicherung wiederherstellen oder die Datei als neue Kolonie importieren.');
    let timing=current?.persistenceTiming;
    if(!timing){
      const candidates:ColonySave[]=reason==='restore'?[source]:[];
      for(const slot of [1,2,3] as const)try{candidates.push(await this.readBackup(id,slot));}catch{}
      timing=candidates.sort((a,b)=>b.persistenceTiming.activeSeconds-a.persistenceTiming.activeSeconds)[0]?.persistenceTiming??newPersistenceTiming();
      // A separately committed timer survives damaged payload bytes when available.
      if(previous.timing){try{const probe=structuredClone(source);probe.persistenceTiming=previous.timing;parseColony(serializeColony(probe));if(previous.timing.activeSeconds>=timing.activeSeconds)timing=previous.timing;}catch{}}
    }
    const retainedPeak=current?.state.progression.highestPopulation??(typeof previous.highestPopulation==='number'&&Number.isSafeInteger(previous.highestPopulation)&&previous.highestPopulation>=1?previous.highestPopulation:undefined);
    const target:RestoreTarget={id,name:previous.name,revision:previous.revision,persistenceTiming:timing,highestPopulation:retainedPeak};
    const save=reason==='restore'?prepareBackupRestore(source,target):prepareReplacement(source,target);
    restoreColony(save); // Refuse a snapshot that cannot build the actual model.
    const payload=serializeColony(save),digest=await checksum(payload),savedAt=new Date().toISOString();
    const row:Row={highestPopulation:save.state.progression.highestPopulation,id,name:save.name,revision:save.revision,savedAt,lastPlayedAt:previous.lastPlayedAt,gameDay:save.state.clock.elapsedSeconds/save.state.clock.secondsPerGameDay,antCount:save.state.workforce.workers.size,
      payload,checksum:digest,timing:structuredClone(save.persistenceTiming),backups:reason==='restore'?previous.backups:{}};
    const protection:Recovery|undefined=current?{id:crypto.randomUUID(),colonyId:id,name:current.name,revision:current.revision,savedAt,originalSavedAt:previous.savedAt,reason,
      gameDay:current.state.clock.elapsedSeconds/current.state.clock.secondsPerGameDay,antCount:current.state.workforce.workers.size,payload:previous.payload,checksum:previous.checksum}:undefined;
    const db=await this.database;
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(['colonies','metadata','recoveryCopies','recoveryMetadata'],'readwrite'),store=tx.objectStore('colonies'),req=store.get(id);let failure:Error|null=null;
      req.onsuccess=()=>{const actual=req.result as Row|undefined;
        if(!canWrite()||!actual||actual.revision!==previous.revision||actual.payload!==previous.payload||actual.checksum!==previous.checksum){failure=new Error('Kolonie wurde inzwischen geändert. Vorgang abgebrochen.');tx.abort();return;}
        if(protection){const {payload:_payload,checksum:_checksum,...metadata}=protection;tx.objectStore('recoveryCopies').add(protection);tx.objectStore('recoveryMetadata').add(metadata);}
        store.put(row);tx.objectStore('metadata').put(metadataFor(row));
      };
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure??new Error('Vorgang konnte nicht gespeichert werden. Möglicherweise fehlt Speicherplatz. Bisheriger Stand und Sicherungen bleiben erhalten.'));
      tx.onerror=()=>{};
    });
  }
  async close():Promise<void>{(await this.database).close();}
}
