import Phaser from "phaser";
import { GAME_CONFIG, SCENES } from "../config";
import { lpcLoadList, registerWalkAnims } from "../entities/LPCCharacter";
import { FRAME } from "../data/lpc";
import { SaveManager } from "../systems/SaveManager";
import { getNews } from "../systems/NewsService";

export const TEX = {
  // Ground (cut from terrain_atlas)
  Grass: "tex_grass",
  GrassVar: "tex_grass_var",
  GrassFlowers: "tex_grass_flowers",
  Dirt: "tex_dirt",
  Path: "tex_path",
  PathBrick: "tex_path_brick",
  PathSlate: "tex_path_slate",
  Water: "tex_water",
  Sand: "tex_sand",
  WoodDeck: "tex_wood_deck",
  CarpetRed: "tex_carpet_red",
  // Multi-tile decorations (cut from terrain_atlas)
  TreePine: "tex_tree_pine",
  TreeOak: "tex_tree_oak",
  Bush: "tex_bush",
  BushSmall: "tex_bush_small",
  Flowers: "tex_flowers",
  FlowerRed: "tex_flower_red",
  FlowerYellow: "tex_flower_yellow",
  FlowerBlue: "tex_flower_blue",
  Stump: "tex_stump",
  Statue: "tex_statue",
  Fountain: "tex_fountain",
  Bridge: "tex_bridge",
  Rocks: "tex_rocks",
  RockBig: "tex_rock_big",
  Mushroom: "tex_mushroom",
  Cattail: "tex_cattail",
  LilyPad: "tex_lily_pad",
  Cactus: "tex_cactus",
  Crops: "tex_crops",
  // Buildings (cut from base_out_atlas / terrain_atlas)
  Cottage: "tex_cottage",
  Building: "tex_building",
  BuildingAlt: "tex_building_alt",
  Door: "tex_door",
  // Fences (from fence.png)
  FenceH: "tex_fence_h",
  FenceV: "tex_fence_v",
  Fence: "tex_fence",
  // Procedural fallbacks (not in atlas)
  Wall: "tex_wall",
  Stone: "tex_stone",
  DungeonFloor: "tex_dungeon_floor",
  Dock: "tex_dock",
  GrassDark: "tex_grass_dark",
  GrassLight: "tex_grass_light",
  SignPost: "tex_signpost",
  Totem: "tex_totem",
  Bobber: "tex_bobber",
  ChestClosed: "tex_chest_closed",
  ChestOpen: "tex_chest_open",
  ChestGold: "tex_chest_gold",
  Server: "tex_server",
  Whiteboard: "tex_whiteboard",
  StreetLamp: "tex_street_lamp",
  Dust: "tex_dust",
  NewsKiosk: "tex_news_kiosk",
  Bench: "tex_bench",
  Crate: "tex_crate",
  Rubble: "tex_rubble",
  Web: "tex_web",
  Monitor: "tex_monitor",
  Hill: "tex_hill",
  Cow: "tex_cow",
  Chicken: "tex_chicken",
  Duck: "tex_duck",
} as const;

const ATLAS_TERRAIN = "atlas_terrain";
const ATLAS_BASE_OUT = "atlas_base_out";
const FARM_FENCE = "farm_fence";

export class PreloadScene extends Phaser.Scene {
  private bar?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: SCENES.Preload });
  }

  preload(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;
    this.add
      .text(w / 2, h / 2 - 20, "loading…", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#bcc4d4",
      })
      .setOrigin(0.5);
    this.add.rectangle(w / 2, h / 2, 200, 6, 0x1a1f2a).setOrigin(0.5);
    this.bar = this.add.rectangle(w / 2 - 100, h / 2, 0, 4, 0x9ad7ff).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => this.bar?.setSize(200 * p, 4));

    for (const spec of lpcLoadList()) {
      this.load.spritesheet(spec.key, spec.url, {
        frameWidth: FRAME,
        frameHeight: FRAME,
      });
    }

    this.load.image(ATLAS_TERRAIN, "assets/lpc-tiles/terrain_atlas.png");
    this.load.image(ATLAS_BASE_OUT, "assets/lpc-tiles/base_out_atlas.png");
    this.load.image(FARM_FENCE, "assets/lpc-tiles/fence.png");
  }

  create(): void {
    this.cutAtlasTiles();
    this.makeProcedural();
    registerWalkAnims(this);
    SaveManager.load();
    void getNews();
    this.scene.start(SCENES.Title);
  }

  /**
   * Extract named single textures by cropping rectangles from the LPC atlas
   * images. Each cut becomes a regular Phaser texture so existing
   * `add.image(x, y, key)` calls keep working unchanged.
   */
  private cutAtlasTiles(): void {
    const T = 32;
    const cutFrom = (
      atlasKey: string,
      key: string,
      col: number,
      row: number,
      tilesW = 1,
      tilesH = 1,
    ) => {
      const w = tilesW * T;
      const h = tilesH * T;
      const ct = this.textures.createCanvas(key, w, h);
      if (!ct) return;
      const src = this.textures.get(atlasKey).getSourceImage() as HTMLImageElement;
      ct.context.imageSmoothingEnabled = false;
      ct.context.drawImage(src, col * T, row * T, w, h, 0, 0, w, h);
      ct.refresh();
    };
    const cut = (key: string, col: number, row: number, tilesW = 1, tilesH = 1) =>
      cutFrom(ATLAS_TERRAIN, key, col, row, tilesW, tilesH);

    // Ground tiles
    cut(TEX.Grass, 1, 20);
    cut(TEX.GrassVar, 4, 20);
    cut(TEX.GrassFlowers, 21, 11);
    cut(TEX.PathSlate, 1, 17);
    cut(TEX.PathBrick, 21, 22);
    cut(TEX.Path, 19, 21);
    cut(TEX.Dirt, 19, 21);
    cut(TEX.Sand, 1, 14);
    cut(TEX.Water, 10, 12);
    cut("tex_water_shore_t", 10, 11);
    cut("tex_water_shore_l", 9, 12);
    cut("tex_water_shore_r", 11, 12);
    cut("tex_water_shore_tl", 9, 11);
    cut("tex_water_shore_tr", 11, 11);
    cut("tex_water_shimmer_0", 21, 17);
    cut("tex_water_shimmer_1", 22, 17);
    cut("tex_water_shimmer_2", 23, 17);
    // grass↔dirt 3×3 auto-tile set (rows 17-19, cols 5-7)
    cut("tex_gd_nw", 5, 17);
    cut("tex_gd_n", 6, 17);
    cut("tex_gd_ne", 7, 17);
    cut("tex_gd_w", 5, 18);
    cut("tex_gd_c", 6, 18);
    cut("tex_gd_e", 7, 18);
    cut("tex_gd_sw", 5, 19);
    cut("tex_gd_s", 6, 19);
    cut("tex_gd_se", 7, 19);
    cut(TEX.WoodDeck, 17, 19);
    cut(TEX.CarpetRed, 27, 11);

    // Multi-tile decoration objects
    cut(TEX.TreePine, 30, 0, 2, 5);
    cut(TEX.TreeOak, 25, 16, 2, 3);
    cut("tex_tree_pine_small", 30, 1, 2, 4);
    cut("tex_tree_oak_small", 25, 17, 2, 2);
    cut(TEX.Bush, 22, 9, 2, 2);
    cut(TEX.BushSmall, 23, 4);
    cut(TEX.Stump, 13, 13);
    cut(TEX.Statue, 15, 12, 2, 2);
    cut(TEX.Fountain, 17, 12, 1, 2);
    cut(TEX.Bridge, 16, 16, 3, 2);
    cut(TEX.Rocks, 23, 21, 3, 1);
    cut(TEX.RockBig, 26, 21, 2, 1);
    cut(TEX.Cactus, 11, 14, 1, 2);
    cut(TEX.LilyPad, 12, 27);
    cut(TEX.Crops, 16, 25, 4, 1);
    // Note: TEX.FlowerRed/Yellow/Blue are procedural 8×8 icons (see makeFlower
     // below) — the atlas tiles at those positions are 32×32 fields, not icons.
    cut(TEX.Flowers, 8, 31, 2, 1);
    cut(TEX.Cattail, 6, 25);

    // (Buildings are procedural — see makeCottage / makeBuildingTex below)

    // Fences (fence.png is 3x6 of 32x32; row 0 = horizontal rail, row 1 = single posts)
    cutFrom(FARM_FENCE, TEX.FenceH, 1, 0, 1, 1); // horizontal middle piece
    cutFrom(FARM_FENCE, TEX.FenceV, 0, 1, 1, 1); // single vertical post
    cutFrom(FARM_FENCE, TEX.Fence, 1, 0, 1, 1);
  }

  private makeProcedural(): void {
    this.makeTile(TEX.Wall, 0x4a5060, 0x2c2f36, 0x5e6477);
    this.makeTile(TEX.Stone, 0x6e6f78, 0x55565e, 0x83848e);
    this.makeDungeonFloor(TEX.DungeonFloor);
    this.makeTile(TEX.Dock, 0x7a5638, 0x593e26, 0x8e6645);
    this.makeTile(TEX.GrassDark, 0x2c5530, 0x224427, 0x3a6a3a);
    this.makeTile(TEX.GrassLight, 0x4d8442, 0x3f6f37, 0x5e9750);
    this.makeSign(TEX.SignPost);
    this.makeTotem(TEX.Totem);
    this.makeBobber(TEX.Bobber);
    this.makeChest(TEX.ChestClosed, 0x8a5a2b, 0xd4a14a, false);
    this.makeChest(TEX.ChestOpen, 0x8a5a2b, 0xd4a14a, true);
    this.makeChest(TEX.ChestGold, 0xb8943a, 0xffd479, false);
    this.makeServer(TEX.Server);
    this.makeDust(TEX.Dust);
    this.makeKiosk(TEX.NewsKiosk);
    this.makeBench(TEX.Bench);
    this.makeCrate(TEX.Crate);
    this.makeRubble(TEX.Rubble);
    this.makeWeb(TEX.Web);
    this.makeMonitor(TEX.Monitor);
    this.makeHill(TEX.Hill);
    this.makeCow(TEX.Cow);
    this.makeChicken(TEX.Chicken);
    this.makeDuck(TEX.Duck);
    this.makeCottage(TEX.Cottage);
    this.makeBuildingTex(TEX.Building, 0x9c6f4a, 0x5a3520, 0x6e3f2a);
    this.makeBuildingTex(TEX.BuildingAlt, 0xb8a07a, 0x4a4e58, 0x6e6f78);
    this.makeDoor(TEX.Door);
    this.makeFlower(TEX.FlowerRed, 0xff5670, 0xffa3b0);
    this.makeFlower(TEX.FlowerYellow, 0xffd479, 0xfff0b0);
    this.makeFlower(TEX.FlowerBlue, 0x9ad7ff, 0xc8e9ff);
    this.makeMushroom(TEX.Mushroom);
    this.makeWhiteboard(TEX.Whiteboard);
    this.makeStreetLamp(TEX.StreetLamp);
  }

  /**
   * 64×32 whiteboard with marker streaks — sits on the back wall of the
   * AI/ML Lab so the room reads as "research space" not "stone room".
   */
  private makeWhiteboard(key: string): void {
    const w = 64;
    const h = 32;
    const g = this.add.graphics();
    g.fillStyle(0xe6e8ee, 1).fillRect(0, 0, w, h);
    g.fillStyle(0xc4c6d2, 1).fillRect(0, 0, w, 3);
    g.fillStyle(0x222730, 1).fillRect(0, h - 4, w, 4);
    // marker scribbles
    g.fillStyle(0x9ad7ff, 1);
    g.fillRect(5, 8, 14, 1);
    g.fillRect(5, 11, 9, 1);
    g.fillStyle(0xff5670, 1);
    g.fillRect(25, 7, 20, 1);
    g.fillRect(28, 10, 13, 2);
    g.fillStyle(0x7fdca0, 1);
    g.fillRect(48, 8, 10, 1);
    g.fillRect(50, 12, 6, 1);
    g.fillStyle(0xffd479, 1);
    g.fillRect(7, 18, 18, 1);
    g.fillRect(35, 20, 22, 1);
    g.lineStyle(1, 0x000000, 0.4).strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /**
   * 16×48 street lamp with a glowing top — used between Engineering
   * buildings for ambient detail.
   */
  private makeStreetLamp(key: string): void {
    const w = 16;
    const h = 48;
    const g = this.add.graphics();
    g.fillStyle(0x2a2d35, 1).fillRect(7, 14, 2, 30); // pole
    g.fillStyle(0x4a4e58, 1).fillRect(5, 12, 6, 4); // crossbar
    g.fillStyle(0x4a4e58, 1).fillRect(3, 4, 10, 10); // lantern frame
    g.fillStyle(0xffd479, 1).fillRect(5, 6, 6, 6); // lit glass
    g.fillStyle(0xfff0b0, 1).fillRect(6, 7, 4, 4); // bright center
    g.fillStyle(0x2a2d35, 1).fillRect(5, 0, 6, 4); // hood
    g.fillStyle(0x2a2d35, 1).fillRect(6, 44, 4, 4); // base
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeFlower(key: string, petal: number, light: number): void {
    const g = this.add.graphics();
    g.fillStyle(0x3a7a3e, 1).fillRect(3, 4, 1, 4);
    g.fillStyle(petal, 1).fillRect(2, 1, 4, 3);
    g.fillStyle(light, 1).fillRect(3, 2, 2, 1);
    g.fillStyle(0xffd479, 1).fillRect(3, 2, 1, 1);
    g.generateTexture(key, 8, 8);
    g.destroy();
  }

  private makeMushroom(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xf2efe1, 1).fillRect(3, 5, 4, 4);
    g.fillStyle(0xb84438, 1).fillRect(1, 1, 8, 4);
    g.fillStyle(0xfff0b0, 1).fillRect(3, 2, 1, 1);
    g.fillStyle(0xfff0b0, 1).fillRect(6, 3, 1, 1);
    g.generateTexture(key, 10, 10);
    g.destroy();
  }

  private makeCottage(key: string): void {
    const w = 96;
    const h = 96;
    const g = this.add.graphics();
    g.fillStyle(0xc4a474, 1).fillRect(0, 36, w, h - 36);
    g.fillStyle(0x886844, 1);
    for (let x = 0; x < w; x += 16) g.fillRect(x, 36, 1, h - 36);
    g.fillStyle(0xb84438, 1);
    g.fillTriangle(0, 38, w / 2, -4, w, 38);
    g.fillStyle(0x83291f, 1);
    for (let x = 4; x < w - 4; x += 6) g.fillRect(x, 12, 2, 4);
    g.fillStyle(0x5a3520, 1).fillRect(38, 60, 20, 36);
    g.fillStyle(0x2b1c14, 1).fillRect(40, 62, 16, 32);
    g.fillStyle(0xffd479, 1).fillRect(52, 78, 2, 2);
    g.fillStyle(0x9ad7ff, 1).fillRect(12, 50, 14, 14);
    g.fillStyle(0x9ad7ff, 1).fillRect(70, 50, 14, 14);
    g.fillStyle(0x886844, 1).fillRect(18, 50, 1, 14);
    g.fillStyle(0x886844, 1).fillRect(12, 56, 14, 1);
    g.fillStyle(0x886844, 1).fillRect(76, 50, 1, 14);
    g.fillStyle(0x886844, 1).fillRect(70, 56, 14, 1);
    g.lineStyle(1, 0x000000, 0.5).strokeRect(0, 36, w, h - 36);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeBuildingTex(
    key: string,
    wallColor: number = 0x9c6f4a,
    trimColor: number = 0x5a3520,
    roofColor: number = 0x6e3f2a,
  ): void {
    const w = 128;
    const h = 128;
    const g = this.add.graphics();
    g.fillStyle(wallColor, 1).fillRect(0, 40, w, h - 40);
    g.fillStyle(trimColor, 1).fillRect(-2, 28, w + 4, 14);
    g.fillStyle(roofColor, 1).fillRect(0, 0, w, 30);
    g.fillStyle(0x402418, 1);
    for (let x = 0; x < w; x += 14) g.fillRect(x, 0, 1, 30);
    g.fillStyle(0x2b1c14, 1).fillRect(56, 80, 16, 48);
    g.fillStyle(0xffd479, 1).fillRect(66, 102, 2, 2);
    g.fillStyle(0xffd479, 1).fillRect(20, 60, 18, 18);
    g.fillStyle(0xffd479, 1).fillRect(90, 60, 18, 18);
    g.fillStyle(0x402418, 1).fillRect(28, 60, 1, 18);
    g.fillStyle(0x402418, 1).fillRect(20, 68, 18, 1);
    g.fillStyle(0x402418, 1).fillRect(98, 60, 1, 18);
    g.fillStyle(0x402418, 1).fillRect(90, 68, 18, 1);
    g.fillStyle(0x000000, 0.3).fillRect(0, 120, w, 8);
    g.lineStyle(1, 0x000000, 0.5).strokeRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeDoor(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x2b1c14, 1).fillRect(0, 0, 28, 44);
    g.fillStyle(0xffd479, 1).fillRect(20, 22, 4, 4);
    g.lineStyle(1, 0x000000, 0.6).strokeRect(0, 0, 28, 44);
    g.generateTexture(key, 28, 44);
    g.destroy();
  }

  /**
   * Dungeon-style flagstone floor — large rectangular pavers separated by
   * dark grout lines so the corridor reads as worked stone instead of the
   * generic procedural placeholder.
   */
  private makeDungeonFloor(key: string): void {
    const size = GAME_CONFIG.tileSize; // 32
    const g = this.add.graphics();
    // base stone
    g.fillStyle(0x4a4e58, 1).fillRect(0, 0, size, size);
    // grout cross — splits the tile into 4 flagstones
    g.fillStyle(0x2a2d35, 1).fillRect(0, size / 2 - 1, size, 2);
    g.fillStyle(0x2a2d35, 1).fillRect(size / 2 - 1, 0, 2, size);
    // light specks for texture
    g.fillStyle(0x5e6473, 1);
    for (let i = 0; i < 6; i += 1) {
      const x = (i * 7 + 3) % size;
      const y = (i * 11 + 5) % size;
      g.fillRect(x, y, 1, 1);
    }
    // dark specks
    g.fillStyle(0x363942, 1);
    for (let i = 0; i < 4; i += 1) {
      const x = (i * 9 + 1) % size;
      const y = (i * 13 + 7) % size;
      g.fillRect(x, y, 1, 1);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeTile(key: string, base: number, dark: number, light: number): void {
    const size = GAME_CONFIG.tileSize;
    const g = this.add.graphics();
    g.fillStyle(base, 1).fillRect(0, 0, size, size);
    g.fillStyle(dark, 1);
    for (let i = 0; i < 6; i += 1) {
      const x = (i * 7) % size;
      const y = (i * 11) % size;
      g.fillRect(x, y, 2, 1);
    }
    g.fillStyle(light, 1);
    for (let i = 0; i < 4; i += 1) {
      const x = (i * 9 + 5) % size;
      const y = (i * 13 + 3) % size;
      g.fillRect(x, y, 1, 1);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  private makeSign(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x6b4a2a, 1).fillRect(14, 18, 4, 14);
    g.fillStyle(0xa97844, 1).fillRect(4, 4, 24, 16);
    g.fillStyle(0x5b3a1f, 1).fillRect(4, 4, 24, 2);
    g.fillStyle(0x5b3a1f, 1).fillRect(4, 18, 24, 2);
    g.lineStyle(1, 0x000000, 0.5).strokeRect(4, 4, 24, 16);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeTotem(key: string): void {
    const g = this.add.graphics();
    // stone base
    g.fillStyle(0x55565e, 1).fillRect(2, 50, 28, 14);
    g.fillStyle(0x83848e, 1).fillRect(2, 48, 28, 4);
    g.fillStyle(0x6e6f78, 1).fillRect(2, 50, 28, 1);
    // pillar shaft
    g.fillStyle(0x9b9da9, 1).fillRect(7, 10, 18, 38);
    g.fillStyle(0x55565e, 1).fillRect(21, 10, 4, 38);
    g.fillStyle(0xb8bac6, 1).fillRect(7, 10, 4, 38);
    // cap
    g.fillStyle(0xa0a2ae, 1).fillRect(4, 4, 24, 8);
    g.fillStyle(0x6e6f78, 1).fillRect(22, 4, 6, 8);
    g.fillStyle(0xc4c6d2, 1).fillRect(4, 4, 24, 2);
    // engraved tablet area (slightly recessed)
    g.fillStyle(0x4a4b53, 1).fillRect(11, 16, 10, 26);
    g.fillStyle(0x6e6f78, 1).fillRect(11, 16, 10, 1);
    g.lineStyle(1, 0x000000, 0.45).strokeRect(2, 4, 28, 60);
    g.generateTexture(key, 32, 64);
    g.destroy();
  }

  private makeBobber(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xff3344, 1).fillRect(2, 0, 4, 3);
    g.fillStyle(0xffffff, 1).fillRect(2, 3, 4, 3);
    g.fillStyle(0x000000, 0.4).fillRect(3, 6, 2, 1);
    g.generateTexture(key, 8, 8);
    g.destroy();
  }

  private makeChest(key: string, body: number, trim: number, open: boolean): void {
    const g = this.add.graphics();
    if (open) {
      g.fillStyle(body, 1).fillRect(0, 12, 32, 16);
      g.fillStyle(trim, 1).fillRect(0, 8, 32, 4);
      g.fillStyle(0x10141c, 1).fillRect(4, 12, 24, 8);
      g.fillStyle(0xffd479, 1).fillRect(10, 14, 12, 4);
    } else {
      g.fillStyle(body, 1).fillRect(0, 8, 32, 20);
      g.fillStyle(trim, 1).fillRect(0, 8, 32, 4);
      g.fillStyle(trim, 1).fillRect(0, 18, 32, 2);
      g.fillStyle(0x10141c, 1).fillRect(14, 18, 4, 6);
    }
    g.lineStyle(1, 0x000000, 0.6).strokeRect(0, 8, 32, 20);
    g.generateTexture(key, 32, 28);
    g.destroy();
  }

  private makeServer(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x222730, 1).fillRect(0, 0, 32, 64);
    g.fillStyle(0x40495a, 1);
    for (let i = 0; i < 4; i += 1) g.fillRect(4, 4 + i * 12, 24, 8);
    g.fillStyle(0x9ad7ff, 1).fillRect(26, 6, 2, 2);
    g.fillStyle(0x7fdca0, 1).fillRect(26, 18, 2, 2);
    g.fillStyle(0xffd479, 1).fillRect(26, 30, 2, 2);
    g.fillStyle(0xff7a7a, 1).fillRect(26, 42, 2, 2);
    g.lineStyle(1, 0x000000, 0.7).strokeRect(0, 0, 32, 64);
    g.generateTexture(key, 32, 64);
    g.destroy();
  }

  private makeDust(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xe6e8ee, 0.7).fillCircle(3, 3, 3);
    g.generateTexture(key, 6, 6);
    g.destroy();
  }

  private makeKiosk(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 36, 32, 16);
    g.fillStyle(0x222730, 1).fillRect(2, 0, 28, 36);
    g.fillStyle(0x9ad7ff, 1).fillRect(4, 2, 24, 28);
    g.fillStyle(0x222730, 1).fillRect(6, 6, 20, 2);
    g.fillStyle(0x222730, 1).fillRect(6, 12, 16, 2);
    g.fillStyle(0x222730, 1).fillRect(6, 18, 18, 2);
    g.fillStyle(0x222730, 1).fillRect(6, 24, 14, 2);
    g.lineStyle(1, 0x000000, 0.6).strokeRect(2, 0, 28, 52);
    g.generateTexture(key, 32, 52);
    g.destroy();
  }

  private makeBench(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 8, 32, 6);
    g.fillStyle(0x886844, 1).fillRect(0, 8, 32, 2);
    g.fillStyle(0x5a3520, 1).fillRect(2, 14, 4, 10);
    g.fillStyle(0x5a3520, 1).fillRect(26, 14, 4, 10);
    g.generateTexture(key, 32, 24);
    g.destroy();
  }

  private makeCrate(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x886844, 1).fillRect(0, 0, 32, 32);
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 0, 32, 2);
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 14, 32, 2);
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 30, 32, 2);
    g.fillStyle(0x6b4a2a, 1).fillRect(0, 0, 2, 32);
    g.fillStyle(0x6b4a2a, 1).fillRect(14, 0, 2, 32);
    g.fillStyle(0x6b4a2a, 1).fillRect(30, 0, 2, 32);
    g.lineStyle(1, 0x000000, 0.4).strokeRect(0, 0, 32, 32);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeRubble(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x6e6f78, 1).fillRect(4, 10, 12, 8);
    g.fillStyle(0x55565e, 1).fillRect(16, 14, 8, 6);
    g.fillStyle(0x83848e, 1).fillRect(8, 12, 4, 2);
    g.fillStyle(0x83848e, 1).fillRect(20, 16, 4, 2);
    g.fillStyle(0x55565e, 1).fillRect(0, 18, 6, 4);
    g.generateTexture(key, 28, 24);
    g.destroy();
  }

  private makeWeb(key: string): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0xe6e8ee, 0.45);
    g.strokeLineShape(new Phaser.Geom.Line(0, 0, 32, 32));
    g.strokeLineShape(new Phaser.Geom.Line(32, 0, 0, 32));
    g.strokeLineShape(new Phaser.Geom.Line(16, 0, 16, 32));
    g.strokeLineShape(new Phaser.Geom.Line(0, 16, 32, 16));
    g.lineStyle(1, 0xe6e8ee, 0.3);
    g.strokeCircle(16, 16, 8);
    g.strokeCircle(16, 16, 14);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeMonitor(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x222730, 1).fillRect(0, 0, 32, 24);
    g.fillStyle(0x10141c, 1).fillRect(2, 2, 28, 18);
    g.fillStyle(0x7fdca0, 1).fillRect(4, 4, 12, 2);
    g.fillStyle(0x9ad7ff, 1).fillRect(4, 8, 18, 2);
    g.fillStyle(0xffd479, 1).fillRect(4, 12, 8, 2);
    g.fillStyle(0x222730, 1).fillRect(14, 24, 4, 4);
    g.fillStyle(0x55565e, 1).fillRect(8, 28, 16, 2);
    g.generateTexture(key, 32, 30);
    g.destroy();
  }

  private makeHill(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x4d8442, 1).fillRect(0, 16, 32, 16);
    g.fillStyle(0x3f6f37, 1).fillEllipse(16, 16, 28, 12);
    g.fillStyle(0x5e9750, 1).fillEllipse(16, 14, 16, 6);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeCow(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xf2efe1, 1).fillRect(4, 8, 24, 16);
    g.fillStyle(0x000000, 1).fillRect(6, 10, 6, 4);
    g.fillStyle(0x000000, 1).fillRect(18, 14, 6, 4);
    g.fillStyle(0xf2efe1, 1).fillRect(0, 10, 8, 10);
    g.fillStyle(0xff9aa3, 1).fillRect(0, 14, 2, 2);
    g.fillStyle(0x000000, 1).fillRect(4, 12, 2, 2);
    g.fillStyle(0x6b4a2a, 1).fillRect(6, 24, 2, 4);
    g.fillStyle(0x6b4a2a, 1).fillRect(12, 24, 2, 4);
    g.fillStyle(0x6b4a2a, 1).fillRect(18, 24, 2, 4);
    g.fillStyle(0x6b4a2a, 1).fillRect(24, 24, 2, 4);
    g.generateTexture(key, 32, 28);
    g.destroy();
  }

  private makeChicken(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xf2efe1, 1).fillRect(4, 6, 16, 12);
    g.fillStyle(0xf2efe1, 1).fillRect(0, 4, 8, 8);
    g.fillStyle(0xb84438, 1).fillRect(2, 0, 4, 4);
    g.fillStyle(0xffd479, 1).fillRect(0, 6, 2, 2);
    g.fillStyle(0x000000, 1).fillRect(2, 6, 2, 2);
    g.fillStyle(0xffd479, 1).fillRect(6, 18, 2, 2);
    g.fillStyle(0xffd479, 1).fillRect(14, 18, 2, 2);
    g.generateTexture(key, 24, 20);
    g.destroy();
  }

  private makeDuck(key: string): void {
    const g = this.add.graphics();
    g.fillStyle(0xffd479, 1).fillRect(4, 6, 16, 10);
    g.fillStyle(0xffd479, 1).fillRect(0, 4, 8, 8);
    g.fillStyle(0xff9433, 1).fillRect(0, 6, 4, 4);
    g.fillStyle(0x000000, 1).fillRect(2, 6, 2, 2);
    g.fillStyle(0xffffff, 1).fillRect(16, 8, 2, 2);
    g.generateTexture(key, 24, 16);
    g.destroy();
  }
}
