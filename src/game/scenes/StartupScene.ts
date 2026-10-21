import Phaser from 'phaser';

export class StartupScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;

  constructor() {
    super('StartupScene');
  }

  create(): void {
    this.title = this.add
      .text(320, 180, 'ANTHIVE prototype', {
        color: '#f2ead8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5);
  }
}
