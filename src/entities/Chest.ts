import Phaser from "phaser";
import { Z } from "../config";
import { TEX } from "../scenes/PreloadScene";

export interface ChestVisualOpts {
  golden?: boolean;
}

export class Chest {
  readonly id: string;
  readonly sprite: Phaser.GameObjects.Image;
  private opened: boolean;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    opened: boolean,
    opts: ChestVisualOpts = {},
  ) {
    this.id = id;
    this.opened = opened;
    const tex = opened
      ? TEX.ChestOpen
      : opts.golden
      ? TEX.ChestGold
      : TEX.ChestClosed;
    this.sprite = scene.add.image(x, y, tex).setOrigin(0.5, 0.85).setDepth(Z.Entities);
    if (!opened && opts.golden) {
      scene.tweens.add({
        targets: this.sprite,
        y: y - 1,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }

  isOpened(): boolean {
    return this.opened;
  }

  markOpened(scene: Phaser.Scene): void {
    if (this.opened) return;
    this.opened = true;
    scene.tweens.killTweensOf(this.sprite);
    this.sprite.setTexture(TEX.ChestOpen);
  }
}
