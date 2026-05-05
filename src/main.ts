import Phaser from "phaser";
import { GAME_CONFIG } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { TitleScene } from "./scenes/TitleScene";
import { CharCreateScene } from "./scenes/CharCreateScene";
import { TownScene } from "./scenes/TownScene";
import { EngineeringDistrictScene } from "./scenes/EngineeringDistrictScene";
import { SkillGroveScene } from "./scenes/SkillGroveScene";
import { FishingDockScene } from "./scenes/FishingDockScene";
import { AIMLLabScene } from "./scenes/AIMLLabScene";
import { FullStackDungeonScene } from "./scenes/FullStackDungeonScene";
import { FishingUIScene } from "./scenes/FishingUIScene";
import { ShopUIScene } from "./scenes/ShopUIScene";
import { QuizUIScene } from "./scenes/QuizUIScene";
import { TypingUIScene } from "./scenes/TypingUIScene";
import { DebugUIScene } from "./scenes/DebugUIScene";
import { SettingsUIScene } from "./scenes/SettingsUIScene";
import { UIScene } from "./scenes/UIScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  pixelArt: true,
  backgroundColor: "#0b0d12",
  width: GAME_CONFIG.viewWidth,
  height: GAME_CONFIG.viewHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: GAME_CONFIG.viewWidth,
    height: GAME_CONFIG.viewHeight,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    CharCreateScene,
    TownScene,
    EngineeringDistrictScene,
    SkillGroveScene,
    FishingDockScene,
    AIMLLabScene,
    FullStackDungeonScene,
    FishingUIScene,
    ShopUIScene,
    QuizUIScene,
    TypingUIScene,
    DebugUIScene,
    SettingsUIScene,
    UIScene,
  ],
});

// Expose for in-browser debugging via the preview tools.
(window as unknown as { __game: Phaser.Game }).__game = game;
