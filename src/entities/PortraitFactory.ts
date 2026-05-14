import Phaser from "phaser";
import { BODY_SHEETS, pickGenderedSheet } from "../data/lpc";
import { getCosmetic } from "../data/cosmetics";
import type { Appearance, LayerSlot } from "../types";

/**
 * Renders per-character portraits by compositing the head+shoulders region
 * of each LPC cosmetic layer at 3× scale into a 96×96 canvas. The result is
 * registered as a Phaser canvas texture so dialog UI can blit it by key.
 *
 * LPC anatomy (64×64 frame at frame index 130 = walk-down idle):
 *   y= 0..32  head + neck + shoulders   ← portrait window
 *   y=32..64  torso + legs              ← discarded
 *
 * We crop the center 32×32 region of that top half and scale 3× to 96×96 so
 * the face fills the portrait.
 */

const LAYER_ORDER: LayerSlot[] = ["body", "shoes", "pants", "shirt", "hair", "hat"];
const PORTRAIT_SIZE = 96;
const SOURCE_CROP = 32; // pixels of the LPC frame's head-region we crop
const FRAME_INDEX = 130; // row 10 col 0 — walk-down idle
const FRAME_SIZE = 64;
const SHEET_COLS = 13;

function appearanceKey(a: Appearance): string {
  return [
    "p",
    a.gender,
    a.bodyTone,
    a.shirt.cosmeticId ?? "-",
    a.pants.cosmeticId ?? "-",
    a.shoes.cosmeticId ?? "-",
    a.hair.cosmeticId ?? "-",
    a.hat.cosmeticId ?? "-",
  ].join("_");
}

function textureKeyForSlot(a: Appearance, slot: LayerSlot): string | null {
  if (slot === "body") return BODY_SHEETS[a.gender].key;
  const piece = a[slot];
  const cosm = getCosmetic(piece.cosmeticId);
  if (!cosm) return null;
  const sheet = pickGenderedSheet(cosm.sheets, a.gender);
  return sheet?.key ?? null;
}

/**
 * Build (or fetch from cache) a portrait texture for the given appearance.
 * Returns the Phaser texture key. The scene's TextureManager is used as the
 * cache backing store, so portraits live as long as the game does.
 */
export function buildPortrait(scene: Phaser.Scene, a: Appearance): string {
  const key = appearanceKey(a);
  if (scene.textures.exists(key)) return key;

  const canvas = scene.textures.createCanvas(key, PORTRAIT_SIZE, PORTRAIT_SIZE);
  if (!canvas) return key;
  const ctx = canvas.context;
  ctx.imageSmoothingEnabled = false;

  // Soft inset background panel so the portrait sits in a frame
  ctx.fillStyle = "#10141c";
  ctx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  ctx.strokeStyle = "#2a3142";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, PORTRAIT_SIZE - 2, PORTRAIT_SIZE - 2);

  // Source rectangle on every LPC sheet: top-half head/shoulders crop
  const col = FRAME_INDEX % SHEET_COLS;
  const row = Math.floor(FRAME_INDEX / SHEET_COLS);
  const sx = col * FRAME_SIZE + (FRAME_SIZE - SOURCE_CROP) / 2; // center
  const sy = row * FRAME_SIZE;

  // Composite every LPC layer (body, shoes, pants, shirt, hair, hat) FIRST.
  // The face is painted LAST so heavy fringes (bob, long hair) and hat brims
  // can't hide the cartoon expression — readability beats realistic occlusion.
  for (const slot of LAYER_ORDER) {
    const texKey = textureKeyForSlot(a, slot);
    if (!texKey || !scene.textures.exists(texKey)) continue;
    const src = scene.textures.get(texKey).getSourceImage() as
      | HTMLImageElement
      | HTMLCanvasElement;
    if (!src || !("width" in src) || !src.width) continue;
    try {
      ctx.drawImage(
        src,
        sx,
        sy,
        SOURCE_CROP,
        SOURCE_CROP,
        0,
        0,
        PORTRAIT_SIZE,
        PORTRAIT_SIZE,
      );
    } catch {
      // Sheet may not have loaded yet; skip silently
    }
  }

  // Filled cartoon face on top. Mirrors FaceFactory's down-frame layout at 3×
  // (portrait is 96×96 covering the top 32×32 of the LPC frame, so 1 source-px
  // = 3 portrait-px). Order: skin patch → brows → eyes (with catchlight) →
  // nose → blush → mouth → dimples.
  const sp = (sx: number, sy: number, sw: number, sh: number): [number, number, number, number] =>
    [(sx - 16) * 3, sy * 3, sw * 3, sh * 3];

  // Skin patch — opaque, hides whatever hair/hat tried to paint over the face.
  ctx.fillStyle = "#f4c590";
  ctx.fillRect(...sp(25, 18, 14, 13));
  ctx.clearRect(...sp(25, 18, 1, 1));
  ctx.clearRect(...sp(38, 18, 1, 1));
  ctx.clearRect(...sp(25, 30, 1, 1));
  ctx.clearRect(...sp(38, 30, 1, 1));
  // Jawline shade
  ctx.fillStyle = "#d4a06e";
  ctx.fillRect(...sp(26, 30, 12, 1));

  // Brows
  ctx.fillStyle = "#6e4a24";
  ctx.fillRect(...sp(26, 21, 3, 1));
  ctx.fillRect(...sp(35, 21, 3, 1));

  // Eyes: source (26,23) and (35,23), 3×3 each
  ctx.fillStyle = "#1a1d24";
  ctx.fillRect(...sp(26, 23, 3, 3));
  ctx.fillRect(...sp(35, 23, 3, 3));
  // Catchlights
  ctx.fillStyle = "#f4f6fa";
  ctx.fillRect(...sp(26, 23, 1, 1));
  ctx.fillRect(...sp(35, 23, 1, 1));

  // Nose
  ctx.fillStyle = "#d4a06e";
  ctx.fillRect(...sp(31, 27, 2, 1));

  // Cheek blush
  ctx.fillStyle = "#e89580";
  ctx.fillRect(...sp(26, 28, 2, 1));
  ctx.fillRect(...sp(36, 28, 2, 1));

  // Mouth + smile dimples
  ctx.fillStyle = "#2a1d1d";
  ctx.fillRect(...sp(30, 29, 4, 1));
  ctx.fillRect(...sp(29, 30, 1, 1));
  ctx.fillRect(...sp(34, 30, 1, 1));

  canvas.refresh();
  return key;
}
