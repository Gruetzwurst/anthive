import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createStartingWorld} from '../src/game/world/worldGenerator.ts';
import {ExcavationSystem} from '../src/game/simulation/excavationSystem.ts';
import {ResourceSystem} from '../src/game/simulation/resourceSystem.ts';
import {CollectorNavigation} from '../src/game/world/collectorNavigation.ts';
const p=(column,row)=>({x:(column+.5)*24,y:(row+.5)*24});
function fixture(){
 const world=createStartingWorld();world.dimensions={columns:12,rows:8,tileSize:24};world.decorations=[];world.chamberFootprints=[];world.broodChambers=[];
 world.tiles=Array.from({length:8},(_,row)=>Array.from({length:12},()=>({terrain:row<2?'air':row===2?'surface':'topsoil',state:'discovered'})));
 world.tiles[5][3].state='open';world.landmarks.nestChamberCenter=p(3,5);
 const e=new ExcavationSystem(world,new ResourceSystem());e.addBuilder('builder',p(3,5));return{world,e};
}
test('a real tunnel breaks through grass, creates a usable exit and conserves excavation material',()=>{
 const {world,e}=fixture(),navigation=new CollectorNavigation(world);
 assert.equal(navigation.findPath(p(3,5),p(3,1)),null);
 const cells=[5,4,3,2].map(row=>({column:3,row}));
 const id=e.addOrder(cells,'tunnel');
 for(let i=0;i<3000&&e.getConstructionOrders()[0].status!=='completed';i++)e.advance(.1);
 assert.equal(e.getConstructionOrders().find(o=>o.id===id).status,'completed');
 assert.equal(world.tiles[2][3].state,'open');assert.equal(world.tiles[1][3].terrain,'air');
 assert.ok(navigation.findPath(p(3,5),p(3,1)));
 const b=e.materials.balance;assert.equal(b.produced,3);assert.ok(Math.abs(b.produced-b.ground-b.carried-b.stored-b.consumed)<1e-8);
});
test('only tunnels reach the surface; all outdoor air remains invalid',()=>{
 const {e}=fixture();
 const surface=Array.from({length:12},(_,column)=>({column,row:2}));
 assert.throws(()=>e.addOrder(surface,'food'));
 assert.equal(e.validateOrder([{column:3,row:0}],'tunnel').valid,false);
 assert.equal(e.validateOrder([{column:3,row:1}],'tunnel').valid,false);
});

test('a plan extending into air is rejected entirely rather than digging its ground portion',()=>{
 const {e,world}=fixture();const cells=[5,4,3,2,1].map(row=>({column:3,row}));
 assert.equal(e.validateOrder(cells,'tunnel').valid,false);
 assert.throws(()=>e.addOrder(cells,'tunnel'));
 e.advance(30);assert.equal(e.getConstructionOrders().length,0);assert.equal(world.tiles[3][3].state,'discovered');
});
test('visible pond water rejects a whole tunnel plan even when its underlying terrain is diggable',()=>{
 const world=createStartingWorld(),e=new ExcavationSystem(world,new ResourceSystem());
 const pond=world.decorations.find(p=>p.kind==='pond');
 const column=Math.floor(pond.position.x/24),row=world.tiles.findIndex(tiles=>tiles[column].terrain!=='air')+1;
 const cells=[{column,row:row+4},{column,row:row+3},{column,row:row+2},{column,row:row+1},{column,row}];
 assert.equal(e.validateOrder(cells,'tunnel').valid,false);
 assert.throws(()=>e.addOrder(cells,'tunnel'));assert.equal(e.getConstructionOrders().length,0);
});
