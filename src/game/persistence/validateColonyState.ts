import {queenSupplyRoomId} from '../simulation/queenSupply.ts';
import {captureColony,createColonySession} from './colonySession.ts';
import type {ColonySave} from './colonySession.ts';
import {COLONY_MILESTONES,TERRAIN_DIGGING_GRADES,GATHERING_DEVELOPMENT,CARE_DEVELOPMENT} from '../simulation/simulationConfig.ts';
import {queenLimitForPopulation,royalRoomPosition,ROYAL_STAGE_DAYS} from '../simulation/royalBroodSystem.ts';
import {cardinalNeighbors,cellKey} from '../world/gridPathfinding.ts';

const fail=(message:string):never=>{throw new Error(`Ungültiger Spielstand: ${message}`);};
const record=(v:unknown):v is Record<string,unknown>=>!!v && typeof v==='object' && !Array.isArray(v);
const finite=(v:unknown,min=0)=>typeof v==='number' && Number.isFinite(v) && v>=min;
const point=(v:any)=>record(v)&&finite(v.x)&&finite(v.y);
const kinds=['food','water','buildingMaterial'];
const specs=['gathering','building','care','combat'];
const plans=['tunnel',...kinds,'rest',...specs.map(s=>`brood-${s}`),'queen'];
const comparable=(v:unknown)=>JSON.stringify(v,(_k,x)=>x instanceof Map?{$map:[...x]}:x instanceof Set?{$set:[...x]}:x);
const enums=(v:unknown,values:readonly unknown[])=>values.includes(v);
function map(v:unknown):asserts v is Map<any,any>{if(!(v instanceof Map))fail('Map fehlt');}
function array(v:unknown):asserts v is any[]{if(!Array.isArray(v))fail('Liste fehlt');}
function unique(items:any[],key:(v:any)=>unknown){if(new Set(items.map(key)).size!==items.length)fail('doppelte ID');}
function walk(v:any,depth=0):void {
 if(depth>100)fail('zu tiefe Daten');
 if(typeof v==='number'&&!Number.isFinite(v))fail('nicht endliche Zahl');
 if(v===null||v===undefined||typeof v==='string'||typeof v==='boolean'||typeof v==='number')return;
 if(v instanceof Map){for(const [k,x]of v){walk(k,depth+1);walk(x,depth+1);}return;}
 if(v instanceof Set){for(const x of v)walk(x,depth+1);return;}
 if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return;}
 if(!record(v)||Object.getPrototypeOf(v)!==Object.prototype)fail('ungültiger Datentyp');
 for(const [key,value]of Object.entries(v)){
  if(['__proto__','constructor','prototype'].includes(key))fail('ungültiger Schlüssel');
  walk(value,depth+1);
 }
}
let template:ColonySave|undefined;
function shape(value:any,example:any,path='state'):void {
 if(example===null || example===undefined)return;
 if(example instanceof Map){map(value);return;}
 if(example instanceof Set){if(!(value instanceof Set))fail(path);return;}
 if(Array.isArray(example)){array(value);return;}
 if(typeof example==='object'){
  if(!record(value))fail(path);
  for(const key of Object.keys(example)){
   if(!Object.prototype.hasOwnProperty.call(value,key))fail(`${path}.${key} fehlt`);
   shape(value[key],example[key],`${path}.${key}`);
   if(['config','broodConfig','minimumAreas','foreignEfficiency','capacity'].includes(key) && !path.includes('.rooms') && JSON.stringify(value[key])!==JSON.stringify(example[key]))fail(`${path}.${key}: nicht unterstützte Regeln`);
  }
 }else if(typeof value!==typeof example || typeof value==='number'&&(!Number.isFinite(value)||(value<0 && !path.includes('.credits.') && !path.endsWith('.compensation'))))fail(path);
}
/** Validate data before constructing a model or opening a write transaction. */
export function validateColonyState(input:unknown,legacyDigJobs=false):asserts input is ColonySave {
 walk(input);
 const x=input as any;
 if(!record(x)||x.format!=='anthive-colony'||x.schemaVersion!==9||x.encoding!=='map-set-v1'||x.rulesVersion!==1)fail('Format/Version');
 if(typeof x.id!=='string'||!x.id.trim()||typeof x.name!=='string'||!x.name.trim()||!Number.isSafeInteger(x.revision)||x.revision<0)fail('Koloniezuordnung');
 const timing=x.persistenceTiming;
 if(!record(timing)||!finite(timing.activeSeconds)||!finite(timing.lastAutosaveActiveSeconds)||Number(timing.lastAutosaveActiveSeconds)>Number(timing.activeSeconds)||!record(timing.backupDue)||![1,2,3].every(k=>finite((timing.backupDue as any)[k],1)))fail('Speicherzeit');
 const w=x.world,v=x.state;
 if(!record(w)||!record(v)||!record(w.dimensions))fail('Welt/Zustand fehlt');
 const {columns,rows,tileSize}=w.dimensions as any;
 if(!Number.isSafeInteger(columns)||!Number.isSafeInteger(rows)||columns<1||rows<1||columns*rows>1000000||!finite(tileSize,1))fail('Weltgröße');
 const inside=(p:any)=>point(p)&&p.x<columns*tileSize&&p.y<rows*tileSize;
 const cell=(c:any)=>record(c)&&Number.isInteger(c.column)&&Number.isInteger(c.row)&&(c.column as number)>=0&&(c.row as number)>=0&&(c.column as number)<columns&&(c.row as number)<rows;
 array(w.tiles);if(w.tiles.length!==rows)fail('Weltzeilen');
 for(const row of w.tiles){array(row);if(row.length!==columns)fail('Weltspalten');for(const t of row)if(!record(t)||!enums(t.terrain,['air','surface','soil','topsoil','stone','compactEarth','clay','stoneLayer','deepRock'])||!enums(t.state,['unknown','discovered','open','rubble']))fail('Kachel');}
 for(const key of ['resources','decorations','storageChambers'])array(w[key]);
 if(!record(w.landmarks))fail('Weltmarkierungen');
 for(const key of ['nestChamberCenter','queenChamberCenter','foodStoreCenter','buildingMaterialStoreCenter','waterStoreCenter','stoneOutcropCenter','surfaceFoodSource'])if(!point(w.landmarks[key]))fail('Weltmarkierung fehlt');
 if(!record(w.landmarks.broodChamberCenters)||specs.some(s=>!point((w.landmarks.broodChamberCenters as any)[s])))fail('Brutmarkierung fehlt');
 const sections=['clock','resources','gathering','workforce','engines','queen','broodSupply','adultSupply','colony','traffic','construction','materials','chambers','royal'];
 for(const key of sections)if(!record(v[key]))fail(`fehlendes System ${key}`);
 template ??= captureColony(createColonySession({id:'validation-template',name:'Validation'}));
 shape(v,template.state);
 for(const section of ['workforce','gathering','construction','broodSupply','engines','materials','chambers','queen','traffic']){
   const sectionTemplate=(template.state as any)[section];
   for(const [key,example]of Object.entries(sectionTemplate))if(example instanceof Map && example.size){
     map(v[section][key]);
     const model=example.values().next().value;
     for(const entry of v[section][key].values())shape(entry,model,`${section}.${key}`);
   }
 }
 if(!finite(v.clock.elapsedSeconds)||!finite(v.clock.secondsPerGameDay,1)||!finite(v.clock.compensation,-Infinity)||typeof v.clock.paused!=='boolean')fail('Uhr');
 for(const key of ['sources','stores'])map(v.resources[key]);
 const sources=v.resources.sources as Map<string,any>,stores=v.resources.stores as Map<string,any>;
 for(const [id,s]of [...sources,...stores])if(typeof id!=='string'||!id||s.id!==id||!point(s.position)||!enums(s.resource,kinds))fail('Ressourcen-ID');
 for(const s of sources.values())if(!enums(s.kind,['finite','unlimited'])||(s.kind==='finite'&&(!finite(s.amount)||!finite(s.capacity)||s.amount>s.capacity||!finite(s.regenerationPerDay)||!finite(s.recoveryDays)||!finite(s.recoveryDaysLeft))))fail('Quelle');
 for(const s of stores.values())if(!finite(s.amount)||!finite(s.capacity)||s.amount>s.capacity+1e-8||(s.status!=='operational'&&s.amount>1e-8)||!enums(s.status,['planned','excavated','furnishing','operational'])||typeof s.reachable!=='boolean')fail('Lager');
 map(v.workforce.workers);map(v.engines.states);map(v.gathering.workers);map(v.construction.builders);map(v.broodSupply.nurses);
 const workers=v.workforce.workers as Map<string,any>,states=v.engines.states as Map<string,any>;
 if(!record(v.progression)||!Number.isSafeInteger(v.progression.highestPopulation)||Number(v.progression.highestPopulation)<workers.size+1+(v.queen.additionalQueens instanceof Map?v.queen.additionalQueens.size:0))fail('Koloniehöchststand');
 const level=COLONY_MILESTONES.filter(n=>v.progression.highestPopulation>=n).length;
 if(v.gathering.developmentLevel!==level)fail('Sammelstufe');
 if(v.queen.developmentLevel!==level||v.broodSupply.developmentLevel!==level)fail('Pflegestufe');
 const carrying=GATHERING_DEVELOPMENT[level].carryCapacity;
 if(workers.size!==states.size)fail('Engineanzahl');
 const engines={gathering:v.gathering.workers,building:v.construction.builders,care:v.broodSupply.nurses} as Record<string,Map<string,any>>;
 const load=(l:any)=>l===null||(record(l)&&enums(l.resource,kinds)&&finite(l.amount));
 const path=(p:any,index:any)=>{array(p);if(!p.every(inside)||!Number.isInteger(index)||index<0||index>p.length)fail('Weg');};
 for(const [id,worker]of workers){const s=states.get(id);
  if(typeof id!=='string'||!id||worker.id!==id||!enums(worker.specialization,specs)||!enums(worker.assignment,[...specs,'rest'])||!s||!inside(s.position)||!enums(s.engine,['gathering','building','care','parked']))fail('Arbeitsgruppe');
  const owners=Object.entries(engines).filter(([,m])=>m.has(id));if(s.engine==='parked'?owners.length!==0:owners.length!==1||owners[0][0]!==s.engine)fail('Enginebesitzer');
 }
 for(const [engine,m]of Object.entries(engines))for(const [id,a]of m){
  if(a.id!==id||!workers.has(id)||states.get(id)?.engine!==engine||!inside(a.position))fail('fremde Ameise');
  if(engine==='gathering'){
   if(a.load&&(!enums(a.load.resource,['food','water'])||a.load.amount>carrying+1e-8)||a.expected>carrying+1e-8)fail('Sammelladung');
   if(a.efficiency!==(workers.get(id).specialization==='gathering'?1:v.workforce.foreignEfficiency))fail('Sammeleffizienz');
   if(!load(a.load)||!enums(a.phase,['idle','toSource','pickup','toStore','deposit','waiting','returning'])||!finite(a.remainingAction)||!finite(a.retryIn)||!finite(a.expected)||typeof a.collectingEnabled!=='boolean')fail('Sammelzustand');
   if(a.sourceId&&!sources.has(a.sourceId)||a.storeId&&!stores.has(a.storeId))fail('Transportziel');path(a.path,a.pathIndex);
  }
  if(engine==='care'){
   if(a.load&&(!enums(a.load.resource,['food','water'])||a.load.amount>CARE_DEVELOPMENT[level].carryCapacity+1e-8)||a.load&&a.eggId||a.job?.amount>CARE_DEVELOPMENT[level].carryCapacity+1e-8)fail('Pflegeladung');
   if(!load(a.load)||!finite(a.retry)||typeof a.enabled!=='boolean')fail('Pflegezustand');
   if(a.job){path(a.job.path,a.job.index);if(!finite(a.job.progress)||a.job.progress>v.broodSupply.config.interactionSeconds+1e-8||!finite(a.job.amount)||!enums(a.job.kind,['pickup','delivery','return','eggPickup','eggDelivery'])||!enums(a.job.phase,['walking','interaction']))fail('Pflegeauftrag');if(a.job.storeId&&!stores.has(a.job.storeId))fail('Pflegelager');}
  }
 }
 array(v.construction.orders);unique(v.construction.orders,o=>o.id);
 const orders=new Map<number,any>(v.construction.orders.map((o:any)=>[o.id,o]));
 const queenOrders=[...orders.values()].filter(o=>o.type==='queen'&&!o.cancelled);
 if(queenOrders.length>queenLimitForPopulation(v.progression.highestPopulation)-1)fail('Königinnenplätze');
 if(!Number.isSafeInteger(v.construction.nextOrderId)||v.construction.nextOrderId<=Math.max(0,...orders.keys())||v.construction.grade!==level||v.construction.developmentLevel!==level)fail('Auftragszähler/Baustufe');
 for(const o of orders.values()){
  if(!Number.isSafeInteger(o.id)||o.id<1||!enums(o.type,plans)||typeof o.paused!=='boolean'||typeof o.cancelled!=='boolean')fail('Bauauftrag');
  array(o.cells);if(!o.cells.length||!o.cells.every(cell))fail('Baufläche');unique(o.cells,c=>`${c.column},${c.row}`);
  if(o.type==='queen'&&(o.cells.length<44||o.cells.length>128||o.required!==o.cells.length*3))fail('Königinnenkammer');
  for(const k of ['progress','installed','furnishingProgress']){map(o[k]);for(const [key,amount]of o[k])if(typeof key!=='string'||!finite(amount)||!o.cells.some((c:any)=>key===`${c.column},${c.row}`))fail('Teilfortschritt');}
  if(!finite(o.used)||!finite(o.required)||o.used>o.required||[...o.installed.values()].some(n=>!Number.isInteger(n))||[...o.installed.values()].reduce((sum,n)=>sum+n,0)!==o.used)fail('Einrichtung');
 }
 for(const b of v.construction.builders.values())if(b.job){const j=b.job;path(j.path,j.pathIndex);
  if(!finite(j.progress)||!finite(j.duration,Number.MIN_VALUE)||j.progress>j.duration+1e-8||!enums(j.kind,['dig','pickup','deliver','withdraw','deliverSite','furnish'])||!enums(j.phase,['walking','digging','loading','unloading','furnishing']))fail('Baujob');
  if(j.order&&(!orders.has(j.order.id)||comparable(j.order)!==comparable(orders.get(j.order.id)))||j.storeId&&!stores.has(j.storeId)||j.target&&!cell(j.target))fail('Baujob-Ziel');
  if(['dig','furnish','withdraw','deliverSite'].includes(j.kind)&&!j.order)fail('Baujob ohne Auftrag');
  if(['dig','furnish'].includes(j.kind)&&(!j.target||!j.order.cells.some((c:any)=>c.column===j.target.column&&c.row===j.target.row)))fail('Baujob ohne Auftragszelle');
  if(!legacyDigJobs&&j.kind==='dig'&&TERRAIN_DIGGING_GRADES[w.tiles[j.target.row][j.target.column].terrain as keyof typeof TERRAIN_DIGGING_GRADES]>level)fail('Baujob ohne Grabkraft');
  if(['withdraw','deliver'].includes(j.kind)&&(!j.storeId||stores.get(j.storeId)?.resource!=='buildingMaterial'))fail('Baujob ohne Lager');
  if(['withdraw','pickup'].includes(j.kind)&&!finite(j.amount,Number.MIN_VALUE))fail('Baujob ohne Menge');
  if(j.kind==='pickup'&&(!j.pileId||!v.materials.piles.has(j.pileId)))fail('Baujob ohne Haufen');
  const phases:Record<string,string>={dig:'digging',furnish:'furnishing',pickup:'loading',withdraw:'loading',deliver:'unloading',deliverSite:'unloading'};
  if(j.phase!=='walking'&&j.phase!==phases[j.kind])fail('Baujob-Phase');
 }
 const q=v.queen;map(q.additionalQueens);array(q.eggs);array(q.buffer);array(q.births);map(q.rooms);unique(q.eggs,e=>e.id);
 const eggs=new Map<string,any>(q.eggs.map((e:any)=>[e.id,e]));
 map(v.royal.rooms);map(v.royal.eggs);map(v.chambers.chambers);
 const royalRooms=v.royal.rooms as Map<string,any>,royalEggs=v.royal.eggs as Map<string,any>;
 const finishedQueens=[...v.chambers.chambers.values()].filter((r:any)=>r.type==='queen');
 if(royalRooms.size!==finishedQueens.length||royalEggs.size>queenLimitForPopulation(v.progression.highestPopulation)-1)fail('Königinnenbestand');
 const reached=new Set<string>();
 if(royalRooms.size){
  const origin={column:Math.floor(w.landmarks.nestChamberCenter.x/tileSize),row:Math.floor(w.landmarks.nestChamberCenter.y/tileSize)},queue=[origin];
  if(w.tiles[origin.row]?.[origin.column]?.state==='open')reached.add(cellKey(origin));else queue.length=0;
  for(let i=0;i<queue.length;i++)for(const next of cardinalNeighbors(queue[i]))if(w.tiles[next.row]?.[next.column]?.state==='open'&&!reached.has(cellKey(next))){reached.add(cellKey(next));queue.push(next);}
 }
 for(const [id,r]of royalRooms){
  const chamber=v.chambers.chambers.get(r.orderId),order=orders.get(r.orderId);
  if(r.id!==id||id!==`built-${r.orderId}`||!chamber||chamber.type!=='queen'||!order||order.cancelled||order.type!=='queen'||order.status!=='furnished'||order.used!==order.required||!order.cells.every((c:any)=>order.installed.get(cellKey(c))===3)||comparable(chamber.cells)!==comparable(order.cells)||chamber.capacity!==1||q.rooms.has(id)||typeof r.operational!=='boolean'||r.operational!==chamber.operational||r.operational!==chamber.cells.every((c:any)=>reached.has(cellKey(c)))||!inside(r.position)||comparable(r.position)!==comparable(royalRoomPosition(chamber.cells,tileSize)))fail('Königinnenraum');
  if(r.operational&&!royalEggs.has(`royal-${r.orderId}`))fail('Königinnen-Ei fehlt');
  if(typeof r.produced!=='boolean'||r.produced!==royalEggs.has(`royal-${r.orderId}`))fail('Königinnen-Ei-Erzeugung');
 }
 for(const [id,e]of royalEggs){const r=royalRooms.get(e.roomId);
  if(!r||e.id!==id||id!==`royal-${r.orderId}`||e.sourceQueenId!=='queen-1'||!inside(e.position)||typeof e.arrived!=='boolean'||typeof e.carried!=='boolean'||e.arrived&&(e.carried||e.carrierId!==null)||e.carried&&!e.carrierId||e.carrierId!==null&&typeof e.carrierId!=='string')fail('Königinnen-Ei');
  if(!enums(e.stage,['egg','larva','pupa','adult'])||!finite(e.stageProgressDays)||(!e.arrived&&(e.stage!=='egg'||e.stageProgressDays!==0))||(e.stage==='adult'?e.stageProgressDays!==0:e.stageProgressDays>=ROYAL_STAGE_DAYS[e.stage as keyof typeof ROYAL_STAGE_DAYS]+1e-8))fail('Königinnenentwicklung');
  if(e.arrived&&comparable(e.position)!==comparable(r.position))fail('Königinnen-Ei-Ziel');
  if(e.carrierId){const n=v.broodSupply.nurses.get(e.carrierId);if(!n||e.carried&&(n.eggId!==id||n.targetRoomId!==e.roomId)||!e.carried&&(n.eggId||n.job?.kind!=='eggPickup'||n.job.eggId!==id))fail('Königinnen-Eiträger');}
 }
 const adults=[...royalEggs.values()].filter(e=>e.stage==='adult');
 if(q.additionalQueens.size!==adults.length)fail('Erwachsene Königinnen');
 for(const [id,queen]of q.additionalQueens){
  const room=royalRooms.get(queen.roomId),egg=room&&royalEggs.get(`royal-${room.orderId}`);
  if(!room||!egg||egg.stage!=='adult'||id!==`queen-room-${room.orderId}`||queen.id!==id||!inside(queen.position)||comparable(queen.position)!==comparable(room.position)||queen.operational!==room.operational||!finite(queen.progress)||queen.progress>=1+1e-8||!record(queen.credits)||specs.some(s=>!finite(queen.credits[s],-Infinity)))fail('Königinnenidentität');
 }
 for(const e of q.eggs)if(e.sourceQueenId!=='queen-1'&&!q.additionalQueens.has(e.sourceQueenId))fail('Quellkönigin');
 for(const id of ['queen-1',...q.additionalQueens.keys()])if(q.buffer.filter((e:any)=>e.sourceQueenId===id).length>q.config.bufferCapacity)fail('Königinnen-Eierpuffer');
 const transportEggs=new Map([...eggs,...royalEggs]);
 const carriers=[...transportEggs.values()].filter(e=>e.carrierId).map(e=>e.carrierId);if(new Set(carriers).size!==carriers.length)fail('Mehrfacher Eiträger');
 for(const [index,e]of q.eggs.entries()){if(e.id!==`egg-${index+1}`||typeof e.id!=='string'||!/^egg-[1-9][0-9]*$/.test(e.id)||!enums(e.stage,['egg','larva','pupa','adult','dead'])||!enums(e.targetSpecialization,specs)||!finite(e.stageProgressDays)||typeof e.arrived!=='boolean'||typeof e.carried!=='boolean')fail('Brut');
  if(['egg','larva','pupa'].includes(e.stage)&&e.stageProgressDays>q.broodConfig.stageDays[e.stage]+1e-8)fail('Brutfortschritt');
  if(e.carrierId){const n=v.broodSupply.nurses.get(e.carrierId);if(!n||e.carried&&n.eggId!==e.id||!e.carried&&n.job?.eggId!==e.id)fail('Eiträger');}
  if(e.chamberId&&!q.rooms.has(e.chamberId))fail('Brutkammer');
 }
 const buffered=new Set(q.buffer.map((e:any)=>e.id));
 if(q.eggs.some((e:any)=>!e.arrived&&!buffered.has(e.id)))fail('Ei fehlt im Puffer');
 unique(q.births,b=>b.id);
 for(const birth of q.births){const egg=eggs.get(birth.eggId);if(!egg||egg.stage!=='adult'||birth.id!==`born-${egg.id}`||workers.has(birth.id)||birth.chamberId!==egg.chamberId||!enums(birth.specialization,specs))fail('Geburtswarteschlange');}
 unique(q.buffer,e=>e.id);for(const e of q.buffer)if(!eggs.has(e.id)||e.arrived||JSON.stringify(e)!==JSON.stringify(eggs.get(e.id)))fail('Eierpuffer');
 for(const n of v.broodSupply.nurses.values())if(n.eggId){const e=transportEggs.get(n.eggId);if(!e||e.carrierId!==n.id||!e.carried)fail('getragenes Ei');}
 for(const key of ['quotas','credits']){if(!record(q[key]))fail('Eierverteilung');for(const s of specs)if(!finite(q[key][s],key==='credits'?-Infinity:0))fail('Eieranteil');}
 if(!finite(q.progress)||q.progress>1+1e-8||!finite(q.eggFactor)||q.eggFactor>1)fail('Eiablage');
 for(const state of Object.values(v.adultSupply.states) as any[])if(['workFactor','eggFactor','recoveryProgress','recoveryWork','recoveryEgg'].some(key=>!finite(state[key])||state[key]>1+1e-8))fail('Erwachsenenversorgung');
 if(v.adultSupply.lossProgress>1+1e-8)fail('Verlustguthaben');
 if(specs.some(s=>q.quotas[s]>100)||Math.abs(specs.reduce((sum,s)=>sum+q.quotas[s],0)-100)>1e-8)fail('Eieranteile müssen 100 ergeben');
 for(const n of v.broodSupply.nurses.values())if(n.job){const j=n.job;
   if(['eggPickup','eggDelivery'].includes(j.kind)){
     const egg=transportEggs.get(j.eggId),target=egg?.chamberId??egg?.roomId;
     if(!egg||egg.carrierId!==n.id||(!q.rooms.has(j.roomId)&&!royalRooms.has(j.roomId))||target!==j.roomId||j.kind==='eggPickup'&&(egg.carried||n.eggId)||j.kind==='eggDelivery'&&(!egg.carried||n.eggId!==j.eggId))fail('Ei-Auftragsreferenz');
   }else{
     if(!enums(j.resource,['food','water'])||!finite(j.amount,Number.MIN_VALUE))fail('Pflege-Auftragsressource');
     if(['pickup','return'].includes(j.kind)&&(!stores.has(j.storeId)||stores.get(j.storeId).resource!==j.resource))fail('Pflege-Auftragslager');
     if(['pickup','delivery'].includes(j.kind)&&!v.broodSupply.rooms.has(j.roomId))fail('Pflege-Auftragskammer');
     if(['return','delivery'].includes(j.kind)&&(!n.load||n.load.resource!==j.resource))fail('Pflege-Auftragsladung');
   }
 }
 map(v.broodSupply.rooms);map(v.broodSupply.shortage.rooms);map(v.chambers.chambers);
 for(const [id,r]of v.broodSupply.rooms){if(r.id!==id||typeof r.royal!=='boolean'||r.royal!==royalRooms.has(id)||typeof r.adultQueen!=='boolean'||r.royal&&(r.capacity!==1||r.larvae!==([...royalEggs.values()].some(e=>e.roomId===id&&e.arrived&&e.stage==='larva')?1:0)))fail('Larvenkammer');for(const k of ['food','water']){
  const stock=r[k];if(!record(stock)||['amount','capacity','target','consumed','unmet'].some(key=>!finite(stock[key]))||Number(stock.amount)>Number(stock.capacity)+1e-8||typeof stock.refilling!=='boolean')fail('Larvenvorrat');
 }}
 const expectedQueens=new Map([['queen-1',{position:q.queenOrigin,operational:true}],...q.additionalQueens.entries()]);
 const expectedSupply=new Map([...expectedQueens].map(([id,queen]:any)=>[queenSupplyRoomId(id),queen]));
 for(const [id,room]of v.broodSupply.rooms)if(room.adultQueen){
  const queen=expectedSupply.get(id);if(!queen||room.royal||room.larvae!==0||room.capacity!==1||comparable(room.position)!==comparable(queen.position)||room.operational!==queen.operational)fail('Königinnenvorrat');
  for(const k of ['food','water'])if(room[k].capacity!==10||room[k].target!==10)fail('Königinnenvorratsgröße');
 }
 for(const id of expectedSupply.keys())if(!v.broodSupply.rooms.get(id)?.adultQueen)fail('Königinnenvorrat fehlt');
 for(const [id,s]of v.broodSupply.shortage.rooms){if(!v.broodSupply.rooms.has(id)||['larvae','coverage','shortageDays','severeDays','nonSevereDays','restoredDays','recoveryStart','lossCredit','losses','warnings'].some(key=>!finite(s[key]))||s.coverage>1||s.recoveryStart>1||s.lossCredit>1+1e-8||!Number.isInteger(s.larvae))fail('Larvenmangelzustand');}
 for(const resource of ['food','water']){
  let accounted=v.broodSupply.returned[resource];
  for(const room of v.broodSupply.rooms.values())accounted+=room[resource].amount+room[resource].consumed;
  for(const nurse of v.broodSupply.nurses.values())if(nurse.load?.resource===resource)accounted+=nurse.load.amount;
  array(v.broodSupply.drops);for(const drop of v.broodSupply.drops){if(!inside(drop.position)||!load(drop.load)||!drop.load)fail('Pflege-Bodenladung');if(drop.load.resource===resource)accounted+=drop.load.amount;}
  const withdrawn=v.broodSupply.withdrawn[resource];if(Math.abs(withdrawn-accounted)>1e-7*Math.max(1,withdrawn))fail('Larvenressourcenbilanz');
 }
 const m=v.materials;for(const k of ['piles','carriers','sites'])map(m[k]);
 for(const [id,p]of m.piles)if(id!==p.id||!point(p.position)||!finite(p.amount))fail('Materialhaufen');
 for(const [id,amount]of m.carriers)if(!v.construction.builders.has(id)||!finite(amount))fail('Materialträger');
 for(const [id,site]of m.sites)if(!orders.has(id)||!point(site.position)||!finite(site.amount))fail('Baustellenmaterial');
 const sum=(a:number[])=>a.reduce((s,n)=>s+n,0);
 const stored=sum([...stores.values()].filter(s=>s.resource==='buildingMaterial').map(s=>s.amount));
 const total=stored+sum([...m.piles.values()].map((p:any)=>p.amount))+sum([...m.carriers.values()])+sum([...m.sites.values()].map((s:any)=>s.amount))+m.consumed;
 if(!finite(m.initial)||!finite(m.produced)||!finite(m.consumed)||Math.abs(m.initial+m.produced-total)>1e-7*Math.max(1,total))fail('Materialbilanz');
 for(const [id,room]of v.chambers.chambers){
   const order=orders.get(id);
   if(room.id!==id||!order||room.type!==order.type||comparable(room.cells)!==comparable(order.cells)||!finite(room.capacity)||typeof room.operational!=='boolean'||room.storeId&&!stores.has(room.storeId))fail('fertige Kammer');
 }
 if(!(v.construction.reservations instanceof Set))fail('Grabreservierungen');
 const reserved=new Set<string>();
 for(const b of v.construction.builders.values())if(b.job?.target){
   const key=`${b.job.target.column},${b.job.target.row}`;
   if(reserved.has(key))fail('doppeltes Grabziel');reserved.add(key);
 }
 if(reserved.size!==v.construction.reservations.size||[...reserved].some(k=>!v.construction.reservations.has(k)))fail('abweichende Grabreservierungen');
 map(v.engines.rest.reservations);const spots=new Set();
 for(const [id,r]of v.engines.rest.reservations){if(!workers.has(id)||spots.has(r.spotId)||!point(r.position)||!point(r.target)||typeof r.occupied!=='boolean')fail('Ruheplatz');spots.add(r.spotId);path(r.path,r.index);
   const room=[...v.chambers.chambers.values()].find((c:any)=>`built-${c.id}`===r.roomId&&c.type==='rest'&&c.operational);
   if(!room||!room.cells.some((c:any)=>[0,1].some(i=>r.spotId===`${r.roomId}:${c.column},${c.row}:${i}`&&Math.abs(r.target.x-(c.column+(i===0?.35:.65))*tileSize)<1e-7&&Math.abs(r.target.y-(c.row+.5)*tileSize)<1e-7)))fail('unbekannter Ruheplatz');
   const engine=states.get(id).engine,pos=engine==='parked'?states.get(id).position:engines[engine].get(id).position;
   if(Math.hypot(pos.x-r.position.x,pos.y-r.position.y)>1e-7||r.occupied&&Math.hypot(pos.x-r.target.x,pos.y-r.target.y)>1e-7)fail('Ruheposition');}
}
