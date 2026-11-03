import type {ColonySave} from './colonySession.ts';
import {validateColonyState} from './validateColonyState.ts';
import {newPersistenceTiming,BACKUP_INTERVALS} from './persistenceController.ts';

export const CURRENT_SAVE_SCHEMA=2;
export const SAVE_ENCODING='map-set-v1';
/** Explicit supported step only. Never mutates old data, writes storage or guesses offline time. */
export function migrateColonySave(input:unknown):{save:ColonySave;migrated:boolean;fromVersion:number}{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Ungültiger Spielstand.');
 const source=input as Record<string,any>,version=source.schemaVersion;
 if(source.format!=='anthive-colony'||source.rulesVersion!==1||![1,2].includes(version))throw new Error('Nicht unterstützte Spielstand- oder Regelversion. Originaldaten bleiben erhalten.');
 if(version===2){validateColonyState(input);return {save:input,migrated:false,fromVersion:2};}
 if(source.encoding!==undefined&&source.encoding!==SAVE_ENCODING)throw new Error('Nicht unterstützte Spielstand-Kodierung.');
 const copy=structuredClone(source);copy.schemaVersion=2;copy.encoding=SAVE_ENCODING;
 if(!Object.prototype.hasOwnProperty.call(copy,'persistenceTiming')){
  const active=copy.state?.clock?.elapsedSeconds;
  if(typeof active!=='number'||!Number.isFinite(active)||active<0)throw new Error('Ungültige alte Simulationszeit.');
  copy.persistenceTiming=newPersistenceTiming();copy.persistenceTiming.activeSeconds=active;copy.persistenceTiming.lastAutosaveActiveSeconds=active;
  for(const slot of [1,2,3] as const)copy.persistenceTiming.backupDue[slot]=active+BACKUP_INTERVALS[slot];
 }
 validateColonyState(copy);return {save:copy,migrated:true,fromVersion:1};
}
