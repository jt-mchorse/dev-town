import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene } from "../world/BaseZoneScene";
import { TEX } from "./PreloadScene";
import type { Appearance } from "../types";

const TILE = GAME_CONFIG.tileSize;

const TYPIST: Appearance = {
  gender: "male",
  bodyTone: "light",
  shirt: { cosmeticId: "shirt_white" },
  pants: { cosmeticId: "pants_charcoal" },
  shoes: { cosmeticId: "shoes_brown" },
  hair: { cosmeticId: "hair_buzzcut_ginger" },
  hat: { cosmeticId: null },
};

const DEBUGGER_NPC: Appearance = {
  gender: "female",
  bodyTone: "light",
  shirt: { cosmeticId: "shirt_red" },
  pants: { cosmeticId: "pants_navy" },
  shoes: { cosmeticId: "shoes_brown" },
  hair: { cosmeticId: "hair_bob_raven" },
  hat: { cosmeticId: "hat_cap_red" },
};

export class FullStackDungeonScene extends BaseZoneScene {
  readonly sceneKey = SCENES.Dungeon;
  readonly zoneTitle = "Full-Stack Dungeon";

  constructor() {
    super(SCENES.Dungeon);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintWholeFloor(worldW, worldH, TEX.DungeonFloor);

    // dungeon corridors of stone
    const cy = Math.floor(GAME_CONFIG.worldTilesY / 2) * TILE;
    const cx = Math.floor(GAME_CONFIG.worldTilesX / 2) * TILE;
    this.paintGround(new Phaser.Geom.Rectangle(0, cy - TILE * 2, worldW, TILE * 5), TEX.Stone);
    this.paintGround(new Phaser.Geom.Rectangle(cx - TILE * 2, 0, TILE * 5, worldH), TEX.Stone);

    const cyTile = Math.floor(GAME_CONFIG.worldTilesY / 2);
    this.addBorderWalls(worldW, worldH, [{ tx: 0, ty: cyTile }]);

    // wall the corners (it's a dungeon)
    for (let ty = 0; ty < GAME_CONFIG.worldTilesY; ty += 1) {
      for (let tx = 0; tx < GAME_CONFIG.worldTilesX; tx += 1) {
        const onCorridorH = ty >= cyTile - 2 && ty <= cyTile + 2;
        const onCorridorV = tx >= cx / TILE - 2 && tx <= cx / TILE + 2;
        if (onCorridorH || onCorridorV) continue;
        if (tx === 0 || ty === 0 || tx === GAME_CONFIG.worldTilesX - 1 || ty === GAME_CONFIG.worldTilesY - 1) continue;
        const block = this.add.rectangle(tx * TILE, ty * TILE, TILE, TILE, 0, 0).setOrigin(0, 0);
        this.physics.add.existing(block, true);
        this.walls.add(block as unknown as Phaser.GameObjects.GameObject);
      }
    }

    this.addSpawn("default", cx + TILE / 2, cy + TILE / 2);
    this.addSpawn("from_town", TILE * 2 + TILE / 2, cy + TILE / 2, "right");

    this.addSign(TILE * 4, cy - TILE * 3, "Dungeon Sign", [
      { speaker: "Dungeon Sign", text: "FULL-STACK DUNGEON" },
      { speaker: "Dungeon Sign", text: "Two trials below: a typing speed test, and a spot-the-bug crucible." },
      { speaker: "Dungeon Sign", text: "Mind the corridors. The walls are made of unhandled exceptions." },
    ]);

    this.addNPC({
      id: "typist",
      label: "Typing Trial",
      appearance: TYPIST,
      x: cx + TILE / 2,
      y: cy - TILE * 6,
      facing: "down",
      onInteract: () => this.openTyping(),
    });

    this.addNPC({
      id: "debugger",
      label: "Bug Trial",
      appearance: DEBUGGER_NPC,
      x: cx + TILE / 2,
      y: cy + TILE * 7,
      facing: "up",
      onInteract: () => this.openDebug(),
    });

    // Crate clusters at the four corridor mouths — clusters of 2–3 read as
    // "stuff stored here" instead of evenly-spaced lone props.
    const clusterCrates = (x: number, y: number) => {
      this.addSolidDecor(TEX.Crate, x, y, 14, 4);
      this.addSolidDecor(TEX.Crate, x + TILE * 1.2, y + 4, 14, 4);
      this.addSolidDecor(TEX.Crate, x + TILE * 0.4, y - TILE * 0.9, 14, 4);
    };
    clusterCrates(cx - TILE * 9, cy - TILE);
    clusterCrates(cx + TILE * 6, cy - TILE);
    clusterCrates(cx - TILE * 9, cy + TILE * 2);
    clusterCrates(cx + TILE * 6, cy + TILE * 2);

    // Rubble piles scattered through both corridors.
    for (let i = 0; i < 8; i += 1) {
      const t = (i * 0.34) % 1;
      const onHorizontal = i % 2 === 0;
      const x = onHorizontal
        ? TILE * 2 + t * (worldW - TILE * 4)
        : cx + (i % 4 - 2) * TILE;
      const y = onHorizontal
        ? cy + (i % 3 - 1) * TILE
        : TILE * 2 + t * (worldH - TILE * 4);
      // skip if inside crate clusters or on top of NPCs
      if (Math.abs(x - cx) < TILE * 2 && Math.abs(y - cy) < TILE * 2) continue;
      this.addDecor(TEX.Rubble, x, y, { anchorY: 0.85 });
    }

    // Cobwebs at every corridor corner.
    const webPositions: [number, number][] = [
      [TILE * 2, cy - TILE * 1.5],
      [worldW - TILE * 2, cy - TILE * 1.5],
      [TILE * 2, cy + TILE * 2.5],
      [worldW - TILE * 2, cy + TILE * 2.5],
      [cx - TILE * 1.5, TILE * 2],
      [cx + TILE * 1.5, TILE * 2],
      [cx - TILE * 1.5, worldH - TILE * 3],
      [cx + TILE * 1.5, worldH - TILE * 3],
    ];
    for (const [wx, wy] of webPositions) {
      this.addDecor(TEX.Web, wx, wy, { anchorY: 0, depth: Z.Walls });
    }

    this.spawnStaticChests();

    this.addWarp({
      x: 0,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Town,
      toSpawn: "from_dungeon",
      facing: "left",
    });
  }

  private openTyping(): void {
    if (this.scene.isActive(SCENES.TypingUI)) return;
    this.scene.launch(SCENES.TypingUI);
    this.game.events.emit(EVENTS.MinigameStart);
  }

  private openDebug(): void {
    if (this.scene.isActive(SCENES.DebugUI)) return;
    this.scene.launch(SCENES.DebugUI);
    this.game.events.emit(EVENTS.MinigameStart);
  }
}
