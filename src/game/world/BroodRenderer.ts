import Phaser from 'phaser';
import type {QueenSnapshot} from '../simulation/queenSystem';
import type {WorldCellCoordinate,WorldPoint} from './worldTypes';
import {broodSlot,queenEggSlot} from './broodVisualLayout';

type Stage=QueenSnapshot['eggs'][number]['stage'];
type RoomStock={id:string;food:{amount:number;consumed:number};water:{amount:number;consumed:number}};
export class BroodRenderer {
  private scene:Phaser.Scene;
  private origin:WorldPoint;
  private queen:Phaser.GameObjects.Graphics;
  private status:Phaser.GameObjects.Text;
  private bodies=new Map<string,{body:Phaser.GameObjects.Graphics;stage:Stage}>();
  private stockLabels=new Map<string,Phaser.GameObjects.Text>();
  private feeding=new Map<string,number>();
  private pulse:Phaser.GameObjects.Graphics;
  private time=0;
  private laid=0;
  private layingUntil=0;
  constructor(scene:Phaser.Scene,origin:WorldPoint){
    this.scene=scene;this.origin={...origin};this.queen=scene.add.graphics().setDepth(6);
    const g=this.queen;g.fillStyle(0x1b1512).lineStyle(1,0xb98a53,.9);
    g.fillEllipse(-15,0,30,19);g.strokeEllipse(-15,0,30,19);g.fillEllipse(5,0,16,12);g.fillCircle(17,-1,6);
    g.lineStyle(1,0x261b17);for(const x of [-3,4,10]){g.lineBetween(x,3,x-8,12);g.lineBetween(x,-4,x-8,-12);}
    g.lineBetween(20,-5,27,-12);g.lineBetween(22,-2,31,-6);g.fillStyle(0xd8b17b);g.fillCircle(20,-3,1);
    this.queen.setPosition(origin.x-30,origin.y+1);this.pulse=scene.add.graphics().setDepth(7);
    this.status=scene.add.text(origin.x-108,origin.y+28,'',{fontFamily:'system-ui, sans-serif',fontSize:'8px',color:'#fff0cb',backgroundColor:'#25231e',padding:{x:3,y:2}}).setDepth(8);
  }
  update(delta:number,state:QueenSnapshot,rooms:Map<string,WorldCellCoordinate[]>,stocks:RoomStock[],tileSize:number,secondsPerDay:number):void {
    this.time+=delta;this.queen.setScale(1+Math.sin(this.time/550)*.018,1+Math.sin(this.time/550)*.04);
    if(state.laidEggs>this.laid)this.layingUntil=this.time+700;this.laid=state.laidEggs;
    const seconds=state.daysUntilNextEgg===null?null:Math.max(0,Math.ceil(state.daysUntilNextEgg*secondsPerDay));
    this.status.setText(seconds===null?`Eiablage pausiert · ${state.bufferCount} warten`:`Nächstes Ei ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · ${state.bufferCount} warten`);
    const visible=new Set<string>(),indices=new Map<string,number>();let queenIndex=0;this.pulse.clear();
    if(this.layingUntil>this.time){this.queen.setRotation(Math.sin((this.layingUntil-this.time)/90)*.04);this.pulse.lineStyle(1,0xf4d38b,.65).strokeEllipse(this.origin.x-45,this.origin.y+1,34,23);}else this.queen.setRotation(0);
    for(const egg of state.eggs){
      if(egg.stage==='adult' || egg.carried)continue;
      let position:WorldPoint|null=null;
      if(!egg.arrived){
        const at=egg.origin??this.origin;
        position=Math.hypot(at.x-this.origin.x,at.y-this.origin.y)<1?queenEggSlot(this.origin,queenIndex++):at;
      }else if(egg.chamberId){const index=indices.get(egg.chamberId)??0;indices.set(egg.chamberId,index+1);position=broodSlot(rooms.get(egg.chamberId)??[],index,tileSize);}
      if(!position)continue;visible.add(egg.id);
      let visual=this.bodies.get(egg.id);
      if(!visual || visual.stage!==egg.stage){
        visual?.body.destroy();const body=this.scene.add.graphics().setDepth(6);
        body.lineStyle(1,0x5b4932,.7);
        if(egg.stage==='egg'){body.fillStyle(0xfff2cf);body.fillEllipse(0,0,5,8);body.strokeEllipse(0,0,5,8);body.fillStyle(0xffffff,.8);body.fillEllipse(-1,-2,1.5,3);}
        else if(egg.stage==='larva'){body.fillStyle(0xe9d9a6);for(let i=0;i<4;i++){body.fillCircle(-4+i*2.5,Math.sin(i)*1.5,3);body.strokeCircle(-4+i*2.5,Math.sin(i)*1.5,3);}body.fillStyle(0x7a593d);body.fillCircle(5,0,1.4);}
        else {body.fillStyle(0xb99462);body.fillEllipse(0,0,7,11);body.strokeEllipse(0,0,7,11);body.lineStyle(1,0xe0c28a,.7);for(let y=-3;y<=3;y+=3)body.lineBetween(-2,y,2,y);}
        visual={body,stage:egg.stage};this.bodies.set(egg.id,visual);
      }
      visual.body.setPosition(position.x,position.y);
      const stock=stocks.find(stock=>stock.id===egg.chamberId);
      if(egg.stage==='larva' && stock && stock.food.consumed+stock.water.consumed>(this.feeding.get(stock.id)??0)){
        this.pulse.lineStyle(1,0x9fc987,.55).strokeCircle(position.x,position.y,7+Math.sin(this.time/250));
      }
    }
    for(const [id,visual] of this.bodies)if(!visible.has(id)){visual.body.destroy();this.bodies.delete(id);}
    const stockIds=new Set<string>();
    for(const stock of stocks){
      this.feeding.set(stock.id,stock.food.consumed+stock.water.consumed);const cell=rooms.get(stock.id)?.[0];if(!cell)continue;stockIds.add(stock.id);
      let label=this.stockLabels.get(stock.id);if(!label){label=this.scene.add.text(cell.column*tileSize+2,cell.row*tileSize+2,'',{fontFamily:'system-ui, sans-serif',fontSize:'7px',color:'#cbd5b7',backgroundColor:'#25231e'}).setDepth(7);this.stockLabels.set(stock.id,label);}
      label.setText(`N ${stock.food.amount.toFixed(1)} · W ${stock.water.amount.toFixed(1)}`);
    }
    for(const [id,label] of this.stockLabels)if(!stockIds.has(id)){label.destroy();this.stockLabels.delete(id);}
  }
  destroy():void {this.queen.destroy();this.status.destroy();this.pulse.destroy();for(const v of this.bodies.values())v.body.destroy();for(const l of this.stockLabels.values())l.destroy();}
}
