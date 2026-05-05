import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene, seededRng } from "../world/BaseZoneScene";
import { TEX } from "./PreloadScene";
import { startersFor } from "../data/cosmetics";
import { SaveManager } from "../systems/SaveManager";
import { getCachedStories, todayKey } from "../systems/NewsService";
import type { Appearance, DialogLine } from "../types";

const TILE = GAME_CONFIG.tileSize;

function npcAppearance(gender: "male" | "female", shirtId: string, hairId: string, pantsId = "pants_brown"): Appearance {
  return {
    gender,
    bodyTone: "light",
    shirt: { cosmeticId: shirtId },
    pants: { cosmeticId: pantsId },
    shoes: { cosmeticId: startersFor("shoes")?.id ?? null },
    hair: { cosmeticId: hairId },
    hat: { cosmeticId: null },
  };
}

export class TownScene extends BaseZoneScene {
  readonly sceneKey = SCENES.Town;
  readonly zoneTitle = "/dev/town — Town Square";

  constructor() {
    super(SCENES.Town);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintGroundWithVariants(
      new Phaser.Geom.Rectangle(0, 0, worldW, worldH),
      TEX.Grass,
      [
        { key: TEX.GrassDark, weight: 0.5 },
        { key: TEX.GrassLight, weight: 0.5 },
      ],
      11,
    );

    // central plaza — stone interior with a dirt-ring auto-tile border that
    // blends from the surrounding grass
    const cx = Math.floor(GAME_CONFIG.worldTilesX / 2) * TILE;
    const cy = Math.floor(GAME_CONFIG.worldTilesY / 2) * TILE;
    this.paintRectWithAutoTileBorder(
      new Phaser.Geom.Rectangle(cx - TILE * 5, cy - TILE * 4, TILE * 10, TILE * 8),
      this.GRASS_DIRT_AUTOTILE,
      TEX.Stone,
    );

    // path crossroads — high-contrast brick so exits are easy to spot
    this.paintGround(new Phaser.Geom.Rectangle(0, cy, worldW, TILE), TEX.PathBrick);
    this.paintGround(new Phaser.Geom.Rectangle(cx, 0, TILE, worldH), TEX.PathBrick);
    this.paintGround(new Phaser.Geom.Rectangle(cx - TILE * 8, 0, TILE, cy), TEX.PathBrick);

    // Soft dirt-grass edge strips along every brick path so the brick doesn't
    // butt directly against grass. Inside the plaza the auto-tile ring already
    // handles the transition, so we clip these edges to outside the plaza.
    const plazaL = cx - TILE * 5;
    const plazaR = cx + TILE * 5;
    const plazaT = cy - TILE * 4;
    const plazaB = cy + TILE * 4;
    const paintEdgeStripH = (y: number, key: string) => {
      // left of plaza
      if (plazaL > 0) this.paintGround(new Phaser.Geom.Rectangle(0, y, plazaL, TILE), key);
      // right of plaza
      if (plazaR < worldW) this.paintGround(new Phaser.Geom.Rectangle(plazaR, y, worldW - plazaR, TILE), key);
    };
    const paintEdgeStripV = (x: number, key: string) => {
      // above plaza (only for the dungeon path which only goes north)
      if (plazaT > 0) this.paintGround(new Phaser.Geom.Rectangle(x, 0, TILE, plazaT), key);
      // below plaza (for vertical paths that continue south)
      if (plazaB < worldH) this.paintGround(new Phaser.Geom.Rectangle(x, plazaB, TILE, worldH - plazaB), key);
    };
    paintEdgeStripH(cy - TILE, "tex_gd_n");
    paintEdgeStripH(cy + TILE, "tex_gd_s");
    paintEdgeStripV(cx - TILE, "tex_gd_w");
    paintEdgeStripV(cx + TILE, "tex_gd_e");
    paintEdgeStripV(cx - TILE * 8 - TILE, "tex_gd_w");
    paintEdgeStripV(cx - TILE * 8 + TILE, "tex_gd_e");

    const cyTile = Math.floor(GAME_CONFIG.worldTilesY / 2);
    const cxTile = Math.floor(GAME_CONFIG.worldTilesX / 2);
    this.addBorderWalls(worldW, worldH, [
      { tx: 0, ty: cyTile },
      { tx: GAME_CONFIG.worldTilesX - 1, ty: cyTile },
      { tx: cxTile, ty: GAME_CONFIG.worldTilesY - 1 },
      { tx: cxTile, ty: 0 },
      { tx: cxTile - 8, ty: 0 },
    ]);

    this.addSpawn("default", cx + TILE / 2, cy + TILE / 2);
    this.addSpawn("from_engineering", TILE * 2 + TILE / 2, cy + TILE / 2, "right");
    this.addSpawn("from_skills", worldW - TILE * 2 - TILE / 2, cy + TILE / 2, "left");
    this.addSpawn("from_fishing", cx + TILE / 2, worldH - TILE * 2 - TILE / 2, "up");
    this.addSpawn("from_ailab", cx + TILE / 2, TILE * 2 + TILE / 2, "down");
    this.addSpawn("from_dungeon", cx - TILE * 8 + TILE / 2, TILE * 2 + TILE / 2, "down");

    // welcome sign
    this.addSign(cx - TILE * 2, cy - TILE * 3, "Town Sign", [
      { speaker: "Town Sign", text: "Welcome to /dev/town. Population: undefined." },
      { speaker: "Town Sign", text: "WASD/arrows to move. E to interact." },
    ]);

    // big central waypoint signpost (with on-screen direction labels too)
    this.addSign(cx + TILE, cy - TILE * 2, "Crossroads", [
      { speaker: "Crossroads Signpost", text: "← west:  Engineering District (work history)" },
      { speaker: "Crossroads Signpost", text: "↑ north: Full-Stack Dungeon  (typing + bug-spot)" },
      { speaker: "Crossroads Signpost", text: "↑ ne:    AI/ML Lab  (FAQ quizzes)" },
      { speaker: "Crossroads Signpost", text: "→ east:  Skill Grove  (skills + projects)" },
      { speaker: "Crossroads Signpost", text: "↓ south: Fishing Dock  (credits + tech-pun fish)" },
    ]);

    // floating direction labels at each exit so the path is obvious without
    // having to read the signpost first
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffd479",
      backgroundColor: "#0b0d12cc",
      padding: { x: 4, y: 2 },
    };
    this.add
      .text(TILE * 3, cy - 8, "← Engineering", labelStyle)
      .setOrigin(0, 1)
      .setDepth(Z.Overlay);
    this.add
      .text(worldW - TILE * 3, cy - 8, "Skill Grove →", labelStyle)
      .setOrigin(1, 1)
      .setDepth(Z.Overlay);
    this.add
      .text(cx + TILE / 2 + 4, worldH - TILE * 3, "↓ Fishing Dock", labelStyle)
      .setOrigin(0, 0.5)
      .setDepth(Z.Overlay);
    this.add
      .text(cx + TILE / 2 + 4, TILE * 3, "↑ AI/ML Lab", labelStyle)
      .setOrigin(0, 0.5)
      .setDepth(Z.Overlay);
    this.add
      .text(cx - TILE * 8 + TILE / 2 - 4, TILE * 3, "↑ Dungeon", labelStyle)
      .setOrigin(1, 0.5)
      .setDepth(Z.Overlay);

    // notice board
    this.addSign(cx + TILE * 3, cy - TILE * 3, "Notice Board", [
      { speaker: "Notice Board", text: "All portfolio content lives in src/data/portfolio.ts. Edit there and the world updates." },
      { speaker: "Notice Board", text: "Daily News board (incidents, AI headlines) coming next phase." },
    ]);

    // greeter NPC
    this.addNPC({
      id: "greeter",
      label: "Greeter",
      appearance: npcAppearance("female", "shirt_navy", "hair_bob_blonde"),
      x: cx - TILE * 4,
      y: cy + TILE,
      facing: "right",
      onInteract: () =>
        this.openDialog([
          { speaker: "Greeter", text: "First time? Walk west — the Engineering District has the work history." },
          { speaker: "Greeter", text: "Hit the dock if you need quick credits. Fish bite better at dawn. (Dawn is mocked.)" },
        ]),
    });

    // shopkeeper NPC opens shop overlay
    this.addNPC({
      id: "shopkeep",
      label: "Cosmetic Shop",
      appearance: npcAppearance("male", "shirt_red", "hair_buzzcut_ginger", "pants_charcoal"),
      x: cx + TILE * 4,
      y: cy + TILE,
      facing: "left",
      onInteract: () => {
        this.scene.launch(SCENES.ShopUI);
        this.game.events.emit(EVENTS.ShopOpen);
      },
    });

    // mysterious stump (small free credit drip)
    this.addDecor(TEX.Stump, cx, cy + TILE * 2, { anchorY: 0.85 });
    let lastStumpAt = 0;
    this.addPointInteract({
      x: cx,
      y: cy + TILE * 2,
      range: 22,
      label: "Mysterious Stump",
      onInteract: () => {
        if (Date.now() - lastStumpAt < 8000) {
          this.openDialog([{ speaker: "Stump", text: "Already plundered. Try again later." }]);
          return;
        }
        lastStumpAt = Date.now();
        const saveData = SaveManager.save({ credits: SaveManager.load().credits + 1 });
        this.game.events.emit(EVENTS.CreditsChanged);
        this.openDialog([
          { speaker: "Stump", text: "You found a loose Stack Coin. (+1 ◆)" },
          { speaker: "Stump", text: `Balance: ${saveData.credits} ◆.` },
        ]);
      },
    });

    // building props (decoration, not entered)
    this.add.image(cx - TILE * 8, cy - TILE * 6, TEX.Building).setDepth(Z.Walls).setOrigin(0, 0);
    this.add.image(cx + TILE * 4, cy - TILE * 7, TEX.Building).setDepth(Z.Walls).setOrigin(0, 0);

    // (grass variation handled by paintGroundWithVariants above)
    void worldW; // (intentionally not scattering hills — tan blobs were noise)

    // fountain in the plaza
    this.addSolidDecor(TEX.Fountain, cx, cy - TILE * 2, 24, 10);

    // flowers around the plaza edges
    const flowerKeys = [TEX.FlowerRed, TEX.FlowerYellow, TEX.FlowerBlue];
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2;
      const r = TILE * 5;
      const fx = cx + Math.cos(angle) * r + (Math.random() - 0.5) * 6;
      const fy = cy + Math.sin(angle) * (r * 0.6) + (Math.random() - 0.5) * 6;
      const onPlaza = Math.abs(fx - cx) < TILE * 6 && Math.abs(fy - cy) < TILE * 4;
      const onPath = Math.abs(fy - cy) < TILE && Math.abs(fy - cy) > TILE * 0.4;
      if (!onPlaza || onPath) continue;
      this.addDecor(flowerKeys[i % flowerKeys.length], fx, fy, { anchorY: 0.85, depth: Z.GroundDecal });
    }

    // cottages in the residential areas (NW + SE) — each gets a 4×3 dirt
    // foundation auto-tile under it so the building sits on a packed-earth
    // yard instead of butting into raw grass.
    const cottages: Array<[number, number]> = [
      [TILE * 6, TILE * 8],
      [worldW - TILE * 7, worldH - TILE * 8],
      [TILE * 12, worldH - TILE * 7],
    ];
    for (const [ax, ay] of cottages) {
      const startTx = Math.round(ax / TILE) - 2;
      const startTy = Math.round(ay / TILE) - 1;
      this.paintRectWithAutoTileBorder(
        new Phaser.Geom.Rectangle(startTx * TILE, startTy * TILE, TILE * 4, TILE * 3),
        this.GRASS_DIRT_AUTOTILE,
      );
    }
    for (const [ax, ay] of cottages) {
      this.addSolidDecor(TEX.Cottage, ax, ay, 28, 8, 4);
    }

    // tree perimeter (with collision) — thinned, mixed sizes
    const treeRng = seededRng(7);
    const treeKeys = [TEX.TreePine, TEX.TreeOak, "tex_tree_pine_small", "tex_tree_oak_small"];
    let lastTreeX = -1000;
    for (let i = 0; i < 13; i += 1) {
      const tx = TILE * 2 + treeRng() * (worldW - TILE * 4);
      const placeNorth = treeRng() > 0.5;
      const ty = placeNorth
        ? TILE * 2 + treeRng() * TILE * 4
        : worldH - TILE * 3 - treeRng() * TILE * 4;
      // skip if on a path / near fountain / near central plaza
      if (Math.abs(tx - cx) < TILE * 7 && Math.abs(ty - cy) < TILE * 5) continue;
      if (Math.abs(tx - cx) < TILE * 1.5) continue;
      if (Math.abs(tx - (cx - TILE * 8)) < TILE * 1.5) continue;
      // avoid stacking trees within a trunk-width of each other
      if (Math.abs(tx - lastTreeX) < TILE * 1.2) continue;
      lastTreeX = tx;
      const key = treeKeys[Math.floor(treeRng() * treeKeys.length)];
      this.addSolidDecor(key, tx, ty, 6, 3);
    }

    // bushes scattered (no collision)
    this.scatterDecor(TEX.Bush, 18, new Phaser.Geom.Rectangle(TILE, TILE, worldW - TILE * 2, worldH - TILE * 2), {
      rng: seededRng(13),
    });

    // farm: fence + cow + chicken in SW meadow — pack the whole pen onto a
    // dirt foundation so the fence isn't planted in raw grass.
    const farmX = TILE * 3;
    const farmY = worldH - TILE * 7;
    const farmCols = 5;
    const farmRows = 3;
    this.paintRectWithAutoTileBorder(
      new Phaser.Geom.Rectangle(farmX - TILE, farmY - TILE, TILE * (farmCols + 2), TILE * (farmRows + 2)),
      this.GRASS_DIRT_AUTOTILE,
    );
    for (let i = 0; i < farmCols; i += 1) {
      this.addSolidDecor(TEX.FenceH, farmX + i * TILE, farmY, 28, 8);
      this.addSolidDecor(TEX.FenceH, farmX + i * TILE, farmY + TILE * farmRows, 28, 8);
    }
    for (let i = 1; i < farmRows; i += 1) {
      this.addSolidDecor(TEX.FenceV, farmX, farmY + i * TILE, 8, 8);
      this.addSolidDecor(TEX.FenceV, farmX + TILE * (farmCols - 1), farmY + i * TILE, 8, 8);
    }
    this.addAmbientCritter(TEX.Cow, farmX + TILE * 2, farmY + TILE * 2);
    this.addAmbientCritter(TEX.Chicken, farmX + TILE * 3, farmY + TILE);
    this.addAmbientCritter(TEX.Chicken, farmX + TILE, farmY + TILE * 1.5);

    // benches near plaza
    this.addDecor(TEX.Bench, cx - TILE * 5, cy - TILE * 1.5, { anchorY: 0.85 });
    this.addDecor(TEX.Bench, cx + TILE * 5, cy - TILE * 1.5, { anchorY: 0.85 });

    // warps
    this.addWarp({
      x: 0,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Engineering,
      toSpawn: "from_town",
      facing: "left",
    });
    this.addWarp({
      x: worldW - TILE,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Skill,
      toSpawn: "from_town",
      facing: "right",
    });
    this.addWarp({
      x: cx,
      y: worldH - TILE,
      width: TILE,
      height: TILE,
      toScene: SCENES.Fishing,
      toSpawn: "from_town",
      facing: "down",
    });
    this.addWarp({
      x: cx,
      y: 0,
      width: TILE,
      height: TILE,
      toScene: SCENES.AILab,
      toSpawn: "from_town",
      facing: "up",
    });
    this.addWarp({
      x: cx - TILE * 8,
      y: 0,
      width: TILE,
      height: TILE,
      toScene: SCENES.Dungeon,
      toSpawn: "from_town",
      facing: "up",
    });

    this.spawnStaticChests();

    // News kiosk near plaza
    const kioskX = cx - TILE * 2;
    const kioskY = cy - TILE * 5;
    this.add.image(kioskX, kioskY, TEX.NewsKiosk).setDepth(Z.Entities).setOrigin(0.5, 0.85);
    this.addPointInteract({
      x: kioskX,
      y: kioskY,
      range: 22,
      label: "News Kiosk",
      onInteract: () => this.openNewsDialog(),
    });

  }

  private openNewsDialog(): void {
    const stories = getCachedStories();
    const lines: DialogLine[] = [
      { speaker: "News Kiosk", text: `Today's AI/tech news (HN, ${todayKey()})` },
    ];
    if (stories.length === 0) {
      lines.push({
        speaker: "News Kiosk",
        text: "Wire's offline. Check back in a bit. (Or your network blocks Algolia.)",
      });
    } else {
      for (const story of stories.slice(0, 3)) {
        const trimmed = story.title.length > 110 ? `${story.title.slice(0, 107)}…` : story.title;
        lines.push({
          speaker: `${story.points}pts • ${story.author}`,
          text: trimmed,
        });
      }
      lines.push({
        speaker: "News Kiosk",
        text: "A Daily Secret chest is hiding somewhere today. Different scene every 24h.",
      });
    }
    this.openDialog(lines);
  }
}
