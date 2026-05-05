import { GAME_CONFIG, SCENES } from "../config";
import { startersFor } from "../data/cosmetics";
import type { Appearance, SaveData } from "../types";

const CURRENT_VERSION = 3;

function defaultAppearance(): Appearance {
  return {
    gender: "male",
    bodyTone: "light",
    shirt: { cosmeticId: startersFor("shirt")?.id ?? null },
    pants: { cosmeticId: startersFor("pants")?.id ?? null },
    shoes: { cosmeticId: startersFor("shoes")?.id ?? null },
    hair: { cosmeticId: startersFor("hair")?.id ?? null },
    hat: { cosmeticId: null },
  };
}

function defaultSave(): SaveData {
  const starterIds = [
    startersFor("shirt")?.id,
    startersFor("pants")?.id,
    startersFor("shoes")?.id,
    startersFor("hair")?.id,
  ].filter((x): x is string => Boolean(x));

  return {
    version: CURRENT_VERSION,
    hasCharacter: false,
    credits: 0,
    appearance: defaultAppearance(),
    ownedCosmetics: starterIds,
    fishCaught: [],
    openedChests: [],
    player: {
      scene: SCENES.Town,
      x: (GAME_CONFIG.worldTilesX * GAME_CONFIG.tileSize) / 2,
      y: (GAME_CONFIG.worldTilesY * GAME_CONFIG.tileSize) / 2,
      direction: "down",
    },
    flags: {},
    stats: {
      quizCorrect: 0,
      quizTotal: 0,
      typingBest: 0,
      debugSolved: 0,
    },
  };
}

export class SaveManager {
  private static cached: SaveData | null = null;

  static load(): SaveData {
    if (this.cached) return this.cached;
    const fresh = defaultSave();
    try {
      const raw = localStorage.getItem(GAME_CONFIG.saveKey);
      if (!raw) {
        this.cached = fresh;
        return this.cached;
      }
      const parsed = JSON.parse(raw) as Partial<SaveData> & { version?: number };
      if (parsed.version !== CURRENT_VERSION) {
        this.cached = fresh;
        return this.cached;
      }
      this.cached = { ...fresh, ...parsed, appearance: { ...fresh.appearance, ...(parsed.appearance ?? {}) } };
      return this.cached;
    } catch {
      this.cached = fresh;
      return this.cached;
    }
  }

  static save(patch: Partial<SaveData> = {}): SaveData {
    const next: SaveData = { ...this.load(), ...patch };
    this.cached = next;
    localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(next));
    return next;
  }

  static patchAppearance(patch: Partial<Appearance>): SaveData {
    const cur = this.load();
    const next: SaveData = { ...cur, appearance: { ...cur.appearance, ...patch } };
    this.cached = next;
    localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(next));
    return next;
  }

  static reset(): SaveData {
    this.cached = defaultSave();
    localStorage.removeItem(GAME_CONFIG.saveKey);
    return this.cached;
  }
}
