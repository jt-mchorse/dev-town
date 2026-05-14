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

## Open work

> **Full review with screenshots + structured plan:** see [`docs/review-2026-04-30.md`](review-2026-04-30.md).

### Tier 1 — Face system *(critical, user's repeated complaint)*

- [ ] **NPC portrait system.** LPC sprites have ~8-px faces no matter how much we scale them. Real fix is Stardew-style: render a 64×64 or 96×96 portrait of each NPC's appearance (head + shoulders only, 4× zoom) and show it in the dialog box. Cached at NPC construction. ~2–3 hours.

### Tier 2 — Auto-tile / smooth transitions everywhere

- [ ] **Stone↔dirt transition** for Engineering's avenue edges (atlas may lack this directly; procedural may be required).
- [ ] **Brick-path auto-tile** using the LPC slate-path 5×5 set so path ends and corners blend instead of clipping at world edges.
- [ ] **Foundation borders** under cottages, farm, building props — currently meet grass at hard rectangles.
- [ ] **Full water shoreline** in Fishing Dock — currently only top-edge shore tiles are applied.
- [ ] **Concave-corner auto-tile** for when two auto-tile rects abut.

### Tier 3 — Environment density / per-NPC variety

- [ ] **AI/ML Lab**: a second row of monitors; wider, more visible carpet runway; a whiteboard sprite.
- [ ] **Dungeon**: bigger crate piles, more rubble, cobweb sprites at corners, darker stone floor.
- [ ] **Engineering**: alternating building textures, street-lamp sprites between buildings.
- [ ] Per-NPC portrait variety comes free once Tier 1 ships.

### Tier 4 — Later

- [ ] NPC idle behaviour beyond bobbing (waves, look-around).
- [ ] Day/night lighting overlay.
- [ ] Animated bobber in the Fishing Dock as a world sprite (so it can sit on the water instead of being a HUD label).

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
