import {
  BUILDINGS,
  CROPS,
  DISTRICT_LIST,
  DISTRICTS,
  FACTIONS,
  HERO_LIST,
  HEROES,
  HISTORICAL_EVENT_LIST,
  HISTORICAL_EVENTS,
  getGameCalendar,
} from '../data';
import type {
  AutoModeConfig,
  BattleReport,
  BuildingType,
  CapturedPrisonerPrompt,
  CropId,
  DifficultyLevel,
  DistrictConfig,
  DistrictId,
  DistrictState,
  FactionId,
  FarmPlotState,
  GameMode,
  GameState,
  ManualBattleOutcome,
  MarchOrder,
  OfficerState,
  ResolvedHistoricalEvent,
  UnitType,
} from '../types/game';

export const SAVE_KEY = 'taiwan_strategy_save_v1';
export const SAVE_KEY_STORY = 'taiwan_strategy_save_story_v1';
export const SAVE_KEY_ENDLESS = 'taiwan_strategy_save_endless_v1';
export const EXPLORE_COST_GOLD = 80;
export const RECRUIT_COST_GOLD = 150;
export const REWARD_COST_GOLD = 120;
export const MARCH_LAND_DURATION = 8;
export const MARCH_SEA_DURATION = 14;
export const AI_MARCH_LAND_DURATION = 16;
export const AI_MARCH_SEA_DURATION = 22;
export const AI_CHECK_INTERVAL_SEC = 45;
export const AI_CHECK_INTERVAL_ENDLESS_SEC = Math.round(AI_CHECK_INTERVAL_SEC * 0.78);
export const MAX_BATTLE_REPORTS = 40;

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  desc: string;
  enemyInitialMult: number;
  enemyRegenMult: number;
  enemyCombatMult: number;
  aiAttackIntervalSec: number;
  aiMinTroopsToAttack: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: '簡單',
    desc: '敵軍溫和、適合輕鬆種田',
    enemyInitialMult: 0.75,
    enemyRegenMult: 0.6,
    enemyCombatMult: 0.85,
    aiAttackIntervalSec: 75,
    aiMinTroopsToAttack: 650,
  },
  normal: {
    id: 'normal',
    label: '普通',
    desc: '標準台海戰略平衡',
    enemyInitialMult: 1.0,
    enemyRegenMult: 1.0,
    enemyCombatMult: 1.0,
    aiAttackIntervalSec: 45,
    aiMinTroopsToAttack: 450,
  },
  hard: {
    id: 'hard',
    label: '困難',
    desc: '敵軍積極反撲、戰力提升',
    enemyInitialMult: 1.25,
    enemyRegenMult: 1.4,
    enemyCombatMult: 1.15,
    aiAttackIntervalSec: 24,
    aiMinTroopsToAttack: 360,
  },
  hell: {
    id: 'hell',
    label: '煉獄',
    desc: '台海修羅場、全面猛攻',
    enemyInitialMult: 1.5,
    enemyRegenMult: 1.8,
    enemyCombatMult: 1.3,
    aiAttackIntervalSec: 16,
    aiMinTroopsToAttack: 300,
  },
};

export const DEFAULT_AUTO_MODE: AutoModeConfig = {
  enabled: false,
  autoFarm: true,
  autoRecruit: true,
  autoAttack: true,
};

export function getSaveKeyForMode(mode: GameMode): string {
  return mode === 'endless' ? SAVE_KEY_ENDLESS : SAVE_KEY_STORY;
}

export interface DistrictStats {
  foodMultiplier: number;
  goldMultiplier: number;
  defenseBonus: number;
  maxTroops: number;
  passiveGoldPerSec: number;
  passiveTroopsPerSec: number;
  assignedHeroes: OfficerState[];
  activeBonds: string[];
}

function createInitialPlots(maxPlots: number, isStartingCapital: boolean): FarmPlotState[] {
  const plots: FarmPlotState[] = [];
  for (let i = 0; i < maxPlots; i++) {
    if (isStartingCapital && i === 0) {
      const riceGrow = CROPS.rice.growTimeSec;
      const halfGrow = Math.floor(riceGrow / 2);
      plots.push({
        plotIndex: i,
        cropId: 'rice',
        plantedAt: -halfGrow,
        matureAt: riceGrow - halfGrow,
        unlocked: true,
      });
    } else {
      plots.push({
        plotIndex: i,
        cropId: null,
        plantedAt: null,
        matureAt: null,
        unlocked: isStartingCapital && i < 3,
      });
    }
  }
  return plots;
}

function createInitialDistrictState(
  config: DistrictConfig,
  startingDistrictId: DistrictId = 'tainan',
  enemyInitialMult = 1
): DistrictState {
  const isStarting = config.id === startingDistrictId;
  const isDisplacedTainan = config.id === 'tainan' && startingDistrictId !== 'tainan';
  const faction = isStarting
    ? 'player'
    : isDisplacedTainan
      ? 'south_pirates'
      : config.initialFaction;
  const isNeutral = faction === 'neutral';
  const troops = isStarting
    ? 650
    : isDisplacedTainan
      ? Math.round(280 * enemyInitialMult)
      : Math.round(config.initialTroops * enemyInitialMult);

  return {
    id: config.id,
    faction,
    troops,
    garrisonHeroIds: [],
    buildings: isStarting
      ? { granary: 1, barracks: 1, wall: 2, market: 1 }
      : {
          granary: isNeutral ? 0 : 1,
          barracks: 1,
          wall: config.initialWallLevel,
          market: isNeutral ? 0 : 1,
        },
    plots: createInitialPlots(config.maxFarmPlots, isStarting),
    morale: 100,
  };
}

export function createInitialGameState(
  mode: GameMode = 'story',
  startingDistrictId: DistrictId = 'tainan',
  difficulty: DifficultyLevel = 'normal'
): GameState {
  const validStartId: DistrictId = DISTRICTS[startingDistrictId]
    ? startingDistrictId
    : 'tainan';
  const validDifficulty: DifficultyLevel = DIFFICULTY_CONFIGS[difficulty]
    ? difficulty
    : 'normal';
  const enemyInitialMult = DIFFICULTY_CONFIGS[validDifficulty].enemyInitialMult;
  const districts = {} as Record<DistrictId, DistrictState>;

  for (const config of DISTRICT_LIST) {
    districts[config.id] = createInitialDistrictState(
      config,
      validStartId,
      enemyInitialMult
    );
  }

  // Ensure at least 1 adjacent neighbor of the starting capital has a manageable garrison
  const manageableCap = Math.round(300 * enemyInitialMult);
  const startNeighbors = DISTRICTS[validStartId]?.neighbors ?? [];
  if (startNeighbors.length > 0) {
    const hasManageableNeighbor = startNeighbors.some(
      (nId) => districts[nId].troops <= manageableCap
    );
    if (!hasManageableNeighbor) {
      let weakestId = startNeighbors[0];
      for (const nId of startNeighbors) {
        if (districts[nId].troops < districts[weakestId].troops) {
          weakestId = nId;
        }
      }
      districts[weakestId] = {
        ...districts[weakestId],
        troops: Math.round(280 * enemyInitialMult),
      };
    }
  }

  // Initialize all 39 RTK11 officers
  const officers: Record<string, OfficerState> = {};

  for (const hero of HERO_LIST) {
    if (hero.initialStatus === 'free') {
      officers[hero.id] = {
        heroId: hero.id,
        faction: 'free',
        districtId: hero.originDistrict,
        discovered: false,
        loyalty: 65,
        prisonerOf: null,
        inMarchId: null,
        level: 1,
        exp: 0,
      };
    } else {
      const originDist = districts[hero.originDistrict];
      const faction = originDist ? originDist.faction : 'neutral';
      officers[hero.id] = {
        heroId: hero.id,
        faction,
        districtId: hero.originDistrict,
        discovered: true,
        loyalty: hero.rarity === 'SSR' ? 92 : 84,
        prisonerOf: null,
        inMarchId: null,
        level: 1,
        exp: 0,
      };
      if (originDist && !originDist.garrisonHeroIds.includes(hero.id)) {
        districts[hero.originDistrict] = {
          ...originDist,
          garrisonHeroIds: [...originDist.garrisonHeroIds, hero.id],
        };
      }
    }
  }

  // Endless Mode custom capital: move koxinga & chen_yonghua to startingDistrictId as player officers
  if (validStartId !== 'tainan') {
    const coreIds = ['koxinga', 'chen_yonghua'];
    for (const coreId of coreIds) {
      const officer = officers[coreId];
      if (!officer) continue;
      if (officer.districtId && districts[officer.districtId]) {
        const oldDist = districts[officer.districtId];
        districts[officer.districtId] = {
          ...oldDist,
          garrisonHeroIds: oldDist.garrisonHeroIds.filter((id) => id !== coreId),
        };
      }
      officers[coreId] = {
        ...officer,
        faction: 'player',
        districtId: validStartId,
        discovered: true,
        loyalty: HEROES[coreId]?.rarity === 'SSR' ? 92 : 84,
      };
      const startDist = districts[validStartId];
      if (!startDist.garrisonHeroIds.includes(coreId)) {
        districts[validStartId] = {
          ...startDist,
          garrisonHeroIds: [...startDist.garrisonHeroIds, coreId],
        };
      }
    }
  }

  return {
    mode,
    difficulty: validDifficulty,
    autoMode: { ...DEFAULT_AUTO_MODE },
    startingDistrictId: validStartId,
    gameTime: 0,
    paused: false,
    speed: 1,
    resources: {
      food: 950,
      gold: 900,
    },
    reputation: 100,
    districts,
    officers,
    marches: [],
    pendingBattle: null,
    pendingPrisoners: null,
    battleReports: [],
    activeEventIds: [],
    resolvedEvents: [],
    selectedDistrictId: validStartId,
    victory: false,
    defeat: false,
    soundMuted: false,
    lastSavedAt: Date.now(),
  };
}

export function setDifficulty(
  state: GameState,
  difficulty: DifficultyLevel
): GameState {
  if (!DIFFICULTY_CONFIGS[difficulty] || state.difficulty === difficulty) {
    return state;
  }
  return {
    ...state,
    difficulty,
  };
}

export function updateAutoMode(
  state: GameState,
  patch: Partial<AutoModeConfig>
): GameState {
  return {
    ...state,
    autoMode: {
      ...state.autoMode,
      ...patch,
    },
  };
}

export function toggleSoundMute(state: GameState): GameState {
  return {
    ...state,
    soundMuted: !state.soundMuted,
  };
}

export function getBuildingCost(
  type: BuildingType,
  currentLevel: number
): { gold: number; food: number } {
  const cfg = BUILDINGS[type];
  const scale = Math.pow(1.65, Math.max(0, currentLevel));
  return {
    gold: Math.round(cfg.baseGoldCost * scale),
    food: Math.round(cfg.baseFoodCost * scale),
  };
}

export function getPlotUnlockCost(plotIndex: number): { gold: number; food: number } {
  const idx = Math.max(0, plotIndex);
  return {
    gold: 100 + idx * 65,
    food: 50 + idx * 35,
  };
}

export function getActiveBondGroups(heroIds: string[]): string[] {
  const counts: Record<string, number> = {};
  for (const id of heroIds) {
    const cfg = HEROES[id];
    if (!cfg) continue;
    counts[cfg.bondGroup] = (counts[cfg.bondGroup] ?? 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([group]) => group);
}

export function getDistrictStats(
  state: GameState,
  districtId: DistrictId
): DistrictStats {
  const config = DISTRICTS[districtId];
  const district = state.districts[districtId];

  const assignedHeroes: OfficerState[] = [];
  for (const heroId of district.garrisonHeroIds) {
    const officer = state.officers[heroId];
    if (officer && !officer.inMarchId && !officer.prisonerOf) {
      assignedHeroes.push(officer);
    }
  }

  let heroFarmBonus = 0;
  let heroDefBonus = 0;
  for (const officer of assignedHeroes) {
    const cfg = HEROES[officer.heroId];
    if (!cfg) continue;
    const levelScale = 1 + (officer.level - 1) * 0.04;
    heroFarmBonus += (cfg.farmBonus + cfg.politics / 350) * levelScale;
    heroDefBonus += Math.round((cfg.def * 0.12 + cfg.command * 0.08) * levelScale);
  }

  const activeBonds = getActiveBondGroups(assignedHeroes.map((h) => h.heroId));
  const bondEcoBonus = activeBonds.length * 0.1;

  const granaryBonus = district.buildings.granary * 0.18;
  const marketBonus = district.buildings.market * 0.1;

  const foodMultiplier = Number(
    (config.baseFoodBonus * (1 + granaryBonus + heroFarmBonus + bondEcoBonus)).toFixed(3)
  );
  const goldMultiplier = Number(
    (
      config.baseGoldBonus *
      (1 + granaryBonus + marketBonus + heroFarmBonus + bondEcoBonus)
    ).toFixed(3)
  );
  const defenseBonus =
    config.baseDefense + district.buildings.wall * 15 + heroDefBonus;
  const maxTroops = Math.max(
    config.initialTroops,
    900 + district.buildings.barracks * 350
  );
  const passiveGoldPerSec =
    district.buildings.market > 0
      ? Number(
          (
            district.buildings.market *
            2.2 *
            config.baseGoldBonus *
            (1 + heroFarmBonus + bondEcoBonus)
          ).toFixed(2)
        )
      : 0;
  const passiveTroopsPerSec =
    district.buildings.barracks > 0
      ? Number((district.buildings.barracks * 0.85).toFixed(2))
      : 0;

  return {
    foodMultiplier,
    goldMultiplier,
    defenseBonus,
    maxTroops,
    passiveGoldPerSec,
    passiveTroopsPerSec,
    assignedHeroes,
    activeBonds,
  };
}

export function plantCrop(
  state: GameState,
  districtId: DistrictId,
  plotIndex: number,
  cropId: CropId
): GameState {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player') return state;

  const plot = district.plots[plotIndex];
  if (!plot || !plot.unlocked || plot.cropId !== null) return state;

  const crop = CROPS[cropId];
  if (!crop || state.resources.gold < crop.seedCostGold) return state;

  const nextPlots = district.plots.map((p, idx) =>
    idx === plotIndex
      ? {
          ...p,
          cropId,
          plantedAt: state.gameTime,
          matureAt: state.gameTime + crop.growTimeSec,
        }
      : p
  );

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - crop.seedCostGold,
    },
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        plots: nextPlots,
      },
    },
  };
}

export function harvestPlot(
  state: GameState,
  districtId: DistrictId,
  plotIndex: number
): GameState {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player') return state;

  const plot = district.plots[plotIndex];
  if (
    !plot ||
    !plot.unlocked ||
    plot.cropId === null ||
    plot.matureAt === null ||
    state.gameTime < plot.matureAt
  ) {
    return state;
  }

  const crop = CROPS[plot.cropId];
  const config = DISTRICTS[districtId];
  const stats = getDistrictStats(state, districtId);
  const specialtyBonus = plot.cropId === config.specialtyCrop ? 1.25 : 1;

  const foodGain = Math.round(crop.foodYield * stats.foodMultiplier * specialtyBonus);
  const goldGain = Math.round(crop.goldYield * stats.goldMultiplier * specialtyBonus);

  const nextPlots = district.plots.map((p, idx) =>
    idx === plotIndex
      ? {
          ...p,
          cropId: null,
          plantedAt: null,
          matureAt: null,
        }
      : p
  );

  return {
    ...state,
    resources: {
      ...state.resources,
      food: state.resources.food + foodGain,
      gold: state.resources.gold + goldGain,
    },
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        plots: nextPlots,
      },
    },
  };
}

export function harvestAllMature(
  state: GameState,
  districtId?: DistrictId
): GameState {
  const targetIds: DistrictId[] = districtId
    ? [districtId]
    : DISTRICT_LIST.map((d) => d.id).filter(
        (id) => state.districts[id].faction === 'player'
      );

  let nextState = state;
  for (const id of targetIds) {
    const dist = nextState.districts[id];
    if (!dist || dist.faction !== 'player') continue;
    for (const plot of dist.plots) {
      if (
        plot.unlocked &&
        plot.cropId !== null &&
        plot.matureAt !== null &&
        nextState.gameTime >= plot.matureAt
      ) {
        nextState = harvestPlot(nextState, id, plot.plotIndex);
      }
    }
  }
  return nextState;
}

export function unlockPlot(
  state: GameState,
  districtId: DistrictId,
  plotIndex: number
): GameState {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player') return state;

  const plot = district.plots[plotIndex];
  if (!plot || plot.unlocked) return state;

  const cost = getPlotUnlockCost(plotIndex);
  if (state.resources.gold < cost.gold || state.resources.food < cost.food) {
    return state;
  }

  const nextPlots = district.plots.map((p, idx) =>
    idx === plotIndex ? { ...p, unlocked: true } : p
  );

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - cost.gold,
      food: state.resources.food - cost.food,
    },
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        plots: nextPlots,
      },
    },
  };
}

export function upgradeBuilding(
  state: GameState,
  districtId: DistrictId,
  type: BuildingType
): GameState {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player') return state;

  const currentLevel = district.buildings[type];
  const cfg = BUILDINGS[type];
  if (currentLevel >= cfg.maxLevel) return state;

  const cost = getBuildingCost(type, currentLevel);
  if (state.resources.gold < cost.gold || state.resources.food < cost.food) {
    return state;
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - cost.gold,
      food: state.resources.food - cost.food,
    },
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        buildings: {
          ...district.buildings,
          [type]: currentLevel + 1,
        },
      },
    },
  };
}

export function recruitTroops(
  state: GameState,
  districtId: DistrictId,
  amount: number
): GameState {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player' || amount <= 0) return state;

  const stats = getDistrictStats(state, districtId);
  const availableSpace = Math.floor(stats.maxTroops - district.troops);
  const recruitable = Math.min(Math.floor(amount), availableSpace);
  if (recruitable <= 0) return state;

  const foodCost = Math.ceil(recruitable * 1);
  const goldCost = Math.ceil(recruitable * 0.5);
  if (state.resources.food < foodCost || state.resources.gold < goldCost) {
    return state;
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      food: state.resources.food - foodCost,
      gold: state.resources.gold - goldCost,
    },
    districts: {
      ...state.districts,
      [districtId]: {
        ...district,
        troops: district.troops + recruitable,
      },
    },
  };
}

export function assignHeroToDistrict(
  state: GameState,
  heroId: string,
  districtId: DistrictId | null
): GameState {
  const officer = state.officers[heroId];
  if (
    !officer ||
    officer.faction !== 'player' ||
    officer.prisonerOf !== null ||
    officer.inMarchId !== null
  ) {
    return state;
  }

  if (districtId !== null) {
    const target = state.districts[districtId];
    if (!target || target.faction !== 'player') return state;
  }

  if (officer.districtId === districtId) return state;

  const nextDistricts = { ...state.districts };

  if (officer.districtId !== null) {
    const prevDist = nextDistricts[officer.districtId];
    if (prevDist) {
      nextDistricts[officer.districtId] = {
        ...prevDist,
        garrisonHeroIds: prevDist.garrisonHeroIds.filter((id) => id !== heroId),
      };
    }
  }

  if (districtId !== null) {
    const targetDist = nextDistricts[districtId];
    const nextGarrison = targetDist.garrisonHeroIds.includes(heroId)
      ? targetDist.garrisonHeroIds
      : [...targetDist.garrisonHeroIds, heroId];
    nextDistricts[districtId] = {
      ...targetDist,
      garrisonHeroIds: nextGarrison,
    };
  }

  return {
    ...state,
    districts: nextDistricts,
    officers: {
      ...state.officers,
      [heroId]: {
        ...officer,
        districtId,
      },
    },
  };
}

// ==================== RTK11 Officer / Explore / Recruit / Loyalty / Prison ====================

function findBestPlayerRecruiter(
  state: GameState,
  preferredHeroId?: string
): OfficerState | null {
  if (preferredHeroId) {
    const pref = state.officers[preferredHeroId];
    if (pref && pref.faction === 'player' && !pref.prisonerOf && !pref.inMarchId) {
      return pref;
    }
  }
  const candidates = Object.values(state.officers).filter(
    (o) => o.faction === 'player' && !o.prisonerOf && !o.inMarchId && Boolean(HEROES[o.heroId])
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const cfgA = HEROES[a.heroId];
    const cfgB = HEROES[b.heroId];
    return cfgB.charm + cfgB.intel - (cfgA.charm + cfgA.intel);
  });
  return candidates[0];
}

function getFallbackPlayerDistrictId(
  state: GameState,
  preferredId?: DistrictId | null
): DistrictId | null {
  if (preferredId && state.districts[preferredId]?.faction === 'player') {
    return preferredId;
  }
  if (state.districts[state.selectedDistrictId]?.faction === 'player') {
    return state.selectedDistrictId;
  }
  if (state.districts[state.startingDistrictId]?.faction === 'player') {
    return state.startingDistrictId;
  }
  const first = DISTRICT_LIST.find((d) => state.districts[d.id]?.faction === 'player');
  return first ? first.id : null;
}

export function exploreDistrict(
  state: GameState,
  districtId: DistrictId,
  explorerHeroId?: string,
  rng: () => number = Math.random
): {
  state: GameState;
  message: string;
  foundHeroId?: string;
  bonusGold?: number;
  bonusFood?: number;
} {
  const district = state.districts[districtId];
  if (!district || district.faction !== 'player') {
    return { state, message: '只能探索我方控制的郡縣。' };
  }
  if (state.resources.gold < EXPLORE_COST_GOLD) {
    return {
      state,
      message: `銀兩不足，探索需要 ${EXPLORE_COST_GOLD} 銀兩。`,
    };
  }

  let explorer = explorerHeroId ? state.officers[explorerHeroId] : undefined;
  if (!explorer || explorer.faction !== 'player' || explorer.prisonerOf || explorer.inMarchId) {
    const localOfficers = district.garrisonHeroIds
      .map((id) => state.officers[id])
      .filter((o): o is OfficerState => Boolean(o && o.faction === 'player' && !o.prisonerOf && !o.inMarchId));
    if (localOfficers.length > 0) {
      localOfficers.sort((a, b) => {
        const cfgA = HEROES[a.heroId];
        const cfgB = HEROES[b.heroId];
        return cfgB.charm + cfgB.intel - (cfgA.charm + cfgA.intel);
      });
      explorer = localOfficers[0];
    } else {
      explorer = findBestPlayerRecruiter(state) ?? undefined;
    }
  }

  const explorerCfg = explorer ? HEROES[explorer.heroId] : null;
  const statFactor = explorerCfg ? (explorerCfg.charm + explorerCfg.intel) / 200 : 0.6;

  const baseResources = {
    ...state.resources,
    gold: state.resources.gold - EXPLORE_COST_GOLD,
  };

  // 1. Check undiscovered free officers in this district
  const localHidden = Object.values(state.officers).filter(
    (o) => o.faction === 'free' && !o.discovered && o.districtId === districtId
  );

  if (localHidden.length > 0) {
    const findChance = Math.min(0.95, 0.75 + statFactor * 0.2);
    if (rng() < findChance) {
      const picked =
        localHidden[Math.min(localHidden.length - 1, Math.floor(rng() * localHidden.length))];
      const heroCfg = HEROES[picked.heroId];
      const nextState: GameState = {
        ...state,
        resources: baseResources,
        officers: {
          ...state.officers,
          [picked.heroId]: {
            ...picked,
            discovered: true,
            districtId,
          },
        },
      };
      return {
        state: nextState,
        foundHeroId: picked.heroId,
        message: `在${DISTRICTS[districtId].name}發現隱世奇才【${heroCfg?.name ?? picked.heroId}】！可立即前往登庸。`,
      };
    }
  }

  // 2. Otherwise, 35%+ chance to discover an undiscovered free officer from an adjacent district
  const neighborIds = DISTRICTS[districtId]?.neighbors ?? [];
  const adjacentHidden = Object.values(state.officers).filter(
    (o) =>
      o.faction === 'free' &&
      !o.discovered &&
      o.districtId !== null &&
      neighborIds.includes(o.districtId)
  );

  if (adjacentHidden.length > 0) {
    const adjChance = Math.min(0.55, 0.35 + statFactor * 0.15);
    if (rng() < adjChance) {
      const picked =
        adjacentHidden[
          Math.min(adjacentHidden.length - 1, Math.floor(rng() * adjacentHidden.length))
        ];
      const heroCfg = HEROES[picked.heroId];
      const nextState: GameState = {
        ...state,
        resources: baseResources,
        officers: {
          ...state.officers,
          [picked.heroId]: {
            ...picked,
            discovered: true,
            districtId,
          },
        },
      };
      return {
        state: nextState,
        foundHeroId: picked.heroId,
        message: `探訪鄰境時偶遇在野英才【${heroCfg?.name ?? picked.heroId}】，已迎至${DISTRICTS[districtId].name}待君登庸！`,
      };
    }
  }

  // 3. Fallback local specialty bounty so exploring is never a total waste
  const giveGold = rng() < 0.5;
  if (giveGold) {
    const bonusGold = Math.round(120 + rng() * 100);
    const nextState: GameState = {
      ...state,
      resources: {
        ...baseResources,
        gold: baseResources.gold + bonusGold,
      },
    };
    return {
      state: nextState,
      bonusGold,
      message: `探索${DISTRICTS[districtId].name}雖未見隱士，但尋獲地方特產商貨，獲得 ${bonusGold} 銀兩！`,
    };
  } else {
    const bonusFood = Math.round(150 + rng() * 110);
    const nextState: GameState = {
      ...state,
      resources: {
        ...baseResources,
        food: baseResources.food + bonusFood,
      },
    };
    return {
      state: nextState,
      bonusFood,
      message: `探索${DISTRICTS[districtId].name}雖未見隱士，但獲得鄉紳捐獻軍糧 ${bonusFood}！`,
    };
  }
}

export function getRecruitChance(
  state: GameState,
  targetHeroId: string,
  recruiterHeroId?: string
): number {
  const target = state.officers[targetHeroId];
  const targetCfg = HEROES[targetHeroId];
  if (!target || !targetCfg || target.faction === 'player') {
    return 0;
  }

  let base = 0;
  if (target.faction === 'free') {
    base = 0.65;
  } else if (target.prisonerOf === 'player') {
    base = 0.55 + Math.max(0, (80 - target.loyalty) * 0.008);
  } else {
    // Active enemy officer: only poachable if loyalty < 82
    if (target.loyalty >= 82) {
      return 0;
    }
    base = 0.28 + Math.max(0, (82 - target.loyalty) * 0.008);
  }

  const recruiter = findBestPlayerRecruiter(state, recruiterHeroId);
  const recruiterCfg = recruiter ? HEROES[recruiter.heroId] : null;

  let recruiterBonus = 0;
  let synergyBonus = 0;
  if (recruiterCfg) {
    recruiterBonus =
      (recruiterCfg.charm - 60) * 0.003 + (recruiterCfg.intel - 60) * 0.0015;
    if (
      recruiterCfg.bondGroup === targetCfg.bondGroup ||
      recruiterCfg.originDistrict === targetCfg.originDistrict
    ) {
      synergyBonus = 0.15;
    }
  }

  const repBonus = Math.min(0.18, Math.floor(Math.max(0, state.reputation) / 25) * 0.01);
  const raw = base + recruiterBonus + repBonus + synergyBonus;
  return Number(Math.max(0.15, Math.min(0.95, raw)).toFixed(2));
}

function removeFromPendingPrisoners(
  pending: CapturedPrisonerPrompt | null,
  heroId: string
): CapturedPrisonerPrompt | null {
  if (!pending) return null;
  const remaining = pending.heroIds.filter((id) => id !== heroId);
  return remaining.length > 0 ? { ...pending, heroIds: remaining } : null;
}

export function recruitOfficer(
  state: GameState,
  targetHeroId: string,
  recruiterHeroId?: string,
  rng: () => number = Math.random
): { state: GameState; success: boolean; chance: number; message: string } {
  const target = state.officers[targetHeroId];
  const targetCfg = HEROES[targetHeroId];
  if (!target || !targetCfg) {
    return { state, success: false, chance: 0, message: '查無此武將。' };
  }
  if (target.faction === 'player') {
    return { state, success: false, chance: 0, message: `${targetCfg.name} 已是我軍麾下。` };
  }
  if (target.faction === 'free' && !target.discovered) {
    return {
      state,
      success: false,
      chance: 0,
      message: `${targetCfg.name} 尚未被探索發現。`,
    };
  }
  if (target.faction !== 'free' && target.prisonerOf !== 'player' && target.loyalty >= 82) {
    return {
      state,
      success: false,
      chance: 0,
      message: `${targetCfg.name} 忠誠度高達 ${target.loyalty}，堅拒挖角。`,
    };
  }

  const chance = getRecruitChance(state, targetHeroId, recruiterHeroId);
  if (state.resources.gold < RECRUIT_COST_GOLD) {
    return {
      state,
      success: false,
      chance,
      message: `銀兩不足，登庸需要 ${RECRUIT_COST_GOLD} 銀兩。`,
    };
  }

  const recruiter = findBestPlayerRecruiter(state, recruiterHeroId);
  const nextResources = {
    ...state.resources,
    gold: state.resources.gold - RECRUIT_COST_GOLD,
  };

  if (rng() < chance) {
    const nextDistricts = { ...state.districts };
    // Remove from old district's garrison if present
    if (target.districtId && nextDistricts[target.districtId]) {
      const oldDist = nextDistricts[target.districtId];
      nextDistricts[target.districtId] = {
        ...oldDist,
        garrisonHeroIds: oldDist.garrisonHeroIds.filter((id) => id !== targetHeroId),
      };
    }

    const destDistrictId = getFallbackPlayerDistrictId(state, recruiter?.districtId);
    if (destDistrictId && nextDistricts[destDistrictId]) {
      const destDist = nextDistricts[destDistrictId];
      if (!destDist.garrisonHeroIds.includes(targetHeroId)) {
        nextDistricts[destDistrictId] = {
          ...destDist,
          garrisonHeroIds: [...destDist.garrisonHeroIds, targetHeroId],
        };
      }
    }

    const nextState: GameState = {
      ...state,
      resources: nextResources,
      reputation: state.reputation + 10,
      districts: nextDistricts,
      officers: {
        ...state.officers,
        [targetHeroId]: {
          ...target,
          faction: 'player',
          prisonerOf: null,
          discovered: true,
          loyalty: 88,
          districtId: destDistrictId,
          inMarchId: null,
        },
      },
      pendingPrisoners: removeFromPendingPrisoners(state.pendingPrisoners, targetHeroId),
    };

    return {
      state: nextState,
      success: true,
      chance,
      message: `「蒙君厚愛，願效犬馬之勞！」【${targetCfg.name}】正式加入我軍（聲望 +10）！`,
    };
  }

  // Refusal: lower prisoner/target loyalty by 6 so next persuasion is easier
  const nextLoyalty = Math.max(10, target.loyalty - 6);
  const nextState: GameState = {
    ...state,
    resources: nextResources,
    officers: {
      ...state.officers,
      [targetHeroId]: {
        ...target,
        loyalty: nextLoyalty,
      },
    },
  };

  const refusalLine =
    target.prisonerOf === 'player'
      ? `「寧為玉碎，不為瓦全！」${targetCfg.name} 暫時拒絕招降（忠誠降至 ${nextLoyalty}，下次勸降更易成功）。`
      : `「閣下美意心領了，容我再思量一番。」${targetCfg.name} 婉拒登庸。`;

  return {
    state: nextState,
    success: false,
    chance,
    message: refusalLine,
  };
}

export function rewardOfficer(
  state: GameState,
  heroId: string
): { state: GameState; error?: string } {
  const officer = state.officers[heroId];
  if (!officer || officer.faction !== 'player' || officer.prisonerOf !== null) {
    return { state, error: '只能褒賞我方麾下武將' };
  }
  if (officer.loyalty >= 100) {
    return { state, error: '該武將忠誠度已達 100' };
  }
  if (state.resources.gold < REWARD_COST_GOLD) {
    return { state, error: `銀兩不足，褒賞需要 ${REWARD_COST_GOLD} 銀兩` };
  }

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        gold: state.resources.gold - REWARD_COST_GOLD,
      },
      officers: {
        ...state.officers,
        [heroId]: {
          ...officer,
          loyalty: Math.min(100, officer.loyalty + 15),
        },
      },
    },
  };
}

export function handlePrisonerAction(
  state: GameState,
  heroId: string,
  action: 'persuade' | 'release' | 'imprison',
  rng: () => number = Math.random
): { state: GameState; message: string; recruited?: boolean } {
  const officer = state.officers[heroId];
  const cfg = HEROES[heroId];
  if (!officer || !cfg || officer.prisonerOf !== 'player') {
    return { state, message: '該武將並非我軍俘虜。' };
  }

  const nextPendingPrisoners = removeFromPendingPrisoners(state.pendingPrisoners, heroId);

  if (action === 'persuade') {
    const chance = getRecruitChance(state, heroId);
    if (rng() < chance) {
      const nextDistricts = { ...state.districts };
      const destId = getFallbackPlayerDistrictId(
        state,
        state.pendingPrisoners?.districtId ?? officer.districtId
      );
      if (destId && nextDistricts[destId]) {
        const destDist = nextDistricts[destId];
        if (!destDist.garrisonHeroIds.includes(heroId)) {
          nextDistricts[destId] = {
            ...destDist,
            garrisonHeroIds: [...destDist.garrisonHeroIds, heroId],
          };
        }
      }

      return {
        state: {
          ...state,
          reputation: state.reputation + 10,
          districts: nextDistricts,
          officers: {
            ...state.officers,
            [heroId]: {
              ...officer,
              faction: 'player',
              prisonerOf: null,
              discovered: true,
              loyalty: 86,
              districtId: destId,
              inMarchId: null,
            },
          },
          pendingPrisoners: nextPendingPrisoners,
        },
        recruited: true,
        message: `【${cfg.name}】感佩主公寬仁，慨然歸降我軍（聲望 +10）！`,
      };
    }

    const nextLoyalty = Math.max(10, officer.loyalty - 8);
    return {
      state: {
        ...state,
        officers: {
          ...state.officers,
          [heroId]: {
            ...officer,
            loyalty: nextLoyalty,
          },
        },
        pendingPrisoners: nextPendingPrisoners,
      },
      recruited: false,
      message: `【${cfg.name}】拒不投降，已暫押牢中（忠誠 -8，降至 ${nextLoyalty}）。`,
    };
  }

  if (action === 'release') {
    const nextDistricts = { ...state.districts };
    // Boost morale +5 for all player districts
    for (const dCfg of DISTRICT_LIST) {
      const dist = nextDistricts[dCfg.id];
      if (dist && dist.faction === 'player') {
        nextDistricts[dCfg.id] = {
          ...dist,
          morale: Math.min(100, dist.morale + 5),
        };
      }
    }

    const originalFaction = officer.faction;
    const factionDistrict =
      originalFaction !== 'free'
        ? DISTRICT_LIST.find((d) => nextDistricts[d.id]?.faction === originalFaction)
        : undefined;

    let updatedOfficer: OfficerState;
    if (factionDistrict) {
      const targetDist = nextDistricts[factionDistrict.id];
      if (!targetDist.garrisonHeroIds.includes(heroId)) {
        nextDistricts[factionDistrict.id] = {
          ...targetDist,
          garrisonHeroIds: [...targetDist.garrisonHeroIds, heroId],
        };
      }
      updatedOfficer = {
        ...officer,
        prisonerOf: null,
        districtId: factionDistrict.id,
        loyalty: Math.max(10, officer.loyalty - 10),
        inMarchId: null,
      };
    } else {
      updatedOfficer = {
        ...officer,
        faction: 'free',
        prisonerOf: null,
        discovered: true,
        districtId: officer.districtId ?? state.selectedDistrictId,
        loyalty: Math.max(10, officer.loyalty - 10),
        inMarchId: null,
      };
    }

    return {
      state: {
        ...state,
        reputation: state.reputation + 25,
        districts: nextDistricts,
        officers: {
          ...state.officers,
          [heroId]: updatedOfficer,
        },
        pendingPrisoners: nextPendingPrisoners,
      },
      recruited: false,
      message: `禮送【${cfg.name}】離去，仁義之名遠播四方！聲望 +25、全境民心 +5。`,
    };
  }

  // 'imprison'
  const nextLoyalty = Math.max(10, officer.loyalty - 5);
  return {
    state: {
      ...state,
      officers: {
        ...state.officers,
        [heroId]: {
          ...officer,
          prisonerOf: 'player',
          loyalty: nextLoyalty,
        },
      },
      pendingPrisoners: nextPendingPrisoners,
    },
    recruited: false,
    message: `已將【${cfg.name}】收押天牢，待日後徐圖勸降（忠誠 -5）。`,
  };
}

export function dismissPendingPrisoners(state: GameState): GameState {
  if (!state.pendingPrisoners) return state;
  return {
    ...state,
    pendingPrisoners: null,
  };
}

// ==================== Troop Dispatch & Marching ====================

export function dispatchMarch(
  state: GameState,
  fromId: DistrictId,
  toId: DistrictId,
  troops: number,
  heroIds: string[]
): { state: GameState; error?: string } {
  const fromDistrict = state.districts[fromId];
  const toDistrict = state.districts[toId];
  if (!fromDistrict || !toDistrict) {
    return { state, error: '無效的郡縣目標' };
  }
  if (fromDistrict.faction !== 'player') {
    return { state, error: '只能從我方控制的郡縣出兵' };
  }
  if (!DISTRICTS[fromId].neighbors.includes(toId)) {
    return { state, error: '目標郡縣未與出發地相鄰' };
  }

  const sendTroops = Math.floor(troops);
  if (sendTroops < 10) {
    return { state, error: '出征兵力至少需要 10 人' };
  }

  const availableTroops = Math.floor(fromDistrict.troops);
  const maxSendable =
    availableTroops > 10 ? availableTroops - 10 : availableTroops;
  if (sendTroops > maxSendable) {
    return {
      state,
      error: `兵力不足（需保留至少 10 名守軍，最多可派遣 ${maxSendable} 人）`,
    };
  }

  const foodCost = Math.ceil(sendTroops * 0.4);
  if (state.resources.food < foodCost) {
    return {
      state,
      error: `糧草不足，行軍需要 ${foodCost} 糧食`,
    };
  }

  const uniqueHeroIds = Array.from(new Set(heroIds));
  for (const hId of uniqueHeroIds) {
    const officer = state.officers[hId];
    if (!officer || officer.faction !== 'player' || officer.prisonerOf !== null) {
      return { state, error: '選擇了非我方可用武將' };
    }
    if (officer.inMarchId !== null) {
      return { state, error: '所選武將正在行軍途中' };
    }
  }

  const isSea = Boolean(DISTRICTS[fromId].seaRoutes?.includes(toId));
  const duration = isSea ? MARCH_SEA_DURATION : MARCH_LAND_DURATION;
  const marchId = `march_${Math.round(state.gameTime * 100)}_${fromId}_${toId}_${state.marches.length + 1}`;
  const march: MarchOrder = {
    id: marchId,
    faction: 'player',
    fromId,
    toId,
    troops: sendTroops,
    heroIds: uniqueHeroIds,
    startedAt: state.gameTime,
    arriveAt: state.gameTime + duration,
    type: toDistrict.faction === 'player' ? 'reinforce' : 'attack',
  };

  const nextDistricts = { ...state.districts };
  const nextOfficers = { ...state.officers };

  for (const hId of uniqueHeroIds) {
    const officer = nextOfficers[hId];
    if (officer.districtId) {
      const assignedDist = nextDistricts[officer.districtId];
      if (assignedDist) {
        nextDistricts[officer.districtId] = {
          ...assignedDist,
          garrisonHeroIds: assignedDist.garrisonHeroIds.filter((id) => id !== hId),
        };
      }
    }
    nextOfficers[hId] = {
      ...officer,
      districtId: null,
      inMarchId: marchId,
    };
  }

  nextDistricts[fromId] = {
    ...nextDistricts[fromId],
    troops: nextDistricts[fromId].troops - sendTroops,
  };

  return {
    state: {
      ...state,
      resources: {
        ...state.resources,
        food: state.resources.food - foodCost,
      },
      districts: nextDistricts,
      officers: nextOfficers,
      marches: [...state.marches, march],
    },
  };
}

// ==================== Tactical Battle & Prisoner Capture ====================

function getUnitCounterMultiplier(
  atkUnit: UnitType | null,
  defUnit: UnitType | null
): { atkMult: number; note?: string } {
  if (!atkUnit || !defUnit) return { atkMult: 1 };
  if (
    (atkUnit === 'infantry' && defUnit === 'cavalry') ||
    (atkUnit === 'cavalry' && defUnit === 'archer') ||
    (atkUnit === 'archer' && defUnit === 'infantry')
  ) {
    const names: Record<UnitType, string> = {
      infantry: '步兵',
      cavalry: '騎兵',
      archer: '弓兵',
      naval: '水師',
    };
    return {
      atkMult: 1.15,
      note: `【兵種克制】我軍${names[atkUnit]}克制敵軍${names[defUnit]}，戰力 +15%！`,
    };
  }
  if (
    (defUnit === 'infantry' && atkUnit === 'cavalry') ||
    (defUnit === 'cavalry' && atkUnit === 'archer') ||
    (defUnit === 'archer' && atkUnit === 'infantry')
  ) {
    return { atkMult: 0.9 };
  }
  return { atkMult: 1 };
}

function getDefaultDefenderUnit(districtId: DistrictId): UnitType {
  const terrain = DISTRICTS[districtId].terrain;
  if (terrain === 'port' || terrain === 'island') return 'naval';
  if (terrain === 'mountain') return 'archer';
  if (terrain === 'basin') return 'infantry';
  return 'cavalry';
}

function grantOfficerExp(officer: OfficerState, expGain: number): OfficerState {
  let exp = officer.exp + expGain;
  let level = officer.level;
  while (exp >= 100 && level < 50) {
    exp -= 100;
    level += 1;
  }
  return { ...officer, exp, level };
}

function retreatOfficerToFactionOrFree(
  officer: OfficerState,
  faction: FactionId,
  excludeDistrictId: DistrictId,
  districts: Record<DistrictId, DistrictState>
): { officer: OfficerState; retreatDistrictId: DistrictId | null } {
  const safeDistrict = DISTRICT_LIST.find(
    (d) => d.id !== excludeDistrictId && districts[d.id]?.faction === faction
  );
  if (safeDistrict) {
    return {
      officer: {
        ...officer,
        districtId: safeDistrict.id,
        inMarchId: null,
        prisonerOf: null,
      },
      retreatDistrictId: safeDistrict.id,
    };
  }
  if (faction === 'player') {
    return {
      officer: {
        ...officer,
        districtId: null,
        inMarchId: null,
        prisonerOf: null,
      },
      retreatDistrictId: null,
    };
  }
  // AI faction lost its last city -> officer becomes wandering free talent!
  return {
    officer: {
      ...officer,
      faction: 'free',
      discovered: true,
      districtId: excludeDistrictId,
      inMarchId: null,
      prisonerOf: null,
    },
    retreatDistrictId: null,
  };
}

export function resolveBattle(
  state: GameState,
  march: MarchOrder,
  rng: () => number = Math.random,
  manualOutcome?: ManualBattleOutcome
): { state: GameState; report: BattleReport } {
  const toConfig = DISTRICTS[march.toId];
  const toDistrict = state.districts[march.toId];
  const attackerFaction = march.faction;
  const defenderFaction = toDistrict.faction;
  const attackerTroopsStart = Math.max(1, Math.floor(march.troops));
  const defenderTroopsStart = Math.max(0, Math.floor(toDistrict.troops));

  const highlights: string[] = [];
  const isSeaAttack = Boolean(DISTRICTS[march.fromId]?.seaRoutes?.includes(march.toId));

  const attackerHeroIds = march.heroIds.filter((id) =>
    Boolean(state.officers[id] && HEROES[id])
  );
  const defenderHeroIds = toDistrict.garrisonHeroIds.filter((id) =>
    Boolean(state.officers[id] && HEROES[id])
  );

  let winner: 'attacker' | 'defender';
  let conquered = false;
  let attackerTroopsEnd = 0;
  let defenderTroopsEnd = 0;
  let lootGold = 0;
  let lootFood = 0;
  let hasLiaoTianding = attackerHeroIds.includes('liao_tianding');

  if (manualOutcome) {
    winner = manualOutcome.winner;
    conquered = winner === 'attacker';
    attackerTroopsEnd = Math.max(
      conquered ? 1 : 0,
      Math.round(manualOutcome.attackerTroopsEnd)
    );
    defenderTroopsEnd = Math.max(
      conquered ? 0 : 1,
      Math.round(manualOutcome.defenderTroopsEnd)
    );
    highlights.push(...manualOutcome.highlights);
  } else {
    let attackerMult = 1.0;
    let defenderMult = 1.0 + (toConfig.baseDefense + toDistrict.buildings.wall * 15) / 100;
    let attackerCasualtyReduction = 0;
    let defenderCasualtyReduction = 0;

    if (toDistrict.buildings.wall > 0) {
      highlights.push(
        `【城防地形】${toConfig.name}地形防禦 +${toConfig.baseDefense}%，紅磚城防 Lv.${toDistrict.buildings.wall} 加成 +${toDistrict.buildings.wall * 15}%。`
      );
    }

    // Attacker hero five-stat combat & skills
    for (const hId of attackerHeroIds) {
      const officer = state.officers[hId];
      const cfg = HEROES[hId];
      const levelMult = 1 + (officer.level - 1) * 0.025;
      attackerMult +=
        (cfg.might * 0.0022 + cfg.command * 0.002 + cfg.intel * 0.001) * levelMult;

      if (
        cfg.unitType === 'naval' &&
        (toConfig.terrain === 'port' || toConfig.terrain === 'island' || isSeaAttack)
      ) {
        attackerMult += 0.2;
        highlights.push(`【水師優勢】${cfg.name} 熟稔海路與港島戰術，攻勢戰力 +20%！`);
      } else if (
        toConfig.terrain === 'mountain' &&
        (cfg.unitType === 'infantry' || cfg.unitType === 'archer')
      ) {
        attackerMult += 0.12;
        highlights.push(`【山地專精】${cfg.name} 適應險峻山勢，戰力 +12%！`);
      }

      if (rng() < 0.72) {
        const skillBonus = cfg.rarity === 'SSR' ? 0.16 : cfg.rarity === 'SR' ? 0.11 : 0.07;
        attackerMult += skillBonus;
        highlights.push(`【武將技能】${cfg.name} 發動「${cfg.skillName}」，全軍氣勢大振！`);
        if (cfg.id === 'mazu') {
          attackerCasualtyReduction += 0.18;
        } else if (cfg.id === 'liao_tianding') {
          hasLiaoTianding = true;
        } else if (cfg.id === 'koxinga') {
          attackerMult += 0.1;
        }
      }
    }

    const atkBonds = getActiveBondGroups(attackerHeroIds);
    for (const bond of atkBonds) {
      attackerMult += 0.12;
      highlights.push(`【羈絆發動】攻方觸發「${bond}」羈絆，全軍戰力 +12%！`);
    }

    // Defender hero five-stat combat & skills
    for (const hId of defenderHeroIds) {
      const officer = state.officers[hId];
      const cfg = HEROES[hId];
      const levelMult = 1 + (officer.level - 1) * 0.025;
      defenderMult +=
        (cfg.command * 0.0024 + cfg.might * 0.0018 + cfg.intel * 0.0012) * levelMult;

      if (
        cfg.unitType === 'naval' &&
        (toConfig.terrain === 'port' || toConfig.terrain === 'island')
      ) {
        defenderMult += 0.2;
        highlights.push(`【海防固守】${cfg.name} 憑藉港灣砲壘固守，防禦戰力 +20%！`);
      }

      if (rng() < 0.72) {
        const skillBonus = cfg.rarity === 'SSR' ? 0.16 : cfg.rarity === 'SR' ? 0.11 : 0.07;
        defenderMult += skillBonus;
        highlights.push(`【守將技能】${cfg.name} 發動「${cfg.skillName}」，死守城池！`);
        if (cfg.id === 'mazu') {
          defenderCasualtyReduction += 0.18;
        }
      }
    }

    const defBonds = getActiveBondGroups(defenderHeroIds);
    for (const bond of defBonds) {
      defenderMult += 0.12;
      highlights.push(`【羈絆發動】守方觸發「${bond}」羈絆，防禦戰力 +12%！`);
    }

    const primaryAtkUnit: UnitType | null =
      attackerHeroIds.length > 0 ? HEROES[attackerHeroIds[0]].unitType : 'infantry';
    const primaryDefUnit: UnitType | null =
      defenderHeroIds.length > 0
        ? HEROES[defenderHeroIds[0]].unitType
        : getDefaultDefenderUnit(march.toId);
    const counter = getUnitCounterMultiplier(primaryAtkUnit, primaryDefUnit);
    attackerMult *= counter.atkMult;
    if (counter.note) {
      highlights.push(counter.note);
    }

    const diffCfg = DIFFICULTY_CONFIGS[state.difficulty] ?? DIFFICULTY_CONFIGS.normal;
    if (attackerFaction !== 'player') {
      attackerMult *= diffCfg.enemyCombatMult;
    }
    if (defenderFaction !== 'player') {
      defenderMult *= diffCfg.enemyCombatMult;
    }

    const atkVariance = 0.94 + rng() * 0.12;
    const defVariance = 0.94 + rng() * 0.12;
    const attackerPower = attackerTroopsStart * attackerMult * atkVariance;
    const defenderPower = defenderTroopsStart * defenderMult * defVariance;

    if (defenderTroopsStart <= 0 || attackerPower >= defenderPower) {
      winner = 'attacker';
      conquered = true;
      const ratio = defenderPower / Math.max(1, attackerPower);
      const rawLossRate = Math.min(0.75, Math.max(0.08, ratio * 0.65));
      const finalLossRate = Math.max(0.05, rawLossRate * (1 - attackerCasualtyReduction));
      attackerTroopsEnd = Math.max(
        1,
        Math.round(attackerTroopsStart * (1 - finalLossRate))
      );
      defenderTroopsEnd = 0;
    } else {
      winner = 'defender';
      conquered = false;
      const ratio = attackerPower / Math.max(1, defenderPower);
      const rawLossRate = Math.min(0.75, Math.max(0.08, ratio * 0.65));
      const finalLossRate = Math.max(0.05, rawLossRate * (1 - defenderCasualtyReduction));
      defenderTroopsEnd = Math.max(
        1,
        Math.round(defenderTroopsStart * (1 - finalLossRate))
      );
      attackerTroopsEnd = Math.round(
        attackerTroopsStart * Math.max(0.06, 0.25 * (1 - ratio * 0.5))
      );
    }
  }

  const nextDistricts = { ...state.districts };
  const nextOfficers = { ...state.officers };
  const nextResources = { ...state.resources };
  let nextReputation = state.reputation;
  const capturedHeroIds: string[] = [];

  if (conquered) {
    const updatedPlots =
      attackerFaction === 'player'
        ? toDistrict.plots.map((p, idx) => (idx < 2 ? { ...p, unlocked: true } : p))
        : toDistrict.plots;

    nextDistricts[march.toId] = {
      ...toDistrict,
      faction: attackerFaction,
      troops: attackerTroopsEnd,
      garrisonHeroIds: [...attackerHeroIds],
      plots: updatedPlots,
    };

    // Handle defeated defenders: capture if player conquered, else retreat or turn free
    for (const defHId of defenderHeroIds) {
      const defOfficer = nextOfficers[defHId];
      if (!defOfficer) continue;

      if (attackerFaction === 'player' && defenderFaction !== 'player') {
        if (rng() < 0.7) {
          capturedHeroIds.push(defHId);
          nextOfficers[defHId] = {
            ...defOfficer,
            prisonerOf: 'player',
            districtId: march.toId,
            inMarchId: null,
          };
          continue;
        }
      }

      const retreated = retreatOfficerToFactionOrFree(
        defOfficer,
        defenderFaction,
        march.toId,
        nextDistricts
      );
      nextOfficers[defHId] = retreated.officer;
      if (retreated.retreatDistrictId && nextDistricts[retreated.retreatDistrictId]) {
        const retDist = nextDistricts[retreated.retreatDistrictId];
        if (!retDist.garrisonHeroIds.includes(defHId)) {
          nextDistricts[retreated.retreatDistrictId] = {
            ...retDist,
            garrisonHeroIds: [...retDist.garrisonHeroIds, defHId],
          };
        }
      }
    }

    // Update attacking heroes to garrison conquered city
    for (const hId of attackerHeroIds) {
      if (nextOfficers[hId]) {
        nextOfficers[hId] = grantOfficerExp(
          {
            ...nextOfficers[hId],
            districtId: march.toId,
            inMarchId: null,
          },
          30
        );
      }
    }

    if (attackerFaction === 'player') {
      const lootMult = hasLiaoTianding ? 1.35 : 1;
      lootGold = Math.round(
        (120 + toConfig.baseGoldBonus * 90 + defenderTroopsStart * 0.15) * lootMult
      );
      lootFood = Math.round(
        100 + toConfig.baseFoodBonus * 80 + defenderTroopsStart * 0.12
      );
      nextResources.gold += lootGold;
      nextResources.food += lootFood;

      const alreadyConquered = state.battleReports.some(
        (r) => r.attackerFaction === 'player' && r.conquered && r.toId === march.toId
      );
      if (!alreadyConquered) {
        nextReputation += 20;
        highlights.push(
          `【首克獎勵】首次光復${toConfig.name}，聲望 +20，並開墾 2 塊農田！`
        );
      }
      if (hasLiaoTianding) {
        highlights.push(`【義俠奇謀】廖添丁劫富濟貧，戰利金幣額外提升 35%！`);
      }
    }
  } else {
    // Defender held the district
    nextDistricts[march.toId] = {
      ...toDistrict,
      troops: defenderTroopsEnd,
    };

    for (const defHId of defenderHeroIds) {
      if (nextOfficers[defHId]) {
        nextOfficers[defHId] = grantOfficerExp(nextOfficers[defHId], 20);
      }
    }

    const fromDist = nextDistricts[march.fromId];
    const canReturnHome = Boolean(fromDist && fromDist.faction === attackerFaction);

    if (canReturnHome && attackerTroopsEnd > 0) {
      nextDistricts[march.fromId] = {
        ...fromDist,
        troops: fromDist.troops + attackerTroopsEnd,
      };
    }

    for (const hId of attackerHeroIds) {
      const atkOfficer = nextOfficers[hId];
      if (!atkOfficer) continue;

      if (defenderFaction === 'player' && attackerFaction !== 'player') {
        if (rng() < 0.55) {
          capturedHeroIds.push(hId);
          nextOfficers[hId] = {
            ...atkOfficer,
            prisonerOf: 'player',
            districtId: march.toId,
            inMarchId: null,
          };
          continue;
        }
      }

      if (canReturnHome) {
        const homeDist = nextDistricts[march.fromId];
        nextDistricts[march.fromId] = {
          ...homeDist,
          garrisonHeroIds: homeDist.garrisonHeroIds.includes(hId)
            ? homeDist.garrisonHeroIds
            : [...homeDist.garrisonHeroIds, hId],
        };
        nextOfficers[hId] = grantOfficerExp(
          {
            ...atkOfficer,
            districtId: march.fromId,
            inMarchId: null,
          },
          10
        );
      } else {
        const retreated = retreatOfficerToFactionOrFree(
          atkOfficer,
          attackerFaction,
          march.toId,
          nextDistricts
        );
        nextOfficers[hId] = grantOfficerExp(retreated.officer, 10);
        if (retreated.retreatDistrictId && nextDistricts[retreated.retreatDistrictId]) {
          const retDist = nextDistricts[retreated.retreatDistrictId];
          if (!retDist.garrisonHeroIds.includes(hId)) {
            nextDistricts[retreated.retreatDistrictId] = {
              ...retDist,
              garrisonHeroIds: [...retDist.garrisonHeroIds, hId],
            };
          }
        }
      }
    }

    if (attackerFaction === 'player') {
      highlights.push(
        `【撤軍重整】攻城未果，殘部 ${attackerTroopsEnd} 人與隨軍武將撤回${DISTRICTS[march.fromId].name}。`
      );
    }
  }

  if (capturedHeroIds.length > 0) {
    const names = capturedHeroIds.map((id) => HEROES[id]?.name ?? id).join('、');
    highlights.push(`【生擒敵將】我軍於陣前俘獲 ${names}！`);
  }

  const remainingMarches = state.marches.filter((m) => m.id !== march.id);
  const playerDistrictCount = DISTRICT_LIST.filter(
    (d) => nextDistricts[d.id].faction === 'player'
  ).length;
  const playerActiveMarches = remainingMarches.filter((m) => m.faction === 'player').length;

  const victory = DISTRICT_LIST.every((d) => nextDistricts[d.id]?.faction === 'player');
  const defeat = playerDistrictCount === 0 && playerActiveMarches === 0;

  if (victory) {
    highlights.push('【一統台海】開台義軍平定台澎金馬與東南沿海二十九郡縣，成就百區爭霸偉業！');
  } else if (defeat) {
    highlights.push('【大勢已去】我軍盡失所有根據地，請重整旗鼓再戰江湖。');
  }

  const reportId = `report_${Math.round(state.gameTime * 100)}_${march.fromId}_${march.toId}_${state.battleReports.length + 1}`;

  const report: BattleReport = {
    id: reportId,
    timestamp: state.gameTime,
    attackerFaction,
    defenderFaction,
    fromId: march.fromId,
    toId: march.toId,
    attackerTroopsStart,
    attackerTroopsEnd,
    defenderTroopsStart,
    defenderTroopsEnd,
    attackerHeroIds,
    defenderHeroIds,
    winner,
    conquered,
    capturedHeroIds: capturedHeroIds.length > 0 ? capturedHeroIds : undefined,
    lootGold,
    lootFood,
    highlights,
  };

  let nextPendingPrisoners = state.pendingPrisoners;
  if (!state.autoMode.enabled && capturedHeroIds.length > 0) {
    nextPendingPrisoners = {
      battleId: reportId,
      districtId: march.toId,
      heroIds: capturedHeroIds,
    };
  }

  const nextState: GameState = {
    ...state,
    resources: nextResources,
    reputation: nextReputation,
    districts: nextDistricts,
    officers: nextOfficers,
    marches: remainingMarches,
    pendingPrisoners: nextPendingPrisoners,
    battleReports: [report, ...state.battleReports].slice(0, MAX_BATTLE_REPORTS),
    victory,
    defeat,
  };

  return { state: nextState, report };
}

export function completePendingBattle(
  state: GameState,
  manualOutcome?: ManualBattleOutcome,
  rng: () => number = Math.random
): GameState {
  if (!state.pendingBattle) return state;
  const pending = state.pendingBattle;
  const clearedState: GameState = {
    ...state,
    pendingBattle: null,
  };
  return resolveBattle(clearedState, pending.march, rng, manualOutcome).state;
}

// ==================== AI Counter-Pressure & Smart Auto Mode ====================

function trySpawnAiCounterAttack(
  state: GameState,
  rng: () => number
): GameState {
  if (rng() > 0.35) return state;

  const diffCfg = DIFFICULTY_CONFIGS[state.difficulty] ?? DIFFICULTY_CONFIGS.normal;
  const minTroops = diffCfg.aiMinTroopsToAttack;
  const candidates: Array<{ fromId: DistrictId; targets: DistrictId[] }> = [];

  for (const config of DISTRICT_LIST) {
    const dist = state.districts[config.id];
    if (dist.faction === 'player' || dist.faction === 'neutral') continue;
    if (dist.troops < minTroops) continue;

    const alreadyMarching = state.marches.some((m) => m.fromId === config.id);
    if (alreadyMarching) continue;

    const playerNeighbors = config.neighbors.filter(
      (nId) => state.districts[nId].faction === 'player'
    );
    if (playerNeighbors.length > 0) {
      candidates.push({ fromId: config.id, targets: playerNeighbors });
    }
  }

  if (candidates.length === 0) return state;

  const chosen = candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))];
  const targetId =
    chosen.targets[Math.min(chosen.targets.length - 1, Math.floor(rng() * chosen.targets.length))];
  const fromDistrict = state.districts[chosen.fromId];
  const sendTroops = Math.floor(fromDistrict.troops * 0.45);
  if (sendTroops < 50) return state;

  const isSea = Boolean(DISTRICTS[chosen.fromId].seaRoutes?.includes(targetId));
  const duration = isSea ? AI_MARCH_SEA_DURATION : AI_MARCH_LAND_DURATION;

  const marchId = `ai_march_${Math.round(state.gameTime * 100)}_${chosen.fromId}_${targetId}_${state.marches.length + 1}`;
  const aiHeroIds: string[] = [];
  const nextOfficers = { ...state.officers };
  let nextFromGarrison = [...fromDistrict.garrisonHeroIds];

  // Lead AI attack with up to 1 garrison officer if available
  const leadHeroId = fromDistrict.garrisonHeroIds.find((id) => {
    const o = nextOfficers[id];
    return o && o.faction === fromDistrict.faction && !o.prisonerOf && !o.inMarchId;
  });
  if (leadHeroId) {
    aiHeroIds.push(leadHeroId);
    nextFromGarrison = nextFromGarrison.filter((id) => id !== leadHeroId);
    nextOfficers[leadHeroId] = {
      ...nextOfficers[leadHeroId],
      districtId: null,
      inMarchId: marchId,
    };
  }

  const aiMarch: MarchOrder = {
    id: marchId,
    faction: fromDistrict.faction,
    fromId: chosen.fromId,
    toId: targetId,
    troops: sendTroops,
    heroIds: aiHeroIds,
    startedAt: state.gameTime,
    arriveAt: state.gameTime + duration,
    type: 'attack',
  };

  return {
    ...state,
    districts: {
      ...state.districts,
      [chosen.fromId]: {
        ...fromDistrict,
        troops: fromDistrict.troops - sendTroops,
        garrisonHeroIds: nextFromGarrison,
      },
    },
    officers: nextOfficers,
    marches: [...state.marches, aiMarch],
  };
}

export function runAutoModeStep(state: GameState): GameState {
  if (!state.autoMode?.enabled || state.paused || state.victory || state.defeat) {
    return state;
  }

  let next = state;

  // 1. Auto Farm: harvest all mature crops, then replant unlocked empty plots
  if (next.autoMode.autoFarm) {
    next = harvestAllMature(next);

    for (const config of DISTRICT_LIST) {
      const dist = next.districts[config.id];
      if (!dist || dist.faction !== 'player') continue;

      for (const plot of dist.plots) {
        if (!plot.unlocked || plot.cropId !== null) continue;

        const candidateCrops: CropId[] = [config.specialtyCrop, 'rice', 'sweet_potato'];
        let chosenCrop: CropId | null = null;
        for (const cropId of candidateCrops) {
          const crop = CROPS[cropId];
          if (crop && next.resources.gold >= crop.seedCostGold + 60) {
            chosenCrop = cropId;
            break;
          }
        }
        if (chosenCrop) {
          next = plantCrop(next, config.id, plot.plotIndex, chosenCrop);
        }
      }
    }
  }

  // 2. Auto Recruit & Building Upgrade
  if (next.autoMode.autoRecruit) {
    if (next.resources.food >= 380 && next.resources.gold >= 260) {
      const playerDistricts = DISTRICT_LIST.map((c) => next.districts[c.id]).filter(
        (d) => d && d.faction === 'player'
      );
      const belowMax = playerDistricts.filter(
        (d) => d.troops < getDistrictStats(next, d.id).maxTroops
      );

      if (belowMax.length > 0) {
        const frontline = belowMax.filter((d) =>
          DISTRICTS[d.id].neighbors.some((nId) => next.districts[nId]?.faction !== 'player')
        );
        const pool = frontline.length > 0 ? frontline : belowMax;
        pool.sort((a, b) => a.troops - b.troops);
        const target = pool[0];
        const stats = getDistrictStats(next, target.id);
        const space = Math.floor(stats.maxTroops - target.troops);
        const maxByFood = Math.floor(next.resources.food);
        const maxByGold = Math.floor(next.resources.gold * 2);
        const recruitAmount = Math.min(80, space, maxByFood, maxByGold);
        if (recruitAmount > 0) {
          next = recruitTroops(next, target.id, recruitAmount);
        }
      }
    }

    if (next.resources.gold >= 650 && next.resources.food >= 500) {
      const upgradeCandidates: Array<{
        districtId: DistrictId;
        type: 'granary' | 'wall';
        level: number;
      }> = [];

      for (const config of DISTRICT_LIST) {
        const dist = next.districts[config.id];
        if (!dist || dist.faction !== 'player') continue;
        for (const type of ['granary', 'wall'] as const) {
          const lvl = dist.buildings[type];
          if (lvl < BUILDINGS[type].maxLevel) {
            const cost = getBuildingCost(type, lvl);
            if (next.resources.gold >= cost.gold && next.resources.food >= cost.food) {
              upgradeCandidates.push({ districtId: config.id, type, level: lvl });
            }
          }
        }
      }

      if (upgradeCandidates.length > 0) {
        upgradeCandidates.sort((a, b) => a.level - b.level);
        const best = upgradeCandidates[0];
        next = upgradeBuilding(next, best.districtId, best.type);
      }
    }
  }

  // 3. Auto Attack: launch up to 2 concurrent player attack marches when having clear advantage
  if (next.autoMode.autoAttack) {
    const activePlayerAttacks = next.marches.filter(
      (m) => m.faction === 'player' && m.type === 'attack'
    );
    if (activePlayerAttacks.length < 2) {
      const activeTargets = new Set(activePlayerAttacks.map((m) => m.toId));

      for (const config of DISTRICT_LIST) {
        const dist = next.districts[config.id];
        if (!dist || dist.faction !== 'player' || dist.troops < 320) continue;

        const enemyNeighbors = config.neighbors
          .map((nId) => next.districts[nId])
          .filter((n) => n && n.faction !== 'player' && !activeTargets.has(n.id));

        if (enemyNeighbors.length === 0) continue;

        enemyNeighbors.sort((a, b) => a.troops - b.troops);
        const weakestEnemy = enemyNeighbors[0];

        if (dist.troops < Math.max(1, weakestEnemy.troops) * 1.45) continue;

        const sendTroops = Math.floor(dist.troops) - 180;
        if (sendTroops < 10) continue;

        const foodCost = Math.ceil(sendTroops * 0.4);
        if (next.resources.food < foodCost) continue;

        const availableHeroes = Object.values(next.officers)
          .filter(
            (o) =>
              o.faction === 'player' &&
              !o.prisonerOf &&
              o.inMarchId === null &&
              Boolean(HEROES[o.heroId])
          )
          .sort((a, b) => {
            const cfgA = HEROES[a.heroId];
            const cfgB = HEROES[b.heroId];
            return cfgB.might + cfgB.command - (cfgA.might + cfgA.command);
          })
          .slice(0, 2)
          .map((o) => o.heroId);

        const res = dispatchMarch(next, dist.id, weakestEnemy.id, sendTroops, availableHeroes);
        if (!res.error) {
          next = res.state;
          break;
        }
      }
    }
  }

  return next;
}

// ==================== Main World Tick ====================

export function tickGame(
  state: GameState,
  deltaSec: number,
  rng: () => number = Math.random
): GameState {
  if (
    state.paused ||
    state.victory ||
    state.defeat ||
    state.pendingBattle !== null ||
    deltaSec <= 0
  ) {
    return state;
  }

  const diffCfg = DIFFICULTY_CONFIGS[state.difficulty] ?? DIFFICULTY_CONFIGS.normal;
  const effectiveDelta = deltaSec * state.speed;
  const prevTime = state.gameTime;
  const nextTime = prevTime + effectiveDelta;

  let goldGain = 0;
  const nextDistricts = { ...state.districts };

  for (const config of DISTRICT_LIST) {
    const dist = nextDistricts[config.id];
    if (dist.faction === 'player') {
      const stats = getDistrictStats(state, config.id);
      goldGain += stats.passiveGoldPerSec * effectiveDelta;
      if (dist.troops < stats.maxTroops && stats.passiveTroopsPerSec > 0) {
        nextDistricts[config.id] = {
          ...dist,
          troops: Math.min(
            stats.maxTroops,
            dist.troops + stats.passiveTroopsPerSec * effectiveDelta
          ),
        };
      }
    } else if (dist.faction !== 'neutral') {
      const enemyCap = Math.max(
        Math.round(config.initialTroops * diffCfg.enemyInitialMult),
        650 + dist.buildings.barracks * 300
      );
      if (dist.troops < enemyCap) {
        nextDistricts[config.id] = {
          ...dist,
          troops: Math.min(
            enemyCap,
            dist.troops + 0.18 * diffCfg.enemyRegenMult * effectiveDelta
          ),
        };
      }
    }
  }

  let nextState: GameState = {
    ...state,
    gameTime: nextTime,
    resources: {
      ...state.resources,
      gold: state.resources.gold + goldGain,
    },
    districts: nextDistricts,
  };

  // Resolve arriving marches
  const arrivedMarches = nextState.marches.filter((m) => nextTime >= m.arriveAt);
  for (const march of arrivedMarches) {
    const dest = nextState.districts[march.toId];
    if (march.type === 'reinforce' && dest.faction === march.faction) {
      const updatedOfficers = { ...nextState.officers };
      const nextGarrison = [...dest.garrisonHeroIds];

      for (const hId of march.heroIds) {
        if (updatedOfficers[hId]) {
          updatedOfficers[hId] = {
            ...updatedOfficers[hId],
            districtId: march.toId,
            inMarchId: null,
          };
          if (!nextGarrison.includes(hId)) {
            nextGarrison.push(hId);
          }
        }
      }

      nextState = {
        ...nextState,
        districts: {
          ...nextState.districts,
          [march.toId]: {
            ...dest,
            troops: dest.troops + march.troops,
            garrisonHeroIds: nextGarrison,
          },
        },
        officers: updatedOfficers,
        marches: nextState.marches.filter((m) => m.id !== march.id),
      };
    } else {
      const involvesPlayer =
        march.faction === 'player' || dest.faction === 'player';

      if (involvesPlayer && !nextState.autoMode.enabled) {
        // Trigger Sango Heroes interactive battle prompt and pause world tick
        nextState = {
          ...nextState,
          marches: nextState.marches.filter((m) => m.id !== march.id),
          pendingBattle: {
            id: march.id,
            march,
            defenderFaction: dest.faction,
            defenderTroops: Math.floor(dest.troops),
            defenderHeroIds: [...dest.garrisonHeroIds],
            terrain: DISTRICTS[march.toId].terrain,
          },
        };
        return nextState;
      }

      const battleOutcome = resolveBattle(nextState, march, rng);
      nextState = battleOutcome.state;
    }
  }

  // Periodic AI counter-pressure (scaled by difficulty & endless mode)
  const aiCheckInterval =
    nextState.mode === 'endless'
      ? Math.max(10, Math.round(diffCfg.aiAttackIntervalSec * 0.78))
      : diffCfg.aiAttackIntervalSec;
  if (
    !nextState.victory &&
    !nextState.defeat &&
    Math.floor(nextTime / aiCheckInterval) >
      Math.floor(prevTime / aiCheckInterval)
  ) {
    nextState = trySpawnAiCounterAttack(nextState, rng);
  }

  // 1949+ Historical Event Triggering (Story Mode only)
  if (nextState.mode === 'story' && !nextState.victory && !nextState.defeat) {
    const cal = getGameCalendar(nextState.gameTime);
    const newlyTriggered: string[] = [];
    for (const ev of HISTORICAL_EVENT_LIST) {
      const reachedDate =
        cal.year > ev.year || (cal.year === ev.year && cal.month >= ev.month);
      if (
        reachedDate &&
        !nextState.activeEventIds.includes(ev.id) &&
        !nextState.resolvedEvents.some((r) => r.eventId === ev.id)
      ) {
        newlyTriggered.push(ev.id);
      }
    }
    if (newlyTriggered.length > 0) {
      nextState = {
        ...nextState,
        activeEventIds: [...nextState.activeEventIds, ...newlyTriggered],
      };
    }
  }

  // Smart Auto Mode (throttled to ~once every 2 game seconds)
  if (
    nextState.autoMode?.enabled &&
    !nextState.paused &&
    !nextState.victory &&
    !nextState.defeat &&
    Math.floor(prevTime / 2) < Math.floor(nextTime / 2)
  ) {
    nextState = runAutoModeStep(nextState);
  }

  return nextState;
}

// ==================== Historical Events ====================

export function resolveHistoricalEvent(
  state: GameState,
  eventId: string,
  choiceId: string
): GameState {
  if (!state.activeEventIds.includes(eventId)) return state;
  const ev = HISTORICAL_EVENTS[eventId];
  if (!ev) return state;

  const choice = ev.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const nextResources = {
    food: Math.max(0, state.resources.food + (choice.foodDelta ?? 0)),
    gold: Math.max(0, state.resources.gold + (choice.goldDelta ?? 0)),
  };
  const nextReputation = Math.max(0, state.reputation + (choice.reputationDelta ?? 0));

  const nextDistricts: Record<DistrictId, DistrictState> = { ...state.districts };

  if (typeof choice.moraleDelta === 'number' && choice.moraleDelta !== 0) {
    for (const cfg of DISTRICT_LIST) {
      const dist = nextDistricts[cfg.id];
      if (dist && dist.faction === 'player') {
        nextDistricts[cfg.id] = {
          ...dist,
          morale: Math.max(0, Math.min(100, dist.morale + choice.moraleDelta)),
        };
      }
    }
  }

  if (choice.troopsDelta && choice.troopsDelta.amount !== 0) {
    const { districtId, amount } = choice.troopsDelta;
    if (amount < 0) {
      const target = nextDistricts[districtId];
      if (target) {
        nextDistricts[districtId] = {
          ...target,
          troops: Math.max(0, target.troops + amount),
        };
      }
    } else {
      let targetId: DistrictId | null = null;
      if (nextDistricts[districtId]?.faction === 'player') {
        targetId = districtId;
      } else if (nextDistricts[state.startingDistrictId]?.faction === 'player') {
        targetId = state.startingDistrictId;
      } else if (nextDistricts.tainan?.faction === 'player') {
        targetId = 'tainan';
      } else {
        const firstPlayer = DISTRICT_LIST.find(
          (d) => nextDistricts[d.id]?.faction === 'player'
        );
        targetId = firstPlayer ? firstPlayer.id : null;
      }

      if (targetId) {
        const target = nextDistricts[targetId];
        nextDistricts[targetId] = {
          ...target,
          troops: target.troops + amount,
        };
      }
    }
  }

  let nextMarches = state.marches;
  if (choice.enemyAttack) {
    const { fromId, toId, troops } = choice.enemyAttack;
    const fromDist = nextDistricts[fromId];
    const toDist = nextDistricts[toId];
    if (
      fromDist &&
      toDist &&
      fromDist.faction !== 'player' &&
      fromDist.faction !== toDist.faction &&
      troops > 0
    ) {
      const isSea = Boolean(DISTRICTS[fromId]?.seaRoutes?.includes(toId));
      const duration = isSea ? AI_MARCH_SEA_DURATION : AI_MARCH_LAND_DURATION;

      const deductable = Math.max(0, Math.min(troops, Math.floor(fromDist.troops) - 100));
      if (deductable > 0) {
        nextDistricts[fromId] = {
          ...fromDist,
          troops: fromDist.troops - deductable,
        };
      }

      const eventMarch: MarchOrder = {
        id: `event_march_${ev.id}_${Math.round(state.gameTime * 100)}_${nextMarches.length + 1}`,
        faction: fromDist.faction,
        fromId,
        toId,
        troops,
        heroIds: [],
        startedAt: state.gameTime,
        arriveAt: state.gameTime + duration,
        type: 'attack',
      };
      nextMarches = [...nextMarches, eventMarch];
    }
  }

  const resolvedRecord: ResolvedHistoricalEvent = {
    eventId: ev.id,
    year: ev.year,
    month: ev.month,
    choiceId: choice.id,
    choiceLabel: choice.label,
    outcomeText: choice.effectDesc,
  };

  return {
    ...state,
    resources: nextResources,
    reputation: nextReputation,
    districts: nextDistricts,
    marches: nextMarches,
    activeEventIds: state.activeEventIds.filter((id) => id !== eventId),
    resolvedEvents: [resolvedRecord, ...state.resolvedEvents],
  };
}

// ==================== Save / Load Serialization ====================

export function exportSaveJson(state: GameState): string {
  return JSON.stringify(
    {
      ...state,
      lastSavedAt: Date.now(),
    },
    null,
    2
  );
}

export function importSaveJson(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json) as Partial<GameState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.gameTime !== 'number' || !Number.isFinite(parsed.gameTime)) {
      return null;
    }
    if (
      !parsed.resources ||
      typeof parsed.resources.food !== 'number' ||
      typeof parsed.resources.gold !== 'number'
    ) {
      return null;
    }
    // Gracefully reject old V1 saves (without officers) so V2 starts fresh cleanly
    if (!parsed.officers || typeof parsed.officers !== 'object') {
      return null;
    }
    if (!parsed.districts || typeof parsed.districts !== 'object') return null;

    const hydratedDistricts = {} as Record<DistrictId, DistrictState>;
    let validDistrictCount = 0;

    for (const cfg of DISTRICT_LIST) {
      const dist = parsed.districts[cfg.id];
      if (!dist) {
        hydratedDistricts[cfg.id] = createInitialDistrictState(cfg);
        continue;
      }
      if (
        dist.id !== cfg.id ||
        !FACTIONS[dist.faction] ||
        typeof dist.troops !== 'number' ||
        !Array.isArray(dist.plots)
      ) {
        return null;
      }
      validDistrictCount += 1;
      hydratedDistricts[cfg.id] = dist;
    }

    if (validDistrictCount === 0) return null;

    if (!Array.isArray(parsed.marches) || !Array.isArray(parsed.battleReports)) {
      return null;
    }
    if (!parsed.selectedDistrictId || !DISTRICTS[parsed.selectedDistrictId]) {
      return null;
    }

    const mode: GameMode = parsed.mode === 'endless' ? 'endless' : 'story';
    const difficulty: DifficultyLevel =
      parsed.difficulty && DIFFICULTY_CONFIGS[parsed.difficulty]
        ? parsed.difficulty
        : 'normal';
    const rawAuto = parsed.autoMode;
    const autoMode: AutoModeConfig =
      rawAuto && typeof rawAuto === 'object'
        ? {
            enabled:
              typeof rawAuto.enabled === 'boolean'
                ? rawAuto.enabled
                : DEFAULT_AUTO_MODE.enabled,
            autoFarm:
              typeof rawAuto.autoFarm === 'boolean'
                ? rawAuto.autoFarm
                : DEFAULT_AUTO_MODE.autoFarm,
            autoRecruit:
              typeof rawAuto.autoRecruit === 'boolean'
                ? rawAuto.autoRecruit
                : DEFAULT_AUTO_MODE.autoRecruit,
            autoAttack:
              typeof rawAuto.autoAttack === 'boolean'
                ? rawAuto.autoAttack
                : DEFAULT_AUTO_MODE.autoAttack,
          }
        : { ...DEFAULT_AUTO_MODE };
    const startingDistrictId: DistrictId =
      parsed.startingDistrictId && DISTRICTS[parsed.startingDistrictId]
        ? parsed.startingDistrictId
        : 'tainan';

    const activeEventIds = Array.isArray(parsed.activeEventIds)
      ? parsed.activeEventIds.filter(
          (id): id is string => typeof id === 'string' && Boolean(HISTORICAL_EVENTS[id])
        )
      : [];
    const resolvedEvents = Array.isArray(parsed.resolvedEvents)
      ? parsed.resolvedEvents
      : [];

    return {
      mode,
      difficulty,
      autoMode,
      startingDistrictId,
      gameTime: parsed.gameTime,
      paused: Boolean(parsed.paused),
      speed: parsed.speed === 2 || parsed.speed === 4 ? parsed.speed : 1,
      resources: {
        food: parsed.resources.food,
        gold: parsed.resources.gold,
      },
      reputation:
        typeof parsed.reputation === 'number' && Number.isFinite(parsed.reputation)
          ? parsed.reputation
          : 100,
      districts: hydratedDistricts,
      officers: parsed.officers as Record<string, OfficerState>,
      marches: parsed.marches,
      pendingBattle: parsed.pendingBattle ?? null,
      pendingPrisoners: parsed.pendingPrisoners ?? null,
      battleReports: parsed.battleReports,
      activeEventIds,
      resolvedEvents,
      selectedDistrictId: parsed.selectedDistrictId,
      victory: Boolean(parsed.victory),
      defeat: Boolean(parsed.defeat),
      soundMuted: Boolean(parsed.soundMuted),
      lastSavedAt:
        typeof parsed.lastSavedAt === 'number' ? parsed.lastSavedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveGameToStorage(state: GameState): void {
  try {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.setItem(getSaveKeyForMode(state.mode), exportSaveJson(state));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function loadGameFromStorage(mode?: GameMode): GameState | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;

    if (mode) {
      const modeRaw = globalThis.localStorage.getItem(getSaveKeyForMode(mode));
      if (modeRaw) {
        return importSaveJson(modeRaw);
      }
      if (mode === 'story') {
        const legacyRaw = globalThis.localStorage.getItem(SAVE_KEY);
        if (legacyRaw) {
          return importSaveJson(legacyRaw);
        }
      }
      return null;
    }

    const storyRaw = globalThis.localStorage.getItem(SAVE_KEY_STORY);
    if (storyRaw) return importSaveJson(storyRaw);
    const legacyRaw = globalThis.localStorage.getItem(SAVE_KEY);
    if (legacyRaw) return importSaveJson(legacyRaw);
    const endlessRaw = globalThis.localStorage.getItem(SAVE_KEY_ENDLESS);
    if (endlessRaw) return importSaveJson(endlessRaw);
    return null;
  } catch {
    return null;
  }
}

export interface SavedModeSummary {
  exists: boolean;
  ownedCount: number;
  totalCount: number;
  gameTime: number;
  startingDistrictId: DistrictId;
}

export function getSavedModeSummary(mode: GameMode): SavedModeSummary | null {
  const loaded = loadGameFromStorage(mode);
  if (!loaded) return null;
  const ownedCount = DISTRICT_LIST.filter(
    (d) => loaded.districts[d.id]?.faction === 'player'
  ).length;
  return {
    exists: true,
    ownedCount,
    totalCount: DISTRICT_LIST.length,
    gameTime: loaded.gameTime,
    startingDistrictId: loaded.startingDistrictId,
  };
}
