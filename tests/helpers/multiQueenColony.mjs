import assert from 'node:assert/strict';
import {createColonySession} from '../../src/game/persistence/colonySession.ts';
import {squareTemplate} from '../../src/game/simulation/constructionPlanning.ts';

/** Technical fixture: pre-dug legal sites, real furnishing/transport/development.
 * Explicit fixture resources/population are not a growth or balance simulation. */
export function multiQueenColony(queens=5){
 const peak=queens===5?1000:queens===4?500:queens===3?150:50;
 const a=createColonySession({id:`acceptance-${queens}`,name:'D2.7 technical colony'}),g=a.simulation,e=a.excavation,w=a.world;
 g.restoreProgression({highestPopulation:peak});a.syncConstruction();
 for(let n=1;n<queens;n++){
  let cells;
  for(const row of [42,56])for(const column of [140,160,180,200,220,100,80]){
   if(cells)break;const candidate=squareTemplate('queen','small',{column,row});if(e.validateOrder(candidate,'queen').valid)cells=candidate;
  }
  assert.ok(cells,'legal queen site');
  let col=Math.floor(w.landmarks.nestChamberCenter.x/24),row=Math.floor(w.landmarks.nestChamberCenter.y/24);
  while(row<52){w.tiles[row][col].state='open';row++;}
  while(col!==cells[0].column){w.tiles[row][col].state='open';col+=Math.sign(cells[0].column-col);}
  while(row!==cells[0].row){w.tiles[row][col].state='open';row+=Math.sign(cells[0].row-row);}
  for(const cell of cells)w.tiles[cell.row][cell.column].state='open';g.traffic.invalidateTopology();
  const pile=e.materials.produce(w.landmarks.buildingMaterialStoreCenter,132);
  while(e.materials.getGround().some(p=>p.id===pile)){e.materials.pickUp(pile,'builder-0',5);e.materials.deposit('builder-0','building-material-store');}
  assert.ok(g.navigation.findPath(w.landmarks.queenChamberCenter,{x:(cells[0].column+.5)*24,y:(cells[0].row+.5)*24}),'fixture tunnel is actually walkable below the pond');
  const id=e.addOrder(cells,'queen');
  for(let i=0;i<20000&&e.getConstructionOrders().find(o=>o.id===id).status!=='furnished';i++)e.advance(.25);
  assert.equal(e.getConstructionOrders().find(o=>o.id===id).status,'furnished');a.syncConstruction();
 }
 for(const resource of ['food','water'])g.resources.depositInStore(`${resource}-store`,{resource,amount:300});
 const b=g.broodSupply,q=g.queen;
 const nursesUntil=condition=>{for(let i=0;i<12000&&!condition();i++)b.advanceWorkers(.25);assert.ok(condition(),JSON.stringify({nurses:b.getNurses(),royal:a.royal.getEggs(),rooms:a.royal.snapshot.chambers,routes:a.royal.getEggRequests().map(e=>({id:e.eggId,from:g.navigation.findPath(b.getNurses()[0].position,e.position)?.length,to:g.navigation.findPath(e.position,e.destination)?.length}))}));};
 nursesUntil(()=>a.royal.getEggs().every(e=>e.arrived));
 const develop=days=>{q.advance(days,0,q.snapshot.chambers,1,d=>{for(const loss of b.consume(d,q.getLarvalRooms()))q.loseLarvae(loss.roomId,loss.count);},b);b.syncRooms(q.getLarvalRooms());};
 develop(.2);
 nursesUntil(()=>b.getRooms().filter(r=>r.royal).every(r=>r.food.amount>=.6&&r.water.amount>=.6));
 develop(1);assert.equal(q.queenCount,queens);a.syncConstruction();
 nursesUntil(()=>b.getRooms().filter(r=>r.adultQueen).every(r=>r.food.amount>5&&r.water.amount>5));
 return a;
}

export function populateColony(a,population,{gatherers=200,nurses=20,builders=20}={}){
 const g=a.simulation,engines=g.exportWorkforceState(),counts={gathering:0,care:0,building:0,combat:0};
 for(const w of g.workforce.getWorkers())counts[w.specialization]++;
 while(g.workforce.size+g.queen.queenCount<population){
  const specialization=counts.gathering<gatherers?'gathering':counts.care<nurses?'care':counts.building<builders?'building':'combat';
  const id=`acceptance-worker-${g.workforce.size}`;g.workforce.addWorker(id,specialization);counts[specialization]++;
  engines.states.set(id,{engine:'parked',position:{...a.world.landmarks.nestChamberCenter}});
 }
 g.restoreWorkforceState(engines);g.getProgression();g.advance(.001);return counts;
}
