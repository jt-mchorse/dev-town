import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene } from "../world/BaseZoneScene";
import { TEX } from "./PreloadScene";
import type { QuizTier } from "../data/quiz";
import type { Appearance } from "../types";

const TILE = GAME_CONFIG.tileSize;

const SCIENTIST: Appearance = {
  gender: "female",
  bodyTone: "light",
  shirt: { cosmeticId: "shirt_white" },
  pants: { cosmeticId: "pants_navy" },
  shoes: { cosmeticId: "shoes_brown" },
  hair: { cosmeticId: "hair_bob_raven" },
  hat: { cosmeticId: null },
};

const ASSISTANT: Appearance = {
  gender: "male",
  bodyTone: "light",
  shirt: { cosmeticId: "shirt_forest" },
  pants: { cosmeticId: "pants_charcoal" },
  shoes: { cosmeticId: "shoes_brown" },
  hair: { cosmeticId: "hair_buzzcut_raven" },
  hat: { cosmeticId: null },
};

export class AIMLLabScene extends BaseZoneScene {
  readonly sceneKey = SCENES.AILab;
  readonly zoneTitle = "AI/ML Lab";

  constructor() {
    super(SCENES.AILab);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintWholeFloor(worldW, worldH, TEX.Stone);

    const cy = Math.floor(GAME_CONFIG.worldTilesY / 2) * TILE;
    // Wider central carpet so the room reads as a "research floor" rather
    // than a stone hall with a stripe — 6 tiles tall centered on cy.
    this.paintGround(
      new Phaser.Geom.Rectangle(0, cy - TILE * 3, worldW, TILE * 6),
      TEX.CarpetRed,
    );

    const cyTile = Math.floor(GAME_CONFIG.worldTilesY / 2);
    this.addBorderWalls(worldW, worldH, [{ tx: 0, ty: cyTile }]);

    this.addSpawn("default", worldW / 2, cy + TILE / 2);
    this.addSpawn("from_town", TILE * 2 + TILE / 2, cy + TILE / 2, "right");

    this.addSign(TILE * 4, cy - TILE * 5, "Lab Sign", [
      { speaker: "Lab Sign", text: "AI/ML LAB" },
      { speaker: "Lab Sign", text: "Two researchers run quizzes. Answer questions, earn credits." },
      { speaker: "Lab Sign", text: "The blinking servers do nothing functional. Don't ask." },
    ]);

    // Back-wall server racks (every 4 tiles instead of 6 so the wall is
    // visibly populated end-to-end).
    const serverY = TILE * 2;
    for (let i = 0; i < 12; i += 1) {
      const sx = TILE * 3 + i * TILE * 4;
      if (sx > worldW - TILE * 3) continue;
      this.add.image(sx, serverY, TEX.Server).setDepth(Z.Walls).setOrigin(0, 0);
      const block = this.add.rectangle(sx, serverY, 16, 32, 0, 0).setOrigin(0, 0);
      this.physics.add.existing(block, true);
      this.walls.add(block as unknown as Phaser.GameObjects.GameObject);
    }
    // Whiteboards interspersed between server clusters.
    for (let i = 0; i < 3; i += 1) {
      this.add
        .image(TILE * 7 + i * TILE * 7, TILE * 3, TEX.Whiteboard)
        .setDepth(Z.Walls)
        .setOrigin(0, 0);
    }

    // quiz NPCs at three tiers
    this.addNPC({
      id: "quiz_easy",
      label: "Junior Tier",
      appearance: ASSISTANT,
      x: TILE * 12,
      y: cy + TILE * 4,
      facing: "down",
      onInteract: () => this.openQuiz("easy"),
    });
    this.addNPC({
      id: "quiz_medium",
      label: "Mid Tier",
      appearance: SCIENTIST,
      x: worldW / 2,
      y: cy + TILE * 4,
      facing: "down",
      onInteract: () => this.openQuiz("medium"),
    });
    this.addNPC({
      id: "quiz_hard",
      label: "Staff Tier",
      appearance: SCIENTIST,
      x: worldW - TILE * 12,
      y: cy + TILE * 4,
      facing: "down",
      onInteract: () => this.openQuiz("hard"),
    });

    // workbench row of monitors south of the carpet — visible from default
    // spawn, gives the room a clear "lab floor" foreground
    for (let i = 0; i < 8; i += 1) {
      this.addDecor(TEX.Monitor, TILE * 4 + i * TILE * 4, cy + TILE * 5, { anchorY: 0.85 });
    }
    // crates of "training data" along both side walls
    for (let i = 0; i < 4; i += 1) {
      this.addSolidDecor(TEX.Crate, TILE * 2, TILE * 6 + i * TILE * 2, 28, 8);
      this.addSolidDecor(TEX.Crate, worldW - TILE * 3, TILE * 6 + i * TILE * 2, 28, 8);
    }

    this.spawnStaticChests();

    // warp back to town (left edge)
    this.addWarp({
      x: 0,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Town,
      toSpawn: "from_ailab",
      facing: "left",
    });
  }

  private openQuiz(tier: QuizTier): void {
    if (this.scene.isActive(SCENES.QuizUI)) return;
    this.scene.launch(SCENES.QuizUI, { tier });
    this.game.events.emit(EVENTS.MinigameStart);
  }
}
