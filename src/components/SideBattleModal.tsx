import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BattleFormation,
  HeroConfig,
  ManualBattleOutcome,
  PendingBattle,
  SkillVisualType,
  TerrainType,
  UnitType,
  WeaponStyle,
} from '../types/game';
import { FACTIONS } from '../data/factions';
import { HeroAvatar, RarityBadge } from './GameIcons';
import {
  playArrowShot,
  playBattleStart,
  playDefeat,
  playSkillCast,
  playSwordClash,
  playVictory,
} from '../engine/battleAudio';

export interface SideBattleModalProps {
  battle: PendingBattle;
  attackerHeroes: HeroConfig[];
  defenderHeroes: HeroConfig[];
  soundMuted: boolean;
  onToggleMute: () => void;
  onComplete: (outcome: ManualBattleOutcome) => void;
  onAutoResolve: () => void;
}

type Side = 'attacker' | 'defender';
type ArmyOrder = 'charge' | 'hold' | 'hero_rush' | 'retreat';
type UnitAnimState = 'idle' | 'move' | 'attack' | 'cast' | 'hit' | 'dead';

interface BattleUnit {
  id: string;
  side: Side;
  isHero: boolean;
  hero?: HeroConfig;
  unitType: UnitType;
  weaponStyle: WeaponStyle;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  range: number;
  attackCooldown: number;
  attackTimer: number;
  animState: UnitAnimState;
  animPhase: number;
  hitFlashTimer: number;
  attackAnimTimer: number;
  castAnimTimer: number;
  stunTimer: number;
  mp: number;
  maxMp: number;
  scale: number;
  accentColor: string;
}

interface Projectile {
  id: number;
  side: Side;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  duration: number;
  arcHeight: number;
  damage: number;
  flaming: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'dust' | 'spark' | 'heal' | 'ember' | 'water' | 'blood';
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  big?: boolean;
}

interface SkillVfx {
  type: SkillVisualType;
  side: Side;
  elapsed: number;
  duration: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  bolts?: Array<{ x: number; y: number; delay: number }>;
}

interface CutInOverlay {
  hero: HeroConfig;
  side: Side;
  id: number;
}

interface HeroHudSlot {
  hero: HeroConfig;
  hp: number;
  maxHp: number;
  mp: number;
  alive: boolean;
}

const CANVAS_W = 960;
const CANVAS_H = 420;
const FIELD_TOP = 228;
const FIELD_BOTTOM = 388;

const FORMATION_INFO: Record<
  BattleFormation,
  { label: string; short: string; badge: string; desc: string }
> = {
  wedge: {
    label: '錐形衝鋒陣',
    short: '錐形陣',
    badge: '攻+18% 速+20%',
    desc: '銳角突刺敵陣，強化攻擊力與衝鋒速度',
  },
  square: {
    label: '方形防禦陣',
    short: '方形陣',
    badge: '防+22%',
    desc: '結陣固守陣線，大幅降低近戰與箭雨傷害',
  },
  echelon: {
    label: '雁行齊射陣',
    short: '雁行陣',
    badge: '弓程/射速+25%',
    desc: '兩翼張開掩護射手，強化遠程火力壓制',
  },
};

const ORDER_INFO: Array<{ id: ArmyOrder; label: string; icon: string }> = [
  { id: 'charge', label: '全軍突擊', icon: '⚔️' },
  { id: 'hold', label: '原地結陣', icon: '🛡️' },
  { id: 'hero_rush', label: '武將突前', icon: '🐴' },
  { id: 'retreat', label: '掩護撤退', icon: '🏳️' },
];

const TERRAIN_TITLES: Record<TerrainType, string> = {
  port: '海疆港埠・搶灘激戰',
  island: '離島海峽・奪島登陸戰',
  basin: '府城紅磚・城下攻防戰',
  plain: '沃野稻浪・平野會戰',
  mountain: '峻嶺峽谷・隘口奇襲戰',
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getFormationOffsets(
  index: number,
  total: number,
  isArcher: boolean,
  side: Side,
  formation: BattleFormation
): { x: number; y: number } {
  const dir = side === 'attacker' ? 1 : -1;
  const baseFrontX = side === 'attacker' ? 238 : 722;
  const rows = Math.max(1, Math.ceil(total / 4));
  const row = index % rows;
  const col = Math.floor(index / rows);
  const yNorm = rows === 1 ? 0.5 : row / (rows - 1);
  const y = FIELD_TOP + 14 + yNorm * (FIELD_BOTTOM - FIELD_TOP - 28);

  if (isArcher) {
    const rearX = side === 'attacker' ? 96 + col * 24 : 864 - col * 24;
    const echelonShift =
      formation === 'echelon' ? Math.abs(yNorm - 0.5) * 34 * dir : 0;
    return { x: clamp(rearX + echelonShift, 64, CANVAS_W - 64), y };
  }

  let xOffset = -col * 30;
  if (formation === 'wedge') {
    xOffset += (1 - Math.abs(yNorm - 0.5) * 2) * 38;
  } else if (formation === 'echelon') {
    xOffset += (yNorm - 0.5) * 42;
  } else {
    // square
    xOffset -= 8;
  }

  const x = clamp(baseFrontX + xOffset * dir, 76, CANVAS_W - 76);
  return { x, y };
}

function buildInitialUnits(
  battle: PendingBattle,
  attackerHeroes: HeroConfig[],
  defenderHeroes: HeroConfig[],
  attackerColor: string,
  defenderColor: string
): BattleUnit[] {
  const units: BattleUnit[] = [];

  const spawnSide = (
    side: Side,
    troops: number,
    heroes: HeroConfig[],
    factionColor: string
  ) => {
    const facing: 1 | -1 = side === 'attacker' ? 1 : -1;
    const activeHeroes = heroes.slice(0, 3);
    const soldierCount = clamp(Math.round(troops / 24), 8, 24);
    const archerCount = Math.max(2, Math.floor(soldierCount * 0.34));
    const meleeCount = soldierCount - archerCount;

    // Scale individual unit HP slightly with army size so larger armies feel meaningfully stronger
    const armyStrengthMult = clamp(0.75 + troops / 650, 0.75, 1.9);

    // Spawn Heroes
    activeHeroes.forEach((hero, i) => {
      const yFrac =
        activeHeroes.length === 1
          ? 0.5
          : 0.24 + (i / (activeHeroes.length - 1)) * 0.52;
      const y = FIELD_TOP + 16 + yFrac * (FIELD_BOTTOM - FIELD_TOP - 32);
      const x = side === 'attacker' ? 248 - i * 14 : 712 + i * 14;
      const isRangedHero =
        hero.weaponStyle === 'bow' || hero.weaponStyle === 'fan';
      const maxHp = Math.round(
        (290 + hero.command * 2.1 + hero.might * 1.4) * (0.9 + armyStrengthMult * 0.25)
      );
      units.push({
        id: `${side}-hero-${hero.id}`,
        side,
        isHero: true,
        hero,
        unitType: hero.unitType,
        weaponStyle: hero.weaponStyle,
        x,
        y,
        homeX: x,
        homeY: y,
        vx: 0,
        facing,
        hp: maxHp,
        maxHp,
        atk: Math.round(24 + hero.might * 0.34 + hero.atk * 0.08),
        def: Math.round(12 + hero.command * 0.22 + hero.def * 0.06),
        speed: hero.unitType === 'cavalry' ? 92 : 66,
        range: isRangedHero ? 215 : 44,
        attackCooldown: isRangedHero ? 1.05 : 0.78,
        attackTimer: Math.random() * 0.35,
        animState: 'idle',
        animPhase: Math.random() * Math.PI * 2,
        hitFlashTimer: 0,
        attackAnimTimer: 0,
        castAnimTimer: 0,
        stunTimer: 0,
        mp: 35 + Math.round(hero.intel * 0.2),
        maxMp: 100,
        scale: 1.35,
        accentColor: hero.themeColor || factionColor,
      });
    });

    // Spawn Melee Soldiers
    for (let i = 0; i < meleeCount; i++) {
      const isCav = i % 4 === 0;
      const pos = getFormationOffsets(i, meleeCount, false, side, 'wedge');
      const maxHp = Math.round((isCav ? 108 : 95) * armyStrengthMult);
      units.push({
        id: `${side}-melee-${i}`,
        side,
        isHero: false,
        unitType: isCav ? 'cavalry' : 'infantry',
        weaponStyle: isCav ? 'spear' : 'sword',
        x: pos.x,
        y: pos.y,
        homeX: pos.x,
        homeY: pos.y,
        vx: 0,
        facing,
        hp: maxHp,
        maxHp,
        atk: Math.round((isCav ? 17 : 14) * (0.85 + armyStrengthMult * 0.25)),
        def: isCav ? 8 : 10,
        speed: isCav ? 84 : 58,
        range: 32,
        attackCooldown: isCav ? 0.92 : 0.88,
        attackTimer: Math.random() * 0.45,
        animState: 'idle',
        animPhase: Math.random() * Math.PI * 2,
        hitFlashTimer: 0,
        attackAnimTimer: 0,
        castAnimTimer: 0,
        stunTimer: 0,
        mp: 0,
        maxMp: 0,
        scale: 0.92,
        accentColor: factionColor,
      });
    }

    // Spawn Rear Archers
    for (let i = 0; i < archerCount; i++) {
      const pos = getFormationOffsets(i, archerCount, true, side, 'wedge');
      const maxHp = Math.round(72 * armyStrengthMult);
      units.push({
        id: `${side}-archer-${i}`,
        side,
        isHero: false,
        unitType: 'archer',
        weaponStyle: 'bow',
        x: pos.x,
        y: pos.y,
        homeX: pos.x,
        homeY: pos.y,
        vx: 0,
        facing,
        hp: maxHp,
        maxHp,
        atk: Math.round(13 * (0.85 + armyStrengthMult * 0.24)),
        def: 5,
        speed: 52,
        range: 295,
        attackCooldown: 1.55,
        attackTimer: 0.4 + Math.random() * 0.7,
        animState: 'idle',
        animPhase: Math.random() * Math.PI * 2,
        hitFlashTimer: 0,
        attackAnimTimer: 0,
        castAnimTimer: 0,
        stunTimer: 0,
        mp: 0,
        maxMp: 0,
        scale: 0.88,
        accentColor: factionColor,
      });
    }
  };

  spawnSide('attacker', battle.march.troops, attackerHeroes, attackerColor);
  spawnSide('defender', battle.defenderTroops, defenderHeroes, defenderColor);

  return units;
}

// ============================================================================
// Canvas Backdrop Renderer (Localized Taiwan Terrain Scenes)
// ============================================================================

function drawTaiwanBackdrop(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainType,
  time: number
): void {
  // 1. Sky Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD_TOP + 10);
  if (terrain === 'port' || terrain === 'island') {
    sky.addColorStop(0, '#1e4e79');
    sky.addColorStop(0.55, '#4b92b5');
    sky.addColorStop(1, '#f4d9a6');
  } else if (terrain === 'basin') {
    sky.addColorStop(0, '#2c1d2e');
    sky.addColorStop(0.5, '#7c3a2d');
    sky.addColorStop(1, '#e8a864');
  } else if (terrain === 'mountain') {
    sky.addColorStop(0, '#182b3a');
    sky.addColorStop(0.55, '#3b6472');
    sky.addColorStop(1, '#b8d0cc');
  } else {
    // plain — golden sunset
    sky.addColorStop(0, '#362238');
    sky.addColorStop(0.45, '#b85432');
    sky.addColorStop(0.82, '#ef9d47');
    sky.addColorStop(1, '#fce09b');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, FIELD_TOP + 10);

  // Sun / Celestial Disc
  ctx.save();
  const sunX = terrain === 'mountain' ? 760 : terrain === 'port' || terrain === 'island' ? 480 : 690;
  const sunY = terrain === 'plain' ? 128 : 84;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 92);
  sunGlow.addColorStop(0, 'rgba(255, 244, 198, 0.95)');
  sunGlow.addColorStop(0.35, 'rgba(255, 206, 118, 0.45)');
  sunGlow.addColorStop(1, 'rgba(255, 206, 118, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5d1';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Drifting stylized clouds
  ctx.save();
  ctx.fillStyle = 'rgba(255, 248, 232, 0.16)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 270 + time * (8 + i * 2)) % (CANVAS_W + 180)) - 90;
    const cy = 42 + (i % 2) * 32;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 58, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 28, cy - 6, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Terrain-specific Midground & Ground
  if (terrain === 'port' || terrain === 'island') {
    // Distant island hills
    ctx.fillStyle = '#2d5c6e';
    ctx.beginPath();
    ctx.moveTo(0, 148);
    ctx.quadraticCurveTo(160, 108, 340, 142);
    ctx.quadraticCurveTo(590, 112, 820, 140);
    ctx.lineTo(CANVAS_W, 134);
    ctx.lineTo(CANVAS_W, 155);
    ctx.lineTo(0, 155);
    ctx.closePath();
    ctx.fill();

    // Taiwan Strait sparkling sea
    const sea = ctx.createLinearGradient(0, 142, 0, FIELD_TOP + 6);
    sea.addColorStop(0, '#1e6378');
    sea.addColorStop(0.6, '#2b889c');
    sea.addColorStop(1, '#79c2bd');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 142, CANVAS_W, FIELD_TOP - 134);

    // Animated war junks (福船) bobbing on the horizon
    const junkXs = [190, 440, 745];
    junkXs.forEach((jx, idx) => {
      const bob = Math.sin(time * 2.1 + idx * 1.7) * 2.4;
      const jy = 166 + (idx % 2) * 10 + bob;
      ctx.save();
      ctx.translate(jx, jy);
      // Hull
      ctx.fillStyle = '#5c3118';
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.lineTo(17, 9);
      ctx.lineTo(-17, 9);
      ctx.closePath();
      ctx.fill();
      // Mast & slatted lugsail
      ctx.strokeStyle = '#d4aa5a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -32);
      ctx.stroke();
      ctx.fillStyle = '#f3e5c8';
      ctx.beginPath();
      ctx.moveTo(1, -30);
      ctx.quadraticCurveTo(19, -24, 17, -6);
      ctx.lineTo(1, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c83e2b';
      ctx.fillRect(-1, -34, 9, 4);
      ctx.restore();
    });

    // Animated shoreline waves
    ctx.strokeStyle = 'rgba(255, 252, 240, 0.55)';
    ctx.lineWidth = 2;
    for (let w = 0; w < 3; w++) {
      const wy = 192 + w * 14 + Math.sin(time * 2.4 + w) * 2.5;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_W; x += 40) {
        const yOff = Math.sin(x * 0.03 + time * 3 + w) * 3;
        if (x === 0) ctx.moveTo(x, wy + yOff);
        else ctx.lineTo(x, wy + yOff);
      }
      ctx.stroke();
    }

    // Coastal beach ground
    const sand = ctx.createLinearGradient(0, FIELD_TOP - 4, 0, CANVAS_H);
    sand.addColorStop(0, '#e3c78d');
    sand.addColorStop(0.45, '#cfa96c');
    sand.addColorStop(1, '#9f7b47');
    ctx.fillStyle = sand;
    ctx.fillRect(0, FIELD_TOP - 4, CANVAS_W, CANVAS_H - FIELD_TOP + 4);
  } else if (terrain === 'basin') {
    // Distant hills
    ctx.fillStyle = '#402930';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.quadraticCurveTo(220, 118, 480, 155);
    ctx.quadraticCurveTo(730, 115, CANVAS_W, 158);
    ctx.lineTo(CANVAS_W, 225);
    ctx.lineTo(0, 225);
    ctx.closePath();
    ctx.fill();

    // Red-brick Taiwan Fortress Wall (赤崁 / 台北城)
    ctx.fillStyle = '#7e2f24';
    ctx.fillRect(0, 168, CANVAS_W, 60);
    // Battlements
    ctx.fillStyle = '#92382b';
    for (let bx = 0; bx < CANVAS_W; bx += 36) {
      ctx.fillRect(bx, 156, 22, 14);
    }
    // Brick courses
    ctx.strokeStyle = 'rgba(42, 16, 12, 0.35)';
    ctx.lineWidth = 1;
    for (let by = 178; by < 226; by += 12) {
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(CANVAS_W, by);
      ctx.stroke();
    }

    // Traditional curved Taiwanese temple / gate pavilion silhouette
    const drawPavilion = (px: number) => {
      ctx.save();
      ctx.translate(px, 156);
      ctx.fillStyle = '#2d1814';
      ctx.fillRect(-38, -26, 76, 26);
      // Swallowtail curved roof
      ctx.fillStyle = '#a83324';
      ctx.beginPath();
      ctx.moveTo(-58, -22);
      ctx.quadraticCurveTo(-24, -34, 0, -48);
      ctx.quadraticCurveTo(24, -34, 58, -22);
      ctx.lineTo(48, -16);
      ctx.lineTo(-48, -16);
      ctx.closePath();
      ctx.fill();
      // Hanging golden lanterns
      ctx.fillStyle = '#ffbe55';
      ctx.beginPath();
      ctx.arc(-22, -10, 4, 0, Math.PI * 2);
      ctx.arc(22, -10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawPavilion(230);
    drawPavilion(730);

    // Stone-paved historic plaza ground
    const stone = ctx.createLinearGradient(0, FIELD_TOP - 4, 0, CANVAS_H);
    stone.addColorStop(0, '#8d7a69');
    stone.addColorStop(0.5, '#726052');
    stone.addColorStop(1, '#4f4137');
    ctx.fillStyle = stone;
    ctx.fillRect(0, FIELD_TOP - 4, CANVAS_W, CANVAS_H - FIELD_TOP + 4);
  } else if (terrain === 'mountain') {
    // Towering Taroko / Central Mountain pine cliffs
    ctx.fillStyle = '#223e47';
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.lineTo(130, 74);
    ctx.lineTo(270, 168);
    ctx.lineTo(430, 62);
    ctx.lineTo(610, 160);
    ctx.lineTo(790, 56);
    ctx.lineTo(CANVAS_W, 145);
    ctx.lineTo(CANVAS_W, 228);
    ctx.lineTo(0, 228);
    ctx.closePath();
    ctx.fill();

    // Closer misty cliffs
    ctx.fillStyle = '#30545a';
    ctx.beginPath();
    ctx.moveTo(0, 228);
    ctx.lineTo(190, 128);
    ctx.lineTo(360, 185);
    ctx.lineTo(540, 120);
    ctx.lineTo(740, 182);
    ctx.lineTo(CANVAS_W, 124);
    ctx.lineTo(CANVAS_W, 228);
    ctx.closePath();
    ctx.fill();

    // Drifting alpine mist bands
    const mistShift = Math.sin(time * 0.7) * 24;
    const mistGrad = ctx.createLinearGradient(0, 155, 0, 228);
    mistGrad.addColorStop(0, 'rgba(220, 240, 238, 0)');
    mistGrad.addColorStop(0.55, 'rgba(220, 240, 238, 0.28)');
    mistGrad.addColorStop(1, 'rgba(220, 240, 238, 0.08)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(-30 + mistShift, 155, CANVAS_W + 60, 75);

    // Pine tree silhouettes along ridge
    ctx.fillStyle = '#152e2d';
    for (let tx = 20; tx < CANVAS_W; tx += 62) {
      const h = 24 + (tx % 17);
      ctx.beginPath();
      ctx.moveTo(tx, 224 - h);
      ctx.lineTo(tx - 12, 226);
      ctx.lineTo(tx + 12, 226);
      ctx.closePath();
      ctx.fill();
    }

    // Rocky mountain pass ground
    const gorge = ctx.createLinearGradient(0, FIELD_TOP - 4, 0, CANVAS_H);
    gorge.addColorStop(0, '#6a756c');
    gorge.addColorStop(0.55, '#525b54');
    gorge.addColorStop(1, '#39403b');
    ctx.fillStyle = gorge;
    ctx.fillRect(0, FIELD_TOP - 4, CANVAS_W, CANVAS_H - FIELD_TOP + 4);
  } else {
    // 'plain': Central Mountain silhouette + golden sunset rice terraces
    ctx.fillStyle = '#5c4152';
    ctx.beginPath();
    ctx.moveTo(0, 185);
    ctx.quadraticCurveTo(180, 118, 370, 162);
    ctx.quadraticCurveTo(560, 96, 760, 158);
    ctx.quadraticCurveTo(880, 134, CANVAS_W, 168);
    ctx.lineTo(CANVAS_W, 228);
    ctx.lineTo(0, 228);
    ctx.closePath();
    ctx.fill();

    // Terraced golden rice hills
    ctx.fillStyle = '#a87d2f';
    ctx.beginPath();
    ctx.moveTo(0, 198);
    ctx.quadraticCurveTo(320, 174, 640, 196);
    ctx.quadraticCurveTo(810, 182, CANVAS_W, 194);
    ctx.lineTo(CANVAS_W, 228);
    ctx.lineTo(0, 228);
    ctx.closePath();
    ctx.fill();

    // Golden plains battlefield ground
    const plain = ctx.createLinearGradient(0, FIELD_TOP - 4, 0, CANVAS_H);
    plain.addColorStop(0, '#c89b46');
    plain.addColorStop(0.45, '#a87f35');
    plain.addColorStop(1, '#6f5222');
    ctx.fillStyle = plain;
    ctx.fillRect(0, FIELD_TOP - 4, CANVAS_W, CANVAS_H - FIELD_TOP + 4);

    // Swaying rice stalk accents at horizon edge
    ctx.strokeStyle = 'rgba(254, 228, 138, 0.35)';
    ctx.lineWidth = 1.4;
    for (let rx = 10; rx < CANVAS_W; rx += 18) {
      const sway = Math.sin(time * 2.5 + rx * 0.08) * 3;
      ctx.beginPath();
      ctx.moveTo(rx, FIELD_TOP + 2);
      ctx.lineTo(rx + sway, FIELD_TOP - 11);
      ctx.stroke();
    }
  }

  // Subtle tactical depth grid lines on battlefield floor
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 245, 220, 0.08)';
  ctx.lineWidth = 1;
  for (let y = FIELD_TOP + 28; y < CANVAS_H; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
  // Center clash line marker
  ctx.strokeStyle = 'rgba(247, 205, 109, 0.16)';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, FIELD_TOP);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 2D Layered Animated Sprite Rig Renderer
// ============================================================================

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  style: WeaponStyle,
  swingAngle: number,
  isHero: boolean,
  isCasting: boolean
): void {
  ctx.save();
  ctx.translate(6, -15);
  ctx.rotate(swingAngle);

  if (isCasting) {
    ctx.shadowColor = '#f7cd6d';
    ctx.shadowBlur = 12;
  }

  switch (style) {
    case 'spear':
      ctx.strokeStyle = '#b98948';
      ctx.lineWidth = isHero ? 2.6 : 2;
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(22, -16);
      ctx.stroke();
      // Spearhead
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(22, -16);
      ctx.lineTo(31, -22);
      ctx.lineTo(25, -12);
      ctx.closePath();
      ctx.fill();
      // Red tassel
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(20, -14, 2.6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'bow':
      ctx.strokeStyle = '#d4aa5a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(4, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(6, -11);
      ctx.lineTo(6, 11);
      ctx.stroke();
      break;

    case 'fan':
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d4aa5a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.arc(2, 2, 13, -Math.PI * 0.65, -Math.PI * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'axe':
      ctx.strokeStyle = '#78512b';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-4, 6);
      ctx.lineTo(15, -14);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(11, -10);
      ctx.quadraticCurveTo(22, -16, 20, -4);
      ctx.lineTo(11, -6);
      ctx.closePath();
      ctx.fill();
      break;

    case 'dagger':
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(2, -1);
      ctx.lineTo(14, -7);
      ctx.lineTo(5, 3);
      ctx.closePath();
      ctx.fill();
      break;

    case 'sword':
    default:
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = isHero ? 2.8 : 2.1;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(17, -14);
      ctx.stroke();
      // Gold crossguard
      ctx.strokeStyle = '#f7cd6d';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.lineTo(4, 5);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function drawUnit(ctx: CanvasRenderingContext2D, u: BattleUnit, time: number): void {
  if (u.animState === 'dead') return;

  const isMoving = u.animState === 'move';
  const isAttacking = u.attackAnimTimer > 0;
  const isCasting = u.castAnimTimer > 0;
  const bob = isMoving ? Math.abs(Math.sin(u.animPhase * 2)) * 3.2 : Math.sin(time * 2.5 + u.animPhase) * 0.7;
  const legSwing = isMoving ? Math.sin(u.animPhase * 2) * 5.5 : 0;

  ctx.save();
  ctx.translate(u.x, u.y);

  // Ground shadow
  ctx.fillStyle = 'rgba(10, 12, 16, 0.42)';
  ctx.beginPath();
  ctx.ellipse(
    0,
    2,
    (u.unitType === 'cavalry' ? 18 : 11) * u.scale,
    4.5 * u.scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Golden aura ring for Heroes
  if (u.isHero) {
    ctx.strokeStyle = isCasting
      ? 'rgba(255, 225, 120, 0.95)'
      : u.side === 'attacker'
      ? 'rgba(73, 168, 136, 0.65)'
      : 'rgba(229, 91, 69, 0.65)';
    ctx.lineWidth = isCasting ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, 17 * u.scale, 6 * u.scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Flip horizontally according to facing
  ctx.save();
  ctx.scale(u.facing * u.scale, u.scale);
  ctx.translate(0, -bob);

  const riderLift = u.unitType === 'cavalry' ? -10 : 0;

  // Warhorse for cavalry units
  if (u.unitType === 'cavalry') {
    const horseColor = u.isHero ? '#7c3a1d' : '#6b4226';
    // Animated horse legs
    ctx.strokeStyle = '#3b2010';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-9, -6);
    ctx.lineTo(-11 - legSwing, 2);
    ctx.moveTo(-5, -6);
    ctx.lineTo(-4 + legSwing * 0.8, 2);
    ctx.moveTo(7, -6);
    ctx.lineTo(9 + legSwing, 2);
    ctx.moveTo(10, -6);
    ctx.lineTo(11 - legSwing * 0.8, 2);
    ctx.stroke();

    // Horse body
    ctx.fillStyle = horseColor;
    ctx.beginPath();
    ctx.ellipse(0, -10, 14, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Horse neck & head
    ctx.beginPath();
    ctx.moveTo(9, -12);
    ctx.lineTo(16, -21);
    ctx.lineTo(20, -18);
    ctx.lineTo(14, -9);
    ctx.closePath();
    ctx.fill();
    // Tail
    ctx.strokeStyle = '#271409';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, -11);
    ctx.quadraticCurveTo(-19, -9 + Math.sin(time * 8 + u.animPhase) * 2, -18, -3);
    ctx.stroke();
    // Saddle cloth
    ctx.fillStyle = u.accentColor;
    ctx.fillRect(-5, -16, 10, 6);
  } else {
    // Striding legs
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-2.5, -7);
    ctx.lineTo(-3 - legSwing, 1);
    ctx.moveTo(2.5, -7);
    ctx.lineTo(3 + legSwing, 1);
    ctx.stroke();
  }

  ctx.translate(0, riderLift);

  // Fluttering Hero Cape
  if (u.isHero) {
    const capeWave = Math.sin(time * 7 + u.animPhase) * 3.5;
    ctx.fillStyle = u.accentColor;
    ctx.beginPath();
    ctx.moveTo(-4, -21);
    ctx.quadraticCurveTo(-15, -14 + capeWave * 0.5, -18 - (isMoving ? 4 : 0), -5 + capeWave);
    ctx.lineTo(-5, -8);
    ctx.closePath();
    ctx.fill();
  }

  // Torso Armor
  ctx.fillStyle = u.hitFlashTimer > 0 ? '#ffffff' : u.accentColor;
  ctx.strokeStyle = u.isHero ? '#f7cd6d' : '#1e293b';
  ctx.lineWidth = u.isHero ? 1.4 : 1;
  ctx.beginPath();
  ctx.roundRect(-6, -22, 12, 15, 3);
  ctx.fill();
  ctx.stroke();

  // Chest plate accent
  ctx.fillStyle = u.hitFlashTimer > 0 ? '#ffffff' : u.isHero ? '#f7cd6d' : '#cbd5e1';
  ctx.fillRect(-3.5, -19, 7, 5);

  // Head
  ctx.fillStyle = u.hitFlashTimer > 0 ? '#ffffff' : '#f1c7a4';
  ctx.beginPath();
  ctx.arc(0, -26.5, 4.6, 0, Math.PI * 2);
  ctx.fill();

  // Helmet & Plume
  ctx.fillStyle = u.isHero ? '#334155' : '#475569';
  ctx.beginPath();
  ctx.arc(0, -27.5, 5.1, Math.PI, Math.PI * 2);
  ctx.fill();
  if (u.isHero) {
    // Gold crest + fluttering crimson/gold helmet plume
    ctx.fillStyle = '#f7cd6d';
    ctx.fillRect(-5, -28.5, 10, 2);
    const plumeWave = Math.sin(time * 9 + u.animPhase) * 2.5;
    ctx.strokeStyle = u.hero?.rarity === 'SSR' ? '#f7cd6d' : '#e55b45';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -32.5);
    ctx.quadraticCurveTo(-8, -36 + plumeWave, -13, -31 + plumeWave);
    ctx.stroke();
  }

  // Weapon swing animation
  const swingAngle = isAttacking
    ? -0.8 + (1 - u.attackAnimTimer / 0.24) * 1.95
    : isCasting
    ? -0.95
    : Math.sin(u.animPhase) * 0.1;
  drawWeapon(ctx, u.weaponStyle, swingAngle, u.isHero, isCasting);

  // Attack slash arc VFX
  if (isAttacking && u.weaponStyle !== 'bow' && u.attackAnimTimer > 0.08) {
    ctx.strokeStyle = u.isHero ? 'rgba(255, 224, 130, 0.85)' : 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = u.isHero ? 3 : 2;
    ctx.beginPath();
    ctx.arc(10, -15, u.isHero ? 20 : 14, -Math.PI * 0.45, Math.PI * 0.38);
    ctx.stroke();
  }

  ctx.restore();

  // Hero Nameplate & HP Bar above head (unflipped!)
  if (u.isHero && u.hero) {
    const topY = (u.unitType === 'cavalry' ? -60 : -48) * u.scale;
    const barW = 46;
    const hpRatio = clamp(u.hp / u.maxHp, 0, 1);

    // Name pill
    ctx.font = 'bold 11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    const textW = Math.max(46, ctx.measureText(u.hero.name).width + 10);
    ctx.fillStyle = 'rgba(12, 16, 24, 0.82)';
    ctx.strokeStyle = u.side === 'attacker' ? '#49a888' : '#e55b45';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-textW / 2, topY - 16, textW, 15, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fdf8ec';
    ctx.fillText(u.hero.name, 0, topY - 5);

    // HP Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(-barW / 2, topY + 1, barW, 5);
    ctx.fillStyle = u.side === 'attacker' ? '#34d399' : '#f87171';
    ctx.fillRect(-barW / 2, topY + 1, barW * hpRatio, 5);
  } else if (u.hp < u.maxHp) {
    // Subtle mini HP bar for damaged soldiers
    const barW = 18;
    const hpRatio = clamp(u.hp / u.maxHp, 0, 1);
    const topY = u.unitType === 'cavalry' ? -40 : -32;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-barW / 2, topY, barW, 3);
    ctx.fillStyle = u.side === 'attacker' ? '#4ade80' : '#fb7185';
    ctx.fillRect(-barW / 2, topY, barW * hpRatio, 3);
  }

  ctx.restore();
}

// ============================================================================
// Skill VFX Renderer
// ============================================================================

function drawSkillVfx(ctx: CanvasRenderingContext2D, vfx: SkillVfx): void {
  const p = clamp(vfx.elapsed / vfx.duration, 0, 1);
  const alpha = p < 0.75 ? 1 : (1 - p) / 0.25;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);

  switch (vfx.type) {
    case 'wave': {
      // Giant glowing turquoise-gold tidal wave sweeping across battlefield
      const dir = vfx.side === 'attacker' ? 1 : -1;
      const startX = vfx.side === 'attacker' ? 60 : CANVAS_W - 60;
      const endX = vfx.side === 'attacker' ? CANVAS_W - 30 : 30;
      const cx = startX + (endX - startX) * p;

      const grad = ctx.createLinearGradient(cx - 110 * dir, 0, cx + 35 * dir, 0);
      grad.addColorStop(0, 'rgba(32, 160, 168, 0)');
      grad.addColorStop(0.55, 'rgba(45, 212, 191, 0.72)');
      grad.addColorStop(0.88, 'rgba(247, 205, 109, 0.92)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx - 120 * dir, FIELD_BOTTOM + 20);
      ctx.quadraticCurveTo(cx - 20 * dir, FIELD_TOP - 35, cx + 34 * dir, FIELD_TOP + 22);
      ctx.quadraticCurveTo(cx + 12 * dir, FIELD_TOP + 95, cx + 18 * dir, FIELD_BOTTOM + 20);
      ctx.closePath();
      ctx.fill();

      // Foam crest lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + 8 * dir, FIELD_TOP + 34, 24, 0, Math.PI * 1.3);
      ctx.stroke();
      break;
    }

    case 'heal': {
      // Sacred Mazu golden-jade light pillars
      const baseCenterX = vfx.side === 'attacker' ? 280 : 680;
      for (let i = -2; i <= 2; i++) {
        const px = baseCenterX + i * 74;
        const pillarW = 28 + Math.sin(p * Math.PI) * 14;
        const grad = ctx.createLinearGradient(px, FIELD_TOP - 110, px, FIELD_BOTTOM + 10);
        grad.addColorStop(0, 'rgba(247, 205, 109, 0)');
        grad.addColorStop(0.45, 'rgba(73, 220, 165, 0.45)');
        grad.addColorStop(0.85, 'rgba(247, 205, 109, 0.75)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(px - pillarW / 2, FIELD_TOP - 110, pillarW, FIELD_BOTTOM - FIELD_TOP + 120);
      }
      break;
    }

    case 'assassinate': {
      // Shadow-red lightning dash & crimson X-slash on target
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(vfx.originX, vfx.originY - 22);
      ctx.lineTo(vfx.targetX, vfx.targetY - 22);
      ctx.stroke();

      // Crimson X slash at target
      const r = 42 * Math.sin(Math.min(1, p * 1.5) * Math.PI * 0.5);
      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(vfx.targetX - r, vfx.targetY - 22 - r);
      ctx.lineTo(vfx.targetX + r, vfx.targetY - 22 + r);
      ctx.moveTo(vfx.targetX + r, vfx.targetY - 22 - r);
      ctx.lineTo(vfx.targetX - r, vfx.targetY - 22 + r);
      ctx.stroke();
      break;
    }

    case 'quake': {
      // Earth-shattering golden fissures on enemy frontline
      const cx = vfx.targetX;
      const cy = vfx.targetY;
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const len = (55 + (i % 2) * 35) * Math.min(1, p * 2.2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len * 0.55, cy + Math.sin(angle) * len * 0.25 + 6);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len * 0.4);
        ctx.stroke();
      }
      // Expanding shockwave ring
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.78)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 130 * p, 42 * p, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'lightning': {
      // 6 vertical golden Five-Thunder talisman bolts
      const bolts = vfx.bolts || [];
      bolts.forEach((b) => {
        if (vfx.elapsed < b.delay) return;
        const localP = clamp((vfx.elapsed - b.delay) / 0.45, 0, 1);
        if (localP >= 1) return;
        ctx.save();
        ctx.globalAlpha = 1 - localP;
        ctx.strokeStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(b.x, 0);
        let curX = b.x;
        for (let seg = 1; seg <= 6; seg++) {
          curX = b.x + (seg % 2 === 0 ? -10 : 10);
          ctx.lineTo(curX, (b.y * seg) / 6);
        }
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Ground thunder ring
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 34 * localP, 12 * localP, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      break;
    }

    case 'volley': {
      // Subtle crimson sky flash at launch
      const skyFlash = ctx.createRadialGradient(
        vfx.originX,
        FIELD_TOP - 30,
        10,
        vfx.originX,
        FIELD_TOP - 30,
        180
      );
      skyFlash.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
      skyFlash.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = skyFlash;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      break;
    }
  }

  ctx.restore();
}

// ============================================================================
// Main Component
// ============================================================================

export const SideBattleModal: React.FC<SideBattleModalProps> = ({
  battle,
  attackerHeroes,
  defenderHeroes,
  soundMuted,
  onToggleMute,
  onComplete,
  onAutoResolve,
}) => {
  const playerSide: Side =
    battle.march.faction === 'player' ? 'attacker' : 'defender';
  const attackerFaction = FACTIONS[battle.march.faction];
  const defenderFaction = FACTIONS[battle.defenderFaction];

  const [formation, setFormation] = useState<BattleFormation>('wedge');
  const [order, setOrder] = useState<ArmyOrder>('charge');
  const [hudState, setHudState] = useState<{
    attackerTroops: number;
    defenderTroops: number;
    playerHeroes: HeroHudSlot[];
  }>(() => ({
    attackerTroops: battle.march.troops,
    defenderTroops: battle.defenderTroops,
    playerHeroes: (playerSide === 'attacker' ? attackerHeroes : defenderHeroes)
      .slice(0, 3)
      .map((hero) => ({
        hero,
        hp: 300,
        maxHp: 300,
        mp: 40,
        alive: true,
      })),
  }));

  const [cutIn, setCutIn] = useState<CutInOverlay | null>(null);
  const [bannerResult, setBannerResult] = useState<{
    winner: Side;
    retreated: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mutedRef = useRef(soundMuted);
  mutedRef.current = soundMuted;

  const formationRef = useRef<BattleFormation>(formation);
  formationRef.current = formation;

  const orderRef = useRef<ArmyOrder>(order);
  orderRef.current = order;

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Mutable high-frequency simulation state inside ref for smooth 60fps loop
  const simRef = useRef<{
    units: BattleUnit[];
    projectiles: Projectile[];
    particles: Particle[];
    floats: FloatingText[];
    vfxList: SkillVfx[];
    highlights: string[];
    initialTotalHp: { attacker: number; defender: number };
    nextProjId: number;
    nextCutInId: number;
    shakeTimer: number;
    shakeIntensity: number;
    retreatTimer: number;
    ended: boolean;
    aiSkillCooldown: number;
  } | null>(null);

  // Initialize simulation once per battle
  useMemo(() => {
    const units = buildInitialUnits(
      battle,
      attackerHeroes,
      defenderHeroes,
      attackerFaction.color,
      defenderFaction.color
    );
    const atkHp = units
      .filter((u) => u.side === 'attacker')
      .reduce((s, u) => s + u.maxHp, 0);
    const defHp = units
      .filter((u) => u.side === 'defender')
      .reduce((s, u) => s + u.maxHp, 0);

    simRef.current = {
      units,
      projectiles: [],
      particles: [],
      floats: [],
      vfxList: [],
      highlights: [],
      initialTotalHp: {
        attacker: Math.max(1, atkHp),
        defender: Math.max(1, defHp),
      },
      nextProjId: 1,
      nextCutInId: 1,
      shakeTimer: 0,
      shakeIntensity: 0,
      retreatTimer: 0,
      ended: false,
      aiSkillCooldown: 4.5,
    };
  }, [battle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to execute a Hero Skill (used by both Player button & Enemy AI)
  const triggerHeroSkill = useCallback((casterUnitId: string) => {
    const sim = simRef.current;
    if (!sim || sim.ended) return;

    const caster = sim.units.find((u) => u.id === casterUnitId && u.hp > 0);
    if (!caster || !caster.hero) return;

    const hero = caster.hero;
    if (caster.mp < hero.skillCost) return;

    caster.mp = Math.max(0, caster.mp - hero.skillCost);
    caster.castAnimTimer = 0.75;
    caster.animState = 'cast';

    playSkillCast(hero.skillType, mutedRef.current);

    // Trigger 0.9s Hero Cut-in overlay
    const cutInId = sim.nextCutInId++;
    setCutIn({ hero, side: caster.side, id: cutInId });
    window.setTimeout(() => {
      setCutIn((prev) => (prev && prev.id === cutInId ? null : prev));
    }, 900);

    const enemySide: Side = caster.side === 'attacker' ? 'defender' : 'attacker';
    const enemies = sim.units.filter((u) => u.side === enemySide && u.hp > 0);
    const allies = sim.units.filter((u) => u.side === caster.side && u.hp > 0);
    const powerScale = 1 + (hero.might + hero.intel) / 170;

    const applyDamage = (target: BattleUnit, rawDmg: number, knockbackX = 0, stun = 0) => {
      const dmg = Math.max(8, Math.round(rawDmg - target.def * 0.35));
      target.hp = Math.max(0, target.hp - dmg);
      target.hitFlashTimer = 0.18;
      if (knockbackX !== 0) {
        target.x = clamp(target.x + knockbackX, 42, CANVAS_W - 42);
      }
      if (stun > 0) {
        target.stunTimer = Math.max(target.stunTimer, stun);
      }
      if (target.hp <= 0) {
        target.animState = 'dead';
      }
      sim.floats.push({
        x: target.x + (Math.random() - 0.5) * 14,
        y: target.y - 34,
        vy: -36,
        text: `-${dmg}`,
        color: '#fde047',
        life: 0.85,
        maxLife: 0.85,
        big: dmg >= 70,
      });
    };

    const dir = caster.side === 'attacker' ? 1 : -1;

    switch (hero.skillType) {
      case 'wave': {
        sim.shakeTimer = 0.45;
        sim.shakeIntensity = 6;
        sim.vfxList.push({
          type: 'wave',
          side: caster.side,
          elapsed: 0,
          duration: 1.05,
          originX: caster.x,
          originY: caster.y,
          targetX: CANVAS_W / 2,
          targetY: 310,
        });
        enemies.forEach((e) => {
          applyDamage(e, (52 + Math.random() * 18) * powerScale, 36 * dir, 0.35);
          for (let k = 0; k < 3; k++) {
            sim.particles.push({
              x: e.x,
              y: e.y - 12,
              vx: dir * (40 + Math.random() * 60),
              vy: -35 - Math.random() * 40,
              life: 0.55,
              maxLife: 0.55,
              size: 4,
              color: '#5eead4',
              kind: 'water',
            });
          }
        });
        sim.highlights.push(`${hero.name} 施放【${hero.skillName}】，狂濤橫掃敵軍！`);
        break;
      }

      case 'heal': {
        sim.vfxList.push({
          type: 'heal',
          side: caster.side,
          elapsed: 0,
          duration: 1.1,
          originX: caster.x,
          originY: caster.y,
          targetX: caster.x,
          targetY: caster.y,
        });
        allies.forEach((a) => {
          const healAmt = Math.round(a.maxHp * 0.28);
          a.hp = Math.min(a.maxHp, a.hp + healAmt);
          sim.floats.push({
            x: a.x,
            y: a.y - 36,
            vy: -28,
            text: `+${healAmt}`,
            color: '#6ee7b7',
            life: 0.9,
            maxLife: 0.9,
          });
          for (let k = 0; k < 3; k++) {
            sim.particles.push({
              x: a.x + (Math.random() - 0.5) * 16,
              y: a.y - 10,
              vx: (Math.random() - 0.5) * 18,
              vy: -40 - Math.random() * 25,
              life: 0.65,
              maxLife: 0.65,
              size: 3.5,
              color: '#f7cd6d',
              kind: 'heal',
            });
          }
        });
        sim.highlights.push(`${hero.name} 施放【${hero.skillName}】，聖光庇護全軍回血！`);
        break;
      }

      case 'assassinate': {
        sim.shakeTimer = 0.35;
        sim.shakeIntensity = 7;
        const target =
          enemies.find((e) => e.isHero) ||
          enemies.sort((a, b) => b.hp - a.hp)[0];
        if (target) {
          sim.vfxList.push({
            type: 'assassinate',
            side: caster.side,
            elapsed: 0,
            duration: 0.65,
            originX: caster.x,
            originY: caster.y,
            targetX: target.x,
            targetY: target.y,
          });
          applyDamage(target, 145 * powerScale, 20 * dir, 0.5);
          for (let k = 0; k < 12; k++) {
            sim.particles.push({
              x: target.x,
              y: target.y - 16,
              vx: (Math.random() - 0.5) * 130,
              vy: (Math.random() - 0.5) * 110,
              life: 0.45,
              maxLife: 0.45,
              size: 3.5,
              color: '#f87171',
              kind: 'spark',
            });
          }
        }
        sim.highlights.push(`${hero.name} 發動【${hero.skillName}】，直取敵將首級！`);
        break;
      }

      case 'quake': {
        sim.shakeTimer = 0.6;
        sim.shakeIntensity = 9;
        const frontEnemy = enemies.sort((a, b) =>
          caster.side === 'attacker' ? a.x - b.x : b.x - a.x
        )[0];
        const qx = frontEnemy ? frontEnemy.x : CANVAS_W / 2;
        const qy = frontEnemy ? frontEnemy.y : 310;
        sim.vfxList.push({
          type: 'quake',
          side: caster.side,
          elapsed: 0,
          duration: 0.95,
          originX: caster.x,
          originY: caster.y,
          targetX: qx,
          targetY: qy,
        });
        enemies.forEach((e) => {
          const dist = Math.hypot(e.x - qx, e.y - qy);
          if (dist < 220) {
            applyDamage(e, (68 + Math.random() * 18) * powerScale, 14 * dir, 1.0);
          }
        });
        sim.highlights.push(`${hero.name} 施放【${hero.skillName}】，大地崩裂震懾敵軍！`);
        break;
      }

      case 'lightning': {
        sim.shakeTimer = 0.5;
        sim.shakeIntensity = 7;
        const picked = [...enemies]
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);
        const bolts = Array.from({ length: 6 }, (_, i) => {
          const t = picked[i % Math.max(1, picked.length)];
          return {
            x: t ? t.x : CANVAS_W / 2 + (i - 2.5) * 55,
            y: t ? t.y : 290 + (i % 3) * 28,
            delay: i * 0.08,
          };
        });
        sim.vfxList.push({
          type: 'lightning',
          side: caster.side,
          elapsed: 0,
          duration: 1.0,
          originX: caster.x,
          originY: caster.y,
          targetX: CANVAS_W / 2,
          targetY: 300,
          bolts,
        });
        picked.forEach((e) => {
          applyDamage(e, (78 + Math.random() * 20) * powerScale, 0, 0.45);
        });
        sim.highlights.push(`${hero.name} 祭出【${hero.skillName}】，六道五雷轟擊敵陣！`);
        break;
      }

      case 'volley': {
        sim.shakeTimer = 0.25;
        sim.shakeIntensity = 4;
        sim.vfxList.push({
          type: 'volley',
          side: caster.side,
          elapsed: 0,
          duration: 0.75,
          originX: caster.x,
          originY: caster.y,
          targetX: CANVAS_W / 2,
          targetY: 300,
        });
        for (let i = 0; i < 24; i++) {
          const target =
            enemies.length > 0
              ? enemies[i % enemies.length]
              : null;
          const tx = target
            ? target.x + (Math.random() - 0.5) * 65
            : caster.side === 'attacker'
            ? 620 + Math.random() * 220
            : 120 + Math.random() * 220;
          const ty = target
            ? clamp(target.y + (Math.random() - 0.5) * 45, FIELD_TOP, FIELD_BOTTOM)
            : FIELD_TOP + Math.random() * (FIELD_BOTTOM - FIELD_TOP);

          sim.projectiles.push({
            id: sim.nextProjId++,
            side: caster.side,
            x: caster.x,
            y: caster.y - 24,
            startX: caster.x + (Math.random() - 0.5) * 40,
            startY: caster.y - 24 - Math.random() * 14,
            targetX: tx,
            targetY: ty,
            progress: -(i * 0.025),
            duration: 0.65 + Math.random() * 0.22,
            arcHeight: 115 + Math.random() * 45,
            damage: Math.round(28 * powerScale),
            flaming: true,
          });
        }
        sim.highlights.push(`${hero.name} 下令【${hero.skillName}】，漫天火箭覆蓋敵陣！`);
        break;
      }
    }
  }, []);

  // Main 60fps requestAnimationFrame Loop
  useEffect(() => {
    playBattleStart(mutedRef.current);

    let rafId = 0;
    let lastTs = performance.now();
    let elapsedTotal = 0;
    let hudSyncAccum = 0;
    let finishTimeoutId: number | null = null;

    const getLiveTroops = (side: Side): number => {
      const sim = simRef.current;
      if (!sim) return 0;
      const startTroops =
        side === 'attacker' ? battle.march.troops : battle.defenderTroops;
      const aliveHp = sim.units
        .filter((u) => u.side === side && u.hp > 0)
        .reduce((s, u) => s + u.hp, 0);
      if (aliveHp <= 0) return 0;
      const ratio = aliveHp / sim.initialTotalHp[side];
      return Math.max(1, Math.round(startTroops * ratio));
    };

    const finishBattle = (winner: Side, retreated: boolean) => {
      const sim = simRef.current;
      if (!sim || sim.ended || completedRef.current) return;
      sim.ended = true;

      const attackerTroopsEnd =
        winner === 'defender' && !retreated
          ? 0
          : getLiveTroops('attacker');
      const defenderTroopsEnd =
        winner === 'attacker' && !retreated
          ? 0
          : getLiveTroops('defender');

      if (retreated) {
        sim.highlights.push('我軍吹響鳴金收兵號角，有序掩護撤退！');
      }

      const playerWon = winner === playerSide;
      if (playerWon) {
        playVictory(mutedRef.current);
      } else {
        playDefeat(mutedRef.current);
      }

      setBannerResult({ winner, retreated });
      setHudState((prev) => ({
        ...prev,
        attackerTroops: attackerTroopsEnd,
        defenderTroops: defenderTroopsEnd,
      }));

      finishTimeoutId = window.setTimeout(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        onCompleteRef.current({
          attackerTroopsEnd,
          defenderTroopsEnd,
          winner,
          highlights: sim.highlights.slice(0, 6),
        });
      }, 1250);
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      elapsedTotal += dt;

      const sim = simRef.current;
      const canvas = canvasRef.current;
      if (!sim || !canvas) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // ---- Simulation Step ----
      if (!sim.ended) {
        if (sim.shakeTimer > 0) {
          sim.shakeTimer = Math.max(0, sim.shakeTimer - dt);
        }

        // Retreat countdown
        if (orderRef.current === 'retreat') {
          sim.retreatTimer += dt;
          if (sim.retreatTimer >= 1.15) {
            const enemyWinner: Side =
              playerSide === 'attacker' ? 'defender' : 'attacker';
            finishBattle(enemyWinner, true);
          }
        } else {
          sim.retreatTimer = 0;
        }

        // Enemy AI occasional skill cast
        sim.aiSkillCooldown -= dt;
        if (sim.aiSkillCooldown <= 0) {
          const enemySide: Side =
            playerSide === 'attacker' ? 'defender' : 'attacker';
          const readyAiHero = sim.units.find(
            (u) =>
              u.side === enemySide &&
              u.isHero &&
              u.hp > 0 &&
              u.hero &&
              u.mp >= 98
          );
          if (readyAiHero) {
            triggerHeroSkill(readyAiHero.id);
            sim.aiSkillCooldown = 7.5;
          }
        }

        // Update Units
        const aliveAttackers = sim.units.filter(
          (u) => u.side === 'attacker' && u.hp > 0
        );
        const aliveDefenders = sim.units.filter(
          (u) => u.side === 'defender' && u.hp > 0
        );

        if (aliveAttackers.length === 0) {
          finishBattle('defender', false);
        } else if (aliveDefenders.length === 0) {
          finishBattle('attacker', false);
        }

        for (const u of sim.units) {
          if (u.hp <= 0) {
            u.animState = 'dead';
            continue;
          }

          u.hitFlashTimer = Math.max(0, u.hitFlashTimer - dt);
          u.attackAnimTimer = Math.max(0, u.attackAnimTimer - dt);
          u.castAnimTimer = Math.max(0, u.castAnimTimer - dt);
          u.stunTimer = Math.max(0, u.stunTimer - dt);
          u.attackTimer = Math.max(0, u.attackTimer - dt);

          // Passive MP regeneration for heroes
          if (u.isHero) {
            u.mp = Math.min(u.maxMp, u.mp + dt * 6.8);
          }

          if (u.stunTimer > 0) {
            u.animState = 'hit';
            continue;
          }

          const isPlayerUnit = u.side === playerSide;
          const activeFormation: BattleFormation = isPlayerUnit
            ? formationRef.current
            : 'square';
          const activeOrder: ArmyOrder = isPlayerUnit
            ? orderRef.current
            : 'charge';

          // Formation & Order modifiers
          let atkMult = 1;
          let defMult = 1;
          let speedMult = 1;
          let rangeMult = 1;
          let cdMult = 1;

          if (activeFormation === 'wedge') {
            atkMult *= 1.18;
            speedMult *= 1.2;
          } else if (activeFormation === 'square') {
            defMult *= 1.22;
          } else if (activeFormation === 'echelon' && u.unitType === 'archer') {
            rangeMult *= 1.25;
            cdMult *= 0.8; // +25% fire rate
          }

          if (activeOrder === 'hold') {
            defMult *= 1.12;
          } else if (activeOrder === 'hero_rush' && u.isHero) {
            speedMult *= 1.35;
            atkMult *= 1.15;
          }

          // Retreat behavior
          if (isPlayerUnit && activeOrder === 'retreat') {
            const retreatX = u.side === 'attacker' ? 28 : CANVAS_W - 28;
            const dx = retreatX - u.x;
            u.facing = dx >= 0 ? 1 : -1;
            u.x = clamp(u.x + Math.sign(dx) * u.speed * 1.25 * dt, 24, CANVAS_W - 24);
            u.animState = 'move';
            u.animPhase += dt * 10;
            continue;
          }

          const enemies =
            u.side === 'attacker' ? aliveDefenders : aliveAttackers;
          if (enemies.length === 0) {
            u.animState = 'idle';
            continue;
          }

          // Find nearest enemy
          let nearest = enemies[0];
          let minDist = Infinity;
          for (const e of enemies) {
            const d = Math.hypot(e.x - u.x, (e.y - u.y) * 1.45);
            if (d < minDist) {
              minDist = d;
              nearest = e;
            }
          }

          const effectiveRange = u.range * rangeMult;
          u.facing = nearest.x >= u.x ? 1 : -1;

          if (minDist <= effectiveRange) {
            // Attack!
            if (u.attackTimer <= 0) {
              u.attackTimer = u.attackCooldown * cdMult;
              u.attackAnimTimer = 0.24;
              u.animState = 'attack';

              const isRanged =
                u.unitType === 'archer' ||
                u.weaponStyle === 'bow' ||
                u.weaponStyle === 'fan';

              if (isRanged) {
                playArrowShot(mutedRef.current);
                sim.projectiles.push({
                  id: sim.nextProjId++,
                  side: u.side,
                  x: u.x,
                  y: u.y - 18,
                  startX: u.x,
                  startY: u.y - 18,
                  targetX: nearest.x + (Math.random() - 0.5) * 14,
                  targetY: nearest.y,
                  progress: 0,
                  duration: clamp(minDist / 410, 0.32, 0.72),
                  arcHeight: clamp(minDist * 0.24, 24, 92),
                  damage: Math.round(u.atk * atkMult),
                  flaming: u.isHero,
                });
              } else {
                playSwordClash(mutedRef.current);
                const crit = u.isHero && Math.random() < 0.22;
                const rawDmg = u.atk * atkMult * (crit ? 1.55 : 1);
                const targetIsSquare =
                  nearest.side === playerSide &&
                  formationRef.current === 'square';
                const targetDef = nearest.def * (targetIsSquare ? 1.22 : 1);
                const dmg = Math.max(
                  4,
                  Math.round(rawDmg - targetDef * 0.42 + (Math.random() * 4 - 2))
                );

                nearest.hp = Math.max(0, nearest.hp - dmg);
                nearest.hitFlashTimer = 0.14;
                if (u.isHero) u.mp = Math.min(u.maxMp, u.mp + 2.2);
                if (nearest.isHero) nearest.mp = Math.min(nearest.maxMp, nearest.mp + 1.8);
                if (nearest.hp <= 0) nearest.animState = 'dead';

                // Spark burst
                for (let s = 0; s < (crit ? 6 : 3); s++) {
                  sim.particles.push({
                    x: (u.x + nearest.x) * 0.5,
                    y: (u.y + nearest.y) * 0.5 - 16,
                    vx: (Math.random() - 0.5) * 95,
                    vy: -30 - Math.random() * 65,
                    life: 0.28,
                    maxLife: 0.28,
                    size: crit ? 3.2 : 2.2,
                    color: crit ? '#fde047' : '#fef3c7',
                    kind: 'spark',
                  });
                }

                // Floating damage number (for heroes or crits, or occasional soldier hits)
                if (u.isHero || nearest.isHero || crit || Math.random() < 0.22) {
                  sim.floats.push({
                    x: nearest.x + (Math.random() - 0.5) * 10,
                    y: nearest.y - 30,
                    vy: -32,
                    text: crit ? `暴擊 -${dmg}` : `-${dmg}`,
                    color: crit ? '#fbbf24' : '#ffffff',
                    life: 0.65,
                    maxLife: 0.65,
                    big: crit,
                  });
                }
              }
            } else if (u.attackAnimTimer <= 0 && u.castAnimTimer <= 0) {
              u.animState = 'idle';
            }
          } else {
            // Should unit advance or hold?
            const shouldHold =
              isPlayerUnit &&
              activeOrder === 'hold' &&
              Math.abs(u.x - u.homeX) < 42 &&
              minDist > 120;

            if (shouldHold) {
              u.animState = 'idle';
            } else {
              const dx = nearest.x - u.x;
              const dy = nearest.y - u.y;
              const len = Math.max(1, Math.hypot(dx, dy));
              const spd = u.speed * speedMult;
              u.x = clamp(u.x + (dx / len) * spd * dt, 36, CANVAS_W - 36);
              u.y = clamp(
                u.y + (dy / len) * spd * 0.55 * dt,
                FIELD_TOP + 8,
                FIELD_BOTTOM - 8
              );
              u.animState = 'move';
              u.animPhase += dt * (u.unitType === 'cavalry' ? 11 : 8.5);

              // Subtle stride dust puffs
              if (Math.random() < (u.unitType === 'cavalry' ? 0.22 : 0.08)) {
                sim.particles.push({
                  x: u.x - u.facing * 6,
                  y: u.y + 1,
                  vx: -u.facing * (14 + Math.random() * 16),
                  vy: -8 - Math.random() * 12,
                  life: 0.36,
                  maxLife: 0.36,
                  size: u.unitType === 'cavalry' ? 4.5 : 3,
                  color: 'rgba(218, 198, 160, 0.55)',
                  kind: 'dust',
                });
              }
            }
          }

          // Keep defMult referenced cleanly for defensive aura
          void defMult;
        }

        // Update Projectiles (Arcing Arrows & Flaming Volley)
        for (let i = sim.projectiles.length - 1; i >= 0; i--) {
          const p = sim.projectiles[i];
          p.progress += dt / p.duration;
          if (p.progress < 0) continue;

          if (p.progress >= 1) {
            // Arrow impact check
            const enemySide: Side =
              p.side === 'attacker' ? 'defender' : 'attacker';
            const hitTarget = sim.units.find(
              (u) =>
                u.side === enemySide &&
                u.hp > 0 &&
                Math.hypot(u.x - p.targetX, u.y - p.targetY) < (p.flaming ? 46 : 30)
            );
            if (hitTarget) {
              const dmg = Math.max(4, Math.round(p.damage - hitTarget.def * 0.35));
              hitTarget.hp = Math.max(0, hitTarget.hp - dmg);
              hitTarget.hitFlashTimer = 0.12;
              if (hitTarget.hp <= 0) hitTarget.animState = 'dead';
              if (p.flaming || hitTarget.isHero) {
                sim.floats.push({
                  x: hitTarget.x,
                  y: hitTarget.y - 28,
                  vy: -30,
                  text: `-${dmg}`,
                  color: p.flaming ? '#fb923c' : '#e2e8f0',
                  life: 0.6,
                  maxLife: 0.6,
                });
              }
            }
            if (p.flaming) {
              for (let k = 0; k < 4; k++) {
                sim.particles.push({
                  x: p.targetX,
                  y: p.targetY - 6,
                  vx: (Math.random() - 0.5) * 65,
                  vy: -25 - Math.random() * 45,
                  life: 0.35,
                  maxLife: 0.35,
                  size: 3.2,
                  color: '#fb923c',
                  kind: 'ember',
                });
              }
            }
            sim.projectiles.splice(i, 1);
            continue;
          }

          const t = p.progress;
          p.x = p.startX + (p.targetX - p.startX) * t;
          const linearY = p.startY + (p.targetY - p.startY) * t;
          p.y = linearY - Math.sin(t * Math.PI) * p.arcHeight;
        }
      }

      // Update Particles
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const pt = sim.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          sim.particles.splice(i, 1);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.kind === 'spark' || pt.kind === 'ember') {
          pt.vy += 180 * dt;
        }
      }

      // Update Floating Damage Numbers
      for (let i = sim.floats.length - 1; i >= 0; i--) {
        const fl = sim.floats[i];
        fl.life -= dt;
        if (fl.life <= 0) {
          sim.floats.splice(i, 1);
          continue;
        }
        fl.y += fl.vy * dt;
      }

      // Update Skill VFX
      for (let i = sim.vfxList.length - 1; i >= 0; i--) {
        const fx = sim.vfxList[i];
        fx.elapsed += dt;
        if (fx.elapsed >= fx.duration) {
          sim.vfxList.splice(i, 1);
        }
      }

      // ---- Render Frame ----
      ctx.save();
      if (sim.shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * sim.shakeIntensity * 2;
        const sy = (Math.random() - 0.5) * sim.shakeIntensity * 2;
        ctx.translate(sx, sy);
      }

      drawTaiwanBackdrop(ctx, battle.terrain, elapsedTotal);

      // Depth-sort units by Y
      const sortedUnits = [...sim.units].sort((a, b) => a.y - b.y);
      for (const u of sortedUnits) {
        drawUnit(ctx, u, elapsedTotal);
      }

      // Draw Projectiles
      for (const p of sim.projectiles) {
        if (p.progress < 0) continue;
        const t = p.progress;
        const dx = p.targetX - p.startX;
        const dy =
          p.targetY - p.startY - Math.cos(t * Math.PI) * Math.PI * p.arcHeight;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = p.flaming ? '#fb923c' : '#f8fafc';
        ctx.lineWidth = p.flaming ? 2.4 : 1.7;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Arrowhead / Flame tip
        ctx.fillStyle = p.flaming ? '#fef08a' : '#f7cd6d';
        ctx.beginPath();
        ctx.arc(8, 0, p.flaming ? 3.2 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Particles
      for (const pt of sim.particles) {
        ctx.save();
        ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Skill VFX on top of units
      for (const fx of sim.vfxList) {
        drawSkillVfx(ctx, fx);
      }

      // Draw Floating Damage Numbers
      for (const fl of sim.floats) {
        ctx.save();
        ctx.globalAlpha = clamp(fl.life / fl.maxLife, 0, 1);
        ctx.font = fl.big
          ? '900 16px "Noto Sans TC", sans-serif'
          : 'bold 12px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(10, 12, 16, 0.85)';
        ctx.strokeText(fl.text, fl.x, fl.y);
        ctx.fillStyle = fl.color;
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();
      }

      ctx.restore();

      // Sync React HUD at ~10Hz (keeps React super light while Canvas runs 60fps)
      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.1) {
        hudSyncAccum = 0;
        const pHeroes: HeroHudSlot[] = sim.units
          .filter((u) => u.side === playerSide && u.isHero && u.hero)
          .map((u) => ({
            hero: u.hero!,
            hp: Math.ceil(u.hp),
            maxHp: u.maxHp,
            mp: Math.floor(u.mp),
            alive: u.hp > 0,
          }));

        setHudState({
          attackerTroops: getLiveTroops('attacker'),
          defenderTroops: getLiveTroops('defender'),
          playerHeroes: pHeroes,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimeoutId !== null) {
        window.clearTimeout(finishTimeoutId);
      }
    };
  }, [battle.id, battle.march.troops, battle.defenderTroops, battle.terrain, playerSide, triggerHeroSkill]);

  const totalLiveTroops = Math.max(
    1,
    hudState.attackerTroops + hudState.defenderTroops
  );
  const attackerPct = clamp(
    (hudState.attackerTroops / totalLiveTroops) * 100,
    0,
    100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06090f]/88 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-[1020px] rounded-2xl border-2 border-[#d4aa5a]/75 bg-gradient-to-b from-[#1a1310] via-[#130f0d] to-[#0b0f17] shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_32px_rgba(247,205,109,0.2)] overflow-y-auto flex flex-col max-h-[94vh]">
        {/* ================= TOP HUD ================= */}
        <div className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-[#1d1410] via-[#261a14] to-[#1d1410] border-b border-[#d4aa5a]/40 flex flex-wrap items-center justify-between gap-2">
          {/* Attacker Side */}
          <div className="flex items-center gap-2.5 min-w-[140px]">
            <span
              className="w-3 h-8 rounded-full border border-[#f7cd6d]/70 shrink-0"
              style={{ backgroundColor: attackerFaction.color }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wider text-[#f7cd6d]">
                  攻方
                </span>
                <span className="text-sm font-display font-bold text-[#fdf8ec]">
                  {attackerFaction.name}
                </span>
              </div>
              <div className="text-lg font-black tabular-nums text-[#6ee7b7] leading-tight">
                {hudState.attackerTroops.toLocaleString()}
                <span className="text-[11px] font-normal text-[#e4c890]/75 ml-1">
                  兵力
                </span>
              </div>
            </div>
          </div>

          {/* Center Tug-of-War Morale / Troop Bar */}
          <div className="flex-1 min-w-[190px] max-w-[360px] flex flex-col items-center">
            <div className="text-[11px] font-display tracking-widest text-[#f7cd6d] mb-1">
              {TERRAIN_TITLES[battle.terrain]}
            </div>
            <div className="w-full h-3.5 rounded-full bg-[#090d14] border border-[#d4aa5a]/60 overflow-hidden flex shadow-inner">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${attackerPct}%`,
                  background: `linear-gradient(90deg, ${attackerFaction.color}, #6ee7b7)`,
                }}
              />
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${100 - attackerPct}%`,
                  background: `linear-gradient(90deg, #f87171, ${defenderFaction.color})`,
                }}
              />
            </div>
          </div>

          {/* Defender Side + Action Controls */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-display font-bold text-[#fdf8ec]">
                  {defenderFaction.name}
                </span>
                <span className="text-xs font-bold tracking-wider text-[#f87171]">
                  守方
                </span>
              </div>
              <div className="text-lg font-black tabular-nums text-[#fca5a5] leading-tight">
                {hudState.defenderTroops.toLocaleString()}
                <span className="text-[11px] font-normal text-[#e4c890]/75 ml-1">
                  兵力
                </span>
              </div>
            </div>
            <span
              className="w-3 h-8 rounded-full border border-[#f7cd6d]/70 shrink-0"
              style={{ backgroundColor: defenderFaction.color }}
            />

            <div className="flex items-center gap-1.5 pl-1 border-l border-[#d4aa5a]/30">
              <button
                type="button"
                onClick={onToggleMute}
                title={soundMuted ? '開啟戰場音效' : '靜音'}
                className="px-2.5 py-1.5 rounded-lg border border-[#d4aa5a]/45 bg-[#121822] hover:bg-[#1e293b] text-xs font-bold text-[#fdf8ec] transition cursor-pointer"
              >
                {soundMuted ? '🔇' : '🔊'}
              </button>
              <button
                type="button"
                onClick={onAutoResolve}
                className="px-2.5 py-1.5 rounded-lg border border-[#f7cd6d]/60 bg-gradient-to-b from-[#9c6f26] to-[#684614] hover:brightness-110 text-xs font-bold text-[#fef3c7] shadow transition cursor-pointer whitespace-nowrap"
              >
                ⚡ 委任快速結算
              </button>
            </div>
          </div>
        </div>

        {/* ================= 60FPS TACTICAL CANVAS STAGE ================= */}
        <div className="relative w-full bg-[#090d14] select-none overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-auto aspect-[960/420] block"
          />

          {/* Dramatic 0.9s Hero Portrait Cut-in Overlay */}
          {cutIn && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div
                className={`w-full py-3 px-6 flex items-center justify-center gap-5 border-y-2 shadow-[0_0_45px_rgba(0,0,0,0.85)] animate-pulse ${
                  cutIn.side === playerSide
                    ? 'bg-gradient-to-r from-[#090d14]/15 via-[#183d34]/95 to-[#090d14]/15 border-[#f7cd6d]'
                    : 'bg-gradient-to-r from-[#090d14]/15 via-[#5c1814]/95 to-[#090d14]/15 border-[#f87171]'
                }`}
              >
                <HeroAvatar
                  hero={cutIn.hero}
                  className="w-16 h-16 sm:w-20 sm:h-20 shadow-[0_0_24px_rgba(247,205,109,0.7)]"
                />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <RarityBadge rarity={cutIn.hero.rarity} />
                    <span className="text-xs sm:text-sm font-bold tracking-widest text-[#e4c890]">
                      {cutIn.hero.title} ・ {cutIn.hero.name}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black tracking-[0.15em] text-[#fef3c7] drop-shadow-[0_2px_10px_rgba(245,158,11,0.85)] mt-0.5">
                    【{cutIn.hero.skillName}】
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1.2s Victory / Defeat / Retreat Banner */}
          {bannerResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#06090f]/60 backdrop-blur-[2px]">
              <div
                className={`px-10 py-5 rounded-2xl border-2 text-center shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
                  bannerResult.winner === playerSide
                    ? 'bg-gradient-to-b from-[#1a4738]/95 to-[#0f2920]/95 border-[#f7cd6d]'
                    : 'bg-gradient-to-b from-[#5c1914]/95 to-[#2b0c09]/95 border-[#f87171]'
                }`}
              >
                <div className="text-3xl sm:text-4xl font-display font-black tracking-[0.2em] text-[#fef3c7] drop-shadow">
                  {bannerResult.retreated
                    ? '鳴金收兵'
                    : bannerResult.winner === playerSide
                    ? '大獲全勝！'
                    : '戰陣失利'}
                </div>
                <div className="text-xs sm:text-sm text-[#e4c890] mt-1.5 tracking-widest">
                  {bannerResult.winner === 'attacker'
                    ? `${attackerFaction.name} 攻克戰場`
                    : `${defenderFaction.name} 堅守勝出`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= TACTICAL COMMAND & HERO SKILL BAR ================= */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-gradient-to-b from-[#17120f] to-[#0f141e] border-t border-[#d4aa5a]/40 space-y-3 overflow-y-auto">
          {/* Subtle Mobile Portrait Landscape-Tip */}
          <div className="sm:hidden flex items-center justify-center rounded-lg border border-[#d4aa5a]/25 bg-[#121824]/80 px-2.5 py-1 text-[11px] font-medium text-[#e4c890]/85">
            📱 橫放手機可獲更寬廣戰場視野
          </div>

          {/* Row 1: Formation Selector + Army Orders */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Formations */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#e4c890]/85 mr-0.5">
                陣型變換
              </span>
              {(['wedge', 'square', 'echelon'] as BattleFormation[]).map((f) => {
                const info = FORMATION_INFO[f];
                const active = formation === f;
                return (
                  <button
                    key={f}
                    type="button"
                    title={info.desc}
                    onClick={() => setFormation(f)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'border-[#f7cd6d] bg-gradient-to-b from-[#3d2d16] to-[#261b0c] text-[#fef3c7] shadow-[0_0_12px_rgba(247,205,109,0.3)]'
                        : 'border-[#d4aa5a]/30 bg-[#141a24] text-[#cbd5e1] hover:border-[#d4aa5a]/65'
                    }`}
                  >
                    <span>{info.label}</span>
                    <span className="text-[10px] text-[#f7cd6d]/90 hidden md:inline">
                      {info.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Army Orders */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#e4c890]/85 mr-0.5">
                軍令指揮
              </span>
              {ORDER_INFO.map((ord) => {
                const active = order === ord.id;
                const isRetreat = ord.id === 'retreat';
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setOrder(ord.id)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      active
                        ? isRetreat
                          ? 'border-[#f87171] bg-[#7f1d1d] text-[#fee2e2]'
                          : 'border-[#6ee7b7] bg-[#134739] text-[#ecfdf5] shadow-[0_0_10px_rgba(73,168,136,0.35)]'
                        : 'border-[#d4aa5a]/30 bg-[#141a24] text-[#cbd5e1] hover:border-[#d4aa5a]/65'
                    }`}
                  >
                    {ord.icon} {ord.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Player Hero Skill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {hudState.playerHeroes.length === 0 ? (
              <div className="sm:col-span-3 text-center py-2 text-xs text-[#e4c890]/75 bg-[#121824]/70 rounded-lg border border-[#d4aa5a]/25">
                本隊未編制隨行武將，由基層軍校率領義軍奮勇作戰！
              </div>
            ) : (
              hudState.playerHeroes.map((slot) => {
                const ready = slot.alive && slot.mp >= slot.hero.skillCost;
                const mpPct = clamp(
                  (slot.mp / Math.max(1, slot.hero.skillCost)) * 100,
                  0,
                  100
                );
                const hpPct = clamp(
                  (slot.hp / Math.max(1, slot.maxHp)) * 100,
                  0,
                  100
                );
                const unitId = `${playerSide}-hero-${slot.hero.id}`;

                return (
                  <div
                    key={slot.hero.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition ${
                      !slot.alive
                        ? 'border-slate-700/60 bg-slate-900/50 opacity-50 grayscale'
                        : ready
                        ? 'border-[#f7cd6d] bg-gradient-to-r from-[#2c1f10] via-[#221a12] to-[#1a1f2b] shadow-[0_0_16px_rgba(247,205,109,0.28)]'
                        : 'border-[#d4aa5a]/30 bg-[#121824]/90'
                    }`}
                  >
                    <HeroAvatar hero={slot.hero} className="w-12 h-12 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#fdf8ec] truncate">
                          {slot.hero.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#f7cd6d] truncate">
                          {slot.hero.skillName}
                        </span>
                      </div>

                      {/* HP mini bar */}
                      <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden mt-1">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-150"
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>

                      {/* MP gauge */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-black/70 border border-[#d4aa5a]/30 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-150 ${
                              ready
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-200'
                                : 'bg-gradient-to-r from-sky-500 to-cyan-300'
                            }`}
                            style={{ width: `${mpPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-[#e4c890] shrink-0">
                          {slot.mp}/{slot.hero.skillCost}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!ready}
                      title={slot.hero.skillDesc}
                      onClick={() => triggerHeroSkill(unitId)}
                      className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap border transition active:scale-95 ${
                        ready
                          ? 'border-[#fef08a] bg-gradient-to-b from-[#f59e0b] to-[#b45309] text-[#1a1006] shadow-[0_0_14px_rgba(245,158,11,0.65)] hover:brightness-110 cursor-pointer animate-pulse'
                          : 'border-slate-700 bg-slate-800/80 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      ⚡ 施放武將技
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
