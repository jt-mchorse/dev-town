import Phaser from "phaser";
import { SCENES } from "../config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.Boot });
  }

  create(): void {
    this.scene.start(SCENES.Preload);
  }
}
