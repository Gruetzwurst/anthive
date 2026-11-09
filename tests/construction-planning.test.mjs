import assert from 'node:assert/strict';
import {test} from 'node:test';
import {lineSelection,rectangleSelection,mergeSelection,extendBrushStroke,subtractSelection,isConnectedSelection,constructionMaterialEstimate} from '../src/game/simulation/constructionPlanning.ts';
const c=(column,row)=>({column,row});
test('brush joins diagonal pointer jumps through shared edges and works in either direction',()=>{
 for(const [a,b] of [[c(2,2),c(6,5)],[c(6,5),c(2,2)]]){
  const cells=lineSelection(a,b);
  assert.deepEqual(cells[0],a);assert.deepEqual(cells.at(-1),b);
  assert.equal(cells.length,8);assert.equal(isConnectedSelection(cells),true);
 }
});
test('inclusive reversed rectangles and combined brush selections deduplicate into a free L shape',()=>{
 const first=rectangleSelection(c(3,3),c(1,2));
 assert.equal(first.length,6);
 const combined=mergeSelection(first,rectangleSelection(c(1,3),c(1,5)),lineSelection(c(1,5),c(3,5)));
 assert.equal(new Set(combined.map(c=>`${c.column},${c.row}`)).size,combined.length);
 assert.equal(combined.length,10);assert.equal(isConnectedSelection(combined),true);
 combined[0].row=99;assert.equal(first[0].row,2);
});
test('empty, isolated and diagonal-only areas cannot form one chamber; invalid geometry rejected',()=>{
 assert.equal(isConnectedSelection([]),false);
 assert.equal(isConnectedSelection([c(1,1),c(2,2)]),false);
 assert.equal(isConnectedSelection([c(1,1),c(2,1),c(4,1)]),false);
 assert.throws(()=>lineSelection(c(.1,2),c(3,4)),RangeError);
 assert.throws(()=>rectangleSelection(c(-1,2),c(3,4)),RangeError);
});
test('known furnishing costs are only configurable estimates and tunnels cost zero',()=>{
 for(const type of ['food','water','buildingMaterial'])assert.equal(constructionMaterialEstimate(type,12),24);
 for(const type of ['brood-gathering','brood-building','brood-care','brood-combat'])assert.equal(constructionMaterialEstimate(type,20),60);
 assert.equal(constructionMaterialEstimate('rest',16),32);
 assert.equal(constructionMaterialEstimate('tunnel',99),0);
 assert.equal(constructionMaterialEstimate('queen',44),132);
 assert.throws(()=>constructionMaterialEstimate('unknown-room',10));
});

test('current brush stroke shrinks when retraced, including skipped pointer positions',()=>{
 let stroke=extendBrushStroke([c(2,2)],c(8,2));
 stroke=extendBrushStroke(stroke,c(4,2));
 assert.deepEqual(stroke,lineSelection(c(2,2),c(4,2)));
 stroke=extendBrushStroke(stroke,c(4,4));
 assert.deepEqual(stroke,[c(2,2),c(3,2),c(4,2),c(4,3),c(4,4)]);
 assert.deepEqual(extendBrushStroke(stroke,c(2,2)),[c(2,2)]);
});
test('retracing a new stroke preserves overlapping earlier strokes and never mutates inputs',()=>{
 const earlier=lineSelection(c(2,2),c(8,2));const initial=[c(4,2)];
 const long=extendBrushStroke(initial,c(10,2));
 const short=extendBrushStroke(long,c(5,2));
 assert.deepEqual(mergeSelection(earlier,short),earlier);
 assert.equal(long.length,7);assert.deepEqual(initial,[c(4,2)]);
});
test('eraser removes only selected draft cells, including all cells or an empty stroke',()=>{
 const draft=rectangleSelection(c(2,2),c(4,3));const erased=lineSelection(c(3,2),c(3,3));
 assert.deepEqual(subtractSelection(draft,erased),[c(2,2),c(4,2),c(2,3),c(4,3)]);
 assert.equal(draft.length,6);assert.equal(erased.length,2);
 assert.deepEqual(subtractSelection(draft,draft),[]);
 assert.deepEqual(subtractSelection(draft,[]),draft);
});
test('retracing past the start between pointer events removes the tail before extending backwards',()=>{
 const stroke=lineSelection(c(2,2),c(8,2));
 assert.deepEqual(extendBrushStroke(stroke,c(0,2)),[c(2,2),c(1,2),c(0,2)]);
 assert.equal(stroke.length,7);
});
