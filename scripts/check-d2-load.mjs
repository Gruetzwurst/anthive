/** Bounded technical load probe. No long-term growth/balance simulation. */
import {performance} from 'node:perf_hooks';
import {multiQueenColony,populateColony} from '../tests/helpers/multiQueenColony.mjs';
import {captureColony,restoreColony,serializeColony,parseColony} from '../src/game/persistence/colonySession.ts';
import assert from 'node:assert/strict';
for(const population of [150,500,1000]){
 const a=multiQueenColony(population===150?3:population===500?4:5),g=a.simulation;
 const initStart=performance.now();const workforce=populateColony(a,population,{gatherers:population===150?60:200,nurses:20,builders:20});
 const initialiseMs=performance.now()-initStart;
 const samples=[];for(let i=0;i<40;i++){const start=performance.now();g.advance(.05);samples.push(performance.now()-start);}
 const sorted=samples.slice(10).sort((a,b)=>a-b),start=performance.now(),wire=serializeColony(captureColony(a)),saveMs=performance.now()-start;
 const loadStart=performance.now(),b=restoreColony(parseColony(wire)),loadMs=performance.now()-loadStart;
 g.advance(.05);b.simulation.advance(.05);assert.deepEqual(captureColony(b),captureColony(a));
 console.log(JSON.stringify({population:g.getProgression().population,queens:g.queen.queenCount,workforce,
  activeCollectors:g.gathering.getCollectors().length,activeNurses:g.broodSupply.getNurses().length,
  simulatedSeconds:2,initialiseMs,initialMs:samples[0],medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.floor(sorted.length*.95)],
  saveMs,loadMs,saveBytes:Buffer.byteLength(wire),heapMB:process.memoryUsage().heapUsed/1024/1024,identicalReload:true}));
}
