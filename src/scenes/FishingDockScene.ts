import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene, seededRng } from "../world/BaseZoneScene";
import { TEX } from "./PreloadScene";

const TILE = GAME_CONFIG.tileSize;

export class FishingDockScene extends BaseZoneScene {
  readonly sceneKey = SCENES.Fishing;
  readonly zoneTitle = "Fishing Dock";

  constructor() {
    super(SCENES.Fishing);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintGroundWithVariants(
      new Phaser.Geom.Rectangle(0, 0, worldW, worldH),
      TEX.Grass,
      [
        { key: TEX.GrassDark, weight: 0.5 },
        { key: TEX.GrassLight, weight: 0.5 },
      ],
      71,
    );

    // pond covers the bottom half
    const waterTop = Math.floor(GAME_CONFIG.worldTilesY / 2) * TILE;
    this.paintGround(new Phaser.Geom.Rectangle(0, waterTop, worldW, worldH - waterTop), TEX.Water);

    // dock juts south from grass into water
    const dockX = Math.floor(GAME_CONFIG.worldTilesX / 2) * TILE - TILE;
    const dockY = waterTop;
    const dockH = TILE * 6;
    this.paintGround(new Phaser.Geom.Rectangle(dockX, dockY, TILE * 2, dockH), TEX.Dock);

    // smooth shoreline: replace top row of water with sand-shore tile,
    // except where the dock juts in (those tiles are already painted with dock)
    const dockColLeftIdx = Math.floor(dockX / TILE);
    for (let tx = 0; tx < GAME_CONFIG.worldTilesX; tx += 1) {
      if (tx === dockColLeftIdx || tx === dockColLeftIdx + 1) continue;
      this.add
        .image(tx * TILE, waterTop, "tex_water_shore_t")
        .setOrigin(0, 0)
        .setDepth(Z.Ground);
    }

    const dockColLeft = Math.floor(dockX / TILE);
    this.addBorderWalls(worldW, worldH, [
      { tx: dockColLeft, ty: 0 },
      { tx: dockColLeft + 1, ty: 0 },
    ]);

    // make water impassable except where the dock is
    for (let ty = Math.floor(waterTop / TILE); ty < GAME_CONFIG.worldTilesY - 1; ty += 1) {
      for (let tx = 1; tx < GAME_CONFIG.worldTilesX - 1; tx += 1) {
        const inDockCols = tx >= Math.floor(dockX / TILE) && tx < Math.floor(dockX / TILE) + 2;
        const inDockRows = ty < Math.floor((dockY + dockH) / TILE);
        if (inDockCols && inDockRows) continue;
        const r = this.add.rectangle(tx * TILE, ty * TILE, TILE, TILE, 0, 0).setOrigin(0, 0);
        this.physics.add.existing(r, true);
        this.walls.add(r as unknown as Phaser.GameObjects.GameObject);
      }
    }

    this.addSpawn("default", dockX + TILE, dockY + TILE);
    this.addSpawn("from_town", dockX + TILE, dockY + TILE / 2, "down");

    this.addSign(dockX - TILE * 3, dockY - TILE, "Dock Sign", [
      { speaker: "Dock Sign", text: "FISHING DOCK" },
      { speaker: "Dock Sign", text: "Stand at the end of the dock and press E to cast." },
      { speaker: "Dock Sign", text: "When the bobber dips, hammer E. Don't be a Heisenbug about it." },
    ]);

    // fishing spot at the end of the dock — animated bobber drifting just
    // off the dock end so the spot reads as "where you cast"
    const fishX = dockX + TILE;
    const fishY = dockY + dockH - TILE / 2;
    const bobber = this.add
      .image(fishX, fishY + TILE * 1.5, TEX.Bobber)
      .setDepth(Z.GroundDecal)
      .setAlpha(0.85);
    this.tweens.add({
      targets: bobber,
      y: bobber.y - 2,
      duration: 900 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // A couple more bobbers floating in the open water for ambient life.
    for (let i = 0; i < 3; i += 1) {
      const bx = TILE * 4 + i * TILE * 7;
      const by = waterTop + TILE * 4 + (i % 2 === 0 ? 0 : TILE * 3);
      if (Math.abs(bx - (dockX + TILE)) < TILE * 3) continue;
      const drift = this.add
        .image(bx, by, TEX.Bobber)
        .setDepth(Z.GroundDecal)
        .setAlpha(0.7);
      this.tweens.add({
        targets: drift,
        y: drift.y - 2,
        duration: 1000 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        delay: i * 250,
        ease: "Sine.easeInOut",
      });
    }
    this.addPointInteract({
      x: fishX,
      y: fishY,
      range: 24,
      label: "Cast Line",
      onInteract: () => {
        if (this.scene.isActive(SCENES.FishingUI)) return;
        this.scene.launch(SCENES.FishingUI);
        this.game.events.emit(EVENTS.FishingStart);
      },
    });

    // sand strip along the shoreline
    this.paintGround(
      new Phaser.Geom.Rectangle(0, waterTop - TILE, worldW, TILE),
      TEX.Sand,
    );

    // cattails along the shore
    const fishRng = seededRng(73);
    for (let tx = 1; tx < GAME_CONFIG.worldTilesX - 1; tx += 1) {
      if (tx === Math.floor(dockX / TILE) || tx === Math.floor(dockX / TILE) + 1) continue;
      if (fishRng() > 0.55) continue;
      this.addDecor(TEX.Cattail, tx * TILE + TILE / 2, waterTop - 2, { anchorY: 1 });
    }

    // lily pads in the open water
    for (let i = 0; i < 16; i += 1) {
      const lx = TILE * 3 + fishRng() * (worldW - TILE * 6);
      const ly = waterTop + TILE * 3 + fishRng() * (worldH - waterTop - TILE * 6);
      // skip if too close to dock
      if (Math.abs(lx - (dockX + TILE)) < TILE * 2 && ly < dockY + dockH) continue;
      this.addDecor(TEX.LilyPad, lx, ly, { anchorY: 0.5, depth: Z.GroundDecal });
    }

    // a couple of ducks paddling around (visual only — water is wall)
    for (let i = 0; i < 3; i += 1) {
      const dx = TILE * 4 + fishRng() * (worldW - TILE * 8);
      const dy = waterTop + TILE * 5 + fishRng() * TILE * 6;
      if (Math.abs(dx - (dockX + TILE)) < TILE * 3) continue;
      this.addAmbientCritter(TEX.Duck, dx, dy, { wanderRadius: 22 });
    }

    // shimmering water ripples — small sprites that cycle through 3 atlas frames
    const shimmerFrames = ["tex_water_shimmer_0", "tex_water_shimmer_1", "tex_water_shimmer_2"];
    for (let i = 0; i < 14; i += 1) {
      const sx = TILE * 2 + fishRng() * (worldW - TILE * 4);
      const sy = waterTop + TILE * 2 + fishRng() * (worldH - waterTop - TILE * 4);
      if (Math.abs(sx - (dockX + TILE)) < TILE * 2 && sy < dockY + dockH) continue;
      const offset = Math.floor(fishRng() * 3);
      const ripple = this.add
        .image(sx, sy, shimmerFrames[offset])
        .setOrigin(0.5, 0.5)
        .setDepth(Z.GroundDecal)
        .setAlpha(0.55);
      let f = offset;
      this.time.addEvent({
        delay: 350 + Math.floor(fishRng() * 250),
        loop: true,
        callback: () => {
          f = (f + 1) % 3;
          ripple.setTexture(shimmerFrames[f]);
        },
      });
    }

    // trees and bushes on the grass
    for (let i = 0; i < 12; i += 1) {
      const tx = TILE * 2 + fishRng() * (worldW - TILE * 4);
      const ty = TILE * 2 + fishRng() * (waterTop - TILE * 4);
      if (Math.abs(tx - (dockX + TILE)) < TILE * 3) continue;
      this.addSolidDecor(fishRng() > 0.5 ? TEX.TreeOak : TEX.TreePine, tx, ty, 6, 3);
    }
    this.scatterDecor(TEX.Bush, 8, new Phaser.Geom.Rectangle(0, 0, worldW, waterTop - TILE), {
      rng: seededRng(74),
    });
    this.scatterDecor(TEX.FlowerYellow, 12, new Phaser.Geom.Rectangle(0, 0, worldW, waterTop - TILE), {
      rng: seededRng(75),
    });

    this.spawnStaticChests();

    // warp back to town (top edge near dock)
    this.addWarp({
      x: dockX,
      y: 0,
      width: TILE * 2,
      height: TILE,
      toScene: SCENES.Town,
      toSpawn: "from_fishing",
      facing: "up",
    });
  }
}
