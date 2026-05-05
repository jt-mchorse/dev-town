# /dev/town

A small pixel-art browser game shaped like a classic MMORPG that doubles as an
interactive engineering portfolio. Walk a town, talk to NPCs about the work
history and skills, fish for puns, take a quiz, type a code snippet, debug a
bug, hunt chests, peek at today's AI headlines, and shop for cosmetics.

Built with Phaser 3 + TypeScript + Vite. Pure client-side; saves to localStorage.

> **Working on this project?** Read [`docs/project.md`](docs/project.md) for the
> live status (what's done, what's open) and [`docs/architecture.md`](docs/architecture.md)
> for how the code fits together. Daily change logs live in
> [`docs/sessions/`](docs/sessions/).

## Run it

```sh
npm install
npm run dev
```

Open the URL Vite prints. Pick a gender on the title screen, hit Enter.

```sh
npm run build      # production bundle
npm run typecheck  # tsc --noEmit
```

## Controls

- **WASD** or **arrow keys** — move
- **E** — interact with the highlighted thing (sign, NPC, chest, totem)
- **Space / Enter** — advance dialog
- **Esc** — leave a modal mini-game
- **S** (on the title screen) — open Settings
- **N** (on the title screen, with a save) — wipe save and start over

## The world

| Zone | What lives there |
|---|---|
| Town Square | greeter, shopkeeper, news kiosk, "Mysterious Stump" |
| Engineering District | one foreman per work entry, generated from data |
| Skill Grove | totem per skill, plus a Project Archive |
| AI/ML Lab | three tiered FAQ quiz NPCs (junior / mid / staff) |
| Full-Stack Dungeon | typing trial + spot-the-bug trial |
| Fishing Dock | timing-based fishing mini-game with tech-pun fish |

Town has 5 exits radiating to each zone. Border walls have explicit doorways
where each warp triggers — see [BaseZoneScene.addBorderWalls](src/world/BaseZoneScene.ts).

## Editing the portfolio content

All real portfolio content is data-driven. Edit one file:

- [src/data/portfolio.ts](src/data/portfolio.ts) — `WORK[]`, `SKILLS[]`, `PROJECTS[]`

The Engineering District spawns one building + foreman NPC per `WORK` entry.
The Skill Grove lays out one totem per `SKILLS` entry. The Project Archive
reads `PROJECTS`. No code changes required.

Other knobs:

- [src/data/quiz.ts](src/data/quiz.ts) — quiz questions per tier
- [src/data/typing.ts](src/data/typing.ts) — typing snippets
- [src/data/debug.ts](src/data/debug.ts) — buggy code puzzles
- [src/data/fishing.ts](src/data/fishing.ts) — fish names + flavor + rarity weights
- [src/data/cosmetics.ts](src/data/cosmetics.ts) — shop catalog (LPC layer references)
- [src/data/chests.ts](src/data/chests.ts) — fixed chest spawns + flavor

## Daily news

The News Kiosk in town and the Daily Secret chest both pull from the
[Hacker News Algolia search API](https://hn.algolia.com/api). Today's top
"AI" stories are cached in localStorage for 12h and reused all day.
The Daily Secret chest spawns deterministically at one of the six zones
based on the date string — a different scene every 24h.

No API key is needed.

## Saves

LocalStorage key: `pixel-portfolio.save.v0` (versioned shape; bumping
`CURRENT_VERSION` in [SaveManager](src/systems/SaveManager.ts) auto-resets
old saves on next load).

The save tracks: appearance, credits, owned cosmetics, fish caught, chests
opened, mini-game stats, last position. Settings → reset wipes everything.

## Architecture

- [src/main.ts](src/main.ts) — Phaser config + scene registry
- [src/config.ts](src/config.ts) — central constants (`SCENES`, `EVENTS`, `Z`-layers)
- [src/world/BaseZoneScene.ts](src/world/BaseZoneScene.ts) — abstract zone: ground painting, border walls with doorways, NPC/sign/chest helpers, warp tiles, dust particles, dialog/modal lock
- [src/entities/LPCCharacter.ts](src/entities/LPCCharacter.ts) — layered LPC sprite (body / shoes / pants / shirt / hair / hat) sharing one walk anim
- [src/entities/Player.ts](src/entities/Player.ts), [src/entities/NPC.ts](src/entities/NPC.ts), [src/entities/Chest.ts](src/entities/Chest.ts)
- [src/systems/SaveManager.ts](src/systems/SaveManager.ts) — versioned localStorage save
- [src/systems/DialogManager.ts](src/systems/DialogManager.ts) — singleton event bus for dialog triggers
- [src/systems/NewsService.ts](src/systems/NewsService.ts) — HN Algolia fetch with 12h cache
- [src/scenes/](src/scenes) — gameplay scenes (Town, Engineering, Skill, Fishing, AILab, Dungeon) + UI overlays (UI, Shop, Quiz, Typing, Debug, Settings, Title, Boot, Preload, CharCreate)

Cross-scene chatter goes through `game.events` (credits change, toast,
appearance change, modal open/close). Any new scene can listen without
coupling to the rest.

## Art

All character sprites are from the
[Universal LPC Spritesheet Character Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator),
which collects contributions from the Liberated Pixel Cup community on
OpenGameArt. Licensing is generally CC-BY-SA 3.0 / GPL 3.0+. See
[public/assets/lpc/ATTRIBUTION.md](public/assets/lpc/ATTRIBUTION.md).

Tile graphics, building, dock, totem, chest, kiosk, and dust particles are
drawn procedurally with `Phaser.Graphics` in
[PreloadScene](src/scenes/PreloadScene.ts) — placeholder until you swap in
a Kenney or itch.io tileset of choice.

## Adding a cosmetic

1. Drop a 64-frame LPC PNG into `public/assets/lpc/<slot>/`.
2. Add a `Cosmetic` entry to [src/data/cosmetics.ts](src/data/cosmetics.ts) pointing
   at the new file.
3. Reload — it appears in the shop's catalog automatically and is loaded by
   [LPCCharacter.lpcLoadList()](src/entities/LPCCharacter.ts).

## Adding a zone

1. Add a `SCENES.MyZone` key to [src/config.ts](src/config.ts).
2. Create `src/scenes/MyZoneScene.ts` extending `BaseZoneScene`. Implement
   `buildZone(worldW, worldH)` — paint ground, place NPCs/signs/chests, add
   `addWarp(...)` to neighbors and `addSpawn(name, ...)` matching warp `toSpawn`.
3. Add the doorway tile to `addBorderWalls(...)` so the warp is reachable.
4. Register in [src/main.ts](src/main.ts).
5. Add an exit to it from another zone (warp + doorway + matching spawn).

## Known gaps

- Procedural building/tile art looks placeholder; the LPC kit covers
  characters only. Swapping in a Kenney/itch.io tileset is a search/replace
  in [PreloadScene](src/scenes/PreloadScene.ts).
- No sound — the project ships without audio assets.
- Fish "bobber" feedback is text-only; an animated bobber overlay was
  punted because cross-scene cameras complicate world-space rendering.
- No mobile/touch controls — desktop browser only by design.

## License

Source code: do whatever you want with it. Bundled LPC PNGs carry their
upstream licenses (CC-BY-SA 3.0 / GPL 3.0+); see attribution.
