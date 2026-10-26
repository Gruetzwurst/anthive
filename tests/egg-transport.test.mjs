import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {BroodSupplySystem} from '../src/game/simulation/broodSupplySystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
const p=c=>({x:(c+.5)*24,y:84}),room={id:'r',specialization:'gathering',capacity:40,operational:true,position:p(8)};
function queen(){const q=new QueenSystem();q.requireEggTransport(p(1));q.setQuotas({gathering:100,building:0,care:0,combat:0});q.advance(.2,1,[room],10);return q;}
test('reserved eggs remain by the queen and never develop before real delivery',()=>{
 const q=queen();assert.equal(q.snapshot.bufferCount,1);assert.equal(q.snapshot.assignedCount,0);q.advance(10,0,[room],100);assert.equal(q.snapshot.eggs[0].stageProgressDays,0);
 assert.equal(q.claimEgg('egg-1','n'),true);assert.equal(q.claimEgg('egg-1','other'),false);assert.equal(q.deliverEgg('egg-1','n'),false);
 assert.equal(q.pickUpEgg('egg-1','n'),true);q.advance(10,0,[room],100);assert.equal(q.snapshot.eggs[0].stageProgressDays,0);assert.equal(q.deliverEgg('egg-1','n'),true);assert.equal(q.deliverEgg('egg-1','n'),false);
 assert.equal(q.snapshot.bufferCount,0);q.advance(1,0,[room],1);assert.equal(q.snapshot.eggs[0].stage,'larva');
});
test('loss of a carrier preserves the same egg at its real position for another carrier',()=>{
 const q=queen();q.claimEgg('egg-1','n');q.pickUpEgg('egg-1','n');q.releaseEgg('egg-1','n',p(4));
 assert.deepEqual(q.getEggRequests()[0].position,p(4));assert.equal(q.claimEgg('egg-1','replacement'),true);assert.equal(q.pickUpEgg('egg-1','replacement'),true);assert.equal(q.deliverEgg('egg-1','replacement'),true);assert.equal(q.snapshot.laidEggs,1);
});
test('real nursing paths carry exactly one egg, finish before reassignment and preserve reservations',()=>{
 const world=createStartingWorld();world.dimensions={columns:14,rows:7,tileSize:24};world.decorations=[];world.tiles=Array.from({length:7},()=>Array.from({length:14},()=>({terrain:'topsoil',state:'discovered'})));for(let c=0;c<12;c++)world.tiles[3][c].state='open';
 const q=queen(),s=new BroodSupplySystem(new ResourceSystem(),new CollectorNavigation(world));s.setEggTransport(q);s.addNurse('a',p(0));s.addNurse('b',p(0));
 for(let i=0;i<1000&&!s.getNurses().some(n=>n.eggId);i++)s.advanceWorkers(.05);
 const carrying=s.getNurses().filter(n=>n.eggId);assert.equal(carrying.length,1);assert.equal(q.snapshot.assignedCount,0);s.setNursingEnabled(carrying[0].id,false);
 for(let i=0;i<1000&&q.snapshot.assignedCount!==1;i++)s.advanceWorkers(.05);
 assert.equal(q.snapshot.assignedCount,1);assert.equal(q.snapshot.eggs[0].stageProgressDays,0);assert.ok(s.getNurses().every(n=>!n.eggId));
});
test('the full game waits for explicitly assigned care, then carries and starts the same real egg',()=>{
 const world=createStartingWorld(),s=createWorkforceSimulation(world,{workers:()=>[],addWorker:()=>{},removeWorker:()=>{},retireWorker:()=>{},advanceWorkers:()=>{}});
 s.queen.setQuotas({gathering:100,building:0,care:0,combat:0});s.queen.advance(.2,1,s.queen.snapshot.chambers);s.advance(1);
 assert.equal(s.queen.snapshot.bufferCount,1);assert.equal(s.queen.snapshot.assignedCount,0);s.moveWorkers('gathering','gathering','care',1);
 for(let i=0;i<3000&&!s.getWorkers().some(w=>w.eggId);i++)s.advance(.05);assert.equal(s.getWorkers().filter(w=>w.eggId).length,1);
 for(let i=0;i<3000&&s.queen.snapshot.assignedCount!==1;i++)s.advance(.05);
 assert.equal(s.queen.snapshot.assignedCount,1);assert.equal(s.queen.snapshot.bufferCount,0);assert.equal(s.queen.snapshot.laidEggs,1);assert.equal(s.getWorkers().length,7);
});
