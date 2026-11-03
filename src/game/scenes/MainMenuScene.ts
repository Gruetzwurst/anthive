import Phaser from 'phaser';
import {ColonyMenu} from '../ui/ColonyMenu';
import {ColonyRepository} from '../persistence/colonyRepository';

export class MainMenuScene extends Phaser.Scene {
 constructor(){super('MainMenuScene');}
 create():void {
  const repository=new ColonyRepository();
  const menu=new ColonyMenu(document.querySelector('#game')!,repository,session=>this.scene.start('WorldScene',{session}));
  void menu.refresh();
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{menu.destroy();void repository.close().catch(()=>{});});
 }
}
