import assert from 'node:assert/strict';
import {test} from 'node:test';
import {attachPinchZoom} from '../src/game/world/pinchZoom.ts';
const finger=(identifier,x,y=180)=>({identifier,clientX:x,clientY:y});
function setup(initialZoom=1){
 const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:0,top:0,width:640,height:360});
 let zoom=initialZoom,cancelled=0;const changes=[];
 const control=attachPinchZoom(canvas,{allowed:()=>true,cancelDrag:()=>cancelled++,zoom:()=>zoom,setZoom:(value,x,y)=>{zoom=value;changes.push([value,x,y]);}});
 const send=(name,touches)=>{const event=new Event(name,{cancelable:true});Object.defineProperty(event,'touches',{value:touches});canvas.dispatchEvent(event);return event;};
 return {control,send,changes,get cancelled(){return cancelled;}};
}
test('two fingers zoom around their midpoint in sharp steps without jitter',()=>{
 const s=setup();s.send('touchstart',[finger(1,100),finger(2,200)]);
 assert.equal(s.cancelled,1);assert.equal(s.control.blocked,true);
 s.send('touchmove',[finger(1,75),finger(2,225)]);assert.deepEqual(s.changes,[[2,150,180]]);
 s.send('touchmove',[finger(1,76),finger(2,224)]);assert.equal(s.changes.length,1);
 s.send('touchmove',[finger(1,110),finger(2,190)]);assert.equal(s.changes.at(-1)[0],1);
 s.control.destroy();
});
test('one finger stays blocked after pinch until all fingers lift; cancellation releases safely',async()=>{
 const s=setup();s.send('touchstart',[finger(1,100)]);assert.equal(s.control.blocked,false);
 s.send('touchstart',[finger(1,100),finger(2,200)]);
 s.send('touchend',[finger(1,100)]);assert.equal(s.control.blocked,true);
 s.send('touchmove',[finger(1,150)]);assert.equal(s.changes.length,0);
 s.send('touchcancel',[]);assert.equal(s.control.blocked,true);
 await Promise.resolve();assert.equal(s.control.blocked,false);
 s.control.destroy();s.send('touchstart',[finger(1,100),finger(2,200)]);assert.equal(s.cancelled,1);
});
test('pinch ignores controls outside the map and converts scaled canvas coordinates',()=>{
 const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:20,top:10,width:1280,height:720});
 const changes=[];let cancelled=0;
 const control=attachPinchZoom(canvas,{allowed:(_x,y)=>y>110&&y<280,cancelDrag:()=>cancelled++,zoom:()=>1,setZoom:(...args)=>changes.push(args)});
 const send=(name,touches)=>{const e=new Event(name,{cancelable:true});Object.defineProperty(e,'touches',{value:touches});canvas.dispatchEvent(e);};
 send('touchstart',[finger(1,220,50),finger(2,420,50)]);assert.equal(control.blocked,false);
 send('touchstart',[finger(1,220,370),finger(2,420,370)]);
 send('touchmove',[finger(1,160,370),finger(2,480,370)]);
 assert.equal(cancelled,1);assert.deepEqual(changes,[[2,150,180]]);
 control.destroy();
});

test('one halving gesture changes one zoom level regardless of touch event frequency',()=>{
 const coarse=setup(2),fine=setup(2);
 for(const s of [coarse,fine])s.send('touchstart',[finger(1,100),finger(2,300)]);
 coarse.send('touchmove',[finger(1,150),finger(2,250)]);
 for(let width=198;width>=100;width-=2)fine.send('touchmove',[finger(1,200-width/2),finger(2,200+width/2)]);
 assert.deepEqual(coarse.changes.map(c=>c[0]),[1]);
 assert.deepEqual(fine.changes.map(c=>c[0]),[1]);
 coarse.control.destroy();fine.control.destroy();
});
test('large pinch jumps consume all crossed levels just like intermediate events',()=>{
 const coarse=setup(2),fine=setup(2);
 for(const s of [coarse,fine])s.send('touchstart',[finger(1,100),finger(2,300)]);
 coarse.send('touchmove',[finger(1,175),finger(2,225)]);
 for(let width=198;width>=50;width-=2)fine.send('touchmove',[finger(1,200-width/2),finger(2,200+width/2)]);
 assert.equal(coarse.changes.at(-1)[0],.5);
 assert.equal(fine.changes.at(-1)[0],.5);
 coarse.control.destroy();fine.control.destroy();
});
