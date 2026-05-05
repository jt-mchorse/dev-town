import Phaser from "phaser";
import { EVENTS, GAME_CONFIG, SCENES, Z } from "../config";
import { COSMETICS, type Cosmetic } from "../data/cosmetics";
import { LPCCharacter, registerWalkAnims } from "../entities/LPCCharacter";
import { SaveManager } from "../systems/SaveManager";
import type { Appearance, CosmeticSlot } from "../types";

const SLOTS: CosmeticSlot[] = ["hair", "shirt", "pants", "shoes", "hat"];

export class ShopUIScene extends Phaser.Scene {
  private creditsText!: Phaser.GameObjects.Text;
  private slotText!: Phaser.GameObjects.Text;
  private itemText!: Phaser.GameObjects.Text;
  private flavorText!: Phaser.GameObjects.Text;
  private actionText!: Phaser.GameObjects.Text;
  private preview!: LPCCharacter;
  private slotIdx = 0;
  private itemIdx = 0;
  private workingAppearance!: Appearance;

  constructor() {
    super({ key: SCENES.ShopUI });
  }

  create(): void {
    registerWalkAnims(this);
    const w = GAME_CONFIG.viewWidth;
    const h = GAME_CONFIG.viewHeight;

    this.add
      .rectangle(0, 0, w, h, 0x0b0d12, 0.92)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(Z.HUD);

    this.add
      .text(w / 2, 14, "Cosmetic Shop", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.creditsText = this.add
      .text(w - 12, 14, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffd479",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.workingAppearance = structuredClone(SaveManager.load().appearance);
    this.preview = new LPCCharacter(this, w / 2 - 110, h / 2 + 8, this.workingAppearance);
    this.preview.faceDirection("down");
    this.preview.container.setScrollFactor(0);
    this.preview.container.setDepth(Z.HUDFront);

    this.slotText = this.add
      .text(w / 2 + 30, 56, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#bcc4d4",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.itemText = this.add
      .text(w / 2 + 30, 78, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e6e8ee",
        wordWrap: { width: w / 2 - 50 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.flavorText = this.add
      .text(w / 2 + 30, 110, "", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
        wordWrap: { width: w / 2 - 50 },
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.actionText = this.add
      .text(w / 2 + 30, 158, "", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#9ad7ff",
      })
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.add
      .text(w / 2, h - 14, "W/S slot   A/D item   E buy/equip   X unequip   Esc leave", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const kb = this.input.keyboard!;
    kb.on("keydown-UP", () => this.cycleSlot(-1));
    kb.on("keydown-W", () => this.cycleSlot(-1));
    kb.on("keydown-DOWN", () => this.cycleSlot(1));
    kb.on("keydown-S", () => this.cycleSlot(1));
    kb.on("keydown-LEFT", () => this.cycleItem(-1));
    kb.on("keydown-A", () => this.cycleItem(-1));
    kb.on("keydown-RIGHT", () => this.cycleItem(1));
    kb.on("keydown-D", () => this.cycleItem(1));
    kb.on("keydown-E", () => this.action());
    kb.on("keydown-ENTER", () => this.action());
    kb.on("keydown-X", () => this.unequip());
    kb.on("keydown-ESC", () => this.exit());

    this.refresh();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.preview?.destroy();
    });
  }

  private currentSlot(): CosmeticSlot {
    return SLOTS[this.slotIdx];
  }

  private currentSlotItems(): Cosmetic[] {
    const slot = this.currentSlot();
    return COSMETICS.filter((c) => c.slot === slot);
  }

  private currentItem(): Cosmetic | null {
    const items = this.currentSlotItems();
    if (items.length === 0) return null;
    return items[((this.itemIdx % items.length) + items.length) % items.length];
  }

  private cycleSlot(dir: 1 | -1): void {
    this.slotIdx = (this.slotIdx + dir + SLOTS.length) % SLOTS.length;
    this.itemIdx = 0;
    this.refresh();
  }

  private cycleItem(dir: 1 | -1): void {
    const items = this.currentSlotItems();
    if (items.length === 0) return;
    this.itemIdx = (this.itemIdx + dir + items.length) % items.length;
    this.refresh();
  }

  private action(): void {
    const item = this.currentItem();
    if (!item) return;
    const save = SaveManager.load();
    const owned = save.ownedCosmetics.includes(item.id);
    const slot = item.slot;
    const equippedId = save.appearance[slot].cosmeticId;
    const isEquipped = equippedId === item.id;

    if (isEquipped) return;
    if (!owned) {
      if (save.credits < item.price) {
        this.flashAction("Not enough credits.", "#ff7a7a");
        return;
      }
      const next = SaveManager.save({
        credits: save.credits - item.price,
        ownedCosmetics: [...save.ownedCosmetics, item.id],
      });
      this.game.events.emit(EVENTS.CreditsChanged);
      this.game.events.emit(EVENTS.ToastShow, {
        text: `Bought: ${item.name}  -${item.price}◆`,
        color: "#9ad7ff",
        durationMs: 1600,
      });
      void next;
    }
    SaveManager.patchAppearance({ [slot]: { cosmeticId: item.id } } as Partial<Appearance>);
    this.workingAppearance = structuredClone(SaveManager.load().appearance);
    this.preview.setAppearance(this.workingAppearance);
    this.game.events.emit(EVENTS.AppearanceChanged);
    this.refresh();
  }

  private unequip(): void {
    const slot = this.currentSlot();
    if (slot === "shirt" || slot === "pants" || slot === "shoes") {
      this.flashAction("Can't go bare-essentials in /dev/town.", "#ff7a7a");
      return;
    }
    SaveManager.patchAppearance({ [slot]: { cosmeticId: null } } as Partial<Appearance>);
    this.workingAppearance = structuredClone(SaveManager.load().appearance);
    this.preview.setAppearance(this.workingAppearance);
    this.game.events.emit(EVENTS.AppearanceChanged);
    this.refresh();
  }

  private flashAction(text: string, color: string): void {
    const original = this.actionText.text;
    const originalColor = this.actionText.style.color as string;
    this.actionText.setText(text);
    this.actionText.setColor(color);
    this.time.delayedCall(900, () => {
      this.actionText.setText(original);
      this.actionText.setColor(originalColor);
    });
  }

  private refresh(): void {
    const save = SaveManager.load();
    this.creditsText.setText(`◆ ${save.credits}`);
    this.slotText.setText(`Slot: ${this.currentSlot().toUpperCase()}   (${this.itemIdx + 1}/${this.currentSlotItems().length})`);
    const item = this.currentItem();
    if (!item) {
      this.itemText.setText("No items in this slot.");
      this.flavorText.setText("");
      this.actionText.setText("");
      return;
    }
    const owned = save.ownedCosmetics.includes(item.id);
    const equipped = save.appearance[item.slot].cosmeticId === item.id;
    this.itemText.setText(item.name);
    this.flavorText.setText(item.flavor);
    if (equipped) {
      this.actionText.setText("[ equipped ]");
      this.actionText.setColor("#7fdca0");
    } else if (owned) {
      this.actionText.setText("[E] equip");
      this.actionText.setColor("#9ad7ff");
    } else {
      this.actionText.setText(`[E] buy  —  ${item.price}◆`);
      this.actionText.setColor(save.credits >= item.price ? "#ffd479" : "#7e859a");
    }
    // live preview
    const slot = item.slot;
    const previewAppearance = structuredClone(this.workingAppearance);
    if (!equipped && !owned) {
      previewAppearance[slot] = { cosmeticId: item.id };
      this.preview.setAppearance(previewAppearance);
    } else if (owned && !equipped) {
      previewAppearance[slot] = { cosmeticId: item.id };
      this.preview.setAppearance(previewAppearance);
    } else {
      this.preview.setAppearance(this.workingAppearance);
    }
  }

  private exit(): void {
    this.game.events.emit(EVENTS.ShopClose);
    this.scene.stop();
  }
}
