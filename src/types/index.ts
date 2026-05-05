export type Direction = "up" | "down" | "left" | "right";
export type Gender = "male" | "female";
export type CosmeticSlot = "shoes" | "pants" | "shirt" | "hair" | "hat";
export type LayerSlot = "body" | CosmeticSlot;

export interface AppearancePiece {
  cosmeticId: string | null;
}

export interface Appearance {
  gender: Gender;
  bodyTone: "light";
  shirt: AppearancePiece;
  pants: AppearancePiece;
  shoes: AppearancePiece;
  hair: AppearancePiece;
  hat: AppearancePiece;
}

export interface SaveData {
  version: number;
  hasCharacter: boolean;
  credits: number;
  appearance: Appearance;
  ownedCosmetics: string[];
  fishCaught: string[];
  openedChests: string[];
  player: {
    scene: string;
    x: number;
    y: number;
    direction: Direction;
  };
  flags: Record<string, boolean>;
  stats: {
    quizCorrect: number;
    quizTotal: number;
    typingBest: number; // best WPM-ish credits earned in one go
    debugSolved: number;
  };
}

export interface DialogLine {
  speaker?: string;
  text: string;
  color?: string;
}

export interface DialogRequest {
  lines: DialogLine[];
  onClose?: () => void;
}

export interface ToastRequest {
  text: string;
  durationMs?: number;
  color?: string;
}
