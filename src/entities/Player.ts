import Phaser from "phaser";
import { GAME_CONFIG } from "../config";
import { LPCCharacter } from "./LPCCharacter";
import type { Appearance, Direction } from "../types";

export class Player {
  readonly character: LPCCharacter;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private inputLocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number, appearance: Appearance) {
    this.character = new LPCCharacter(scene, x, y, appearance, { withPhysics: true });
    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error("Keyboard input unavailable");
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  get x(): number {
    return this.character.x;
  }
  get y(): number {
    return this.character.y;
  }
  get facing(): Direction {
    return this.character.facing;
  }
  get container(): Phaser.GameObjects.Container {
    return this.character.container;
  }

  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) this.character.setVelocityFromInput(0, 0, 0);
  }

  setAppearance(appearance: Appearance): void {
    this.character.setAppearance(appearance);
  }

  setPosition(x: number, y: number): void {
    this.character.setPosition(x, y);
  }

  faceDirection(d: Direction): void {
    this.character.faceDirection(d);
  }

  update(): void {
    this.character.container.setDepth(10 + this.character.y);
    if (this.inputLocked) {
      this.character.setVelocityFromInput(0, 0, 0);
      return;
    }
    const left = this.cursors.left?.isDown || this.wasd.left.isDown;
    const right = this.cursors.right?.isDown || this.wasd.right.isDown;
    const up = this.cursors.up?.isDown || this.wasd.up.isDown;
    const down = this.cursors.down?.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 && vy !== 0) {
      const inv = 1 / Math.SQRT2;
      vx *= inv;
      vy *= inv;
    }

    this.character.setVelocityFromInput(vx, vy, GAME_CONFIG.playerSpeed);
  }
}
