import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
test('idle builders start later independent fronts while earlier fronts are reserved',()=>{
 const world=createStartingWorld();world.dimensions={columns:12,rows:9,tileSize:24};world.chamberFootprints=[];world.decorations=[];
 world.tiles=Array.from({length:9},()=>Array.from({length:12},()=>({terrain:'topsoil',state:'discovered'})));
 for(let row=2;row<=6;row++)for(let column=1;column<=3;column++)world.tiles[row][column].state='open';
 const e=new ExcavationSystem(world,new ResourceSystem());
 for(let i=0;i<4;i++)e.addBuilder(`builder-${i}`,{x:60,y:(i+2.5)*24});
 const ids=[2,3,4,5].map(row=>e.addOrder([{column:4,row},{column:5,row}]));
 e.advance(.1);const jobs=e.getBuilders().map(b=>b.job).filter(Boolean);
 assert.equal(jobs.length,4);assert.deepEqual(new Set(jobs.map(j=>j.orderId)),new Set(ids));
 assert.equal(new Set(jobs.map(j=>`${j.target.column},${j.target.row}`)).size,4);
 e.pauseOrder(ids[1]);e.advance(30);
 assert.ok(e.getConstructionOrders().find(o=>o.id===ids[3]).excavated>0);
});
