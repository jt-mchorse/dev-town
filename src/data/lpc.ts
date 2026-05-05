import { GAME_CONFIG } from "../config";
import type { Direction, Gender, LayerSlot } from "../types";

export const FRAME = GAME_CONFIG.lpcFrame;
export const SHEET_COLS = 13;

export const WALK_ROWS: Record<Direction, number> = {
  up: 8,
  left: 9,
  down: 10,
  right: 11,
};

export function walkFrame0(direction: Direction): number {
  return WALK_ROWS[direction] * SHEET_COLS;
}

export function walkAnimKey(textureKey: string, direction: Direction): string {
  return `${textureKey}__walk_${direction}`;
}

export const LAYER_Z: Record<LayerSlot, number> = {
  body: 0,
  shoes: 1,
  pants: 2,
  shirt: 3,
  hair: 4,
  hat: 5,
};

export interface SheetSpec {
  key: string;
  url: string;
}

export const BODY_SHEETS: Record<Gender, SheetSpec> = {
  male: { key: "lpc_body_male", url: "assets/lpc/body/male_light.png" },
  female: { key: "lpc_body_female", url: "assets/lpc/body/female_light.png" },
};

export interface CosmeticSheets {
  male?: SheetSpec;
  female?: SheetSpec;
  unisex?: SheetSpec;
}

export function pickGenderedSheet(
  sheets: CosmeticSheets,
  gender: Gender,
): SheetSpec | null {
  return sheets[gender] ?? sheets.unisex ?? null;
}
