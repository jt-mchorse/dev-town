import type { CosmeticSlot } from "../types";
import type { CosmeticSheets } from "./lpc";

export interface Cosmetic {
  id: string;
  slot: CosmeticSlot;
  name: string;
  flavor: string;
  price: number;
  starter?: boolean;
  sheets: CosmeticSheets;
}

const SHIRT = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  fileColor: string,
  starter = false,
): Cosmetic => ({
  id,
  slot: "shirt",
  name,
  flavor,
  price,
  starter,
  sheets: {
    male: {
      key: `lpc_shirt_${fileColor}_male`,
      url: `assets/lpc/torso/longsleeve_${fileColor}_male.png`,
    },
    female: {
      key: `lpc_shirt_${fileColor}_female`,
      url: `assets/lpc/torso/longsleeve_${fileColor}_female.png`,
    },
  },
});

const PANTS = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  fileColor: string,
  starter = false,
): Cosmetic => ({
  id,
  slot: "pants",
  name,
  flavor,
  price,
  starter,
  sheets: {
    male: {
      key: `lpc_pants_${fileColor}_male`,
      url: `assets/lpc/legs/pants_${fileColor}_male.png`,
    },
    female: {
      key: `lpc_pants_${fileColor}_female`,
      url: `assets/lpc/legs/pants_${fileColor}_female.png`,
    },
  },
});

const SHOES = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  fileColor: string,
  starter = false,
): Cosmetic => ({
  id,
  slot: "shoes",
  name,
  flavor,
  price,
  starter,
  sheets: {
    male: {
      key: `lpc_shoes_${fileColor}_male`,
      url: `assets/lpc/feet/shoes_${fileColor}_male.png`,
    },
    female: {
      key: `lpc_shoes_${fileColor}_female`,
      url: `assets/lpc/feet/shoes_${fileColor}_female.png`,
    },
  },
});

const HAIR = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  filename: string,
  starter = false,
): Cosmetic => ({
  id,
  slot: "hair",
  name,
  flavor,
  price,
  starter,
  sheets: {
    unisex: {
      key: `lpc_hair_${filename}`,
      url: `assets/lpc/hair/${filename}.png`,
    },
  },
});

const HAT = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  filename: string,
): Cosmetic => ({
  id,
  slot: "hat",
  name,
  flavor,
  price,
  sheets: {
    unisex: {
      key: `lpc_hat_${filename}`,
      url: `assets/lpc/hat/${filename}.png`,
    },
  },
});

export const COSMETICS: Cosmetic[] = [
  // starter outfit
  SHIRT("shirt_white", "Plain Tee", "The standard issue. Like a default constructor.", 0, "white", true),
  PANTS("pants_brown", "Brown Trousers", "Practical. Boring. Browser-safe.", 0, "brown", true),
  SHOES("shoes_brown", "Worn Shoes", "Mileage: undefined.", 0, "brown", true),
  HAIR("hair_bob_chestnut", "Tidy Bob — Chestnut", "Came pre-installed.", 0, "bob_chestnut", true),

  // shop shirts
  SHIRT("shirt_navy", "Stack Trace Tee", "Navy. Calming, until you read line 47.", 12, "navy"),
  SHIRT("shirt_red", "Critical Path Top", "Production-red. Wear with caution.", 18, "red"),
  SHIRT("shirt_forest", "Linter Approved Tee", "Pure forest green. Zero warnings.", 18, "forest"),

  // shop pants
  PANTS("pants_charcoal", "Hotfix Slacks", "Goes with anything. Even an outage.", 14, "charcoal"),
  PANTS("pants_navy", "Code Review Trousers", "Slightly more formal than the standup.", 16, "navy"),

  // shop hair
  HAIR("hair_buzzcut_raven", "Buzzcut — Raven", "Low overhead. O(1) maintenance.", 20, "buzzcut_raven"),
  HAIR("hair_buzzcut_ginger", "Buzzcut — Ginger", "+1 charisma in design crits.", 20, "buzzcut_ginger"),
  HAIR("hair_bob_blonde", "Bob — Blonde", "Sun-bleached, like a forgotten staging env.", 18, "bob_blonde"),
  HAIR("hair_bob_raven", "Bob — Raven", "Dark mode, but for hair.", 18, "bob_raven"),

  // hats
  HAT("hat_cap_brown", "Adventurer's Cap", "Every protagonist needs one.", 35, "feather_cap_brown"),
  HAT("hat_cap_red", "Sysadmin's Plume", "Demands respect at standups.", 45, "feather_cap_red"),
];

export const COSMETICS_BY_ID = new Map(COSMETICS.map((c) => [c.id, c]));

export function startersFor(slot: CosmeticSlot): Cosmetic | undefined {
  return COSMETICS.find((c) => c.starter && c.slot === slot);
}

export function getCosmetic(id: string | null): Cosmetic | null {
  if (!id) return null;
  return COSMETICS_BY_ID.get(id) ?? null;
}
