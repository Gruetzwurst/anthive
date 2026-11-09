import Phaser from 'phaser';

/** Reuse the existing ant drawing as a small native-resolution pixel-art texture.
 * Vector bodies otherwise replay ~160 commands for every ant on every frame. */
export function createAntBody(scene:Phaser.Scene,builder=false):Phaser.GameObjects.Image{
 const key=builder?'anthive-builder-body':'anthive-worker-body';
 if(!scene.textures.exists(key)){
  const shape=new Phaser.GameObjects.Graphics(scene);
  shape.translateCanvas(8,8).fillStyle(0x261b17,1);
  shape.fillEllipse(-3,0,builder?8:7,builder?6:5);
  shape.fillCircle(builder?2:1,0,builder?2.4:2.2);
  shape.fillCircle(builder?6:5,-.5,builder?2.3:2.2);
  shape.lineStyle(1,0x261b17,1).beginPath();
  const legs=builder?[[-3,1,-5,4],[0,1,-1,4],[3,1,4,1],[6,-2,8,-4]]:[[-3,1,-5,4],[0,1,-1,4],[2,1,3,4],[5,-2,7,-4]];
  for(const [x,y,toX,toY]of legs)shape.moveTo(x,y).lineTo(toX,toY);
  shape.strokePath().generateTexture(key,24,16);shape.destroy();
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 return scene.add.image(0,0,key).setOrigin(8/24,8/16);
}
