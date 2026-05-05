# Architecture

How the code is organized and why. Read this before making invasive changes.

## High-level shape

```
┌─────────────────────────────────────────────────────────────┐
│                     index.html                              │
│   ┌─────────────────────────────┐   ┌────────────────────┐  │
│   │   Phaser game canvas         │   │  HTML legend      │  │
│   │   (960×540, 480×270 logical) │   │  (controls, map)  │  │
│   └─────────────────────────────┘   └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────────────┐
   │     Phaser.Game         │   src/main.ts
   │  scene: [Boot, Preload, │
   │   Title, CharCreate,    │
   │   6× zone scenes,       │
   │   6× UI overlay scenes] │
   └─────────────────────────┘
```

The game canvas is **fixed at 960×540 display, 480×270 logical**. Phaser
`Scale.FIT` maps logical to display 2× crisp. The HTML container caps the
canvas size; nothing about the game is full-window.

## Scene tree

| Scene | Type | Active when |
|---|---|---|
| `BootScene` | flow | first frame, then jumps to Preload |
| `PreloadScene` | loader | once on game start; loads LPC sheets, cuts atlas tiles, registers walk anims, kicks off news fetch |
| `TitleScene` | menu | always before the first new game; offered as continue thereafter |
| `CharCreateScene` | menu | only when there's no save (or after a reset) |
| `TownScene` / `EngineeringDistrictScene` / `SkillGroveScene` / `FishingDockScene` / `AIMLLabScene` / `FullStackDungeonScene` | gameplay zone | one at a time; warps swap them |
| `UIScene` | overlay | continuously, on top of every gameplay zone — shows dialog box, credits HUD, toasts |
| `ShopUIScene` / `QuizUIScene` / `TypingUIScene` / `DebugUIScene` / `FishingUIScene` / `SettingsUIScene` | modal | launched on demand; pauses input on the underlying gameplay scene |

All zone scenes extend [`BaseZoneScene`](../src/world/BaseZoneScene.ts), which
encapsulates ground painting, border walls with named doorways, NPC/sign/chest
helpers, dialog/modal locks, dust particles, periodic save, and the
auto-tile painter.

## Cross-scene communication

- **`game.events`** — single shared `Phaser.Events.EventEmitter` for everything that crosses scene boundaries: `credits:changed`, `appearance:changed`, `shop:open`, `shop:close`, `fishing:start`, `fishing:end`, `minigame:start`, `minigame:end`, `toast:show`. Adding a new mini-game = emit `minigame:start/end`; everything else (input lock, HUD pause) reacts.
- **`DialogManager`** singleton in [`systems/DialogManager.ts`](../src/systems/DialogManager.ts) — its own event bus dedicated to dialog show/advance/close. UIScene subscribes for rendering; BaseZoneScene subscribes to release the player on close.

## Save system

[`SaveManager`](../src/systems/SaveManager.ts) wraps `localStorage` with a
versioned schema. Every save read/write goes through it. On schema mismatch
(`CURRENT_VERSION` constant) it discards the stored save and returns defaults.
Bumping the version when the save shape changes auto-migrates everyone with
one line.

Stored shape:

```ts
SaveData {
  version: number;
  hasCharacter: boolean;
  credits: number;
  appearance: { gender, bodyTone, shirt, pants, shoes, hair, hat };
  ownedCosmetics: string[];     // cosmetic IDs the player has bought/started with
  fishCaught: string[];         // first-catch list
  openedChests: string[];       // chest IDs already opened (incl. daily secrets)
  player: { scene, x, y, direction };
  flags: Record<string, boolean>;
  stats: { quizCorrect, quizTotal, typingBest, debugSolved };
}
```

## LPC character system

The player and every NPC are an [`LPCCharacter`](../src/entities/LPCCharacter.ts):
a Phaser container with stacked sprites, one per cosmetic slot.

Layer z-order (back to front):
```
body → shoes → pants → shirt → hair → hat
```

Each layer is a Phaser sprite using its own LPC spritesheet (loaded in
PreloadScene from `lpcLoadList()`). All layers play the same walk animation
(`walk_up / walk_down / walk_left / walk_right`) at the same time, so layers
move in sync. `setAppearance()` rebuilds the affected layers when the player
changes outfit at the shop.

**Scale:** `GAME_CONFIG.charScale = 1.0` puts characters at native 64-px LPC
size — about 2 tiles tall, faces readable. The `LABEL_OFFSET_Y` in
[`NPC.ts`](../src/entities/NPC.ts) is computed from charScale so labels always
sit just above the head regardless of the chosen scale.

## Tile system

- **World tile size** = 32 px. World is **30×20 tiles** = 960×640 px.
- Ground tiles are loaded as **named single textures** (no spritesheet frames)
  by cutting subrectangles out of the LPC atlas in [`PreloadScene.cutAtlasTiles`](../src/scenes/PreloadScene.ts). Each `TEX.X` constant maps to one cut.
- **`paintGround(rect, key)`** lays the same tile across a rectangle.
- **`paintGroundWithVariants(rect, base, variants[], seed)`** lays a base tile and randomly substitutes variants per cell using a seeded PRNG so reloads look identical.
- **`paintRectWithAutoTileBorder(rect, set, interior?)`** — auto-tile painter for the soft border between two terrains. Takes a 9-tile transition set (NW/N/NE/W/C/E/SW/S/SE) and an optional interior key. Used for Town plaza and Skill Grove clearing.

## Decoration helpers

On `BaseZoneScene`:
- `addDecor(key, x, y, opts)` — pure visual sprite, depth = `Z.Entities + y` so y-sort works.
- `addSolidDecor(key, x, y, bodyW, bodyH, bodyOffsetY?)` — visual + invisible static physics body at the base for collision (trees, cottages, fences).
- `addAmbientCritter(key, x, y, { wanderRadius })` — bobs and slowly walks side-to-side; flips on the yoyo.
- `scatterDecor(key, count, rect, opts)` — uniform random scatter inside a rect, seeded RNG.
- `spawnStaticChests()` — reads [`STATIC_CHESTS`](../src/data/chests.ts) for the current scene.
- `spawnDailyIfHere()` — reads `dailySecretFor(todayKey(), [zones])` and spawns a golden chest if today's hash points to this scene.

## Where to edit what

- **Real portfolio content** → [`src/data/portfolio.ts`](../src/data/portfolio.ts) (`WORK[]`, `SKILLS[]`, `PROJECTS[]`)
- **Quiz questions / typing snippets / debug puzzles / fish loot** → respective files in [`src/data/`](../src/data/)
- **Cosmetic shop catalog** → [`src/data/cosmetics.ts`](../src/data/cosmetics.ts) — drop a PNG into `public/assets/lpc/<slot>/` and add a `Cosmetic` entry; the shop rebuilds itself.
- **Tile palette** → [`src/scenes/PreloadScene.ts`](../src/scenes/PreloadScene.ts) `cutAtlasTiles()` to cut new tiles from the LPC atlas, or `makeProcedural()` to generate from `Phaser.Graphics`.
- **A new zone** → see "Adding a zone" in [`README.md`](../README.md).

## What's atypical for a Phaser game

- **No Tiled / TMX maps.** Layouts are code-driven so portfolio content can be
  data-driven from JSON. Trade-off: anything more polished than rectangles
  needs the auto-tile painter or hand-placed decoration.
- **Procedural fallback art.** Anything not in the LPC atlas (chest, server
  rack, news kiosk, monitor, bench, cow/chicken/duck) is generated with
  `Phaser.Graphics`. Painting these procedurally was the cheapest path; they
  can be swapped for real sprites by replacing the `make*` calls.
- **Singleton `DialogManager`.** Most Phaser projects use scene events; we
  wanted a simple bus that any scene could `import` and emit on without
  worrying about scene refs. UIScene listens; gameplay scenes show.

## Build outputs

- `npm run dev` → Vite dev server with HMR on `5173`
- `npm run build` → typechecks then bundles to `dist/`
- `npm run typecheck` → TypeScript only, no bundle
