import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createColonySession} from '../src/game/persistence/colonySession.ts';

test('ongoing queen consumption must leave nurses time for real egg delivery instead of endless top-ups',()=>{
 const a=createColonySession({id:'feeding-fairness',name:'Feeding fairness'}),g=a.simulation;
 for(const resource of ['food','water'])g.resources.depositInStore(`${resource}-store`,{resource,amount:100});
 let delivered=false;
 for(let seconds=0;seconds<300&&!delivered;seconds++){
  g.advance(1);delivered=g.queen.snapshot.eggs.some(e=>e.arrived);
 }
 assert.ok(delivered,'a supplied queen egg must be carried to its brood chamber while queen consumption continues');
 const room=g.broodSupply.getRooms().find(r=>r.adultQueen);
 assert.ok(room.food.amount>5&&room.water.amount>5,'healthy local reserves do not require continuous refill');
 for(const b of Object.values(g.broodSupply.balance))assert.ok(Math.abs(b.withdrawn-b.atChambers-b.carried-b.consumed-b.dropped-b.returned)<1e-7);
});
