import Phaser from "phaser";
import { GAME_CONFIG, SCENES, Z } from "../config";
import { LPCCharacter, registerWalkAnims } from "../entities/LPCCharacter";
import { SaveManager } from "../systems/SaveManager";
import { IntroUIScene } from "./IntroUIScene";

export class TitleScene extends Phaser.Scene {
  private demoChars: LPCCharacter[] = [];
  private hintIdx = 0;
  private hintText!: Phaser.GameObjects.Text;
  private cycleTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: SCENES.Title });
  }

  create(): void {
    registerWalkAnims(this);
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add.rectangle(0, 0, w, h, 0x0b0d12).setOrigin(0).setDepth(-1);

    this.add
      .text(w / 2, h / 2 - 60, "/dev/town", {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h / 2 - 30, "an interactive engineering portfolio", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#7e859a",
      })
      .setOrigin(0.5);

    const save = SaveManager.load();
    const hasSave = save.hasCharacter;

    const startLabel = hasSave ? "[Enter] continue" : "[Enter] new game";
    const startText = this.add
      .text(w / 2, h / 2 + 30, startLabel, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e6e8ee",
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: startText, alpha: 0.55, yoyo: true, repeat: -1, duration: 700 });

    const lines: string[] = [];
    if (hasSave) {
      lines.push(`progress  ${save.credits}◆  •  fish ${save.fishCaught.length}  •  chests ${save.openedChests.length}`);
      lines.push("[N] new game (clears save)   [S] settings");
    } else {
      lines.push("a tiny MMO-shaped portfolio. WASD to move, E to interact.");
      lines.push("[S] settings");
    }
    this.add
      .text(w / 2, h / 2 + 56, lines.join("\n"), {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
        align: "center",
      })
      .setOrigin(0.5);

    this.hintText = this.add
      .text(w / 2, h - 14, "", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#5c6275",
      })
      .setOrigin(0.5, 1)
      .setDepth(Z.HUDFront);
    this.cycleHint();
    this.cycleTimer = this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => this.cycleHint(),
    });

    this.spawnDemoCharacter(w / 2 - 80, h / 2 + 110, save.appearance.gender);
    this.spawnDemoCharacter(w / 2 + 80, h / 2 + 110, save.appearance.gender === "male" ? "female" : "male");

    const kb = this.input.keyboard!;
    kb.on("keydown-ENTER", () => this.start());
    kb.on("keydown-SPACE", () => this.start());
    kb.on("keydown-S", () => this.scene.launch(SCENES.SettingsUI, { from: SCENES.Title }));
    kb.on("keydown-N", () => {
      if (!hasSave) return;
      SaveManager.reset();
      this.scene.restart();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cycleTimer?.remove();
      this.demoChars.forEach((c) => c.destroy());
      this.demoChars = [];
    });
  }

  private cycleHint(): void {
    const tips = [
      "tip: cosmetics in the town shop are pure flair, never gated",
      "tip: fish at the dock for the Null Pointer (rare)",
      "tip: AI/ML lab quizzes pay scaling tiers — staff tier hurts",
      "tip: spot-the-bug rewards land instantly; typing rewards scale with cps × accuracy",
      "tip: a Daily Secret chest hides somewhere new every 24h",
    ];
    this.hintText.setText(tips[this.hintIdx % tips.length]);
    this.hintIdx += 1;
  }

  private spawnDemoCharacter(x: number, y: number, gender: "male" | "female"): void {
    const c = new LPCCharacter(this, x, y, {
      gender,
      bodyTone: "light",
      shirt: { cosmeticId: gender === "male" ? "shirt_navy" : "shirt_red" },
      pants: { cosmeticId: "pants_charcoal" },
      shoes: { cosmeticId: "shoes_brown" },
      hair: { cosmeticId: gender === "male" ? "hair_buzzcut_ginger" : "hair_bob_blonde" },
      hat: { cosmeticId: null },
    });
    c.faceDirection("down");
    this.tweens.add({
      targets: c.container,
      y: y - 2,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.demoChars.push(c);
  }

  private start(): void {
    // First-launch onboarding: show the intro overlay before falling through
    // to the rest of the boot flow. The intro flips its own save flag on
    // dismiss, so the second start() call sails past this branch.
    if (IntroUIScene.shouldShow()) {
      this.scene.launch(SCENES.IntroUI);
      this.scene.get(SCENES.IntroUI).events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.start();
      });
      return;
    }

    const save = SaveManager.load();
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      if (save.hasCharacter) {
        this.scene.start(save.player.scene || SCENES.Town);
        this.scene.launch(SCENES.UI);
      } else {
        this.scene.start(SCENES.CharCreate);
      }
    });
  }
}
