import Phaser from 'phaser';
import {chamberFurnishingLayout,ROOM_APPEARANCE} from './chamberFurnishingLayout';
import type {FurnishingVisualOrder,FurnishingMark} from './chamberFurnishingLayout';

/** Natural fixtures and actual store contents. Brood renderer owns brood individuals. */
export class ChamberFurnishingRenderer {
  private graphics:Phaser.GameObjects.Graphics;
  private tileSize:number;
  constructor(scene:Phaser.Scene,tileSize:number,private openAt?:(column:number,row:number)=>boolean){
    this.tileSize=tileSize;
    this.graphics=scene.add.graphics().setDepth(2);
  }
  update(orders:readonly FurnishingVisualOrder[]):void {
    this.graphics.clear();
    for(const order of orders)for(const mark of chamberFurnishingLayout(order,this.tileSize))this.draw(mark);
  }
  private draw(mark:FurnishingMark):void {
    const g=this.graphics,s=this.tileSize,x=mark.x,y=mark.y,p=mark.progress;
    const appearance=ROOM_APPEARANCE[mark.kind];
    // Full-cell flat fills join without an interior tile grid. Only the outer
    // room contour receives a smooth lining; real corridor mouths remain open.
    g.fillStyle(appearance.inside,p).fillRect(x-s/2,y-s/2,s,s);
    g.fillStyle(appearance.wall,p);
    const lining=Math.max(2,s*.1);
    for(const edge of mark.edges){
      const dx=edge==='left'?-1:edge==='right'?1:0,dy=edge==='top'?-1:edge==='bottom'?1:0;
      if(this.openAt?.(mark.column+dx,mark.row+dy))continue;
      if(edge==='top')g.fillRect(x-s/2,y-s/2,s,lining);
      if(edge==='bottom')g.fillRect(x-s/2,y+s/2-lining,s,lining);
      if(edge==='left')g.fillRect(x-s/2,y-s/2,lining,s);
      if(edge==='right')g.fillRect(x+s/2-lining,y-s/2,lining,s);
    }
    g.lineStyle(1,appearance.wall,.3+.35*p);
    if(mark.kind==='queen')return;
    const r=s*(.13+.15*p);
    if(mark.kind==='water'){
      // Dry clay basin: deliberately no blue fill or water surface.
      g.strokeEllipse(x,y,r*2,r*1.5);if(p>=.5)g.strokeEllipse(x,y,r*1.6,r*1.1);
      if(mark.stockFraction>0)g.fillStyle(0x71b6bc,.65).fillEllipse(x,y+r*.3*(1-mark.stockFraction),r*1.6,r*1.1*mark.stockFraction);
    }else if(mark.kind==='food'||mark.kind==='buildingMaterial'){
      // Empty shallow storage hollow, with a twig rim for building materials.
      g.strokeRoundedRect(x-r,y-r*.7,r*2,r*1.4,s*.08);
      if(mark.stockFraction>0){
        g.fillStyle(mark.kind==='food'?0xc88b38:0x77573d,.85);
        const count=Math.ceil(mark.stockFraction*4);
        for(let i=0;i<count;i++)g.fillEllipse(x+(i%2?1:-1)*r*.35,y+(i<2?1:-1)*r*.25,r*.8,r*.55);
      }
      if(p>=.5&&mark.kind==='buildingMaterial'){
        g.lineBetween(x-r,y-r,x+r,y-r*.8);g.lineBetween(x+r,y-r*.8,x+r*.8,y+r);
      }
    }else{
      // Woven roots, not brood bodies or human furniture.
      g.strokeEllipse(x,y,r*2,r*1.4);
      const strands=Math.max(1,Math.ceil(p*4));
      for(let i=0;i<strands;i++){
        const dy=(i-1.5)*s*.065;
        g.lineBetween(x-r*.8,y+dy,x+r*.8,y+dy+s*.035);
      }
      if(mark.kind.startsWith('brood-')&&p>=.5){
        // Small root notches distinguish specialties without function colors.
        const count=mark.kind==='brood-gathering'?1:mark.kind==='brood-building'?2:mark.kind==='brood-care'?3:4;
        for(let i=0;i<count;i++){
          const dx=(i-(count-1)/2)*s*.075;
          g.lineBetween(x+dx,y-r*.9,x+dx+s*.025,y-r*1.1);
        }
      }
    }
  }
  destroy():void {this.graphics.destroy();}
}
