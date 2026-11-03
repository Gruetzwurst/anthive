import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {createPondProfile} from '../src/game/world/pondProfile.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {GatheringSystem} from '../src/game/simulation/gatheringSystem.ts';
function fixture(){
 const world=createStartingWorld(),pond=world.decorations.find(d=>d.kind==='pond');
 const surface=c=>world.tiles.findIndex(row=>row[c]?.terrain!=='air');
 const profile=createPondProfile(pond.position.x,24,pond.scale??1,surface);
 const right=profile.columns.at(-1).x+profile.columns.at(-1).width;
 const source={id:pond.id,kind:'unlimited',resource:'water',position:pond.position};
 return {world,profile,right,source};
}
test('opening a dry side tunnel creates an intake at visible water height, not the old floating bank',()=>{
 const {world,profile,right,source}=fixture(),nav=new CollectorNavigation(world);
 const column=Math.floor(right/24),row=Math.floor(profile.waterY/24);
 assert.ok(nav.sourceAccessPoints(source).filter(p=>p.x>=right).every(p=>Math.abs(p.y-profile.waterY)<1));
 world.tiles[row][column].state='open';
 const access=nav.sourceAccessPoints(source).find(p=>p.x>=right&&Math.abs(p.y-profile.waterY)<24);
 assert.ok(access);assert.ok(access.x-right<=1);assert.ok(nav.isWalkable(access));
 // Excavating beneath painted water must never permit swimming through it.
 world.tiles[row][column-1].state='open';
 assert.equal(nav.isWalkable({x:right-12,y:(row+.5)*24}),false);
});
test('a collector actually picks up and delivers water using the shorter dry shore tunnel',()=>{
 const {world,profile,right,source}=fixture(),nav=new CollectorNavigation(world);
 const shoreColumn=Math.floor(right/24),shoreRow=Math.floor(profile.waterY/24);
 const store=world.landmarks.waterStoreCenter,storeColumn=Math.floor(store.x/24),storeRow=Math.floor(store.y/24);
 for(let column=shoreColumn;column<=storeColumn;column++)world.tiles[shoreRow][column].state='open';
 for(let row=Math.min(shoreRow,storeRow);row<=Math.max(shoreRow,storeRow);row++)world.tiles[row][storeColumn].state='open';
 const resources=new ResourceSystem();resources.addSource(source);
 resources.addStore({id:'store',resource:'water',position:store,capacity:100,amount:0,status:'operational',reachable:true});
 const gathering=new GatheringSystem(resources,nav);gathering.addCollector('a',store);
 let pickup;
 for(let i=0;i<6000&&!pickup;i++){
  gathering.advance(.05);const worker=gathering.getCollectors()[0];assert.ok(nav.isWalkable(worker.position));
  if(worker.phase==='pickup')pickup=worker.position;
 }
 assert.ok(pickup);assert.ok(pickup.x>=right&&pickup.x-right<=1);assert.ok(pickup.y>=profile.waterY&&pickup.y<profile.waterY+24);
 for(let i=0;i<6000&&resources.getStore('store').amount===0;i++)gathering.advance(.05);
 assert.ok(resources.getStore('store').amount>0);
});

import {TunnelTrafficSystem} from '../src/game/simulation/tunnelTrafficSystem.ts';
test('traffic-weighted routes do not enter an exposed bank through undug earth',()=>{
 const {world,profile,right,source}=fixture();
 const column=Math.floor(right/24),row=Math.floor(profile.waterY/24)-1;
 world.tiles[row][column+1].state='open';
 const traffic=new TunnelTrafficSystem(world),nav=new CollectorNavigation(world,traffic);
 const from={x:(column+1.5)*24,y:(row+.5)*24};
 const shore=nav.sourceAccessPoints(source).find(p=>p.x>=right);
 assert.ok(shore);assert.equal(nav.findPath(from,shore),null);
 world.tiles[row][column].state='open';traffic.invalidateTopology();
 const path=nav.findPath(from,shore);assert.ok(path);
 for(let i=1;i<path.length;i++)assert.ok(nav.canMove(path[i-1],path[i]));
});
