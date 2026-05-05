export interface ChestDef {
  id: string;
  scene: string;
  x: number;
  y: number;
  reward: number;
  flavorTitle: string;
  flavorBody: string;
}

export interface DailyChestSeed {
  scene: string;
  x: number;
  y: number;
  reward: number;
}

import { GAME_CONFIG, SCENES } from "../config";

const TILE = GAME_CONFIG.tileSize;
const W = GAME_CONFIG.worldTilesX * TILE;
const H = GAME_CONFIG.worldTilesY * TILE;

export const STATIC_CHESTS: ChestDef[] = [
  {
    id: "town_corner",
    scene: SCENES.Town,
    x: TILE * 4,
    y: TILE * 4,
    reward: 8,
    flavorTitle: "Cron Cache",
    flavorBody: "Loose change from a forgotten scheduled job. Free money, technically.",
  },
  {
    id: "town_back",
    scene: SCENES.Town,
    x: W - TILE * 5,
    y: H - TILE * 6,
    reward: 12,
    flavorTitle: "Tech Debt Fund",
    flavorBody: "Someone added it to the backlog years ago. You collected the interest.",
  },
  {
    id: "engineering_back",
    scene: SCENES.Engineering,
    x: TILE * 4,
    y: TILE * 5,
    reward: 14,
    flavorTitle: "Severed Side Project",
    flavorBody: "A weekend hack that almost shipped. The repo got archived; the loot survived.",
  },
  {
    id: "engineering_corner",
    scene: SCENES.Engineering,
    x: W - TILE * 5,
    y: H - TILE * 5,
    reward: 18,
    flavorTitle: "Refactor Bounty",
    flavorBody: "Whoever cleans this up earns a beer. You found the receipt.",
  },
  {
    id: "skill_corner",
    scene: SCENES.Skill,
    x: TILE * 5,
    y: TILE * 4,
    reward: 10,
    flavorTitle: "Stale npm Audit",
    flavorBody: "47 high-severity warnings. Exactly nothing was exploited.",
  },
  {
    id: "skill_back",
    scene: SCENES.Skill,
    x: W - TILE * 4,
    y: H - TILE * 5,
    reward: 16,
    flavorTitle: "Forgotten Library",
    flavorBody: "Last commit: 7 years ago. Still better than your last npm install.",
  },
  {
    id: "fishing_grass",
    scene: SCENES.Fishing,
    x: TILE * 5,
    y: TILE * 5,
    reward: 12,
    flavorTitle: "Lost Bait",
    flavorBody: "Apparently someone keeps their savings in a tackle box. Bold strategy.",
  },
];

export function chestsForScene(sceneKey: string): ChestDef[] {
  return STATIC_CHESTS.filter((c) => c.scene === sceneKey);
}

const DAILY_REWARDS = [22, 28, 35];

export function dailySecretFor(date: string, sceneCandidates: string[]): DailyChestSeed {
  // hash the date string into deterministic position + scene + reward
  let hash = 0;
  for (let i = 0; i < date.length; i += 1) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  const scene = sceneCandidates[Math.abs(hash) % sceneCandidates.length];
  const x = (Math.abs(hash >> 3) % (W / TILE - 6) + 3) * TILE;
  const y = (Math.abs(hash >> 7) % (H / TILE - 6) + 3) * TILE;
  const reward = DAILY_REWARDS[Math.abs(hash >> 11) % DAILY_REWARDS.length];
  return { scene, x, y, reward };
}
