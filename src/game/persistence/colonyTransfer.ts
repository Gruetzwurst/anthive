import {migrateColonySave} from './colonyMigration.ts';
import {validateColonyState} from './validateColonyState.ts';
import type {ColonySave} from './colonySession.ts';
import {newPersistenceTiming,BACKUP_INTERVALS} from './persistenceController.ts';
import type {PersistenceTiming} from './persistenceController.ts';
import {COLONY_MILESTONES} from '../simulation/simulationConfig.ts';

export type RestoreTarget={id:string;name:string;revision:number;persistenceTiming:PersistenceTiming;highestPopulation?:number};
export const normalizedColonyName=(name:string)=>name.trim().normalize('NFC').toLocaleLowerCase('de-DE');
export function suggestImportName(name:string,existing:readonly {name:string}[]):string{
 const names=new Set(existing.map(r=>normalizedColonyName(r.name)));
 if(!names.has(normalizedColonyName(name)))return name.trim();
 let index=1,suggestion:string;
 do{suggestion=`${name.trim()} (Import${index===1?'':` ${index}`})`;index++;}while(names.has(normalizedColonyName(suggestion)));
 return suggestion;
}
export function prepareNewImport(input:unknown,id:string,name:string):ColonySave{
 input=migrateColonySave(input).save;validateColonyState(input);
 if(!id.trim()||id===input.id||!name.trim())throw new Error('Neue Kolonie benötigt eine eigene ID und einen Namen.');
 const save=structuredClone(input);save.id=id;save.name=name.trim();save.revision=0;save.persistenceTiming=newPersistenceTiming();return save;
}
function prepare(input:unknown,current:RestoreTarget,replacing:boolean):ColonySave{
 input=migrateColonySave(input).save;validateColonyState(input);
 if(!current.id.trim()||!current.name.trim()||!Number.isSafeInteger(current.revision)||current.revision<0)throw new Error('Ungültiges Wiederherstellungsziel.');
 const save=structuredClone(input);save.id=current.id;save.name=replacing?input.name:current.name;save.revision=current.revision+1;
 if(!replacing&&current.highestPopulation!==undefined){
  if(!Number.isSafeInteger(current.highestPopulation)||current.highestPopulation<1)throw new Error('Ungültiger Koloniehöchststand.');
  save.state.progression.highestPopulation=Math.max(save.state.progression.highestPopulation,current.highestPopulation);
  const level=COLONY_MILESTONES.filter(n=>save.state.progression.highestPopulation>=n).length;
  save.state.construction.grade=level;save.state.construction.developmentLevel=level;
  save.state.gathering.developmentLevel=level;
  save.state.queen.developmentLevel=level;save.state.broodSupply.developmentLevel=level;
 }
 save.persistenceTiming=structuredClone(current.persistenceTiming);
 const active=save.persistenceTiming.activeSeconds;save.persistenceTiming.lastAutosaveActiveSeconds=active;
 if(replacing)for(const slot of [1,2,3] as const)save.persistenceTiming.backupDue[slot]=active+BACKUP_INTERVALS[slot];
 validateColonyState(save);return save;
}
export function prepareBackupRestore(input:unknown,current:RestoreTarget):ColonySave{return prepare(input,current,false);}
export function prepareReplacement(input:unknown,current:RestoreTarget):ColonySave{return prepare(input,current,true);}
