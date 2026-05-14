import Phaser from "phaser";
import { GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene, seededRng } from "../world/BaseZoneScene";
import { WORK } from "../data/portfolio";
import { TEX } from "./PreloadScene";
import type { Appearance, DialogLine } from "../types";

const TILE = GAME_CONFIG.tileSize;

const NPC_LOOKS: Appearance[] = [
  {
    gender: "male",
    bodyTone: "light",
    shirt: { cosmeticId: "shirt_navy" },
    pants: { cosmeticId: "pants_charcoal" },
    shoes: { cosmeticId: "shoes_brown" },
    hair: { cosmeticId: "hair_buzzcut_raven" },
    hat: { cosmeticId: null },
  },
  {
    gender: "female",
    bodyTone: "light",
    shirt: { cosmeticId: "shirt_forest" },
    pants: { cosmeticId: "pants_navy" },
    shoes: { cosmeticId: "shoes_brown" },
    hair: { cosmeticId: "hair_bob_chestnut" },
    hat: { cosmeticId: null },
  },
  {
    gender: "male",
    bodyTone: "light",
    shirt: { cosmeticId: "shirt_red" },
    pants: { cosmeticId: "pants_brown" },
    shoes: { cosmeticId: "shoes_brown" },
    hair: { cosmeticId: "hair_bob_blonde" },
    hat: { cosmeticId: "hat_cap_brown" },
  },
];

export class EngineeringDistrictScene extends BaseZoneScene {
  readonly sceneKey = SCENES.Engineering;
  readonly zoneTitle = "Engineering District";

  constructor() {
    super(SCENES.Engineering);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintWholeFloor(worldW, worldH, TEX.Stone);

    // wide central avenue of path tiles
    // Central avenue: dirt path through the stone district, blended at the
    // top and bottom with the new stone↔dirt auto-tile so the avenue grows
    // out of the pavement instead of meeting it at a hard line.
    const cy = Math.floor(GAME_CONFIG.worldTilesY / 2) * TILE;
    this.paintGround(
      new Phaser.Geom.Rectangle(0, cy - TILE, worldW, TILE),
      this.STONE_DIRT_AUTOTILE.n,
    );
    this.paintGround(
      new Phaser.Geom.Rectangle(0, cy, worldW, TILE),
      this.STONE_DIRT_AUTOTILE.c,
    );
    this.paintGround(
      new Phaser.Geom.Rectangle(0, cy + TILE, worldW, TILE),
      this.STONE_DIRT_AUTOTILE.s,
    );

    const cyTile = Math.floor(GAME_CONFIG.worldTilesY / 2);
    this.addBorderWalls(worldW, worldH, [
      { tx: GAME_CONFIG.worldTilesX - 1, ty: cyTile },
    ]);

    this.addSpawn("default", worldW / 2, cy + TILE / 2);
    this.addSpawn("from_town", worldW - TILE * 2 - TILE / 2, cy + TILE / 2, "left");

    this.addSign(TILE * 4, cy - TILE * 3, "District Sign", [
      { speaker: "District Sign", text: "ENGINEERING DISTRICT" },
      { speaker: "District Sign", text: "Each building's foreman tells you what they shipped." },
    ]);

    // place a building + NPC per work entry, spaced along the avenue
    const slots = WORK.length;
    const span = worldW - TILE * 4;
    const step = span / Math.max(slots, 1);
    const BUILDING_W = 128;
    const BUILDING_H = 128;
    for (let i = 0; i < slots; i += 1) {
      const work = WORK[i];
      const bx = TILE * 2 + step * i + step / 2 - BUILDING_W / 2;
      // Position building so its bottom sits just above the avenue's north
      // sand shoulder — keeps the whole building + NPC label inside the
      // camera viewport even when the player walks the avenue.
      const by = cy - TILE - BUILDING_H;

      // packed-earth foundation around the building so it doesn't butt
      // straight into stone pavers
      const foundationX = bx - TILE;
      const foundationY = by - TILE / 2;
      const foundationW = BUILDING_W + TILE * 2;
      const foundationH = BUILDING_H + TILE * 2;
      this.paintRectWithAutoTileBorder(
        new Phaser.Geom.Rectangle(foundationX, foundationY, foundationW, foundationH),
        this.GRASS_DIRT_AUTOTILE,
      );

      // Alternate brown-roof and slate-roof buildings so the avenue
      // doesn't read as three identical clones.
      const buildingTex = i % 2 === 0 ? TEX.Building : TEX.BuildingAlt;
      this.add.image(bx, by, buildingTex).setDepth(Z.Walls + 1).setOrigin(0, 0);
      // (no standalone building label — the NPC label below conveys the
      // building name as the company tag, and the dialog reveals the role.)

      // physics collider for the building footprint (lower portion only, so player
      // can walk in front of the upper roof)
      const fpY = by + BUILDING_H - 56;
      const footprint = this.add.rectangle(bx, fpY, BUILDING_W, 56, 0, 0).setOrigin(0, 0);
      this.physics.add.existing(footprint, true);
      this.walls.add(footprint as unknown as Phaser.GameObjects.GameObject);

      const npcX = bx + BUILDING_W / 2;
      const npcY = by + BUILDING_H + 24;
      const lines: DialogLine[] = [
        { speaker: work.npcName, text: `${work.role} @ ${work.company}  •  ${work.period}` },
        { speaker: work.npcName, text: work.pitch },
        ...work.highlights.map((h) => ({ speaker: work.npcName, text: `• ${h}` })),
      ];
      this.addNPC({
        id: `work_${work.id}`,
        label: work.building,
        appearance: NPC_LOOKS[i % NPC_LOOKS.length],
        x: npcX,
        y: npcY,
        facing: "down",
        dialog: lines,
      });
    }

    // benches along the avenue
    for (let i = 0; i < 4; i += 1) {
      this.addDecor(TEX.Bench, TILE * 6 + i * TILE * 12, cy + TILE * 3, { anchorY: 0.85 });
    }

    // Street lamps between buildings — sit on the north sand shoulder so
    // they read as "lining the road" rather than dropped onto the path.
    for (let i = 0; i < 4; i += 1) {
      const lx = TILE * 4 + i * (worldW - TILE * 8) / 3;
      this.addDecor(TEX.StreetLamp, lx, cy - TILE / 2, { anchorY: 0.95 });
    }

    // street trees lining the road
    const eRng = seededRng(45);
    for (let i = 0; i < 14; i += 1) {
      const tx = TILE * 3 + i * TILE * 4 + eRng() * TILE;
      this.addSolidDecor(TEX.TreeOak, tx, cy + TILE * 5, 6, 3);
      this.addSolidDecor(TEX.TreeOak, tx, cy - TILE * 4, 6, 3);
    }

    // ambient flowers on the boulevard
    this.scatterDecor(TEX.FlowerYellow, 12, new Phaser.Geom.Rectangle(0, cy + TILE * 4, worldW, TILE * 3), {
      rng: seededRng(46),
    });
    this.scatterDecor(TEX.FlowerRed, 8, new Phaser.Geom.Rectangle(0, cy - TILE * 5, worldW, TILE * 2), {
      rng: seededRng(47),
    });

    // a chicken because there's always a chicken
    this.addAmbientCritter(TEX.Chicken, TILE * 10, cy + TILE * 6);

    this.spawnStaticChests();

    // warp back to town (right edge)
    this.addWarp({
      x: worldW - TILE,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Town,
      toSpawn: "from_engineering",
      facing: "right",
    });
  }
}
