import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as placement from '../src/game/simulation/constructionPlanning.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
const cell = (column,row) => ({column,row});
const rect = (x,y,w,h) => placement.rectangleSelection(cell(x,y),cell(x+w-1,y+h-1));
function fixture() {
 const world=createStartingWorld(); world.chamberFootprints=[];
 world.dimensions={columns:100,rows:100,tileSize:24};
 world.tiles=Array.from({length:100},()=>Array.from({length:100},()=>({terrain:'topsoil',state:'discovered'})));
 return {world,e:new ExcavationSystem(world,new ResourceSystem())};
}
test('all eight chamber types provide exact square templates, matching free costs and capacity area',()=>{
 assert.equal(typeof placement.squareTemplate,'function');
 for(const type of placement.PLAN_TYPES.filter(t=>t!=='tunnel'&&t!=='queen')) {
  const sides=type.startsWith('brood-')?[5,7,9]:[4,6,8];
  for(const [i,size] of ['small','medium','large'].entries()) {
   const cells=placement.squareTemplate(type,size,cell(7,9));
   assert.deepEqual(cells,rect(7,9,sides[i],sides[i]));
   assert.equal(placement.constructionMaterialEstimate(type,cells.length),placement.constructionMaterialEstimate(type,sides[i]**2));
  }
 }
 assert.throws(()=>placement.squareTemplate('tunnel','small',cell(1,1)));
});
test('free chambers allow exact maximum 128/162 and reject the next cell before creating a queue entry',()=>{
 for(const type of ['food','water','buildingMaterial','rest','brood-gathering','brood-building','brood-care','brood-combat']) {
  const {e}=fixture(),brood=type.startsWith('brood-'); const shape=rect(5,5,brood?18:16,brood?9:8);
  const oneExtra=[...shape,cell(5,brood?14:13)];
  assert.throws(()=>e.addOrder(oneExtra,type),/höchstens/);assert.equal(e.getConstructionOrders().length,0);
  assert.equal(e.addOrder(shape,type),1);
 }
});
test('side and diagonal spacing reject zero/one empty tiles and accept two including open tunnels',()=>{
 for(const diagonal of [false,true])for(const gap of [0,1,2]) {
  const {world,e}=fixture();world.chamberFootprints=[rect(10,10,4,4)];
  const shape=rect(14+gap,diagonal?14+gap:10,4,4);
  for(const c of rect(14,10,2,4))world.tiles[c.row][c.column].state='open';
  const result=e.validateOrder(shape,'food');
  assert.equal(result.valid,gap===2);
  if(gap<2){assert.match(result.message,/2 Kacheln Abstand/);assert.ok(result.conflicts.length>0);assert.throws(()=>e.addOrder(shape,'food'),/Abstand/);}
  else assert.equal(e.addOrder(shape,'food'),1);
 }
});
test('planned and paused rooms reserve distance, cancellation frees it, tunnels do not reserve chamber distance',()=>{
 const {e}=fixture();const first=e.addOrder(rect(10,10,4,4),'food');e.pauseOrder(first);
 assert.throws(()=>e.addOrder(rect(15,10,4,4),'water'),/Abstand/);
 e.cancelOrder(first);assert.equal(e.addOrder(rect(15,10,4,4),'water'),2);
 assert.doesNotThrow(()=>e.addOrder(rect(14,10,1,4),'tunnel'));
 assert.throws(()=>e.addOrder(rect(15,10,4,4),'food'),/Kammer/);
});
test('preview checks bounds, connected free shape and minimum without mutating queue or starting rooms',()=>{
 const {e,world}=fixture();const old=rect(10,10,4,4);world.chamberFootprints=[old];
 assert.equal(e.validateOrder(rect(98,98,4,4),'food').valid,false);
 assert.equal(e.validateOrder([cell(1,1)],'food').valid,false);
 assert.equal(e.validateOrder([...rect(1,1,4,3),cell(8,8)],'food').valid,false);
 assert.equal(e.getConstructionOrders().length,0);assert.deepEqual(world.chamberFootprints,[old]);
});
