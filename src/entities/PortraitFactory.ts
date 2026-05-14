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

  for (const slot of LAYER_ORDER) {
    if (slot === "hair" || slot === "hat") continue; // drawn last, after face
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

  // Big-eye face overlay: paint cartoony eyes + mouth at portrait scale so
  // the dialog face matches what's drawn in-world. Portrait is 96×96 covering
  // the top 32×32 of the LPC frame at 3×, so 1 source-px = 3 portrait-px.
  // Eyes sit at source (27,23) and (35,23); mouth at source (31,29).
  ctx.fillStyle = "#1a1d24";
  // Left eye: source (27,23) 2×2 → portrait ((27-16)*3, 23*3) = (33, 69), 6×6
  ctx.fillRect(33, 69, 6, 6);
  // Right eye: source (35,23) 2×2 → portrait (57, 69), 6×6
  ctx.fillRect(57, 69, 6, 6);
  // Mouth: source (31,29) 3×1 → portrait (45, 87), 9×3
  ctx.fillStyle = "#2a1d1d";
  ctx.fillRect(45, 87, 9, 3);

  // Hair + hat on top of the face overlay, so fringe naturally occludes.
  for (const slot of ["hair", "hat"] as LayerSlot[]) {
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

  canvas.refresh();
  return key;
}
