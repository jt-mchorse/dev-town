import Phaser from "phaser";
import type { Direction } from "../types";

/**
 * Procedural face overlay — paints readable cartoon eyes + mouth onto the LPC
 * head region. LPC's native face features are ~2 px each on a 64-px sprite,
 * which scales down to soup at gameplay resolution; this overlay paints a
 * 2×2-pixel eye dot per side plus a 3-px mouth at the head's eye-line. Slots
 * in as another layer on the LPCCharacter between shirt and hair, so hair
 * fringe and hats still occlude naturally.
 *
 * One global 4-frame spritesheet, frames keyed by Direction:
 *   0 = down  (both eyes visible)
 *   1 = up    (back of head — blank, no features painted)
 *   2 = left  (single eye on the visible left half)
 *   3 = right (single eye on the visible right half)
 */

export const FACE_TEX_KEY = "tex_face_overlay";
const FRAME = 64;
const FRAMES_TOTAL = 4;

export const FACE_FRAME: Record<Direction, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

// LPC head anatomy (frame is 64×64, character centered):
// Hair fringe occupies roughly y=14..22; safe eye line is y=23..26 to avoid
// clipping behind hair on most variants. Mouth at y=29..30.
const EYE_Y = 23;
const MOUTH_Y = 29;
const CENTER_X = 32;

const EYE_COLOR = "#1a1d24";
const MOUTH_COLOR = "#2a1d1d";

function drawDownFace(ctx: CanvasRenderingContext2D, ox: number): void {
  ctx.fillStyle = EYE_COLOR;
  // Left eye (2×2)
  ctx.fillRect(ox + CENTER_X - 5, EYE_Y, 2, 2);
  // Right eye (2×2)
  ctx.fillRect(ox + CENTER_X + 3, EYE_Y, 2, 2);
  // Mouth (3×1, slight smile curl via two pixels dropped at the ends)
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X - 1, MOUTH_Y, 3, 1);
}

function drawLeftFace(ctx: CanvasRenderingContext2D, ox: number): void {
  // When facing left, the body sprite shifts slightly; the visible eye is on
  // the left side of the head. Single 2×2 eye + short profile mouth.
  ctx.fillStyle = EYE_COLOR;
  ctx.fillRect(ox + CENTER_X - 4, EYE_Y, 2, 2);
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X - 6, MOUTH_Y, 2, 1);
}

function drawRightFace(ctx: CanvasRenderingContext2D, ox: number): void {
  ctx.fillStyle = EYE_COLOR;
  ctx.fillRect(ox + CENTER_X + 2, EYE_Y, 2, 2);
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X + 4, MOUTH_Y, 2, 1);
}

/**
 * Build (or no-op) the global face overlay spritesheet. Call once at preload
 * after all other textures exist. Subsequent calls short-circuit.
 *
 * Frame layout: a single 256×64 sheet (4 frames × 64 px) registered as a
 * spritesheet so callers can `setFrame(FACE_FRAME[dir])`.
 */
export function buildFaceOverlay(scene: Phaser.Scene): void {
  if (scene.textures.exists(FACE_TEX_KEY)) return;

  const sheetW = FRAME * FRAMES_TOTAL;
  const canvas = scene.textures.createCanvas(FACE_TEX_KEY, sheetW, FRAME);
  if (!canvas) return;
  const ctx = canvas.context;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, sheetW, FRAME);

  // Frame 0: down
  drawDownFace(ctx, 0);
  // Frame 1: up — back of head, leave transparent
  // Frame 2: left
  drawLeftFace(ctx, FRAME * FACE_FRAME.left);
  // Frame 3: right
  drawRightFace(ctx, FRAME * FACE_FRAME.right);

  // Define the 4 sub-frames on the canvas texture so `setFrame(0..3)` works.
  for (let i = 0; i < FRAMES_TOTAL; i += 1) {
    canvas.add(i, 0, i * FRAME, 0, FRAME, FRAME);
  }
  canvas.refresh();
}
