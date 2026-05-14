import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { Player } from "../entities/Player";
import { NPC, type NPCSpec } from "../entities/NPC";
import { Chest } from "../entities/Chest";
import { DialogManager } from "../systems/DialogManager";
import { SaveManager } from "../systems/SaveManager";
import { TEX } from "../scenes/PreloadScene";
import { chestsForScene, dailySecretFor, type ChestDef, type DailyChestSeed } from "../data/chests";

export function seededRng(seed: number): () => number {
  let state = seed | 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return ((state >>> 0) / 0xffffffff);
  };
}
import { getCachedStories, newsHeadlineForDailySecret, todayKey } from "../systems/NewsService";
import type { Direction, DialogLine } from "../types";

const TILE = GAME_CONFIG.tileSize;

export interface ZoneInitData {
  spawn?: string;
  fromScene?: string;
}

export interface InteractTarget {
  x: number;
  y: number;
  range: number;
  label?: string;
  onInteract: () => void;
  ref?: NPC | Chest | Phaser.GameObjects.GameObject;
}

export interface WarpSpec {
  x: number;
  y: number;
  width: number;
  height: number;
  toScene: string;
  toSpawn?: string;
  facing?: Direction;
}

export abstract class BaseZoneScene extends Phaser.Scene {
  abstract readonly sceneKey: string;
  abstract readonly zoneTitle: string;

  protected player!: Player;
  protected interactKey!: Phaser.Input.Keyboard.Key;
  protected interactables: InteractTarget[] = [];
  protected npcs: NPC[] = [];
  protected walls!: Phaser.Physics.Arcade.StaticGroup;
  protected warps: WarpSpec[] = [];
  protected currentHintTarget: InteractTarget | null = null;
  protected hintText!: Phaser.GameObjects.Text;
  protected zoneTitleText!: Phaser.GameObjects.Text;
  protected inDialog = false;
  protected isWarping = false;
  protected spawnPoints = new Map<string, { x: number; y: number; facing?: Direction }>();
  protected initData: ZoneInitData = {};

  constructor(key: string) {
    super({ key });
  }

  init(data: ZoneInitData): void {
    this.initData = data ?? {};
  }

  create(): void {
    const worldW = GAME_CONFIG.worldTilesX * TILE;
    const worldH = GAME_CONFIG.worldTilesY * TILE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(220, 0, 0, 0);

    this.walls = this.physics.add.staticGroup();

    this.buildZone(worldW, worldH);

    const save = SaveManager.load();
    const spawn = this.resolveSpawn(save);
    this.player = new Player(this, spawn.x, spawn.y, save.appearance);
    this.player.faceDirection(spawn.facing ?? save.player.direction);
    this.cameras.main.startFollow(this.player.container, true, 0.18, 0.18);

    this.physics.add.collider(this.player.container, this.walls);
    for (const npc of this.npcs) {
      this.physics.add.collider(this.player.container, npc.character.container);
    }

    const kb = this.input.keyboard;
    if (!kb) throw new Error("Keyboard input unavailable");
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.zoneTitleText = this.add
      .text(GAME_CONFIG.viewWidth / 2, 12, this.zoneTitle, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9ad7ff",
        backgroundColor: "#0b0d12cc",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);
    this.zoneTitleText.setAlpha(0);
    this.tweens.add({
      targets: this.zoneTitleText,
      alpha: 1,
      duration: 400,
      hold: 1500,
      yoyo: true,
      onComplete: () => this.zoneTitleText.setAlpha(0),
    });

    this.hintText = this.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffd479",
      })
      .setOrigin(0.5, 1)
      .setDepth(Z.Overlay)
      .setVisible(false);

    DialogManager.on(EVENTS.DialogClose, this.onDialogClose, this);
    this.game.events.on(EVENTS.ShopOpen, this.onModalOpen, this);
    this.game.events.on(EVENTS.ShopClose, this.onModalClose, this);
    this.game.events.on(EVENTS.FishingStart, this.onModalOpen, this);
    this.game.events.on(EVENTS.FishingEnd, this.onModalClose, this);
    this.game.events.on(EVENTS.MinigameStart, this.onModalOpen, this);
    this.game.events.on(EVENTS.MinigameEnd, this.onModalClose, this);
    this.game.events.on(EVENTS.AppearanceChanged, this.onAppearanceChanged, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      DialogManager.off(EVENTS.DialogClose, this.onDialogClose, this);
      this.game.events.off(EVENTS.ShopOpen, this.onModalOpen, this);
      this.game.events.off(EVENTS.ShopClose, this.onModalClose, this);
      this.game.events.off(EVENTS.FishingStart, this.onModalOpen, this);
      this.game.events.off(EVENTS.FishingEnd, this.onModalClose, this);
      this.game.events.off(EVENTS.MinigameStart, this.onModalOpen, this);
      this.game.events.off(EVENTS.MinigameEnd, this.onModalClose, this);
      this.game.events.off(EVENTS.AppearanceChanged, this.onAppearanceChanged, this);
    });

    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.persistPosition(),
    });

    this.dustEmitter = this.add.particles(0, 0, TEX.Dust, {
      lifespan: 350,
      speed: { min: 8, max: 22 },
      angle: { min: 240, max: 300 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.55, end: 0 },
      gravityY: 30,
      frequency: -1,
      quantity: 1,
    });
    this.dustEmitter.setDepth(Z.GroundDecal);
  }

  protected dustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastDustAt = 0;
  private lastPlayerPos = { x: 0, y: 0 };

  update(): void {
    this.player.update();
    for (const npc of this.npcs) npc.update();
    this.maybePuffDust();

    const target = this.findNearestInteract();
    if (target !== this.currentHintTarget) {
      this.currentHintTarget = target;
      this.refreshHint();
    }
    if (target) {
      this.hintText.setPosition(target.x, target.y - 28);
    }

    if (!this.inDialog && !this.modalOpen && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (target) {
        target.onInteract();
      }
    }

    if (!this.isWarping && !this.inDialog && !this.modalOpen) this.checkWarps();
  }

  protected abstract buildZone(worldW: number, worldH: number): void;

  protected addSpawn(name: string, x: number, y: number, facing?: Direction): void {
    this.spawnPoints.set(name, { x, y, facing });
  }

  protected paintGround(rect: Phaser.Geom.Rectangle, key: string): void {
    const startTx = Math.floor(rect.x / TILE);
    const startTy = Math.floor(rect.y / TILE);
    const endTx = Math.ceil((rect.x + rect.width) / TILE);
    const endTy = Math.ceil((rect.y + rect.height) / TILE);
    for (let ty = startTy; ty < endTy; ty += 1) {
      for (let tx = startTx; tx < endTx; tx += 1) {
        this.add.image(tx * TILE, ty * TILE, key).setOrigin(0, 0).setDepth(Z.Ground);
      }
    }
  }

  protected paintWholeFloor(worldW: number, worldH: number, key: string = TEX.Grass): void {
    this.paintGround(new Phaser.Geom.Rectangle(0, 0, worldW, worldH), key);
  }

  /**
   * Auto-tile painter — paints a rectangular region with proper edge/corner
   * transitions on its border. The base ground beneath should already be
   * painted with the "outside" terrain (e.g. grass) so the transition tiles
   * (which have grass on their outer edges) blend naturally.
   *
   * Layout of the 3×3 transition set: NW, N, NE on the top row; W, C, E in
   * the middle (C is the pure interior); SW, S, SE on the bottom row.
   *
   * If `interior` is provided, the inside cells use that texture instead of
   * the auto-tile's center cell — useful for "stone plaza with a dirt ring"
   * effects where the interior is a different terrain.
   */
  protected paintRectWithAutoTileBorder(
    rect: Phaser.Geom.Rectangle,
    set: {
      nw: string; n: string; ne: string;
      w: string; c: string; e: string;
      sw: string; s: string; se: string;
    },
    interior?: string,
  ): void {
    const startTx = Math.floor(rect.x / TILE);
    const startTy = Math.floor(rect.y / TILE);
    const endTx = Math.ceil((rect.x + rect.width) / TILE);
    const endTy = Math.ceil((rect.y + rect.height) / TILE);
    for (let ty = startTy; ty < endTy; ty += 1) {
      for (let tx = startTx; tx < endTx; tx += 1) {
        const isWest = tx === startTx;
        const isEast = tx === endTx - 1;
        const isNorth = ty === startTy;
        const isSouth = ty === endTy - 1;
        let key: string;
        if (isNorth && isWest) key = set.nw;
        else if (isNorth && isEast) key = set.ne;
        else if (isSouth && isWest) key = set.sw;
        else if (isSouth && isEast) key = set.se;
        else if (isNorth) key = set.n;
        else if (isSouth) key = set.s;
        else if (isWest) key = set.w;
        else if (isEast) key = set.e;
        else key = interior ?? set.c;
        this.add.image(tx * TILE, ty * TILE, key).setOrigin(0, 0).setDepth(Z.Ground);
      }
    }
  }

  protected readonly GRASS_DIRT_AUTOTILE = {
    nw: "tex_gd_nw", n: "tex_gd_n", ne: "tex_gd_ne",
    w: "tex_gd_w", c: "tex_gd_c", e: "tex_gd_e",
    sw: "tex_gd_sw", s: "tex_gd_s", se: "tex_gd_se",
  };

  /**
   * Tile-aligned ground painter that draws a base tile and randomly substitutes
   * variant tiles at a given probability per cell. Use this for grass/dirt
   * color variation — it keeps every tile on the 32-px grid so they don't look
   * like overlapping decoration sprites.
   */
  protected paintGroundWithVariants(
    rect: Phaser.Geom.Rectangle,
    base: string,
    variants: Array<{ key: string; weight: number }>,
    seed = 1,
  ): void {
    const rng = seededRng(seed);
    const startTx = Math.floor(rect.x / TILE);
    const startTy = Math.floor(rect.y / TILE);
    const endTx = Math.ceil((rect.x + rect.width) / TILE);
    const endTy = Math.ceil((rect.y + rect.height) / TILE);
    const totalWeight = variants.reduce((s, v) => s + v.weight, 0);
    for (let ty = startTy; ty < endTy; ty += 1) {
      for (let tx = startTx; tx < endTx; tx += 1) {
        let key = base;
        if (totalWeight > 0) {
          const roll = rng() * (1 + totalWeight);
          if (roll > 1) {
            let r = roll - 1;
            for (const v of variants) {
              r -= v.weight;
              if (r <= 0) {
                key = v.key;
                break;
              }
            }
          }
        }
        this.add.image(tx * TILE, ty * TILE, key).setOrigin(0, 0).setDepth(Z.Ground);
      }
    }
  }

  protected addWallTile(x: number, y: number, tex = TEX.Wall): void {
    const img = this.add.image(x, y, tex).setOrigin(0, 0).setDepth(Z.Walls);
    this.walls.add(img);
    const body = (img as Phaser.GameObjects.Image & { body?: Phaser.Physics.Arcade.StaticBody }).body;
    body?.updateFromGameObject();
  }

  protected addBorderWalls(
    worldW: number,
    worldH: number,
    doorways: Array<{ tx: number; ty: number }> = [],
    tex = TEX.Wall,
  ): void {
    const skip = (tx: number, ty: number) =>
      doorways.some((d) => d.tx === tx && d.ty === ty);
    const colsX = worldW / TILE;
    const colsY = worldH / TILE;
    for (let tx = 0; tx < colsX; tx += 1) {
      if (!skip(tx, 0)) this.addWallTile(tx * TILE, 0, tex);
      if (!skip(tx, colsY - 1)) this.addWallTile(tx * TILE, worldH - TILE, tex);
    }
    for (let ty = 1; ty < colsY - 1; ty += 1) {
      if (!skip(0, ty)) this.addWallTile(0, ty * TILE, tex);
      if (!skip(colsX - 1, ty)) this.addWallTile(worldW - TILE, ty * TILE, tex);
    }
  }

  protected addSign(x: number, y: number, label: string, lines: DialogLine[]): void {
    const img = this.add.image(x, y, TEX.SignPost).setDepth(Z.Entities).setOrigin(0.5, 0.85);
    const interact: InteractTarget = {
      x,
      y,
      range: 22,
      label,
      onInteract: () => this.openDialog(lines),
      ref: img,
    };
    this.interactables.push(interact);
  }

  protected addNPC(spec: NPCSpec): NPC {
    const npc = new NPC(this, spec);
    this.npcs.push(npc);
    // If a static `dialog` is provided, auto-wire interact to speak through
    // the NPC's portrait. Otherwise the spec must provide an `onInteract`.
    let onInteract = spec.onInteract;
    if (!onInteract && spec.dialog) {
      const lines = spec.dialog;
      onInteract = () => this.speakAs(npc, lines);
    }
    if (!onInteract) {
      throw new Error(`NPC ${spec.id} needs either onInteract or dialog`);
    }
    this.interactables.push({
      x: spec.x,
      y: spec.y,
      range: npc.interactRange,
      onInteract,
      ref: npc,
    });
    return npc;
  }

  protected addPointInteract(t: InteractTarget): void {
    this.interactables.push(t);
  }

  protected addDecor(
    key: string,
    x: number,
    y: number,
    options: { depth?: number; anchorY?: number; flip?: boolean } = {},
  ): Phaser.GameObjects.Image {
    const img = this.add
      .image(x, y, key)
      .setOrigin(0.5, options.anchorY ?? 0.85);
    img.setDepth(options.depth !== undefined ? options.depth : Z.Entities + y);
    if (options.flip) img.setFlipX(true);
    return img;
  }

  protected addSolidDecor(
    key: string,
    x: number,
    y: number,
    bodyW = 10,
    bodyH = 4,
    bodyYOffset = 0,
  ): Phaser.GameObjects.Image {
    const img = this.addDecor(key, x, y);
    const block = this.add
      .rectangle(x - bodyW / 2, y + bodyYOffset - bodyH, bodyW, bodyH, 0, 0)
      .setOrigin(0, 0);
    this.physics.add.existing(block, true);
    this.walls.add(block as unknown as Phaser.GameObjects.GameObject);
    return img;
  }

  protected addAmbientCritter(
    key: string,
    x: number,
    y: number,
    options: { wanderRadius?: number } = {},
  ): Phaser.GameObjects.Image {
    const sprite = this.addDecor(key, x, y);
    const wander = options.wanderRadius ?? 12;
    sprite.setDepth(Z.Entities + y);
    this.tweens.add({
      targets: sprite,
      y: y - 1,
      duration: 700 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => sprite.setDepth(Z.Entities + sprite.y),
    });
    this.tweens.add({
      targets: sprite,
      x: x + (Math.random() > 0.5 ? wander : -wander),
      duration: 4000 + Math.random() * 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onYoyo: () => sprite.setFlipX(!sprite.flipX),
    });
    return sprite;
  }

  protected scatterDecor(
    key: string,
    count: number,
    rect: Phaser.Geom.Rectangle,
    options: { solid?: boolean; bodyW?: number; bodyH?: number; rng?: () => number } = {},
  ): void {
    const rng = options.rng ?? Math.random;
    for (let i = 0; i < count; i += 1) {
      const x = rect.x + rng() * rect.width;
      const y = rect.y + rng() * rect.height;
      if (options.solid) {
        this.addSolidDecor(key, x, y, options.bodyW ?? 8, options.bodyH ?? 3);
      } else {
        this.addDecor(key, x, y, { anchorY: 0.85, depth: Z.GroundDecal });
      }
    }
  }

  protected spawnStaticChests(): void {
    const save = SaveManager.load();
    for (const def of chestsForScene(this.sceneKey)) {
      this.spawnChest(def, save.openedChests.includes(def.id), false);
    }
    this.spawnDailyIfHere();
  }

  protected spawnDailyIfHere(): void {
    const seed = dailySecretFor(todayKey(), [
      SCENES.Town,
      SCENES.Engineering,
      SCENES.Skill,
      SCENES.Fishing,
      SCENES.AILab,
      SCENES.Dungeon,
    ]);
    if (seed.scene !== this.sceneKey) return;
    const headline = newsHeadlineForDailySecret(getCachedStories());
    this.spawnDailySecret(seed, `daily_${todayKey()}`, headline.title, headline.body);
  }

  protected spawnDailySecret(seed: DailyChestSeed, id: string, title: string, body: string): void {
    if (seed.scene !== this.sceneKey) return;
    const save = SaveManager.load();
    const opened = save.openedChests.includes(id);
    const def: ChestDef = {
      id,
      scene: seed.scene,
      x: seed.x,
      y: seed.y,
      reward: seed.reward,
      flavorTitle: title,
      flavorBody: body,
    };
    this.spawnChest(def, opened, true);
  }

  private spawnChest(def: ChestDef, opened: boolean, golden: boolean): void {
    const chest = new Chest(this, def.id, def.x, def.y, opened, { golden });
    if (opened) return;
    this.addPointInteract({
      x: def.x,
      y: def.y,
      range: 22,
      label: golden ? "Daily Secret" : "Chest",
      onInteract: () => this.openChest(def, chest),
      ref: chest,
    });
  }

  private openChest(def: ChestDef, chest: Chest): void {
    if (chest.isOpened()) return;
    chest.markOpened(this);
    const save = SaveManager.load();
    SaveManager.save({
      credits: save.credits + def.reward,
      openedChests: [...save.openedChests, def.id],
    });
    this.game.events.emit(EVENTS.CreditsChanged);
    this.game.events.emit(EVENTS.ToastShow, {
      text: `${def.flavorTitle}  +${def.reward}◆`,
      color: "#ffd479",
      durationMs: 1800,
    });
    this.openDialog([
      { speaker: def.flavorTitle, text: def.flavorBody },
      { speaker: def.flavorTitle, text: `+${def.reward}◆ added.` },
    ]);
    // remove the interactable for this chest
    this.interactables = this.interactables.filter((i) => {
      const isThis =
        i.ref instanceof Chest && (i.ref as Chest).id === def.id;
      return !isThis;
    });
  }

  protected addWarp(spec: WarpSpec): void {
    this.warps.push(spec);
  }

  protected openDialog(
    linesArr: DialogLine[],
    onClose?: () => void,
    portrait?: string,
  ): void {
    if (this.inDialog) return;
    this.inDialog = true;
    this.player.setInputLocked(true);
    DialogManager.show({
      lines: linesArr,
      portrait,
      onClose: () => onClose?.(),
    });
  }

  /**
   * Convenience: open a dialog whose speaker is an NPC. The NPC's pre-built
   * portrait is used automatically.
   */
  protected speakAs(npc: NPC, lines: DialogLine[], onClose?: () => void): void {
    this.openDialog(lines, onClose, npc.portrait);
  }

  protected onDialogClose(): void {
    this.inDialog = false;
    if (this.player && !this.modalOpen) this.player.setInputLocked(false);
  }

  protected onModalOpen(): void {
    this.modalOpen = true;
    this.player?.setInputLocked(true);
  }

  protected onModalClose(): void {
    this.modalOpen = false;
    if (!this.inDialog) this.player?.setInputLocked(false);
  }

  protected onAppearanceChanged(): void {
    if (!this.player) return;
    this.player.setAppearance(SaveManager.load().appearance);
  }

  protected modalOpen = false;

  private maybePuffDust(): void {
    if (!this.dustEmitter || !this.player) return;
    const px = this.player.x;
    const py = this.player.y;
    const moved =
      Math.abs(px - this.lastPlayerPos.x) > 0.5 ||
      Math.abs(py - this.lastPlayerPos.y) > 0.5;
    this.lastPlayerPos = { x: px, y: py };
    if (!moved) return;
    if (this.time.now - this.lastDustAt < 220) return;
    this.lastDustAt = this.time.now;
    this.dustEmitter.emitParticleAt(px, py + 6, 1);
  }

  private resolveSpawn(save: ReturnType<typeof SaveManager.load>): { x: number; y: number; facing?: Direction } {
    if (this.initData.spawn && this.spawnPoints.has(this.initData.spawn)) {
      return this.spawnPoints.get(this.initData.spawn)!;
    }
    if (save.player.scene === this.sceneKey) {
      return {
        x: save.player.x,
        y: save.player.y,
        facing: save.player.direction,
      };
    }
    if (this.spawnPoints.has("default")) return this.spawnPoints.get("default")!;
    return {
      x: (GAME_CONFIG.worldTilesX * TILE) / 2,
      y: (GAME_CONFIG.worldTilesY * TILE) / 2,
    };
  }

  private findNearestInteract(): InteractTarget | null {
    if (!this.player) return null;
    let nearest: InteractTarget | null = null;
    let bestSq = Infinity;
    const px = this.player.x;
    const py = this.player.y;
    for (const t of this.interactables) {
      const dx = t.x - px;
      const dy = t.y - py;
      const dSq = dx * dx + dy * dy;
      const r = t.range * t.range;
      if (dSq <= r && dSq < bestSq) {
        nearest = t;
        bestSq = dSq;
      }
    }
    return nearest;
  }

  private refreshHint(): void {
    if (!this.currentHintTarget) {
      this.hintText.setVisible(false);
      return;
    }
    const t = this.currentHintTarget;
    this.hintText.setText(t.label ? `[E] ${t.label}` : "[E]");
    this.hintText.setVisible(true);
  }

  private checkWarps(): void {
    const px = this.player.x;
    const py = this.player.y;
    for (const w of this.warps) {
      if (px >= w.x && px <= w.x + w.width && py >= w.y && py <= w.y + w.height) {
        this.triggerWarp(w);
        return;
      }
    }
  }

  private triggerWarp(w: WarpSpec): void {
    this.isWarping = true;
    this.player.setInputLocked(true);
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.persistPosition();
      this.scene.start(w.toScene, { spawn: w.toSpawn ?? "default", fromScene: this.sceneKey });
      // UIScene persists; ensure it's up
      if (!this.scene.isActive(SCENES.UI)) this.scene.launch(SCENES.UI);
    });
  }

  private persistPosition(): void {
    if (!this.player) return;
    SaveManager.save({
      player: {
        scene: this.sceneKey,
        x: this.player.x,
        y: this.player.y,
        direction: this.player.facing,
      },
    });
  }
}
