import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { SaveManager } from "../systems/SaveManager";

interface SettingsInit {
  from?: string;
}

export class SettingsUIScene extends Phaser.Scene {
  private confirming = false;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.SettingsUI });
  }

  create(data: SettingsInit): void {
    void data;
    this.confirming = false;

    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.95)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.add
      .text(w / 2, 18, "Settings", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const save = SaveManager.load();
    const stats = [
      `credits           ${save.credits}◆`,
      `cosmetics owned   ${save.ownedCosmetics.length}`,
      `fish caught       ${save.fishCaught.length}`,
      `chests opened     ${save.openedChests.length}`,
      `quiz score        ${save.stats.quizCorrect}/${save.stats.quizTotal}`,
      `typing best       ${save.stats.typingBest}◆`,
      `bugs solved       ${save.stats.debugSolved}`,
    ].join("\n");
    this.add
      .text(w / 2, 50, stats, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#bcc4d4",
        align: "left",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.add
      .text(w / 2, 168, "art: LPC + community contributors (CC-BY-SA 3.0 / GPL3+)\nsee public/assets/lpc/ATTRIBUTION.md", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.statusText = this.add
      .text(
        w / 2,
        h - 60,
        "[T] view trinkets   [R] reset save   [Esc] close",
        {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#bcc4d4",
          align: "center",
        },
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const kb = this.input.keyboard!;
    kb.on("keydown-R", () => this.tryReset());
    kb.on("keydown-Y", () => this.confirmReset());
    kb.on("keydown-T", () => this.scene.launch(SCENES.TrinketsUI));
    kb.on("keydown-ESC", () => this.exit());
  }

  private tryReset(): void {
    if (this.confirming) return;
    this.confirming = true;
    this.statusText.setColor("#ff9aa3");
    this.statusText.setText("clear all progress? [Y] confirm   [Esc] cancel");
  }

  private confirmReset(): void {
    if (!this.confirming) return;
    SaveManager.reset();
    this.game.events.emit(EVENTS.CreditsChanged);
    this.statusText.setColor("#7fdca0");
    this.statusText.setText("save cleared. relaunching…");
    this.time.delayedCall(700, () => {
      window.location.reload();
    });
  }

  private exit(): void {
    this.scene.stop();
  }
}
