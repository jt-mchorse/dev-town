import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { DEBUG_REWARD, rollDebug, type DebugChallenge } from "../data/debug";
import { SaveManager } from "../systems/SaveManager";

type Phase = "selecting" | "result" | "closing";

export class DebugUIScene extends Phaser.Scene {
  private challenge!: DebugChallenge;
  private cursor = 0;
  private phase: Phase = "selecting";
  private promptText!: Phaser.GameObjects.Text;
  private lineTexts: Phaser.GameObjects.Text[] = [];
  private feedbackText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.DebugUI });
  }

  create(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.95)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.add
      .text(12, 12, "Spot the Bug", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9ad7ff",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.promptText = this.add
      .text(12, 32, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#bcc4d4",
        wordWrap: { width: w - 24 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.feedbackText = this.add
      .text(12, h - 56, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#7e859a",
        wordWrap: { width: w - 24 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.hintText = this.add
      .text(w / 2, h - 14, "W/S pick line   E confirm   N new puzzle   [Esc] leave", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.loadChallenge();

    const kb = this.input.keyboard!;
    kb.on("keydown-UP", () => this.move(-1));
    kb.on("keydown-W", () => this.move(-1));
    kb.on("keydown-DOWN", () => this.move(1));
    kb.on("keydown-S", () => this.move(1));
    kb.on("keydown-E", () => this.confirm());
    kb.on("keydown-ENTER", () => this.confirm());
    kb.on("keydown-N", () => {
      if (this.phase === "result") this.loadChallenge();
    });
    kb.on("keydown-ESC", () => this.exit());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.lineTexts.forEach((t) => t.destroy());
      this.lineTexts = [];
    });
  }

  private loadChallenge(): void {
    this.challenge = rollDebug();
    this.cursor = 0;
    this.phase = "selecting";
    this.lineTexts.forEach((t) => t.destroy());
    this.lineTexts = [];
    this.promptText.setText(`[${this.challenge.language}]  ${this.challenge.prompt}`);
    this.feedbackText.setText("");
    const startY = 60;
    this.challenge.lines.forEach((line, i) => {
      const t = this.add
        .text(20, startY + i * 14, `${String(i + 1).padStart(2, " ")}  ${line}`, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#bcc4d4",
        })
        .setScrollFactor(0)
        .setDepth(Z.HUDFront);
      this.lineTexts.push(t);
    });
    this.refreshCursor();
    this.hintText.setText("W/S pick line   E confirm   [Esc] leave");
  }

  private move(dir: 1 | -1): void {
    if (this.phase !== "selecting") return;
    const n = this.challenge.lines.length;
    this.cursor = (this.cursor + dir + n) % n;
    this.refreshCursor();
  }

  private refreshCursor(): void {
    this.lineTexts.forEach((t, i) => {
      if (i === this.cursor) {
        t.setBackgroundColor("#1a2230");
        t.setColor("#ffd479");
      } else {
        t.setBackgroundColor("");
        t.setColor("#bcc4d4");
      }
    });
  }

  private confirm(): void {
    if (this.phase !== "selecting") return;
    const correct = this.cursor === this.challenge.buggyLineIndex;
    this.lineTexts.forEach((t, i) => {
      if (i === this.challenge.buggyLineIndex) {
        t.setBackgroundColor("#1f3a24");
        t.setColor("#7fdca0");
      } else if (i === this.cursor && !correct) {
        t.setBackgroundColor("#3a1f24");
        t.setColor("#ff9aa3");
      } else {
        t.setBackgroundColor("");
        t.setColor("#7e859a");
      }
    });
    if (correct) {
      const save = SaveManager.load();
      const next = SaveManager.save({
        credits: save.credits + DEBUG_REWARD,
        stats: { ...save.stats, debugSolved: save.stats.debugSolved + 1 },
      });
      this.game.events.emit(EVENTS.CreditsChanged);
      this.game.events.emit(EVENTS.ToastShow, {
        text: `Bug squashed  +${DEBUG_REWARD}◆`,
        color: "#7fdca0",
        durationMs: 1600,
      });
      this.feedbackText.setColor("#7fdca0");
      this.feedbackText.setText(`Correct. ${this.challenge.explanation}\n+${DEBUG_REWARD}◆  •  balance ${next.credits}◆`);
    } else {
      this.feedbackText.setColor("#ff9aa3");
      this.feedbackText.setText(`Not quite. ${this.challenge.explanation}`);
    }
    this.phase = "result";
    this.hintText.setText("[N] new puzzle   [Esc] leave");
  }

  private exit(): void {
    if (this.phase === "closing") return;
    this.phase = "closing";
    this.game.events.emit(EVENTS.MinigameEnd);
    this.scene.stop();
  }
}
