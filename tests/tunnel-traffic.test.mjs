import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {TunnelTrafficSystem} from '../src/game/simulation/tunnelTrafficSystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {GatheringSystem} from '../src/game/simulation/gatheringSystem.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {createWorkforceSimulation} from '../src/game/simulation/workforceSimulation.ts';
const point=(column,row=3)=>({x:(column+.5)*24,y:(row+.5)*24});
function fixture(){
 const world=createStartingWorld();world.dimensions={columns:16,rows:8,tileSize:24};world.decorations=[];
 world.tiles=Array.from({length:8},()=>Array.from({length:16},()=>({terrain:'topsoil',state:'discovered'})));
 for(let c=1;c<14;c++)world.tiles[3][c].state='open';
 return{world,traffic:new TunnelTrafficSystem(world)};
}
test('empty and lightly occupied corridors retain base speed; crowded segments always keep moving',()=>{
 const {traffic}=fixture();traffic.advance(0,[]);assert.equal(traffic.speedFactor(point(6)),1);
 traffic.advance(1,Array.from({length:4},()=>point(6)));assert.equal(traffic.speedFactor(point(6)),1);
 traffic.advance(1,Array.from({length:500},()=>point(6)));assert.equal(traffic.speedFactor(point(6)),.6);
 assert.equal(traffic.speedFactor(point(10)),1);assert.equal(traffic.stats.agents,500);
});
test('wide rooms and surface positions do not produce narrow-tunnel congestion',()=>{
 const {world,traffic}=fixture();for(let c=4;c<8;c++)world.tiles[2][c].state='open';
 traffic.advance(0,Array.from({length:30},()=>point(6)));assert.equal(traffic.speedFactor(point(6)),1);
 world.tiles[3][6].terrain='air';traffic.invalidateTopology();traffic.advance(1,Array.from({length:30},()=>point(6)));assert.equal(traffic.speedFactor(point(6)),1);
});
test('weighted existing navigation chooses a longer free detour and never crosses a solid cell',()=>{
 const {world,traffic}=fixture();for(let c=1;c<=12;c++)world.tiles[1][c].state='open';world.tiles[2][1].state='open';world.tiles[2][12].state='open';
 traffic.advance(0,Array.from({length:50},(_,i)=>point(4+i%8)));
 const nav=new CollectorNavigation(world,traffic),path=nav.findPath(point(1),point(12));
 assert.ok(path.some(p=>p.y===point(1,1).y));assert.ok(path.every(p=>world.tiles[Math.floor(p.y/24)][Math.floor(p.x/24)].state==='open'));
 world.tiles[1][6].state='discovered';traffic.invalidateTopology();const blocked=nav.findPath(point(1),point(12));
 assert.ok(blocked.every(p=>p.y===point(1).y));
 traffic.advance(1,[]);assert.ok(nav.findPath(point(1),point(12)).every(p=>p.y===point(1).y));
});
test('traffic snapshots are throttled and aggregate hundreds of individuals into segment counts',()=>{
 const {traffic}=fixture();const positions=Array.from({length:600},(_,i)=>point(1+i%12));traffic.advance(0,positions);
 const updates=traffic.stats.updates;for(let i=0;i<49;i++)traffic.advance(.01,positions);
 assert.equal(traffic.stats.updates,updates);traffic.advance(.02,positions);assert.equal(traffic.stats.updates,updates+1);
 assert.equal(traffic.stats.agents,600);assert.ok(traffic.stats.buckets<=4);
});
function transport(crowded){
 const {world,traffic}=fixture();traffic.advance(0,crowded?Array.from({length:30},()=>point(6)):[]);
 const resources=new ResourceSystem();resources.addSource({id:'food',resource:'food',kind:'finite',position:point(7),capacity:5,amount:5,regenerationPerDay:0,recoveryDays:2});
 resources.addStore({id:'food-store',resource:'food',position:point(5),capacity:5,amount:0,status:'operational',reachable:true});
 const gathering=new GatheringSystem(resources,new CollectorNavigation(world,traffic));gathering.addCollector('a',point(5));
 return{world,traffic,resources,gathering};
}
test('actual collection slows only movement and credits stock only after a real conserved delivery',()=>{
 const free=transport(false),busy=transport(true);free.gathering.advance(.2);busy.gathering.advance(.2);
 const a=free.gathering.getCollectors()[0],b=busy.gathering.getCollectors()[0];
 assert.ok(Math.abs((b.position.x-point(5).x)/(a.position.x-point(5).x)-.6)<1e-8);
 assert.equal(busy.resources.getStore('food-store').amount,0);
 for(let i=0;i<1000&&busy.resources.getStore('food-store').amount<5;i++)busy.gathering.advance(.05);
 assert.equal(busy.resources.getStore('food-store').amount,5);assert.equal(busy.resources.getSource('food').amount,0);assert.equal(busy.gathering.getCollectors()[0].load,null);
});
test('builders share the traffic slowdown without slowing dig actions or violating reservations/material conservation',()=>{
 const {world,traffic}=fixture();world.tiles[3][8].state='discovered';traffic.invalidateTopology();traffic.advance(0,Array.from({length:30},()=>point(6)));
 const e=new ExcavationSystem(world,new ResourceSystem());e.setTraffic(traffic);e.addBuilder('a',point(5));e.addBuilder('b',point(4));e.addOrder([{column:8,row:3}]);
 e.advance(.2);assert.ok(Math.abs(e.getBuilders()[0].position.x-point(5).x-78*.6*.2)<1e-8);
 assert.equal(e.getBuilders().filter(w=>w.job?.kind==='dig').length,1);
 for(let i=0;i<500&&e.getBuilders()[0].job?.phase!=='digging';i++)e.advance(.01);
 const progress=e.getBuilders()[0].job.progress;e.advance(1);assert.ok(Math.abs(e.getBuilders()[0].job.progress-progress-1)<1e-8);
 e.advance(10);const b=e.materials.balance;assert.equal(b.produced,1);assert.equal(b.initial+b.produced,b.stored+b.carried+b.ground+b.atSites+b.consumed);
});
test('one shared snapshot includes collectors, builders and parked workers exactly once',()=>{
 const {world}=fixture();world.landmarks.nestChamberCenter=point(5);world.resources=[];world.storageChambers=[];
 let e;const simulation=createWorkforceSimulation(world,(resources,traffic)=>{
  e=new ExcavationSystem(world,resources);e.setTraffic(traffic);e.addBuilder('builder',point(6));
  return{workers:()=>e.getBuilders(),addWorker:(id,p)=>e.addBuilder(id,p),removeWorker:id=>e.removeBuilder(id),retireWorker:id=>e.removeBuilder(id),advanceWorkers:(s,f)=>e.advance(s,f)};
 });simulation.advance(.1);assert.equal(simulation.traffic.stats.agents,8);
 simulation.moveWorkers('building','building','rest',1);simulation.advance(.6);assert.equal(simulation.traffic.stats.agents,8);
 assert.equal(simulation.getWorkers().filter(w=>w.actualWork==='rest').length,1);
});
test('500 actual collectors retain individual identities and conserve stock in sustained counterflow',()=>{
 const {world,traffic}=fixture(),resources=new ResourceSystem();
 resources.addSource({id:'food',resource:'food',kind:'finite',position:point(12),capacity:5000,amount:5000,regenerationPerDay:0,recoveryDays:2});
 resources.addStore({id:'store',resource:'food',position:point(1),capacity:5000,amount:0,status:'operational',reachable:true});
 const gathering=new GatheringSystem(resources,new CollectorNavigation(world,traffic));
 for(let i=0;i<500;i++)gathering.addCollector(`worker-${i}`,point(1+i%12));
 for(let i=0;i<100;i++){traffic.advance(.1,gathering.getCollectors().map(w=>w.position));gathering.advance(.1);}
 const workers=gathering.getCollectors(),stock=resources.getStore('store').amount;
 assert.equal(workers.length,500);assert.equal(new Set(workers.map(w=>w.id)).size,500);assert.ok(stock>0);
 assert.equal(resources.getSource('food').amount+stock+workers.reduce((s,w)=>s+(w.load?.amount??0),0),5000);
 assert.ok(workers.every(w=>w.position.y===point(1).y));assert.ok(traffic.stats.updates<=21);
});
test('actual delivery and building-supply warehouse choices use congestion travel times',()=>{
 const {world,traffic}=fixture();world.chamberFootprints=[];world.landmarks.nestChamberCenter=point(1);
 for(let c=1;c<=12;c++)world.tiles[1][c].state='open';world.tiles[2][1].state='open';world.tiles[2][12].state='open';
 const room=[];world.tiles[4][1].state='open';for(let r=5;r<=7;r++)for(let c=1;c<=4;c++){world.tiles[r][c].state='open';room.push({column:c,row:r});}
 traffic.invalidateTopology();traffic.advance(0,Array.from({length:50},(_,i)=>point(4+i%8)));
 const resources=new ResourceSystem();
 for(const [id,position] of [['short-busy',point(12)],['long-free',point(12,1)]]){
  resources.addStore({id,resource:'food',position,capacity:120,amount:0,status:'operational',reachable:true});
  resources.addStore({id:`material-${id}`,resource:'buildingMaterial',position,capacity:120,amount:30,status:'operational',reachable:true});
 }
 resources.addSource({id:'source',resource:'food',kind:'finite',position:point(1),capacity:5,amount:5,regenerationPerDay:0,recoveryDays:2});
 const gathering=new GatheringSystem(resources,new CollectorNavigation(world,traffic));gathering.addCollector('a',point(1));gathering.advance(.01);
 assert.equal(gathering.getCollectors()[0].storeId,'long-free');
 const e=new ExcavationSystem(world,resources);e.setTraffic(traffic);e.addBuilder('builder',point(1));e.addOrder(room,'food');e.advance(.01);
 assert.equal(e.getBuilders()[0].job.storeId,'material-long-free');
});
