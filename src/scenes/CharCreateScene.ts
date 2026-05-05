import Phaser from "phaser";
import { GAME_CONFIG, SCENES } from "../config";
import { LPCCharacter, registerWalkAnims } from "../entities/LPCCharacter";
import { startersFor } from "../data/cosmetics";
import { SaveManager } from "../systems/SaveManager";
import type { Appearance, Gender } from "../types";

export class CharCreateScene extends Phaser.Scene {
  private preview!: LPCCharacter;
  private gender: Gender = "male";
  private genderText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENES.CharCreate });
  }

  create(): void {
    registerWalkAnims(this);
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add.rectangle(0, 0, w, h, 0x0b0d12).setOrigin(0).setDepth(-1);
    this.add.text(w / 2, 24, "/dev/town", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#9ad7ff",
    }).setOrigin(0.5);
    this.add.text(w / 2, 44, "Character creation", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#bcc4d4",
    }).setOrigin(0.5);

    const appearance = this.buildAppearance(this.gender);
    this.preview = new LPCCharacter(this, w / 2, h / 2 + 8, appearance);
    this.preview.faceDirection("down");

    this.genderText = this.add.text(w / 2, h - 90, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#e6e8ee",
    }).setOrigin(0.5);
    this.refreshGenderText();

    this.add.text(w / 2, h - 60, "A / D switch     W / S rotate     Enter to begin", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#7e859a",
    }).setOrigin(0.5);

    this.hint = this.add.text(w / 2, h - 30, "tip: cosmetics unlock at the shop after Phase 3 lands", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#5c6275",
    }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on("keydown-LEFT", () => this.cycleGender(-1));
    kb.on("keydown-A", () => this.cycleGender(-1));
    kb.on("keydown-RIGHT", () => this.cycleGender(1));
    kb.on("keydown-D", () => this.cycleGender(1));
    kb.on("keydown-UP", () => this.rotatePreview(-1));
    kb.on("keydown-W", () => this.rotatePreview(-1));
    kb.on("keydown-DOWN", () => this.rotatePreview(1));
    kb.on("keydown-S", () => this.rotatePreview(1));
    kb.on("keydown-ENTER", () => this.confirm());
    kb.on("keydown-SPACE", () => this.confirm());

    this.tweens.add({
      targets: this.preview.container,
      y: this.preview.container.y - 2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private cycleGender(dir: 1 | -1): void {
    void dir;
    this.gender = this.gender === "male" ? "female" : "male";
    this.preview.setAppearance(this.buildAppearance(this.gender));
    this.refreshGenderText();
    this.flash();
  }

  private rotatePreview(dir: 1 | -1): void {
    const order = ["down", "left", "up", "right"] as const;
    const cur = this.preview.facing;
    const idx = order.indexOf(cur);
    const next = order[(idx + (dir === 1 ? 1 : 3)) % 4];
    this.preview.faceDirection(next);
  }

  private refreshGenderText(): void {
    this.genderText.setText(`< ${this.gender.toUpperCase()} >`);
  }

  private flash(): void {
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;
    const flashRect = this.add.rectangle(0, 0, w, h, 0xffffff, 0.18).setOrigin(0).setDepth(100);
    this.tweens.add({
      targets: flashRect,
      alpha: 0,
      duration: 180,
      onComplete: () => flashRect.destroy(),
    });
  }

  private buildAppearance(gender: Gender): Appearance {
    const isMale = gender === "male";
    return {
      gender,
      bodyTone: "light",
      shirt: { cosmeticId: isMale ? "shirt_navy" : "shirt_red" },
      pants: { cosmeticId: isMale ? "pants_charcoal" : "pants_brown" },
      shoes: { cosmeticId: startersFor("shoes")?.id ?? null },
      hair: { cosmeticId: isMale ? "hair_buzzcut_raven" : "hair_bob_chestnut" },
      hat: { cosmeticId: null },
    };
  }

  private confirm(): void {
    const appearance = this.buildAppearance(this.gender);
    const owned = new Set(SaveManager.load().ownedCosmetics);
    for (const slot of ["shirt", "pants", "shoes", "hair"] as const) {
      const id = appearance[slot].cosmeticId;
      if (id) owned.add(id);
    }
    SaveManager.save({ hasCharacter: true, appearance, ownedCosmetics: [...owned] });
    this.hint.setText("welcome to /dev/town");
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(SCENES.Town, { spawn: "default" });
      this.scene.launch(SCENES.UI);
    });
  }
}
