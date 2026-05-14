# Project status — /dev/town

This file is the **single source of truth for what's done, what's next, and what's
deferred**. Update it at the end of every session. Day-to-day work logs live in
[`docs/sessions/`](sessions/). The session logs are append-only history; this
file is the live state.

---

## Snapshot

- **Stack:** Phaser 3 + TypeScript + Vite + LPC art (CC-BY-SA 3.0 / GPL3+)
- **Persistence:** localStorage only (`pixel-portfolio.save.v0`, schema v3)
- **Build:** `npm run dev` for local, `npm run build` for production
- **Target:** desktop browser, fixed 960×540 game window inside a 1000-px page

## Phases shipped

- [x] **Phase 0** — skeleton (Phaser + TS + Vite scaffold, scene chain, dialog box, save/load)
- [x] **Phase 1** — LPC layered character + character creation + town hub with NPCs
- [x] **Phase 2** — portfolio data schema, Engineering District, Skill Grove, warp system
- [x] **Phase 3** — fishing dock + fishing mini-game, cosmetic shop UI, credits loop
- [x] **Phase 4** — AI/ML Lab (FAQ quiz), Full-Stack Dungeon (typing + spot-the-bug), chest hunt
- [x] **Phase 5** — News service (HN Algolia, 12 h cache), news kiosk, daily-secret chest
- [x] **Phase 6** — title scene, settings overlay, NPC idle-bob, dust particles, README

## Polish passes shipped (post Phase 6)

- [x] LPC tile atlas integration — 32-px grid + atlas-cut named tile textures
- [x] Auto-tile dirt ring on Town plaza + Skill Grove clearing
- [x] Smooth transitions everywhere — sand shoulders on Engineering avenue, sand-shore tile + sand strip + dock on Fishing Dock, dirt edge strips on Town brick paths
- [x] Animated water shimmer (3-frame cycle, ~14 ripple sprites)
- [x] Tree variants + density tuning (small/large pine + oak, proximity rejection)
- [x] Player + NPC scale bumped to 1.0 (full LPC 64-px, faces readable)
- [x] NPC label offset tied to character scale so labels never sit inside bodies
- [x] Engineering: standalone building labels dropped (NPC label carries the name now); buildings lowered so they fit the camera viewport
- [x] Skill Grove: bushes removed from in-clearing scatter, flowers restored to 8×8 procedural icons
- [x] Modal-UI hint text uses ASCII (`W/S A/D`) — `↑↓←→` were rendering as glyph soup at 9-px font

## Polish tiers (shipped 2026-04-30 → 2026-05-14)

> Full review + plan that spawned these: [`docs/review-2026-04-30.md`](review-2026-04-30.md).

- [x] **Tier 1 — Portrait system.** Per-NPC 96×96 head-and-shoulders portraits composed from each character's LPC layers, cached on the scene texture manager, slotted into the left of the dialog box. Faces are readable.
- [x] **Tier 2 — Foundations + dungeon floor.** Engineering buildings now sit on auto-tile dirt foundations (matches Town cottages + farm). New procedural dungeon-flagstone floor replaced the `tex_wall` placeholder.
- [x] **Tier 3 — Density + per-zone variety.** AI/ML Lab carpet widened, 12 server racks across the back wall, whiteboard sprites, on-screen monitor row, side-wall crates. Dungeon: crate clusters of three at each corridor mouth, eight cobwebs, scattered rubble. Engineering: alternating brown- and slate-roof buildings, street lamps between them.
- [x] **Tier 4 — Polish.** NPCs glance left/right every 6–14 s and snap back. Animated bobbing bobbers on the Fishing Dock pond (cast spot + three ambient drifters).
- [x] **Tier 5 — Stone↔dirt auto-tile on the Engineering avenue.** Procedural 9-tile set (`tex_sd_*`) replaces the hard sand-shoulder cut so the avenue blends into surrounding stone.
- [x] **Tier 6 — Day/night tint overlay.** `BaseZoneScene` runs a 5-anchor colour cycle (dawn → day → dusk → night → predawn) over an 8-minute loop, drawn at `Z.Overlay+10`, scroll-locked, refreshed every 200 ms.
- [x] **Tier 7 — Trinkets UI.** Settings → `[T]` opens a modal listing every static chest. Opened chests show their flavor body + reward; unopened show `◇ undiscovered • hidden in <zone>`. Daily-secret count separated in the header.
- [x] **Tier 8 — First-launch onboarding.** TitleScene launches `IntroUIScene` the first time a player hits Enter (gated by `save.flags.hasSeenIntro`). The overlay names the project, lists controls, enumerates the six zones, and points at `src/data/portfolio.ts` as the one file to edit for stale content.
- [x] **Tier 9 — In-world face overlay.** New `FaceFactory` builds a 4-frame procedural face spritesheet (one per direction) with 3×3 cartoony eyes (white catchlight) + smile-curl mouth. `LPCCharacter` paints it as an extra layer at depth 3.5 — between shirt and hair — so hair fringe and hats still occlude naturally. `PortraitFactory` paints the same face at 3× into the dialog portrait so in-world and dialog look match.
- [x] **Tier 10 — Concave-corner auto-tile.** Stone↔dirt set ships 4 concave variants (`tex_sd_c{nw,ne,sw,se}`) for inner-corner cells where two regions touch diagonally. New `paintRegionAutoTile(cellSet, set)` painter on `BaseZoneScene` selects tiles by inspecting all 8 neighbors per cell.
- [x] **Tier 11 — Brick-path auto-tile.** Town's brick paths now use a 16-tile procedural set (`tex_bp_*`) with grass-blend edges, strips, end-caps, and an isolated variant. `paintRegionAutoTile` selects per-cell; `membershipMask` lets the brick cross into the plaza without painting grass against stone.

## Open work

### Deferred (nice-to-have, not blocking ship)

- [ ] **Grass↔dirt concave variants** — currently only stone↔dirt has them. Grass↔dirt falls back to plain interior at concave junctions (the cells where two grass↔dirt regions touch diagonally). No zone triggers this today.
- [ ] **Stone↔sand transition tiles** for the Fishing Dock shoreline (the dock currently uses a single sand strip; works visually but isn't a real auto-tile).

### Later

- [ ] Sound effects + ambient music (no audio assets bundled yet)
- [ ] Mobile / touch controls (deliberately out of scope for v1)
- [ ] Cross-device save sync (would need a tiny backend)

### Won't do
- Replace LPC art with Stardew's actual sprites (copyrighted to ConcernedApe — would be infringement)
- Auto-touchscreen support — desktop-browser-first by design
- Multiplayer

## Daily news / secret-chest seeding

- News fetched from `https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=20&query=AI` at preload, cached in `localStorage` for 12 h
- Daily secret chest position is a deterministic hash of `YYYY-MM-DD`, picking from `[Town, Engineering, Skill, Fishing, AILab, Dungeon]`
- Headlines feed into the chest's flavor text on open

## Editing portfolio content

All real content is data-driven from one file: [`src/data/portfolio.ts`](../src/data/portfolio.ts).
- `WORK[]` → Engineering District buildings + foreman NPCs
- `SKILLS[]` → Skill Grove totems
- `PROJECTS[]` → Project Archive at south of the Skill Grove
