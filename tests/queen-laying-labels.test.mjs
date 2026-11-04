import assert from 'node:assert/strict';
import {test} from 'node:test';
import {QueenSystem} from '../src/game/simulation/queenSystem.ts';
import {queenLayingLabels} from '../src/game/world/queenLayingLabels.ts';
const origin={x:240,y:240};
test('each queen label shows her own next egg time at her actual chamber',()=>{
 const q=new QueenSystem();q.requireEggTransport(origin);q.advance(.1,1,[]);
 q.addQueen('queen-room-2','built-2',{x:480,y:480});q.advance(.05,1,[]);
 const labels=queenLayingLabels(q.snapshot.queens,origin,600);
 assert.equal(labels.length,2);assert.equal(labels[0].text,'Nächstes Ei 0:30 · 0 warten');assert.equal(labels[1].text,'Nächstes Ei 1:30 · 0 warten');
 assert.deepEqual(labels[0].position,{x:132,y:268});assert.deepEqual(labels[1].position,{x:372,y:508});
});
test('a full or inaccessible queen buffer does not replace the other queens own countdown',()=>{
 const q=new QueenSystem();q.requireEggTransport(origin);q.advance(100,1,[]);
 q.addQueen('queen-room-2','built-2',{x:480,y:480});q.advance(0,1,[]);
 let labels=queenLayingLabels(q.snapshot.queens,origin,600);
 assert.equal(labels[0].text,'Eiablage pausiert · 50 warten');assert.equal(labels[1].text,'Nächstes Ei 2:00 · 0 warten');
 q.setQueenOperational('queen-room-2',false);labels=queenLayingLabels(q.snapshot.queens,origin,600);assert.equal(labels[1].text,'Eiablage pausiert · 0 warten');
});
