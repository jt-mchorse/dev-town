import Phaser from "phaser";
import { GAME_CONFIG, Z } from "../config";
import { COSMETICS, getCosmetic } from "../data/cosmetics";
import {
  BODY_SHEETS,
  FRAME,
  LAYER_Z,
  pickGenderedSheet,
  walkAnimKey,
  walkFrame0,
  WALK_ROWS,
  SHEET_COLS,
} from "../data/lpc";
import type { Appearance, Direction, LayerSlot } from "../types";
import { buildFaceOverlay, FACE_FRAME, FACE_TEX_KEY } from "./FaceFactory";

// Face sits ABOVE hair and hat. Heavy-fringe hair (bob, long hair) otherwise
// completely hides the face overlay; cartoon expression is more important
// here than realistic occlusion, so the face wins.
const FACE_DEPTH = 6;

export interface LPCAssetSpec {
  key: string;
  url: string;
}

/**
 * Returns every spritesheet key+url that needs to be loaded
 * to render any character + every shop cosmetic.
 */
export function lpcLoadList(): LPCAssetSpec[] {
  const out: LPCAssetSpec[] = [BODY_SHEETS.male, BODY_SHEETS.female];
  for (const c of COSMETICS) {
    if (c.sheets.unisex) out.push(c.sheets.unisex);
    if (c.sheets.male) out.push(c.sheets.male);
    if (c.sheets.female) out.push(c.sheets.female);
  }
  // de-dupe by key
  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.key) ? false : (seen.add(s.key), true)));
}

/**
 * Phaser anims are keyed globally and reference one texture each, so we register
 * 4 walk anims (one per direction) for every loaded LPC spritesheet.
 */
export function registerWalkAnims(scene: Phaser.Scene): void {
  for (const spec of lpcLoadList()) {
    if (!scene.textures.exists(spec.key)) continue;
    for (const dir of ["up", "left", "down", "right"] as Direction[]) {
      const key = walkAnimKey(spec.key, dir);
      if (scene.anims.exists(key)) continue;
      const row = WALK_ROWS[dir];
      const start = row * SHEET_COLS + 1;
      const end = row * SHEET_COLS + 8;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(spec.key, { start, end }),
        frameRate: 9,
        repeat: -1,
      });
    }
  }
}

const LAYER_ORDER: LayerSlot[] = ["body", "shoes", "pants", "shirt", "hair", "hat"];

export class LPCCharacter {
  readonly container: Phaser.GameObjects.Container;
  private layers = new Map<LayerSlot, Phaser.GameObjects.Sprite>();
  private faceSprite: Phaser.GameObjects.Sprite | null = null;
  private appearance: Appearance;
  private direction: Direction = "down";
  private animating = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    appearance: Appearance,
    options: { withPhysics?: boolean; depth?: number } = {},
  ) {
    this.appearance = structuredClone(appearance);
    this.container = scene.add.container(x, y);
    this.container.setDepth(options.depth ?? Z.Entities);
    this.container.setSize(16, 12);

    if (options.withPhysics) {
      scene.physics.add.existing(this.container);
      const body = this.container.body as Phaser.Physics.Arcade.Body;
      body.setSize(12, 8);
      body.setOffset(-6, 6);
      body.setCollideWorldBounds(true);
    }

    for (const slot of LAYER_ORDER) this.rebuildLayer(slot);
    this.buildFaceSprite();
    this.faceDirection("down");
  }

  private buildFaceSprite(): void {
    // Ensure the global overlay sheet exists; safe to call repeatedly.
    buildFaceOverlay(this.scene);
    if (!this.scene.textures.exists(FACE_TEX_KEY)) return;
    const sprite = this.scene.add.sprite(0, 0, FACE_TEX_KEY, FACE_FRAME.down);
    sprite.setOrigin(0.5, 0.85);
    sprite.setDisplaySize(FRAME * GAME_CONFIG.charScale, FRAME * GAME_CONFIG.charScale);
    sprite.setDepth(FACE_DEPTH);
    this.container.add(sprite);
    this.container.sort("depth");
    this.faceSprite = sprite;
  }

  get x(): number {
    return this.container.x;
  }
  get y(): number {
    return this.container.y;
  }
  get facing(): Direction {
    return this.direction;
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setAppearance(next: Appearance): void {
    const wasAppearance = this.appearance;
    this.appearance = structuredClone(next);
    for (const slot of LAYER_ORDER) {
      const a = wasAppearance[slot as keyof Appearance];
      const b = next[slot as keyof Appearance];
      if (slot === "body" || JSON.stringify(a) !== JSON.stringify(b)) {
        this.rebuildLayer(slot);
      }
    }
    if (wasAppearance.gender !== next.gender) {
      // body changed, rebuild every layer in case gender-specific sheet differs
      for (const slot of LAYER_ORDER) this.rebuildLayer(slot);
    }
    this.faceDirection(this.direction);
  }

  setVelocityFromInput(vx: number, vy: number, speed: number): void {
    const body = this.container.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;
    body.setVelocity(vx * speed, vy * speed);
    if (vx === 0 && vy === 0) {
      this.stopWalking();
    } else {
      let dir: Direction = this.direction;
      if (Math.abs(vx) > Math.abs(vy)) dir = vx < 0 ? "left" : "right";
      else dir = vy < 0 ? "up" : "down";
      this.walk(dir);
    }
  }

  walk(direction: Direction): void {
    this.direction = direction;
    if (this.animating && this.lastDir === direction) return;
    this.lastDir = direction;
    this.animating = true;
    this.layers.forEach((sprite, slot) => {
      const tex = sprite.texture.key;
      if (!tex) return;
      const anim = walkAnimKey(tex, direction);
      if (this.scene.anims.exists(anim)) sprite.play(anim, true);
      void slot;
    });
    this.syncFaceDirection();
  }

  stopWalking(): void {
    if (!this.animating) {
      this.faceDirection(this.direction);
      return;
    }
    this.animating = false;
    this.faceDirection(this.direction);
  }

  faceDirection(direction: Direction): void {
    this.direction = direction;
    this.lastDir = null;
    const frame = walkFrame0(direction);
    this.layers.forEach((sprite) => {
      sprite.stop();
      if (sprite.texture.key) sprite.setFrame(frame);
    });
    this.syncFaceDirection();
  }

  destroy(): void {
    this.layers.forEach((s) => s.destroy());
    this.layers.clear();
    this.faceSprite?.destroy();
    this.faceSprite = null;
    this.container.destroy();
  }

  private syncFaceDirection(): void {
    if (!this.faceSprite) return;
    this.faceSprite.setFrame(FACE_FRAME[this.direction]);
  }

  private lastDir: Direction | null = null;

  private textureKeyForSlot(slot: LayerSlot): string | null {
    if (slot === "body") return BODY_SHEETS[this.appearance.gender].key;
    const piece = this.appearance[slot];
    const cosm = getCosmetic(piece.cosmeticId);
    if (!cosm) return null;
    const sheet = pickGenderedSheet(cosm.sheets, this.appearance.gender);
    return sheet?.key ?? null;
  }

  private rebuildLayer(slot: LayerSlot): void {
    const existing = this.layers.get(slot);
    if (existing) {
      existing.destroy();
      this.layers.delete(slot);
    }
    const key = this.textureKeyForSlot(slot);
    if (!key) return;
    if (!this.scene.textures.exists(key)) return;
    const sprite = this.scene.add.sprite(0, 0, key, walkFrame0(this.direction));
    sprite.setOrigin(0.5, 0.85);
    sprite.setDisplaySize(FRAME * GAME_CONFIG.charScale, FRAME * GAME_CONFIG.charScale);
    sprite.setDepth(LAYER_Z[slot]);
    this.container.add(sprite);
    // re-sort container by layer z
    this.container.sort("depth");
    this.layers.set(slot, sprite);
  }
}
