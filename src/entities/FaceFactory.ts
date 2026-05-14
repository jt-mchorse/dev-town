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
//   y=14..22  hair fringe region (overlay sits behind hair, occluded here)
//   y=18..30  head skin region (we paint a skin patch here to cover LPC's
//             tiny native facial pixels and host our larger cartoon features)
// Vertical layout of features inside that patch:
//   y=21  eyebrows
//   y=23..25  eyes (3 rows)
//   y=27  nose tint
//   y=28  cheek blush
//   y=29  mouth
//   y=30  smile dimples
const CENTER_X = 32;
const BROW_Y = 21;
const EYE_Y = 23;
const NOSE_Y = 27;
const BLUSH_Y = 28;
const MOUTH_Y = 29;

// Palette tuned to match the LPC light-skin body sheet so the painted head
// patch reads as the same character, not a cutout. (We currently only ship
// bodyTone="light"; revisit when adding more.)
const SKIN = "#f4c590";
const SKIN_SHADE = "#d4a06e";
const BLUSH = "#e89580";
const BROW_COLOR = "#6e4a24";
const EYE_COLOR = "#1a1d24";
const EYE_HIGHLIGHT = "#f4f6fa";
const MOUTH_COLOR = "#2a1d1d";

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = EYE_COLOR;
  ctx.fillRect(x, y, 3, 3);
  // Tiny catchlight pixel in the upper-left of the eye for liveliness.
  ctx.fillStyle = EYE_HIGHLIGHT;
  ctx.fillRect(x, y, 1, 1);
}

/** Paint a soft-cornered skin patch covering the LPC face region. */
function paintHeadPatch(
  ctx: CanvasRenderingContext2D,
  ox: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + x, y, w, h);
  // Round each corner by clearing one pixel — turns the rectangle into
  // a rough oval at this resolution.
  ctx.clearRect(ox + x, y, 1, 1);
  ctx.clearRect(ox + x + w - 1, y, 1, 1);
  ctx.clearRect(ox + x, y + h - 1, 1, 1);
  ctx.clearRect(ox + x + w - 1, y + h - 1, 1, 1);
  // Soft jawline shade — bottom row, one px in from each side.
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(ox + x + 1, y + h - 1, w - 2, 1);
}

function drawDownFace(ctx: CanvasRenderingContext2D, ox: number): void {
  // Skin patch (14 wide × 13 tall): hides the LPC face beneath ours.
  paintHeadPatch(ctx, ox, 25, 18, 14, 13);
  // Brows — a touch above the eyes, give the face attitude.
  ctx.fillStyle = BROW_COLOR;
  ctx.fillRect(ox + CENTER_X - 6, BROW_Y, 3, 1);
  ctx.fillRect(ox + CENTER_X + 3, BROW_Y, 3, 1);
  // Eyes
  drawEye(ctx, ox + CENTER_X - 6, EYE_Y);
  drawEye(ctx, ox + CENTER_X + 3, EYE_Y);
  // Nose: single shaded pixel between the eyes, dropped two rows.
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(ox + CENTER_X - 1, NOSE_Y, 2, 1);
  // Cheek blush — a hint of warmth either side of the nose.
  ctx.fillStyle = BLUSH;
  ctx.fillRect(ox + CENTER_X - 6, BLUSH_Y, 2, 1);
  ctx.fillRect(ox + CENTER_X + 4, BLUSH_Y, 2, 1);
  // Mouth: 4-px line + two smile-curl dimples at the corners.
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X - 2, MOUTH_Y, 4, 1);
  ctx.fillRect(ox + CENTER_X - 3, MOUTH_Y + 1, 1, 1);
  ctx.fillRect(ox + CENTER_X + 2, MOUTH_Y + 1, 1, 1);
}

function drawLeftFace(ctx: CanvasRenderingContext2D, ox: number): void {
  // Half-head patch on the visible (left) half. 8 wide so it lands on the
  // LPC face's left side when the body sprite shifts for the left walk row.
  paintHeadPatch(ctx, ox, 24, 18, 9, 13);
  // Brow over the visible eye
  ctx.fillStyle = BROW_COLOR;
  ctx.fillRect(ox + CENTER_X - 7, BROW_Y, 3, 1);
  // Profile eye
  drawEye(ctx, ox + CENTER_X - 7, EYE_Y);
  // Tiny nose nub at the far-left edge
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(ox + 24, NOSE_Y, 1, 1);
  // Profile mouth
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X - 7, MOUTH_Y, 3, 1);
}

function drawRightFace(ctx: CanvasRenderingContext2D, ox: number): void {
  paintHeadPatch(ctx, ox, 31, 18, 9, 13);
  ctx.fillStyle = BROW_COLOR;
  ctx.fillRect(ox + CENTER_X + 4, BROW_Y, 3, 1);
  drawEye(ctx, ox + CENTER_X + 4, EYE_Y);
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(ox + 39, NOSE_Y, 1, 1);
  ctx.fillStyle = MOUTH_COLOR;
  ctx.fillRect(ox + CENTER_X + 4, MOUTH_Y, 3, 1);
}

/**
 * Paint the back-of-head silhouette: a slim skin sliver showing one ear,
 * but no facial features. Keeps the head from looking transparent when
 * the player walks north.
 */
function drawUpFace(ctx: CanvasRenderingContext2D, ox: number): void {
  // Two narrow skin slivers at the edges of the head (the ears that peek
  // around behind the hair). The body sheet already paints the back-of-head
  // shape; we just reinforce the ear positions.
  ctx.fillStyle = SKIN;
  ctx.fillRect(ox + 25, 22, 1, 3); // left ear
  ctx.fillRect(ox + 38, 22, 1, 3); // right ear
  ctx.fillStyle = SKIN_SHADE;
  ctx.fillRect(ox + 25, 24, 1, 1);
  ctx.fillRect(ox + 38, 24, 1, 1);
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

  // Frame 0: down (facing camera — full face)
  drawDownFace(ctx, 0);
  // Frame 1: up (back of head — ears only)
  drawUpFace(ctx, FRAME * FACE_FRAME.up);
  // Frame 2: left profile
  drawLeftFace(ctx, FRAME * FACE_FRAME.left);
  // Frame 3: right profile
  drawRightFace(ctx, FRAME * FACE_FRAME.right);

  // Define the 4 sub-frames on the canvas texture so `setFrame(0..3)` works.
  for (let i = 0; i < FRAMES_TOTAL; i += 1) {
    canvas.add(i, 0, i * FRAME, 0, FRAME, FRAME);
  }
  canvas.refresh();
}
