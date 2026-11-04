import {emptyQueenSupplyRoom} from '../simulation/queenSupply.ts';
import type {ColonySave} from './colonySession.ts';
import {validateColonyState} from './validateColonyState.ts';
import {newPersistenceTiming,BACKUP_INTERVALS} from './persistenceController.ts';
import {COLONY_MILESTONES,TERRAIN_DIGGING_GRADES,CHAMBER_CONFIG} from '../simulation/simulationConfig.ts';

export const CURRENT_SAVE_SCHEMA=9;
export const SAVE_ENCODING='map-set-v1';
/** Explicit supported step only. Never mutates old data, writes storage or guesses offline time. */
export function migrateColonySave(input:unknown):{save:ColonySave;migrated:boolean;fromVersion:number}{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Ungültiger Spielstand.');
 const source=input as Record<string,any>,version=source.schemaVersion;
 if(source.format!=='anthive-colony'||source.rulesVersion!==1||![1,2,3,4,5,6,7,8,9].includes(version))throw new Error('Nicht unterstützte Spielstand- oder Regelversion. Originaldaten bleiben erhalten.');
 if(version===9){validateColonyState(input);return {save:input,migrated:false,fromVersion:9};}
 if(version>=2?source.encoding!==SAVE_ENCODING:source.encoding!==undefined&&source.encoding!==SAVE_ENCODING)throw new Error('Nicht unterstützte Spielstand-Kodierung.');
 const copy=structuredClone(source);
 // Known step1→2: explicit codec and legacy persistence timers.
 if(version===1&&!Object.prototype.hasOwnProperty.call(copy,'persistenceTiming')){
  const active=copy.state?.clock?.elapsedSeconds;
  if(typeof active!=='number'||!Number.isFinite(active)||active<0)throw new Error('Ungültige alte Simulationszeit.');
  copy.persistenceTiming=newPersistenceTiming();copy.persistenceTiming.activeSeconds=active;copy.persistenceTiming.lastAutosaveActiveSeconds=active;
  for(const slot of [1,2,3] as const)copy.persistenceTiming.backupDue[slot]=active+BACKUP_INTERVALS[slot];
 }
 copy.schemaVersion=2;copy.encoding=SAVE_ENCODING;
 // Known step2→3: no historical population can be inferred beyond the saved adults.
 const workers=copy.state?.workforce?.workers;
 if(!(workers instanceof Map))throw new Error('Arbeitsgruppen fehlen.');
 if(version<3)copy.state.progression={highestPopulation:workers.size+1};copy.schemaVersion=3;
 const peak=copy.state.progression?.highestPopulation;
 if(!Number.isSafeInteger(peak)||peak<workers.size+1||!copy.state.construction)throw new Error('Ungültiger Koloniehöchststand oder Bauzustand.');
 const level=COLONY_MILESTONES.filter(n=>peak>=n).length,construction=copy.state.construction;
 if(version<4){
  if(!Number.isInteger(construction.grade)||construction.grade<0||construction.grade>3)throw new Error('Ungültige alte Grabkraft.');
  construction.developmentLevel=level;construction.grade=level;
 }
 const gathering=copy.state.gathering;
 if(!(gathering?.workers instanceof Map))throw new Error('Sammelzustand fehlt.');
 // Old formats had only base-sized loads. Do not legitimise corrupt cargo by
 // first raising the limit to the new developed capacity.
 if(version<5){
  for(const worker of gathering.workers.values())if(worker.load?.amount>gathering.config?.carryCapacity+1e-8||worker.expected>gathering.config?.carryCapacity+1e-8)throw new Error('Ungültige alte Sammelladung.');
  gathering.developmentLevel=level;
 }
 const supply=copy.state.broodSupply;
 if(!(supply?.nurses instanceof Map)||!copy.state.queen)throw new Error('Pflegezustand fehlt.');
 if(version<6){
  for(const nurse of supply.nurses.values())if(nurse.load?.amount>supply.config?.carryCapacity+1e-8||nurse.job?.amount>supply.config?.carryCapacity+1e-8)throw new Error('Ungültige alte Pflegeladung.');
  supply.developmentLevel=level;copy.state.queen.developmentLevel=level;
 }
 if(version<7){
 // Earlier formats had no player-built queen chambers or royal eggs.
 if(!construction.minimumAreas||!Array.isArray(construction.orders)||construction.orders.some((o:any)=>o.type==='queen'))throw new Error('Ungültiger alter Kammerzustand.');
 if(construction.minimumAreas.queen!==undefined&&construction.minimumAreas.queen!==44||Object.prototype.hasOwnProperty.call(copy.state,'royal'))throw new Error('Unbekannte königliche Daten im alten Format.');
 construction.minimumAreas.queen=CHAMBER_CONFIG.minimumArea.queen;
 copy.state.royal={rooms:new Map(),eggs:new Map()};
 }
 // Step7→8: pending royal eggs have not developed; no invented elapsed time.
 const queen=copy.state.queen,royal=copy.state.royal;
 if(version<8){
 if(queen.additionalQueens!==undefined&&(!(queen.additionalQueens instanceof Map)||queen.additionalQueens.size))throw new Error('Unbekannte zusätzliche Königinnen im alten Format.');
 queen.additionalQueens=new Map();
 if(!Array.isArray(queen.eggs)||!Array.isArray(queen.buffer)||!(royal?.eggs instanceof Map))throw new Error('Ungültige alte Brut.');
 for(const egg of [...queen.eggs,...queen.buffer]){
  if(egg.sourceQueenId!==undefined&&egg.sourceQueenId!=='queen-1')throw new Error('Unbekannte alte Quellkönigin.');
  egg.sourceQueenId='queen-1';
 }
 for(const egg of royal.eggs.values()){
  if(egg.stage!==undefined&&egg.stage!=='egg'||egg.stageProgressDays!==undefined&&egg.stageProgressDays!==0)throw new Error('Unbekannte alte Königinnenentwicklung.');
  egg.stage='egg';egg.stageProgressDays=0;
 }
 if(!(supply.rooms instanceof Map))throw new Error('Alte Larvenkammern fehlen.');
 for(const room of supply.rooms.values()){if(room.royal!==undefined&&room.royal!==false)throw new Error('Unbekannte alte königliche Versorgung.');room.royal=false;}
 }
 // Step8→9: retain existing queens, eggs and cargo; start new private stocks empty.
 if(!(supply.rooms instanceof Map)||!(queen.additionalQueens instanceof Map))throw new Error('Königinnenversorgung fehlt.');
 for(const room of supply.rooms.values()){
  if(room.adultQueen!==undefined&&room.adultQueen!==false)throw new Error('Unbekannte alte Königinnenvorräte.');room.adultQueen=false;
 }
 // Schema7 had no royal larval reservoirs; schema8 may not have advanced yet.
 for(const r of royal.rooms.values())if(!supply.rooms.has(r.id)){
  const larvae=[...royal.eggs.values()].some((e:any)=>e.roomId===r.id&&e.arrived&&e.stage==='larva')?1:0;
  const stock=()=>({amount:0,target:larvae*2,capacity:2,refilling:!!larvae,consumed:0,unmet:0});
  supply.rooms.set(r.id,{id:r.id,specialization:'care',capacity:1,operational:r.operational,position:{...r.position},larvae,royal:true,adultQueen:false,food:stock(),water:stock()});
 }
 const queens=[{id:'queen-1',position:queen.queenOrigin,operational:true},...queen.additionalQueens.values()];
 for(const q of queens){if(!q.position)throw new Error('Königinnenort fehlt.');const room=emptyQueenSupplyRoom(q);if(supply.rooms.has(room.id))throw new Error('Unerwarteter alter Königinnenvorrat.');supply.rooms.set(room.id,room);}
 if(!(supply.shortage?.rooms instanceof Map))throw new Error('Pflegeversorgungshistorie fehlt.');
 for(const room of supply.rooms.values())if((room.adultQueen||room.royal)&&!supply.shortage.rooms.has(room.id))supply.shortage.rooms.set(room.id,{larvae:0,coverage:1,shortageDays:0,severeDays:0,nonSevereDays:0,restoredDays:0,recoveryStart:1,lossCredit:0,losses:0,warnings:0});
 copy.schemaVersion=9;
 // Check every old job before releasing newly locked prototype work. Otherwise
 // dropping such a job could conceal corrupt progress, durations or references.
 validateColonyState(copy,version<4);
 if(!(construction.builders instanceof Map)||!(construction.reservations instanceof Set))throw new Error('Ungültiger Bauzustand.');
 for(const builder of construction.builders.values()){
  const job=builder.job,tile=job?.target&&copy.world?.tiles?.[job.target.row]?.[job.target.column];
  if(version<4&&job?.kind==='dig'&&tile&&TERRAIN_DIGGING_GRADES[tile.terrain as keyof typeof TERRAIN_DIGGING_GRADES]>level){
   construction.reservations.delete(`${job.target.column},${job.target.row}`);builder.job=null;builder.status='Grabkraft fehlt · Auftrag wartet';
  }
 }
 validateColonyState(copy);return {save:copy,migrated:true,fromVersion:version};
}
