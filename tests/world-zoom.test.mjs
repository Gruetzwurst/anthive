import assert from 'node:assert/strict';
import {test} from 'node:test';
import {closestWorldZoom,nextWorldZoom} from '../src/game/world/worldZoom.ts';
test('zoom uses only integer pixel reductions and whole enlargement with bounded steps',()=>{
 assert.equal(closestWorldZoom(.72),.5);assert.equal(closestWorldZoom(1.2),1);
 assert.equal(nextWorldZoom(1,-1),.5);assert.equal(nextWorldZoom(.5,-1),.25);
 assert.equal(nextWorldZoom(.25,-1),.25);assert.equal(nextWorldZoom(1,1),2);
 assert.equal(nextWorldZoom(2,1),2);assert.equal(nextWorldZoom(2,-1),1);
});
