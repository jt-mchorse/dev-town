import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { rewardForTyping, rollSnippet, type TypingSnippet } from "../data/typing";
import { SaveManager } from "../systems/SaveManager";

type Phase = "ready" | "typing" | "result" | "closing";

const SHIFT_KEYS: Record<string, string> = {
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  ",": "<",
  ".": ">",
  "/": "?",
  ";": ":",
  "'": '"',
  "[": "{",
  "]": "}",
  "\\": "|",
  "`": "~",
  "-": "_",
  "=": "+",
};

export class TypingUIScene extends Phaser.Scene {
  private phase: Phase = "ready";
  private snippet!: TypingSnippet;
  private typed = "";
  private errors = 0;
  private startedAt = 0;
  private headerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.TypingUI });
  }

  create(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;
    this.snippet = rollSnippet();
    this.typed = "";
    this.errors = 0;
    this.startedAt = 0;
    this.phase = "ready";

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.95)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.headerText = this.add
      .text(12, 12, "Typing Trial", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9ad7ff",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.add
      .text(12, 28, this.snippet.hint, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.targetText = this.add
      .text(12, 64, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        wordWrap: { width: w - 24 },
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.statsText = this.add
      .text(12, h - 56, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#bcc4d4",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.resultText = this.add
      .text(12, h - 38, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#7fdca0",
        wordWrap: { width: w - 24 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.hintText = this.add
      .text(w / 2, h - 14, "type to begin   [Backspace] correct   [Esc] leave", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.renderTarget();
    this.renderStats();

    this.input.keyboard!.on("keydown", this.onKey, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown", this.onKey, this);
    });
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.phase === "closing") return;
    if (ev.key === "Escape") {
      this.exit();
      return;
    }
    if (this.phase === "result") {
      if (ev.key === "Enter" || ev.key === "e" || ev.key === "E") {
        this.snippet = rollSnippet();
        this.typed = "";
        this.errors = 0;
        this.startedAt = 0;
        this.phase = "ready";
        this.headerText.setText("Typing Trial");
        this.resultText.setText("");
        this.renderTarget();
        this.renderStats();
        this.hintText.setText("type to begin   [Backspace] correct   [Esc] leave");
      }
      return;
    }

    if (ev.key === "Backspace") {
      ev.preventDefault();
      if (this.typed.length > 0) this.typed = this.typed.slice(0, -1);
      this.renderTarget();
      this.renderStats();
      return;
    }

    const ch = mapKey(ev);
    if (!ch) return;
    if (this.phase === "ready") {
      this.phase = "typing";
      this.startedAt = this.time.now;
    }
    const expected = this.snippet.text[this.typed.length];
    if (expected === undefined) return;
    if (ch !== expected) {
      this.errors += 1;
    }
    this.typed += ch;
    this.renderTarget();
    this.renderStats();
    if (this.typed.length >= this.snippet.text.length) {
      this.finish();
    }
  }

  private renderTarget(): void {
    const target = this.snippet.text;
    const typed = this.typed;
    let plain = "";
    for (let i = 0; i < target.length; i += 1) {
      if (i === typed.length) plain += "▌";
      plain += target[i];
    }
    if (typed.length >= target.length) plain += "▌";
    this.targetText.setText(plain);
    const hasError = typed
      .split("")
      .some((c, i) => target[i] !== undefined && c !== target[i]);
    this.targetText.setColor(hasError ? "#ff9aa3" : "#e6e8ee");
  }

  private renderStats(): void {
    const len = this.snippet.text.length;
    const elapsed = this.startedAt ? Math.max(this.time.now - this.startedAt, 1) : 0;
    const cps = elapsed > 0 ? this.typed.length / (elapsed / 1000) : 0;
    const acc = this.typed.length === 0 ? 100 : Math.max(0, ((this.typed.length - this.errors) / this.typed.length) * 100);
    this.statsText.setText(
      `progress ${this.typed.length}/${len}   errors ${this.errors}   ${cps.toFixed(1)} cps   ${acc.toFixed(0)}% acc`,
    );
  }

  private finish(): void {
    this.phase = "result";
    const duration = this.time.now - this.startedAt;
    const reward = rewardForTyping(duration, this.errors, this.snippet.text.length);
    const save = SaveManager.load();
    const next = SaveManager.save({
      credits: save.credits + reward,
      stats: {
        ...save.stats,
        typingBest: Math.max(save.stats.typingBest, reward),
      },
    });
    this.game.events.emit(EVENTS.CreditsChanged);
    if (reward > 0) {
      this.game.events.emit(EVENTS.ToastShow, {
        text: `Typing reward  +${reward}◆`,
        color: "#9ad7ff",
        durationMs: 1800,
      });
    }
    this.headerText.setText("Typing Trial — done");
    this.resultText.setColor(reward >= save.stats.typingBest ? "#ffd479" : "#7fdca0");
    this.resultText.setText(
      `+${reward}◆  •  balance ${next.credits}◆  •  best ${next.stats.typingBest}◆\n[E] try a new snippet   [Esc] leave`,
    );
    this.hintText.setText("");
  }

  private exit(): void {
    if (this.phase === "closing") return;
    this.phase = "closing";
    this.game.events.emit(EVENTS.MinigameEnd);
    this.scene.stop();
  }
}

function mapKey(ev: KeyboardEvent): string | null {
  if (ev.key === "Enter" || ev.key === "Tab") return null;
  if (ev.key.length === 1) {
    if (ev.shiftKey) {
      if (/[a-z]/.test(ev.key)) return ev.key.toUpperCase();
      return SHIFT_KEYS[ev.key] ?? ev.key;
    }
    return ev.key;
  }
  return null;
}

