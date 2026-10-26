import assert from 'node:assert/strict';
import {test} from 'node:test';
import {LarvalShortageSystem} from '../src/game/simulation/larvalShortageSystem.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function setup(coverage=0,larvae=20){const s=new LarvalShortageSystem();s.observe('a',larvae,coverage,1);return s;}
test('one full warning day, poorer resource and minimum 25 percent; no loss before day seven',()=>{
 const s=setup(.5);assert.equal(s.get('a').factor,1);s.advance(.5);assert.equal(s.get('a').factor,1);s.advance(.5);assert.equal(s.get('a').factor,.5);assert.equal(s.get('a').warnings,1);
 s.observe('a',20,1,0);s.advance(5);assert.equal(s.get('a').factor,.25);assert.equal(s.get('a').losses,0);
});
test('recovery integrates MIN with care, lasts one day, and leaves care independently limited',()=>{
 const s=setup(0);s.advance(2);s.observe('a',20,1,1);near(s.progress('a',.5,1),.21875);near(s.progress('a',1,.5),11/24);
 s.advance(.5);near(s.get('a').factor,.625);s.advance(.5);near(s.get('a').factor,1);near(s.progress('a',1,.5),.5);assert.equal(s.get('a').shortageDays,0);
});
test('severe shortage starts losses only after six full days, with fractional accumulation and interruption reset',()=>{
 const s=setup(0);assert.deepEqual(s.advance(6),[]);assert.equal(s.get('a').losses,0);const losses=s.advance(.5);assert.deepEqual(losses,[]);near(s.get('a').lossCredit,.5);
 assert.deepEqual(s.advance(.5),[{roomId:'a',count:1}]);assert.equal(s.get('a').losses,1);
 s.observe('a',19,.25,1);s.advance(1);assert.equal(s.get('a').severeDays,0);s.advance(19);assert.equal(s.get('a').losses,1);
 s.observe('a',19,0,1);s.advance(5.9);assert.equal(s.get('a').losses,1);
});
test('brief full supply does not reset warning history or instantly repair development',()=>{
 const s=setup();s.advance(3);s.observe('a',20,1,1);s.advance(.01);assert.ok(s.get('a').factor<.3);s.observe('a',20,0,1);assert.equal(s.get('a').factor,.25);assert.ok(s.get('a').shortageDays>=3);assert.equal(s.get('a').warnings,1);assert.ok(s.get('a').severeDays>=3);
 s.observe('a',0,0,0);s.advance(10);assert.equal(s.get('a').factor,1);assert.equal(s.get('a').losses,0);
});
test('large and small constant-coverage steps match without rounding losses up',()=>{
 const a=setup(0,100),b=setup(0,100);a.advance(7.2);for(let i=0;i<720;i++)b.advance(.01);near(a.get('a').lossCredit,b.get('a').lossCredit);assert.equal(a.get('a').losses,b.get('a').losses);assert.equal(a.get('a').losses,6);
});
