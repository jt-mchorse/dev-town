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

## Polish tiers (shipped 2026-04-30)

> Full review + plan that spawned these: [`docs/review-2026-04-30.md`](review-2026-04-30.md).

- [x] **Tier 1 — Portrait system.** Per-NPC 96×96 head-and-shoulders portraits composed from each character's LPC layers, cached on the scene texture manager, slotted into the left of the dialog box. Faces are readable.
- [x] **Tier 2 — Foundations + dungeon floor.** Engineering buildings now sit on auto-tile dirt foundations (matches Town cottages + farm). New procedural dungeon-flagstone floor replaced the `tex_wall` placeholder. *(Deferred: concave-corner auto-tile — no zone currently places adjacent transition rects, so the bug isn't visible.)*
- [x] **Tier 3 — Density + per-zone variety.** AI/ML Lab carpet widened, 12 server racks across the back wall instead of 8, whiteboard sprites, on-screen monitor row, side-wall crates. Dungeon: crate clusters of three at each corridor mouth, eight cobwebs (one per corner), scattered rubble. Engineering: alternating brown- and slate-roof buildings, street lamps between them.
- [x] **Tier 4 — Polish.** NPCs glance left/right every 6–14 s and snap back. Animated bobbing bobbers on the Fishing Dock pond (cast spot + three ambient drifters).

## Open work

### Soon

- [ ] **Concave-corner auto-tile** — for when zone foundations or transition rects share a side. Not currently visible because no zone places adjacent auto-tile rects, but easy trap to fall into the next time we add one.
- [ ] **Brick-path auto-tile** using the LPC slate-path 5×5 set so brick path ends blend into surrounding terrain instead of clipping at world edges.
- [ ] **Stone↔sand transition tiles** to smooth Engineering's sand-shoulder edges against the surrounding stone pavers.

### Later

- [ ] Day/night lighting overlay (tinted `Phaser.GameObjects.Layer` driven by `Date.now()`).
- [ ] Sound effects + ambient music.
- [ ] Cross-device save sync (would need a tiny backend).
- [ ] Trinkets / inventory UI surfacing the chest discoveries currently only persisted in `save.openedChests`.
- [ ] Recruiter-friendly first-launch overlay ("here's what to look at first").

### Later
- [ ] Sound effects + ambient music (no audio assets bundled yet)
- [ ] Mobile / touch controls (deliberately out of scope for v1)
- [ ] Cross-device save sync (would need a tiny backend)
- [ ] Trinkets / inventory UI (chests already store discoveries in save; nothing surfaces it)
- [ ] Recruiter-friendly intro overlay on first launch ("here's what to look at first")

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
