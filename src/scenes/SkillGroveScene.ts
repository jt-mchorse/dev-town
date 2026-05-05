import Phaser from "phaser";
import { GAME_CONFIG, SCENES, Z } from "../config";
import { BaseZoneScene, seededRng } from "../world/BaseZoneScene";
import { SKILLS, PROJECTS } from "../data/portfolio";
import { TEX } from "./PreloadScene";
import type { DialogLine } from "../types";

const TILE = GAME_CONFIG.tileSize;

export class SkillGroveScene extends BaseZoneScene {
  readonly sceneKey = SCENES.Skill;
  readonly zoneTitle = "Skill Grove";

  constructor() {
    super(SCENES.Skill);
  }

  protected buildZone(worldW: number, worldH: number): void {
    this.paintGroundWithVariants(
      new Phaser.Geom.Rectangle(0, 0, worldW, worldH),
      TEX.Grass,
      [
        { key: TEX.GrassDark, weight: 0.6 },
        { key: TEX.GrassLight, weight: 0.4 },
      ],
      31,
    );

    // grove clearing — natural earth clearing in a forest, not a paved plaza.
    // The pure-dirt center of the auto-tile reads as a packed-earth clearing
    // so the ring blends grass→dirt seamlessly.
    const cx = worldW / 2;
    const cy = worldH / 2;
    this.paintRectWithAutoTileBorder(
      new Phaser.Geom.Rectangle(cx - TILE * 8, cy - TILE * 6, TILE * 16, TILE * 12),
      this.GRASS_DIRT_AUTOTILE,
    );

    const cyTile = Math.floor(GAME_CONFIG.worldTilesY / 2);
    this.addBorderWalls(worldW, worldH, [{ tx: 0, ty: cyTile }]);
    this.addSpawn("default", cx, cy);
    this.addSpawn("from_town", TILE * 2 + TILE / 2, cy + TILE / 2, "right");

    this.addSign(cx, cy - TILE * 9, "Grove Sign", [
      { speaker: "Grove Sign", text: "SKILL GROVE" },
      { speaker: "Grove Sign", text: "Each totem channels a different stack. Read 'em like a CV — but with more pixels." },
    ]);

    // arrange totems in a grid around the clearing
    const cols = 4;
    const cell = TILE * 4;
    SKILLS.forEach((skill, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = cx - (cols * cell) / 2 + col * cell + cell / 2;
      const ty = cy - TILE * 4 + row * cell;
      this.add.image(tx, ty, TEX.Totem).setDepth(Z.Entities).setOrigin(0.5, 0.85);
      this.add
        .text(tx, ty - 36, skill.totem, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#ffd479",
          backgroundColor: "#0b0d12cc",
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 1)
        .setDepth(Z.Overlay);

      const lines: DialogLine[] = [
        { speaker: skill.name, text: `[${skill.category}] level ${skill.level}/5` },
        { speaker: skill.name, text: skill.blurb },
        { speaker: skill.name, text: "★".repeat(skill.level) + "☆".repeat(5 - skill.level) },
      ];
      this.addPointInteract({
        x: tx,
        y: ty,
        range: 22,
        label: skill.totem,
        onInteract: () => this.openDialog(lines),
      });
    });

    // projects bookshelf — at the far end
    const px = cx;
    const py = cy + TILE * 7;
    this.add.image(px - 24, py - 16, TEX.Building).setDepth(Z.Walls).setOrigin(0, 0).setScale(0.75);
    this.addPointInteract({
      x: px,
      y: py,
      range: 26,
      label: "Project Archive",
      onInteract: () => {
        const lines: DialogLine[] = [{ speaker: "Project Archive", text: "Side quests on record:" }];
        for (const p of PROJECTS) {
          lines.push({ speaker: p.name, text: p.blurb });
          lines.push({ speaker: p.name, text: `Stack: ${p.stack.join(", ")}${p.url ? `\n${p.url}` : ""}` });
        }
        this.openDialog(lines);
      },
    });

    // grove of trees ringing the clearing — thinned & varied
    const groveRng = seededRng(91);
    const groveKeys = [TEX.TreePine, TEX.TreeOak, "tex_tree_pine_small", "tex_tree_oak_small"];
    const placed: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 48; i += 1) {
      const angle = groveRng() * Math.PI * 2;
      const r = TILE * 11 + groveRng() * TILE * 6;
      const tx = cx + Math.cos(angle) * r;
      const ty = cy + Math.sin(angle) * (r * 0.75);
      if (tx < TILE * 2 || tx > worldW - TILE * 2) continue;
      if (ty < TILE * 2 || ty > worldH - TILE * 2) continue;
      if (Math.abs(ty - cy) < TILE * 1.5 && tx < TILE * 6) continue;
      // reject if too close to an already-placed tree
      if (placed.some((p) => Math.abs(p.x - tx) < TILE * 1.2 && Math.abs(p.y - ty) < TILE * 1.2)) continue;
      placed.push({ x: tx, y: ty });
      const key = groveKeys[Math.floor(groveRng() * groveKeys.length)];
      this.addSolidDecor(key, tx, ty, 6, 3);
    }

    // mushrooms + small flowers between totems — kept inside the dirt
    // clearing only (bushes/grass tufts would clash with the packed earth)
    const innerW = TILE * 14;
    const innerH = TILE * 10;
    for (let i = 0; i < 18; i += 1) {
      const tx = cx + (groveRng() - 0.5) * innerW;
      const ty = cy + (groveRng() - 0.5) * innerH;
      const onTotemRow = Math.abs(ty - cy + TILE * 4) < TILE || Math.abs(ty - cy + TILE * 0) < TILE * 2;
      if (onTotemRow) continue;
      const k = [TEX.Mushroom, TEX.FlowerRed, TEX.FlowerYellow, TEX.FlowerBlue][i % 4];
      this.addDecor(k, tx, ty, { anchorY: 0.85, depth: Z.GroundDecal });
    }

    this.spawnStaticChests();

    this.addWarp({
      x: 0,
      y: cy,
      width: TILE,
      height: TILE,
      toScene: SCENES.Town,
      toSpawn: "from_skills",
      facing: "left",
    });
  }
}
