import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {AdultSupplySystem} from '../src/game/simulation/adultSupplySystem.ts';

test('only occupied resting workers receive 50 percent consumption; en route remains 80 percent',()=>{
 const resources=new ResourceSystem();
 for(const resource of ['food','water'])resources.addStore({id:resource,resource,amount:100,capacity:100,position:{x:0,y:0},status:'operational',reachable:true});
 const supply=new AdultSupplySystem(resources);
 supply.advance(1,{activeWorkers:2,restingWorkers:3,restingInChambers:1,queens:0});
 assert.ok(Math.abs(resources.getStore('food').amount-95.9)<1e-8);
 assert.throws(()=>supply.advance(1,{activeWorkers:0,restingWorkers:1,restingInChambers:2,queens:0}));
});

import {RestSystem} from '../src/game/simulation/restSystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
function restingFixture(){
 const world=createStartingWorld();world.dimensions={columns:20,rows:5,tileSize:24};world.decorations=[];
 world.tiles=Array.from({length:5},()=>Array.from({length:20},()=>({terrain:'soil',state:'discovered'})));
 for(let column=0;column<20;column++)world.tiles[2][column].state='open';
 const room={id:'room',operational:true,cells:Array.from({length:16},(_,column)=>({column:column+4,row:2}))};
 const idle=Array.from({length:33},(_,i)=>({id:`ant-${i}`,position:{x:12,y:60}}));
 const rest=new RestSystem(new CollectorNavigation(world),24);
 return {world,room,idle,rest,move:(id,position)=>{idle.find(w=>w.id===id).position=position;return true;}};
}
test('sixteen real chamber cells provide exactly 32 exclusive places',()=>{
 const {rest,room,idle,move}=restingFixture();rest.advance(20,[room],idle,move);
 assert.equal(idle.filter(w=>rest.get(w.id)?.occupied).length,32);
 assert.equal(rest.get('ant-32'),undefined);
 rest.advance(.1,[room],idle.slice(1),move);
 assert.equal(rest.get('ant-0'),undefined);assert.ok(rest.get('ant-32'));
});
test('incomplete, failed and unreachable rooms cannot grant reservations',()=>{
 const {rest,room,idle,move,world}=restingFixture();
 rest.advance(1,[{...room,cells:room.cells.slice(1)}],idle,move);assert.equal(rest.get('ant-0'),undefined);
 rest.advance(1,[{...room,operational:false}],idle,move);assert.equal(rest.get('ant-0'),undefined);
 world.tiles[2][3].state='discovered';
 rest.advance(1,[room],idle,move);assert.equal(rest.get('ant-0'),undefined);
 world.tiles[2][3].state='open';rest.advance(1,[room],idle,move);assert.ok(rest.get('ant-0'));
 world.tiles[2][3].state='discovered';rest.advance(.1,[room],idle,move);assert.equal(rest.get('ant-0'),undefined);
});
test('an engine action completed between rest updates invalidates the old occupied position',()=>{
 const {rest,room,idle,move}=restingFixture();rest.advance(20,[room],idle.slice(0,1),move);
 assert.equal(rest.get('ant-0').occupied,true);idle[0].position={x:12,y:60};
 rest.advance(.01,[room],idle.slice(0,1),move);
 assert.equal(rest.get('ant-0').occupied,false);assert.ok(idle[0].position.x<14);
});
