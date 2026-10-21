import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 640,
  height: 360,
  pixelArt: true,
  backgroundColor: '#252525',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [WorldScene],
};
