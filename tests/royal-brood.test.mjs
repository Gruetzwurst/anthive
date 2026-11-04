import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession} from '../src/game/persistence/colonySession.ts';
import {squareTemplate,constructionMaterialEstimate} from '../src/game/simulation/constructionPlanning.ts';
import {chamberCapacity} from '../src/game/simulation/chamberSystem.ts';
function fixture(){
 const a=createColonySession({id:'royal',name:'Royal'});a.simulation.restoreProgression({highestPopulation:150});
 const center=a.world.landmarks.foodStoreCenter,c={column:Math.floor(center.x/24),row:Math.floor(center.y/24)};
 const room={id:20,type:'queen',cells:[c],capacity:1,operational:true};return {a,room};
}
test('queen places unlock at50/150/500/1000 and count the existing queen',()=>{
 const a=createColonySession({id:'a',name:'A'});assert.ok(a.royal,'royal brood model must exist');
 for(const [peak,max]of [[49,1],[50,2],[149,2],[150,3],[499,3],[500,4],[999,4],[1000,5]]){a.simulation.restoreProgression({highestPopulation:peak});assert.equal(a.royal.maxQueens,max);}
});
test('queen template is11x4 and costs132 material with one queen place regardless of extra area',()=>{
 const cells=squareTemplate('queen','small',{column:10,row:20});assert.equal(cells.length,44);
 assert.equal(Math.max(...cells.map(c=>c.column)),20);assert.equal(Math.max(...cells.map(c=>c.row)),23);
 assert.equal(constructionMaterialEstimate('queen',44),132);assert.equal(chamberCapacity('queen',44),1);assert.equal(chamberCapacity('queen',80),1);
});
test('a real source queen lays only one special egg after the destination becomes operational',()=>{
 const {a,room}=fixture(),normal=a.simulation.queen.snapshot.laidEggs;
 a.royal.syncRooms([{...room,operational:false}]);assert.equal(a.royal.getEggRequests().length,0);
 a.royal.syncRooms([room]);a.royal.syncRooms([room]);const requests=a.royal.getEggRequests();assert.equal(requests.length,1);
 assert.deepEqual(requests[0].position,a.world.landmarks.queenChamberCenter);assert.notDeepEqual(requests[0].position,requests[0].destination);
 assert.equal(a.simulation.queen.snapshot.laidEggs,normal);
});
test('royal egg carrier reservation is exclusive and a dropped egg resumes at its real position',()=>{
 const {a,room}=fixture();a.royal.syncRooms([room]);const id=a.royal.getEggRequests()[0].eggId;
 assert.equal(a.royal.claimEgg(id,'first'),true);assert.equal(a.royal.claimEgg(id,'second'),false);assert.equal(a.royal.pickUpEgg(id,'second'),false);
 assert.equal(a.royal.pickUpEgg(id,'first'),true);const drop={x:100,y:100};a.royal.releaseEgg(id,'first',drop);
 assert.deepEqual(a.royal.getEggRequests()[0].position,drop);assert.equal(a.royal.claimEgg(id,'second'),true);assert.equal(a.royal.pickUpEgg(id,'second'),true);
 assert.equal(a.royal.deliverEgg(id,'second'),true);a.royal.syncRooms([room]);assert.equal(a.royal.getEggRequests().length,0);assert.equal(a.royal.getEggs().length,1);assert.equal(a.royal.getEggs()[0].arrived,true);
});
test('existing nurse workflow physically delivers royal eggs without normal brood allocation',()=>{
 const {a,room}=fixture();a.royal.syncRooms([room]);
 for(let i=0;i<2000&&!a.royal.getEggs()[0].arrived;i++)a.simulation.broodSupply.advanceWorkers(.05);
 assert.equal(a.royal.getEggs()[0].arrived,true);assert.deepEqual(a.royal.getEggs()[0].position,{x:(room.cells[0].column+.5)*24,y:(room.cells[0].row+.5)*24});
 assert.equal(a.simulation.queen.snapshot.laidEggs,0);assert.ok(a.simulation.broodSupply.getNurses().every(n=>!n.eggId));
});
test('a blocked pickup route releases the uncollected egg so a nurse can retry',()=>{
 const {a,room}=fixture();a.royal.syncRooms([room]);a.simulation.broodSupply.removeNurse('nurse-0');a.simulation.broodSupply.addNurse('retry',a.world.landmarks.foodStoreCenter);
 a.simulation.broodSupply.advanceWorkers(.01);const n=a.simulation.broodSupply.exportState().nurses.get('retry');assert.equal(n.job.kind,'eggPickup');
 const next=n.job.path[n.job.index],col=Math.floor(next.x/24),row=Math.floor(next.y/24),tile=a.world.tiles[row][col],old=tile.state;
 tile.state='discovered';a.simulation.traffic.invalidateTopology();a.simulation.broodSupply.advanceWorkers(.1);
 assert.equal(a.royal.getEggs()[0].carrierId,null,'blocked pickup must release its reservation');
 tile.state=old;a.simulation.traffic.invalidateTopology();a.simulation.broodSupply.advanceWorkers(100);assert.equal(a.royal.getEggs()[0].arrived,true);
});
