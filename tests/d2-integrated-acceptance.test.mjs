import assert from 'node:assert/strict';
import {test} from 'node:test';
import {multiQueenColony} from './helpers/multiQueenColony.mjs';
import {captureColony,restoreColony,serializeColony,parseColony} from '../src/game/persistence/colonySession.ts';
import {queenSupplyRoomId} from '../src/game/simulation/queenSupply.ts';

test('five real queens keep separate supplies, egg sources and active nurse deliveries across reload',()=>{
 const a=multiQueenColony(),g=a.simulation,q=g.queen,b=g.broodSupply;
 assert.equal(a.royal.getEggs().length,4);assert.equal(a.excavation.materials.balance.consumed,528);
 assert.equal(g.getProgression().population,g.workforce.size+5);assert.equal(a.excavation.queenSlotsAvailable,0);
 const supplies=b.getRooms().filter(r=>r.adultQueen);assert.equal(supplies.length,5);
 q.setQuotas({gathering:100,building:0,care:0,combat:0});
 q.advance(.2,1,q.snapshot.chambers,1,d=>b.consume(d,q.getLarvalRooms()),b);
 assert.equal(q.snapshot.laidEggs,5);assert.equal(new Set(q.snapshot.eggs.map(e=>e.sourceQueenId)).size,5);
 for(const queen of q.getQueens()){
  const egg=q.snapshot.eggs.find(e=>e.sourceQueenId===queen.id);assert.deepEqual(egg.origin,queen.position);
  const before=supplies.find(r=>r.id===queenSupplyRoomId(queen.id));const after=b.getRooms().find(r=>r.id===before.id);
  for(const k of ['food','water'])assert.ok(Math.abs(before[k].amount-after[k].amount-1)<1e-7,'one delivered unit consumed per queen in .2 day');
 }
 for(let i=0;i<5000&&!b.getNurses().some(n=>n.eggId);i++)b.advanceWorkers(.05);
 assert.ok(b.getNurses().some(n=>n.eggId),'real active egg carrier');
 const save=captureColony(a),loaded=restoreColony(parseColony(serializeColony(save)));assert.deepEqual(captureColony(loaded),save);
 for(let i=0;i<20;i++){g.advance(.05);loaded.simulation.advance(.05);}
 assert.deepEqual(captureColony(loaded),captureColony(a));
 for(const balance of Object.values(b.balance))assert.ok(Math.abs(balance.withdrawn-balance.atChambers-balance.carried-balance.consumed-balance.dropped-balance.returned)<1e-7);
 assert.equal(q.queenCount,5);assert.equal(a.royal.getEggs().filter(e=>e.stage==='adult').length,4);
});
