import {nextWorldZoom} from './worldZoom.ts';

/** Capture before Phaser handles touches, so a second finger never draws a plan. */
export function attachPinchZoom(canvas: HTMLCanvasElement, actions: {
  allowed: (x: number, y: number) => boolean; cancelDrag: () => void;
  zoom: () => number; setZoom: (value: number, x: number, y: number) => void;
}): {readonly blocked: boolean; destroy: () => void} {
  let blocked = false;
  let pair: number[] = [];
  let distance = 0;
  let generation = 0;
  const handle = (event: TouchEvent) => {
    const touches = Array.from(event.touches);
    if (!touches.length) {
      pair = []; distance = 0;
      const ended = ++generation;
      // Phaser must process the last release while drawing is still blocked.
      queueMicrotask(() => { if (ended === generation) blocked = false; });
      return;
    }
    generation++;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const point = (touch: Touch) => ({x:(touch.clientX-bounds.left)*640/bounds.width,y:(touch.clientY-bounds.top)*360/bounds.height});
    if (touches.length < 2) { pair = []; distance = 0; return; }
    if (!blocked && !touches.slice(0,2).every(touch => {const p=point(touch);return actions.allowed(p.x,p.y);})) return;
    if (!blocked) { blocked = true; actions.cancelDrag(); }
    event.preventDefault();
    let selected = pair.map(id => touches.find(touch => touch.identifier === id));
    if (selected.length !== 2 || selected.some(touch => !touch)) {
      selected = touches.slice(0,2); pair = selected.map(touch => touch!.identifier); distance = 0;
    }
    const a=point(selected[0]!),b=point(selected[1]!);
    const current = Math.hypot(a.x-b.x,a.y-b.y);
    if (current < 12) return;
    if (!distance) { distance = current; return; }
    const ratio = current/distance;
    if (ratio >= 1.35 || ratio <= 1/1.35) {
      const zoom = nextWorldZoom(actions.zoom(),ratio>1?1:-1);
      if (zoom !== actions.zoom()) actions.setZoom(zoom,(a.x+b.x)/2,(a.y+b.y)/2);
      distance = current;
    }
  };
  const events = ['touchstart','touchmove','touchend','touchcancel'] as const;
  for (const name of events) canvas.addEventListener(name,handle,{capture:true,passive:false});
  return {get blocked(){return blocked;},destroy(){
    generation++; blocked=false;
    for (const name of events) canvas.removeEventListener(name,handle,{capture:true});
  }};
}
