import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chamberFurnishingLayout} from '../src/game/world/chamberFurnishingLayout.ts';
const cells=[{column:2,row:3},{column:2,row:4},{column:3,row:4}];
const order={id:1,type:'food',cells,materialRequired:12,installedByCell:[]};
test('only actual installed material reveals fixtures at the matching cell',()=>{
 assert.deepEqual(chamberFurnishingLayout(order,24),[]);
 const result=chamberFurnishingLayout({...order,installedByCell:[{...cells[1],amount:1}]},24);
 assert.equal(result.length,1);assert.equal(result[0].progress,.25);assert.equal(result[0].column,2);assert.equal(result[0].row,4);
 assert.equal(result[0].kind,'food');assert.equal(result[0].edges.includes('right'),false);
});
test('irregular rooms retain fixtures inside their actual cells with exposed borders only',()=>{
 const input={...order,installedByCell:cells.map(cell=>({...cell,amount:4}))};
 const before=structuredClone(input),result=chamberFurnishingLayout(input,24);
 assert.equal(result.length,3);assert.ok(result.every(mark=>mark.progress===1));
 assert.ok(result.every(mark=>cells.some(cell=>cell.column===Math.floor(mark.x/24)&&cell.row===Math.floor(mark.y/24))));
 assert.deepEqual(result,chamberFurnishingLayout(input,24));assert.deepEqual(input,before);
 assert.deepEqual(result[0].edges,['top','right','left']);
});
test('unselected material and tunnels create no marks; brood specialties remain distinct',()=>{
 assert.deepEqual(chamberFurnishingLayout({...order,installedByCell:[{column:99,row:99,amount:20}]},24),[]);
 assert.deepEqual(chamberFurnishingLayout({...order,type:'tunnel',installedByCell:[{...cells[0],amount:4}]},24),[]);
 const marks=['gathering','building','care','combat'].map(kind=>chamberFurnishingLayout({...order,type:`brood-${kind}`,installedByCell:[{...cells[0],amount:4}]},24)[0].kind);
 assert.equal(new Set(marks).size,4);
});
test('installed amounts alone control partial and complete appearance without clock progression',()=>{
 const partial={...order,installedByCell:[{...cells[0],amount:2},{...cells[1],amount:4}]};
 const result=chamberFurnishingLayout(partial,24);
 assert.deepEqual(result.map(mark=>mark.progress),[.5,1]);
 for(const status of ['paused','blocked','furnishing','completed']){
  assert.deepEqual(chamberFurnishingLayout({...partial,status,materialUsed:999,materialAtSite:999},24),result);
 }
 assert.equal(chamberFurnishingLayout({...order,installedByCell:[{...cells[0],amount:8}]},24)[0].progress,1);
});

test('storage contents reflect only actual stock and stay empty without inventory',()=>{
 const base={id:1,type:'water',cells:[{column:1,row:2}],materialRequired:2,installedByCell:[{column:1,row:2,amount:2}]};
 assert.equal(chamberFurnishingLayout(base,24)[0].stockFraction,0);
 assert.equal(chamberFurnishingLayout({...base,stock:{amount:5,capacity:10}},24)[0].stockFraction,.5);
 assert.equal(chamberFurnishingLayout({...base,stock:{amount:0,capacity:10}},24)[0].stockFraction,0);
});

import * as chamberArt from '../src/game/world/chamberFurnishingLayout.ts';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
test('all existing useful starting rooms have furnished exact footprints and distinct identities',()=>{
 assert.equal(typeof chamberArt.startingFurnishingOrders,'function');
 const world=createStartingWorld(),rooms=chamberArt.startingFurnishingOrders(world);
 assert.equal(rooms.length,8);assert.equal(rooms.filter(r=>r.type==='queen').length,1);
 assert.equal(new Set(rooms.map(r=>r.id)).size,8);
 for(const room of rooms){
  assert.ok(world.chamberFootprints.some(c=>JSON.stringify(c)===JSON.stringify(room.cells)));
  assert.equal(chamberFurnishingLayout(room,24).length,room.cells.length);
  assert.ok(chamberFurnishingLayout(room,24).every(mark=>mark.progress===1));
 }
});
