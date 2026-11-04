import Phaser from 'phaser';

/** Static, world-aligned artwork: build on first sight and skip offscreen commands.
 * Phaser Graphics otherwise replays its full command buffer at every zoom level.
 */
export class ViewportGraphics extends Phaser.GameObjects.Graphics {
  private built=false;
  constructor(scene:Phaser.Scene,private bounds:Phaser.Geom.Rectangle,private build:(graphics:Phaser.GameObjects.Graphics)=>void){
    super(scene);
  }
  override willRender(camera:Phaser.Cameras.Scene2D.Camera):boolean{
    if(!super.willRender(camera)||!Phaser.Geom.Intersects.RectangleToRectangle(this.bounds,camera.worldView))return false;
    if(!this.built){this.build(this);this.built=true;}
    return true;
  }
}
