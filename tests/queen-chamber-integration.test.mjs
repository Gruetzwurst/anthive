import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession,captureColony,serializeColony,parseColony,restoreColony} from '../src/game/persistence/colonySession.ts';
import {squareTemplate} from '../src/game/simulation/constructionPlanning.ts';
function fixture(peak=150){
 const a=createColonySession({id:'queen-build',name:'Queen Build'});a.simulation.restoreProgression({highestPopulation:peak});a.syncConstruction();
 let cells;
 for(const column of [100,80,60,40,200,220]){const candidate=squareTemplate('queen','small',{column,row:28});if(a.excavation.validateOrder(candidate,'queen').valid){cells=candidate;break;}}
 assert.ok(cells);return {a,cells};
}
function finishRoom(){
 const {a,cells}=fixture();const w=a.world,s=w.dimensions.tileSize;
 let col=Math.floor(w.landmarks.nestChamberCenter.x/s),row=Math.floor(w.landmarks.nestChamberCenter.y/s);
 while(col!==cells[0].column){w.tiles[row][col].state='open';col+=Math.sign(cells[0].column-col);}while(row!==cells[0].row){w.tiles[row][col].state='open';row+=Math.sign(cells[0].row-row);}
 for(const c of cells)w.tiles[c.row][c.column].state='open';a.simulation.traffic.invalidateTopology();
 const pile=a.excavation.materials.produce(w.landmarks.buildingMaterialStoreCenter,132);
 while(a.excavation.materials.getGround().some(p=>p.id===pile)){a.excavation.materials.pickUp(pile,'builder-0',5);a.excavation.materials.deposit('builder-0','building-material-store');}
 const id=a.excavation.addOrder(cells,'queen');a.syncConstruction();assert.equal(a.royal.getEggs().length,0);
 for(let n=0;n<20000&&a.excavation.getConstructionOrders()[0].status!=='furnished';n++)a.excavation.advance(.25);
 assert.equal(a.excavation.getConstructionOrders()[0].status,'furnished');assert.equal(a.excavation.materials.balance.consumed,132);
 a.syncConstruction();return {a,cells,id};
}
test('accepted queen plans reserve slots through pause and release them on cancellation',()=>{
 const {a,cells}=fixture();a.simulation.restoreProgression({highestPopulation:49});assert.equal(a.excavation.validateOrder(cells,'queen').valid,false);
 a.simulation.restoreProgression({highestPopulation:50});const id=a.excavation.addOrder(cells,'queen');assert.equal(a.excavation.queenSlotsAvailable,0);
 a.excavation.pauseOrder(id);assert.equal(a.excavation.queenSlotsAvailable,0);a.excavation.cancelOrder(id);assert.equal(a.excavation.queenSlotsAvailable,1);
 assert.equal(a.excavation.validateOrder(cells.slice(0,43),'queen').valid,false);
});
test('real furnishing consumes132 material and creates one saved special egg without a queen spawn',()=>{
 const {a}=finishRoom();assert.equal(a.royal.getEggs().length,1);assert.equal(a.simulation.getProgression().population,a.simulation.workforce.size+1);
 const save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);b.syncConstruction();assert.equal(b.royal.getEggs().length,1);
});
test('operational queen rooms cannot silently regenerate a missing egg or bypass real furnishing on load',()=>{
 const {a}=finishRoom(),missing=captureColony(a);missing.state.royal.eggs.clear();assert.throws(()=>restoreColony(missing));
 const unfinished=captureColony(a),order=unfinished.state.construction.orders.find(o=>o.type==='queen');order.used=0;order.installed.clear();assert.throws(()=>restoreColony(unfinished));
});
test('pending queen rooms consume every unlocked place without allowing overbooking',()=>{
 const {a,cells}=fixture(150);a.excavation.addOrder(cells,'queen');
 let second;
 for(const column of [80,60,40,220]){const candidate=squareTemplate('queen','small',{column,row:28});if(a.excavation.validateOrder(candidate,'queen').valid){second=candidate;break;}}
 assert.ok(second);a.excavation.addOrder(second,'queen');assert.equal(a.excavation.queenSlotsAvailable,0);
 assert.equal(a.excavation.validateOrder(squareTemplate('queen','small',{column:20,row:28}),'queen').valid,false);
 const save=captureColony(a);assert.deepEqual(captureColony(restoreColony(save)),save);
});
test('a previously produced egg remains mandatory after its room becomes unreachable',()=>{
 const {a,cells}=finishRoom(),selected=new Set(cells.map(c=>`${c.column},${c.row}`));
 for(const c of cells)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=c.column+dx,y=c.row+dy;if(!selected.has(`${x},${y}`)&&a.world.tiles[y]?.[x]?.state==='open')a.world.tiles[y][x].state='discovered';}
 a.simulation.traffic.invalidateTopology();a.excavation.chambers.refreshAccess();a.syncConstruction();const save=captureColony(a);
 assert.equal(save.state.royal.rooms.values().next().value.operational,false);save.state.royal.eggs.clear();assert.throws(()=>restoreColony(save));
});
test('old save formats cannot silently discard royal sections of an unexpected shape',()=>{
 for(const royal of [{eggs:[],rooms:[]},{unknown:'data'},{}]){
  const save=captureColony(createColonySession({id:'old-unknown',name:'Old Unknown'}));save.schemaVersion=6;save.state.royal=royal;assert.throws(()=>restoreColony(save));
 }
});
test('claimed and carried royal eggs roundtrip, resume physically and reject broken carrier references',()=>{
 const {a}=finishRoom();
 for(let n=0;n<2000&&!a.simulation.broodSupply.getNurses().some(n=>n.eggId?.startsWith('royal-'));n++)a.simulation.broodSupply.advanceWorkers(.05);
 assert.ok(a.simulation.broodSupply.getNurses().some(n=>n.eggId?.startsWith('royal-')));
 const save=captureColony(a),b=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(b),save);
 for(let n=0;n<4000&&!b.royal.getEggs()[0].arrived;n++)b.simulation.broodSupply.advanceWorkers(.05);
 assert.equal(b.royal.getEggs()[0].arrived,true);const arrived=captureColony(b);assert.equal(restoreColony(arrived).royal.getEggs().length,1);
 const egg=save.state.royal.eggs.values().next().value;egg.carrierId='missing';assert.throws(()=>restoreColony(save));
});
