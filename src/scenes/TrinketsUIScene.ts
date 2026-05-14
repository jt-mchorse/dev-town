import Phaser from "phaser";
import { GAME_CONFIG, SCENES, Z } from "../config";
import { STATIC_CHESTS } from "../data/chests";
import { SaveManager } from "../systems/SaveManager";

const ROWS_VISIBLE = 6;
const ROW_H = 30;

/**
 * Surfaces every chest in the world plus the player's discovery state.
 * Opened chests show their flavor text in full; unopened chests show a
 * "(undiscovered)" placeholder with their location hint so the player
 * knows where to look. Launched from Settings.
 */
export class TrinketsUIScene extends Phaser.Scene {
  private offset = 0;
  private rowTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: SCENES.TrinketsUI });
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
      .text(w / 2, 12, "Trinkets", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9ad7ff",
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    const save = SaveManager.load();
    const opened = save.openedChests.length;
    const total = STATIC_CHESTS.length;
    const dailies = save.openedChests.filter((id) => id.startsWith("daily_")).length;

    this.add
      .text(
        w / 2,
        30,
        `${opened - dailies} / ${total} chests opened   •   ${dailies} daily secret${dailies === 1 ? "" : "s"}`,
        {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#bcc4d4",
        },
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    for (let i = 0; i < ROWS_VISIBLE; i += 1) {
      const t = this.add
        .text(16, 56 + i * ROW_H, "", {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#e6e8ee",
          wordWrap: { width: w - 32 },
        })
        .setScrollFactor(0)
        .setDepth(Z.HUDFront);
      this.rowTexts.push(t);
    }

    this.add
      .text(w / 2, h - 14, "W/S scroll   Esc close", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#7e859a",
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(Z.HUDFront);

    this.refresh();

    const kb = this.input.keyboard!;
    kb.on("keydown-W", () => this.scroll(-1));
    kb.on("keydown-UP", () => this.scroll(-1));
    kb.on("keydown-S", () => this.scroll(1));
    kb.on("keydown-DOWN", () => this.scroll(1));
    kb.on("keydown-ESC", () => this.scene.stop());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.rowTexts.forEach((t) => t.destroy());
      this.rowTexts = [];
    });
  }

  private scroll(dir: 1 | -1): void {
    const max = Math.max(0, STATIC_CHESTS.length - ROWS_VISIBLE);
    this.offset = Math.max(0, Math.min(max, this.offset + dir));
    this.refresh();
  }

  private refresh(): void {
    const save = SaveManager.load();
    const opened = new Set(save.openedChests);
    for (let i = 0; i < ROWS_VISIBLE; i += 1) {
      const idx = this.offset + i;
      const chest = STATIC_CHESTS[idx];
      const t = this.rowTexts[i];
      if (!chest) {
        t.setText("");
        continue;
      }
      const isOpened = opened.has(chest.id);
      if (isOpened) {
        t.setColor("#ffd479");
        t.setText(`◆ ${chest.flavorTitle}  +${chest.reward}◆\n  ${chest.flavorBody}`);
      } else {
        t.setColor("#5c6275");
        t.setText(`◇ undiscovered  •  hidden in ${humanZone(chest.scene)}`);
      }
    }
  }
}

function humanZone(key: string): string {
  switch (key) {
    case "TownScene":
      return "Town Square";
    case "EngineeringDistrictScene":
      return "Engineering District";
    case "SkillGroveScene":
      return "Skill Grove";
    case "FishingDockScene":
      return "Fishing Dock";
    case "AIMLLabScene":
      return "AI/ML Lab";
    case "FullStackDungeonScene":
      return "Full-Stack Dungeon";
    default:
      return key;
  }
}
