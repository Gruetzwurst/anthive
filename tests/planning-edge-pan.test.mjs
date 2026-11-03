import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as camera from '../src/game/world/worldZoom.ts';
test('held drawing at horizontal edges moves camera, centre and HUD stay still',()=>{
 assert.equal(typeof camera.planningEdgePan,'function');
 assert.deepEqual(camera.planningEdgePan(320,210,110),{x:0,y:0});
 assert.ok(camera.planningEdgePan(635,210,110).x>0);assert.ok(camera.planningEdgePan(5,210,110).x<0);
 assert.equal(camera.planningEdgePan(635,90,110).x,0);
 assert.ok(camera.planningEdgePan(320,112,110).y<0);
 assert.ok(camera.planningEdgePan(320,309,110).y>0);
 assert.deepEqual(camera.planningEdgePan(650,220,110),{x:0,y:0});
 assert.ok(camera.planningEdgePan(635,70,34).x>0);
});
