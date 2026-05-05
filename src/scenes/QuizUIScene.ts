import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import {
  QUIZ,
  TIER_LABEL,
  TIER_REWARD,
  type QuizQuestion,
  type QuizTier,
} from "../data/quiz";
import { SaveManager } from "../systems/SaveManager";

interface QuizInit {
  tier: QuizTier;
}

const ROUND_SIZE = 3;

export class QuizUIScene extends Phaser.Scene {
  private tier: QuizTier = "easy";
  private pool: QuizQuestion[] = [];
  private idx = 0;
  private correctCount = 0;
  private state: "question" | "feedback" | "summary" | "closing" = "question";
  private headerText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  private feedbackText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.QuizUI });
  }

  create(data: QuizInit): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;
    this.tier = data.tier;
    this.idx = 0;
    this.correctCount = 0;
    this.pool = drawQuiz(this.tier, ROUND_SIZE);
    this.state = "question";

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.95)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.headerText = this.add
      .text(12, 12, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9ad7ff",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.promptText = this.add
      .text(12, 36, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#e6e8ee",
        wordWrap: { width: w - 24 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    for (let i = 0; i < 4; i += 1) {
      const t = this.add
        .text(20, 90 + i * 24, "", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#bcc4d4",
          wordWrap: { width: w - 40 },
        })
        .setScrollFactor(0)
        .setDepth(Z.HUDFront);
      this.optionTexts.push(t);
    }

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
      .text(w / 2, h - 14, "", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.renderQuestion();

    const kb = this.input.keyboard!;
    for (const k of ["ONE", "TWO", "THREE", "FOUR"] as const) {
      kb.on(`keydown-${k}`, () => this.choose(["ONE", "TWO", "THREE", "FOUR"].indexOf(k)));
    }
    kb.on("keydown-E", () => this.advance());
    kb.on("keydown-SPACE", () => this.advance());
    kb.on("keydown-ENTER", () => this.advance());
    kb.on("keydown-ESC", () => this.exit(false));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.optionTexts = [];
    });
  }

  private currentQ(): QuizQuestion | null {
    return this.pool[this.idx] ?? null;
  }

  private renderQuestion(): void {
    const q = this.currentQ();
    if (!q) return this.renderSummary();
    this.headerText.setText(`${TIER_LABEL[this.tier]}   ${this.idx + 1}/${this.pool.length}   reward ${TIER_REWARD[this.tier]}◆/q`);
    this.promptText.setText(q.prompt);
    q.options.forEach((opt, i) => {
      this.optionTexts[i].setText(`${i + 1}) ${opt}`);
      this.optionTexts[i].setColor("#bcc4d4");
      this.optionTexts[i].setVisible(true);
    });
    for (let i = q.options.length; i < this.optionTexts.length; i += 1) {
      this.optionTexts[i].setVisible(false);
    }
    this.feedbackText.setText("");
    this.hintText.setText("press 1–4 to answer    [Esc] leave");
    this.state = "question";
  }

  private choose(idx: number): void {
    if (this.state !== "question") return;
    const q = this.currentQ();
    if (!q || idx >= q.options.length) return;
    const correct = idx === q.correctIndex;
    this.optionTexts.forEach((t, i) => {
      if (i === q.correctIndex) t.setColor("#7fdca0");
      else if (i === idx) t.setColor("#ff7a7a");
    });
    if (correct) {
      this.correctCount += 1;
      this.feedbackText.setColor("#7fdca0");
      this.feedbackText.setText(`Correct. ${q.explanation}`);
    } else {
      this.feedbackText.setColor("#ff7a7a");
      this.feedbackText.setText(`Wrong. ${q.explanation}`);
    }
    this.hintText.setText("[E / Enter] next");
    this.state = "feedback";
  }

  private advance(): void {
    if (this.state === "feedback") {
      this.idx += 1;
      if (this.idx >= this.pool.length) {
        this.renderSummary();
      } else {
        this.renderQuestion();
      }
    } else if (this.state === "summary") {
      this.exit(true);
    }
  }

  private renderSummary(): void {
    this.state = "summary";
    const reward = this.correctCount * TIER_REWARD[this.tier];
    const save = SaveManager.load();
    const next = SaveManager.save({
      credits: save.credits + reward,
      stats: {
        ...save.stats,
        quizCorrect: save.stats.quizCorrect + this.correctCount,
        quizTotal: save.stats.quizTotal + this.pool.length,
      },
    });
    this.game.events.emit(EVENTS.CreditsChanged);
    if (reward > 0) {
      this.game.events.emit(EVENTS.ToastShow, {
        text: `Quiz reward  +${reward}◆`,
        color: "#7fdca0",
        durationMs: 1800,
      });
    }
    this.headerText.setText(`Result — ${TIER_LABEL[this.tier]}`);
    this.promptText.setText(`${this.correctCount}/${this.pool.length} correct  •  +${reward}◆  •  balance ${next.credits}◆`);
    this.optionTexts.forEach((t) => t.setVisible(false));
    this.feedbackText.setColor("#bcc4d4");
    this.feedbackText.setText(
      this.correctCount === this.pool.length
        ? "Flawless. Should we get you on the interview loop?"
        : this.correctCount === 0
        ? "Rough. Try the easier tier; the staff tier is rough on everyone."
        : "Solid. Run it back any time for more credits.",
    );
    this.hintText.setText("[E] leave");
  }

  private exit(clean: boolean): void {
    if (this.state === "closing") return;
    this.state = "closing";
    this.game.events.emit(EVENTS.MinigameEnd);
    void clean;
    this.scene.stop();
  }
}

function drawQuiz(tier: QuizTier, count: number): QuizQuestion[] {
  const pool = QUIZ.filter((q) => q.tier === tier);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
