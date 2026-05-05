import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { DialogManager } from "../systems/DialogManager";
import { SaveManager } from "../systems/SaveManager";
import type { DialogRequest, ToastRequest } from "../types";

const BOX_PAD = 6;
const BOX_HEIGHT = 64;
const BOX_MARGIN = 8;

export class UIScene extends Phaser.Scene {
  private boxBg!: Phaser.GameObjects.Rectangle;
  private boxBorder!: Phaser.GameObjects.Rectangle;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private creditsText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastBg!: Phaser.GameObjects.Rectangle;
  private toastTimer?: Phaser.Time.TimerEvent;
  private current: DialogRequest | null = null;
  private cursor = 0;

  constructor() {
    super({ key: SCENES.UI });
  }

  create(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.boxBorder = this.add
      .rectangle(BOX_MARGIN, h - BOX_HEIGHT - BOX_MARGIN, w - BOX_MARGIN * 2, BOX_HEIGHT, 0xe6e8ee)
      .setOrigin(0, 0)
      .setDepth(Z.HUD)
      .setScrollFactor(0);
    this.boxBg = this.add
      .rectangle(
        BOX_MARGIN + 1,
        h - BOX_HEIGHT - BOX_MARGIN + 1,
        w - BOX_MARGIN * 2 - 2,
        BOX_HEIGHT - 2,
        0x10141c,
      )
      .setOrigin(0, 0)
      .setDepth(Z.HUD + 1)
      .setScrollFactor(0);

    this.speakerText = this.add
      .text(BOX_MARGIN + BOX_PAD, h - BOX_HEIGHT - BOX_MARGIN + BOX_PAD, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9ad7ff",
      })
      .setDepth(Z.HUDFront)
      .setScrollFactor(0);

    this.bodyText = this.add
      .text(BOX_MARGIN + BOX_PAD, h - BOX_HEIGHT - BOX_MARGIN + BOX_PAD + 12, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#e6e8ee",
        wordWrap: { width: w - BOX_MARGIN * 2 - BOX_PAD * 2 },
      })
      .setDepth(Z.HUDFront)
      .setScrollFactor(0);

    this.hintText = this.add
      .text(w - BOX_MARGIN - BOX_PAD, h - BOX_MARGIN - BOX_PAD - 4, "[space]", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7e859a",
      })
      .setOrigin(1, 1)
      .setDepth(Z.HUDFront)
      .setScrollFactor(0);

    this.creditsText = this.add
      .text(w - BOX_MARGIN, BOX_MARGIN, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffd479",
        backgroundColor: "#0b0d12cc",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 0)
      .setDepth(Z.HUDFront)
      .setScrollFactor(0);

    this.toastBg = this.add
      .rectangle(w / 2, 36, 200, 18, 0x10141c, 0.95)
      .setOrigin(0.5, 0)
      .setDepth(Z.HUDFront)
      .setScrollFactor(0)
      .setVisible(false);
    this.toastText = this.add
      .text(w / 2, 38, "", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#e6e8ee",
      })
      .setOrigin(0.5, 0)
      .setDepth(Z.HUDFront + 1)
      .setScrollFactor(0)
      .setVisible(false);

    this.setBoxVisible(false);
    this.refreshCredits();

    DialogManager.on(EVENTS.DialogShow, this.onShow, this);
    DialogManager.on(EVENTS.DialogAdvance, this.advance, this);
    DialogManager.on(EVENTS.DialogClose, this.closeBox, this);
    this.game.events.on(EVENTS.CreditsChanged, this.refreshCredits, this);
    this.game.events.on(EVENTS.ToastShow, this.onToast, this);

    const kb = this.input.keyboard;
    if (kb) {
      kb.on("keydown-SPACE", () => this.current && this.advance());
      kb.on("keydown-ENTER", () => this.current && this.advance());
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      DialogManager.off(EVENTS.DialogShow, this.onShow, this);
      DialogManager.off(EVENTS.DialogAdvance, this.advance, this);
      DialogManager.off(EVENTS.DialogClose, this.closeBox, this);
      this.game.events.off(EVENTS.CreditsChanged, this.refreshCredits, this);
      this.game.events.off(EVENTS.ToastShow, this.onToast, this);
    });
  }

  private setBoxVisible(v: boolean): void {
    this.boxBg.setVisible(v);
    this.boxBorder.setVisible(v);
    this.speakerText.setVisible(v);
    this.bodyText.setVisible(v);
    this.hintText.setVisible(v);
  }

  private onShow(req: DialogRequest): void {
    this.current = req;
    this.cursor = 0;
    this.render();
    this.setBoxVisible(true);
  }

  private advance(): void {
    if (!this.current) return;
    this.cursor += 1;
    if (this.cursor >= this.current.lines.length) {
      DialogManager.close();
      return;
    }
    this.render();
  }

  private render(): void {
    if (!this.current) return;
    const line = this.current.lines[this.cursor];
    this.speakerText.setText(line.speaker ?? "");
    this.bodyText.setText(line.text);
    if (line.color) this.bodyText.setColor(line.color);
    else this.bodyText.setColor("#e6e8ee");
  }

  private closeBox(): void {
    const cb = this.current?.onClose;
    this.current = null;
    this.setBoxVisible(false);
    cb?.();
  }

  private refreshCredits(): void {
    const { credits } = SaveManager.load();
    this.creditsText.setText(`◆ ${credits}`);
  }

  private onToast(req: ToastRequest): void {
    this.toastTimer?.remove();
    this.toastText.setText(req.text);
    if (req.color) this.toastText.setColor(req.color);
    else this.toastText.setColor("#e6e8ee");
    const w = Math.max(180, this.toastText.width + 24);
    this.toastBg.setSize(w, 18);
    this.toastBg.setVisible(true);
    this.toastText.setVisible(true);
    const dur = req.durationMs ?? 1500;
    this.toastTimer = this.time.delayedCall(dur, () => {
      this.toastBg.setVisible(false);
      this.toastText.setVisible(false);
    });
  }
}
