import assert from 'node:assert/strict';
import {test} from 'node:test';
import {redistributeEggQuotas} from '../src/game/ui/eggQuotaDistribution.ts';
const equal={gathering:25,building:25,care:25,combat:25};
test('edited quota stays fixed and remaining ratios sum to exactly 100 percent',()=>{
 const q=redistributeEggQuotas(equal,'combat',0);assert.deepEqual(q,{gathering:33.34,building:33.33,care:33.33,combat:0});assert.deepEqual(equal,{gathering:25,building:25,care:25,combat:25});
 const p=redistributeEggQuotas({gathering:50,building:25,care:0,combat:25},'combat',40);assert.deepEqual(p,{gathering:40,building:20,care:0,combat:40});
});
test('sole 100 percent quota releases equally to others; explicit zero groups otherwise stay zero',()=>{
 assert.deepEqual(redistributeEggQuotas({gathering:100,building:0,care:0,combat:0},'gathering',70),{gathering:70,building:10,care:10,combat:10});
 assert.deepEqual(redistributeEggQuotas(equal,'care',100),{gathering:0,building:0,care:100,combat:0});
});
test('repeated decimal edits remain bounded and valid for the strict queen model',()=>{
 let q=equal;for(let i=0;i<500;i++){const kind=['gathering','building','care','combat'][i%4];const v=(i*137%10001)/100;q=redistributeEggQuotas(q,kind,v);assert.equal(q[kind],v);assert.ok(Math.abs(Object.values(q).reduce((a,b)=>a+b,0)-100)<1e-9);assert.ok(Object.values(q).every(x=>x>=0&&x<=100));}
 for(const v of [NaN,Infinity,-1,101])assert.throws(()=>redistributeEggQuotas(equal,'care',v));
});
