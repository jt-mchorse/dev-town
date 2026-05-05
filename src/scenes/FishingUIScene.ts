import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { rollFish, RARITY_COLOR, type FishSpec } from "../data/fishing";
import { SaveManager } from "../systems/SaveManager";

type Phase = "casting" | "waiting" | "bite" | "result" | "closing";

export class FishingUIScene extends Phaser.Scene {
  private phase: Phase = "casting";
  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private flavorText!: Phaser.GameObjects.Text;
  private timer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: SCENES.FishingUI });
  }

  create(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add
      .rectangle(0, h - 80, w, 80, 0x0b0d12, 0.9)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.add
      .text(w / 2, h - 70, "Fishing", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.statusText = this.add
      .text(w / 2, h - 52, "Casting…", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e6e8ee",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.flavorText = this.add
      .text(w / 2, h - 32, "", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
        wordWrap: { width: w - 40 },
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.hintText = this.add
      .text(w / 2, h - 14, "watching the bobber…   [Esc] leave", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#5c6275",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const kb = this.input.keyboard!;
    kb.on("keydown-E", () => this.onPress());
    kb.on("keydown-SPACE", () => this.onPress());
    kb.on("keydown-ENTER", () => this.onPress());
    kb.on("keydown-ESC", () => this.exit());

    this.startCast();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.timer?.remove();
    });
  }

  private startCast(): void {
    this.phase = "casting";
    this.statusText.setColor("#e6e8ee");
    this.statusText.setText("Casting…");
    this.flavorText.setText("");
    this.hintText.setText("watching the bobber…   [Esc] leave");
    this.timer?.remove();
    this.timer = this.time.delayedCall(450, () => this.beginWaiting());
  }

  private beginWaiting(): void {
    this.phase = "waiting";
    this.statusText.setText("…  …  …");
    const wait = 900 + Math.random() * 2400;
    this.timer = this.time.delayedCall(wait, () => this.beginBite());
  }

  private beginBite(): void {
    this.phase = "bite";
    this.statusText.setColor("#ffd479");
    this.statusText.setText("!! BITE !!  press E");
    this.hintText.setText("hit E now    [Esc] leave");
    this.timer = this.time.delayedCall(700, () =>
      this.miss("Too slow. The fish chose violence (and left)."),
    );
  }

  private onPress(): void {
    if (this.phase === "result") {
      this.startCast();
      return;
    }
    if (this.phase === "waiting") {
      this.miss("Cast snagged early. The bobber thinks you're impatient.");
      return;
    }
    if (this.phase === "bite") {
      this.timer?.remove();
      this.land();
    }
  }

  private miss(reason: string): void {
    this.phase = "result";
    this.statusText.setColor("#ff7a7a");
    this.statusText.setText(reason);
    this.flavorText.setText("");
    this.hintText.setText("[E] cast again    [Esc] leave");
  }

  private land(): void {
    this.phase = "result";
    const fish = rollFish();
    const save = SaveManager.load();
    const updatedFish = save.fishCaught.includes(fish.id)
      ? save.fishCaught
      : [...save.fishCaught, fish.id];
    const next = SaveManager.save({
      credits: save.credits + fish.reward,
      fishCaught: updatedFish,
    });
    this.game.events.emit(EVENTS.CreditsChanged);
    this.game.events.emit(EVENTS.ToastShow, {
      text: `Caught ${fish.name}  +${fish.reward}◆`,
      color: RARITY_COLOR[fish.rarity],
      durationMs: 1800,
    });
    this.statusText.setColor(RARITY_COLOR[fish.rarity]);
    this.statusText.setText(`Caught: ${fish.name}  +${fish.reward}◆  (now ${next.credits}◆)`);
    this.flavorText.setText(`${RARITY_LABEL[fish.rarity]} • ${fish.flavor}`);
    this.hintText.setText("[E] cast again    [Esc] leave");
  }

  private exit(): void {
    if (this.phase === "closing") return;
    this.phase = "closing";
    this.timer?.remove();
    this.game.events.emit(EVENTS.FishingEnd);
    this.scene.stop();
  }
}

const RARITY_LABEL: Record<FishSpec["rarity"], string> = {
  common: "common",
  uncommon: "uncommon",
  rare: "RARE",
  legendary: "LEGENDARY",
};
