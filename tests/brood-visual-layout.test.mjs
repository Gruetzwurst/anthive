import assert from 'node:assert/strict';
import {test} from 'node:test';
import {broodSlot,queenEggSlot} from '../src/game/world/broodVisualLayout.ts';
test('two brood positions fit each actual tile even in a freely shaped chamber',()=>{
 const cells=[{column:2,row:3},{column:2,row:4},{column:3,row:4}],points=Array.from({length:6},(_,i)=>broodSlot(cells,i,24));
 assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,6);
 assert.ok(points.every(p=>cells.some(c=>Math.floor(p.x/24)===c.column&&Math.floor(p.y/24)===c.row)));assert.equal(broodSlot([],0,24),null);
});
test('fifty waiting eggs have distinct stable positions next to the actual queen',()=>{
 const origin={x:3840,y:552},points=Array.from({length:50},(_,i)=>queenEggSlot(origin,i));
 assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,50);assert.deepEqual(points[0],queenEggSlot(origin,0));
 assert.ok(points.every(p=>p.x>=origin.x&&p.x<origin.x+60&&p.y>=origin.y&&p.y<origin.y+48));
});
