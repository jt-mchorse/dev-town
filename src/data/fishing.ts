export interface FishSpec {
  id: string;
  name: string;
  flavor: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  weight: number;
  reward: number;
}

export const FISH: FishSpec[] = [
  { id: "boot", name: "Old Boot", flavor: "Just a boot. Honestly classic.", rarity: "common", weight: 30, reward: 1 },
  { id: "off_by_one", name: "Off-by-One Trout", flavor: "You aimed for the next one over.", rarity: "common", weight: 22, reward: 3 },
  { id: "stack_overflow", name: "Stack Overflow Salmon", flavor: "Spawned recursively.", rarity: "common", weight: 18, reward: 4 },
  { id: "race_condition", name: "Race Condition Bass", flavor: "Slippery. Catches differ each run.", rarity: "uncommon", weight: 12, reward: 7 },
  { id: "memory_leak", name: "Memory Leak Mackerel", flavor: "Keeps growing while you hold it.", rarity: "uncommon", weight: 8, reward: 9 },
  { id: "heisenbug", name: "Heisenbug", flavor: "Disappears when observed too closely.", rarity: "rare", weight: 5, reward: 14 },
  { id: "null_pointer", name: "Null Pointer", flavor: "Hard to point at. Easy to crash on.", rarity: "rare", weight: 3, reward: 18 },
  { id: "infinite_loop", name: "Infinite Loop Eel", flavor: "Reels in forever and ever and forever and ever.", rarity: "rare", weight: 2, reward: 22 },
  { id: "kernel_panic", name: "Kernel Panic Koi", flavor: "Legendary. Everyone nearby has to reboot.", rarity: "legendary", weight: 1, reward: 50 },
];

const TOTAL_WEIGHT = FISH.reduce((s, f) => s + f.weight, 0);

export function rollFish(rng: () => number = Math.random): FishSpec {
  let r = rng() * TOTAL_WEIGHT;
  for (const fish of FISH) {
    r -= fish.weight;
    if (r <= 0) return fish;
  }
  return FISH[0];
}

export const RARITY_COLOR: Record<FishSpec["rarity"], string> = {
  common: "#bcc4d4",
  uncommon: "#7fdca0",
  rare: "#7faaff",
  legendary: "#ffb84d",
};
