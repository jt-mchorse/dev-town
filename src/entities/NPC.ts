import Phaser from "phaser";
import { Z, GAME_CONFIG } from "../config";
import { LPCCharacter } from "./LPCCharacter";
import type { Appearance, Direction } from "../types";

// Sprite renders at FRAME * charScale tall with anchor (0.5, 0.85), so the
// visible top of the head sits at y - height * 0.85. Label goes a few pixels
// above that.
const LABEL_OFFSET_Y =
  GAME_CONFIG.lpcFrame * GAME_CONFIG.charScale * 0.85 + 6;

export interface NPCSpec {
  id: string;
  appearance: Appearance;
  x: number;
  y: number;
  facing?: Direction;
  onInteract: () => void;
  label?: string;
  interactRange?: number;
}

export class NPC {
  readonly character: LPCCharacter;
  readonly id: string;
  readonly onInteract: () => void;
  readonly interactRange: number;
  private labelText: Phaser.GameObjects.Text | null = null;
  private hint: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, spec: NPCSpec) {
    this.id = spec.id;
    this.onInteract = spec.onInteract;
    this.interactRange = spec.interactRange ?? 28;
    this.character = new LPCCharacter(scene, spec.x, spec.y, spec.appearance, {
      withPhysics: true,
      depth: Z.Entities,
    });
    const body = this.character.container.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.moves = false;
    this.character.faceDirection(spec.facing ?? "down");

    // subtle idle bob
    scene.tweens.add({
      targets: this.character.container,
      y: spec.y - 1,
      duration: 1100 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    if (spec.label) {
      this.labelText = scene.add
        .text(spec.x, spec.y - LABEL_OFFSET_Y, spec.label, {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#bcc4d4",
          backgroundColor: "#0b0d12cc",
          padding: { x: 3, y: 1 },
        })
        .setOrigin(0.5, 1)
        .setDepth(Z.Overlay);
    }
  }

  get x(): number {
    return this.character.x;
  }
  get y(): number {
    return this.character.y;
  }

  showInteractHint(scene: Phaser.Scene, show: boolean): void {
    if (show && !this.hint) {
      this.hint = scene.add
        .text(this.x, this.y - (LABEL_OFFSET_Y + 12), "[E]", {
          fontFamily: "monospace",
          fontSize: "9px",
          color: "#ffd479",
        })
        .setOrigin(0.5, 1)
        .setDepth(Z.Overlay);
    } else if (!show && this.hint) {
      this.hint.destroy();
      this.hint = null;
    }
  }

  update(): void {
    this.character.container.setDepth(10 + this.y);
    if (this.labelText) this.labelText.setPosition(this.x, this.y - LABEL_OFFSET_Y);
    if (this.hint) this.hint.setPosition(this.x, this.y - (LABEL_OFFSET_Y + 12));
  }

  destroy(): void {
    this.character.destroy();
    this.labelText?.destroy();
    this.hint?.destroy();
  }
}
