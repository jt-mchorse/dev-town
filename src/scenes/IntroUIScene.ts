import Phaser from "phaser";
import { GAME_CONFIG, SCENES, Z } from "../config";
import { SaveManager } from "../systems/SaveManager";

const INTRO_FLAG = "hasSeenIntro";

/**
 * First-launch onboarding overlay — explains what this thing is, where to
 * look, and that the world is data-driven. Sets a save flag on dismiss so
 * it never shows again unless the player resets.
 *
 * Trigger pattern: TitleScene launches this if `save.flags.hasSeenIntro`
 * is unset. Existing players never see it.
 */
export class IntroUIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.IntroUI });
  }

  static shouldShow(): boolean {
    return !SaveManager.load().flags[INTRO_FLAG];
  }

  create(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.96)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.add
      .text(w / 2, 18, "/dev/town", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.add
      .text(w / 2, 44, "an interactive engineering portfolio", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#bcc4d4",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const body = [
      "Walk this small world to learn who I am as an engineer.",
      "",
      "  WASD / arrows  move",
      "  E             talk to anyone, open chests, cast a line",
      "  Esc           leave any mini-game",
      "",
      "Six zones to find:",
      "",
      "  Engineering District   work history per foreman",
      "  Skill Grove            skill totems + the project archive",
      "  AI/ML Lab              tiered FAQ quizzes",
      "  Full-Stack Dungeon     typing + spot-the-bug",
      "  Fishing Dock           credits via tech-pun fish",
      "  Town Square            shop, news, daily-secret chest",
      "",
      "All portfolio content is data-driven from src/data/portfolio.ts —",
      "if anything looks stale, that's the one file to edit.",
    ].join("\n");

    this.add
      .text(w / 2, 70, body, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#e6e8ee",
        align: "left",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.add
      .text(w / 2, h - 18, "[Enter] start playing   •   [Esc] skip", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffd479",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const kb = this.input.keyboard!;
    kb.on("keydown-ENTER", () => this.dismiss());
    kb.on("keydown-SPACE", () => this.dismiss());
    kb.on("keydown-ESC", () => this.dismiss());
  }

  private dismiss(): void {
    const save = SaveManager.load();
    SaveManager.save({ flags: { ...save.flags, [INTRO_FLAG]: true } });
    this.scene.stop();
  }
}
