import { describe, expect, it } from 'vitest';
import {
  CROPS,
  DISTRICT_LIST,
  DISTRICTS,
  HERO_LIST,
  SECONDS_PER_MONTH,
  getGameCalendar,
} from '../data';
import {
  AI_CHECK_INTERVAL_ENDLESS_SEC,
  AI_MARCH_SEA_DURATION,
  DEFAULT_AUTO_MODE,
  DIFFICULTY_CONFIGS,
  EXPLORE_COST_GOLD,
  MARCH_LAND_DURATION,
  MARCH_SEA_DURATION,
  RECRUIT_COST_GOLD,
  REWARD_COST_GOLD,
  SAVE_KEY,
  SAVE_KEY_ENDLESS,
  SAVE_KEY_STORY,
  assignHeroToDistrict,
  completePendingBattle,
  createInitialGameState,
  dismissPendingPrisoners,
  dispatchMarch,
  exploreDistrict,
  exportSaveJson,
  getBuildingCost,
  getDistrictStats,
  getPlotUnlockCost,
  getRecruitChance,
  getSavedModeSummary,
  handlePrisonerAction,
  harvestAllMature,
  harvestPlot,
  importSaveJson,
  loadGameFromStorage,
  plantCrop,
  recruitOfficer,
  recruitTroops,
  resolveBattle,
  resolveHistoricalEvent,
  rewardOfficer,
  saveGameToStorage,
  setDifficulty,
  tickGame,
  toggleSoundMute,
  unlockPlot,
  updateAutoMode,
  upgradeBuilding,
} from './gameEngine';

describe('gameEngine V2.0 - initial state & 39 officers', () => {
  it('initializes all 29 districts, all 39 officers (31 garrison + 8 hidden free), resources, and Tainan plots', () => {
    const state = createInitialGameState();

    expect(Object.keys(state.districts)).toHaveLength(29);
    expect(Object.keys(state.officers)).toHaveLength(39);
    expect(HERO_LIST).toHaveLength(39);

    expect(state.districts.xiamen.faction).toBe('mainland_command');
    expect(state.districts.fuzhou.faction).toBe('mainland_command');
    expect(state.activeEventIds).toEqual([]);
    expect(state.resolvedEvents).toEqual([]);
    expect(state.selectedDistrictId).toBe('tainan');
    expect(state.speed).toBe(1);
    expect(state.paused).toBe(false);
    expect(state.resources).toEqual({ food: 950, gold: 900 });
    expect(state.reputation).toBe(100);
    expect(state.pendingBattle).toBeNull();
    expect(state.pendingPrisoners).toBeNull();
    expect(state.soundMuted).toBe(false);

    // Every one of the 29 districts starts with at least 1 garrison officer
    for (const cfg of DISTRICT_LIST) {
      expect(state.districts[cfg.id].garrisonHeroIds.length).toBeGreaterThanOrEqual(1);
    }

    // Tainan starts with 3 player officers: koxinga, chen_yonghua, anping_helmsman
    const tainan = state.districts.tainan;
    expect(tainan.faction).toBe('player');
    expect(tainan.buildings).toEqual({ granary: 1, barracks: 1, wall: 2, market: 1 });
    expect(tainan.garrisonHeroIds).toEqual(
      expect.arrayContaining(['koxinga', 'chen_yonghua', 'anping_helmsman'])
    );
    expect(tainan.garrisonHeroIds).toHaveLength(3);
    expect(tainan.plots.filter((p) => p.unlocked)).toHaveLength(3);
    expect(tainan.plots[0].cropId).toBe('rice');
    expect(tainan.plots[0].matureAt).toBeGreaterThan(0);

    // Verify SSR vs SR/R loyalty
    expect(state.officers.koxinga.faction).toBe('player');
    expect(state.officers.koxinga.loyalty).toBe(92);
    expect(state.officers.chen_yonghua.loyalty).toBe(84);
    expect(state.officers.shi_lang.faction).toBe('mainland_command');
    expect(state.officers.shi_lang.loyalty).toBe(92);

    // Verify 8 hidden free talents
    const freeOfficers = Object.values(state.officers).filter((o) => o.faction === 'free');
    expect(freeOfficers).toHaveLength(8);
    expect(freeOfficers.every((o) => !o.discovered && o.loyalty === 65)).toBe(true);

    // Non-player districts start with locked plots
    expect(state.districts.taipei.plots.every((p) => !p.unlocked)).toBe(true);
    expect(state.districts.taipei.buildings.wall).toBe(DISTRICTS.taipei.initialWallLevel);
  });

  it('initializes endless mode with custom capital (kinmen), moving koxinga & chen_yonghua + keeping local garrison', () => {
    const state = createInitialGameState('endless', 'kinmen');

    expect(state.mode).toBe('endless');
    expect(state.startingDistrictId).toBe('kinmen');
    expect(state.selectedDistrictId).toBe('kinmen');

    const playerDistricts = DISTRICT_LIST.filter(
      (d) => state.districts[d.id].faction === 'player'
    );
    expect(playerDistricts.map((d) => d.id)).toEqual(['kinmen']);

    expect(state.districts.kinmen.faction).toBe('player');
    expect(state.districts.kinmen.troops).toBe(650);
    expect(state.districts.kinmen.garrisonHeroIds).toEqual(
      expect.arrayContaining(['kinmen_wind_lion', 'koxinga', 'chen_yonghua'])
    );
    expect(state.officers.koxinga.faction).toBe('player');
    expect(state.officers.koxinga.districtId).toBe('kinmen');
    expect(state.officers.chen_yonghua.faction).toBe('player');
    expect(state.officers.chen_yonghua.districtId).toBe('kinmen');
    expect(state.officers.kinmen_wind_lion.faction).toBe('player');

    // Tainan is now south_pirates and no longer has koxinga/chen_yonghua
    expect(state.districts.tainan.faction).toBe('south_pirates');
    expect(state.districts.tainan.garrisonHeroIds).not.toContain('koxinga');
    expect(state.districts.tainan.garrisonHeroIds).not.toContain('chen_yonghua');
    expect(state.districts.tainan.garrisonHeroIds).toContain('anping_helmsman');

    // At least 1 adjacent neighbor of kinmen has a manageable early-game garrison (<= 300)
    const kinmenNeighbors = DISTRICTS.kinmen.neighbors;
    expect(kinmenNeighbors.some((nId) => state.districts[nId].troops <= 300)).toBe(true);
  });
});

describe('gameEngine - farming, buildings, troops & officer assignment', () => {
  it('plants, matures via tickGame, and harvests crops with politics-boosted multipliers', () => {
    let state = createInitialGameState();
    const initialGold = state.resources.gold;

    // Plant sugarcane (Tainan specialty crop) on plot 1
    state = plantCrop(state, 'tainan', 1, 'sugarcane');
    expect(state.resources.gold).toBe(initialGold - CROPS.sugarcane.seedCostGold);
    expect(state.districts.tainan.plots[1].cropId).toBe('sugarcane');

    // Cannot harvest before mature
    const premature = harvestPlot(state, 'tainan', 1);
    expect(premature).toBe(state);

    // Advance time past sugarcane growTimeSec
    state = tickGame(state, CROPS.sugarcane.growTimeSec + 1, () => 0.99);
    const foodBefore = state.resources.food;
    const goldBefore = state.resources.gold;

    state = harvestPlot(state, 'tainan', 1);
    expect(state.districts.tainan.plots[1].cropId).toBeNull();
    expect(state.resources.food).toBeGreaterThan(foodBefore);
    expect(state.resources.gold).toBeGreaterThan(goldBefore);
  });

  it('harvestAllMature harvests all ready plots across player districts', () => {
    let state = createInitialGameState();
    state = plantCrop(state, 'tainan', 1, 'sweet_potato');
    state = plantCrop(state, 'tainan', 2, 'sweet_potato');

    state = tickGame(state, 15, () => 0.99);
    const foodBefore = state.resources.food;

    state = harvestAllMature(state);
    expect(state.districts.tainan.plots[0].cropId).toBeNull();
    expect(state.districts.tainan.plots[1].cropId).toBeNull();
    expect(state.districts.tainan.plots[2].cropId).toBeNull();
    expect(state.resources.food).toBeGreaterThan(foodBefore);
  });

  it('unlocks locked plots and upgrades buildings', () => {
    let state = createInitialGameState();
    const plotCost = getPlotUnlockCost(3);
    state = unlockPlot(state, 'tainan', 3);
    expect(state.districts.tainan.plots[3].unlocked).toBe(true);
    expect(state.resources.gold).toBe(900 - plotCost.gold);
    expect(state.resources.food).toBe(950 - plotCost.food);

    const statsBefore = getDistrictStats(state, 'tainan');
    const bCost = getBuildingCost('granary', 1);
    const goldBefore = state.resources.gold;
    const foodBefore = state.resources.food;

    state = upgradeBuilding(state, 'tainan', 'granary');
    expect(state.districts.tainan.buildings.granary).toBe(2);
    expect(state.resources.gold).toBe(goldBefore - bCost.gold);
    expect(state.resources.food).toBe(foodBefore - bCost.food);
    expect(getDistrictStats(state, 'tainan').foodMultiplier).toBeGreaterThan(
      statsBefore.foodMultiplier
    );
  });

  it('recruits troops and reassigns officers cleanly', () => {
    let state = createInitialGameState();
    const troopsBefore = state.districts.tainan.troops;
    state = recruitTroops(state, 'tainan', 100);
    expect(state.districts.tainan.troops).toBe(troopsBefore + 100);
    expect(state.resources.food).toBe(850);
    expect(state.resources.gold).toBe(850);

    // Unassign and reassign anping_helmsman
    state = assignHeroToDistrict(state, 'anping_helmsman', null);
    expect(state.officers.anping_helmsman.districtId).toBeNull();
    expect(state.districts.tainan.garrisonHeroIds).not.toContain('anping_helmsman');

    state = assignHeroToDistrict(state, 'anping_helmsman', 'tainan');
    expect(state.officers.anping_helmsman.districtId).toBe('tainan');
    expect(state.districts.tainan.garrisonHeroIds).toContain('anping_helmsman');

    // Cannot reassign enemy officer
    const unchanged = assignHeroToDistrict(state, 'shi_lang', 'tainan');
    expect(unchanged).toBe(state);
  });

  it('toggles sound mute state', () => {
    let state = createInitialGameState();
    expect(state.soundMuted).toBe(false);
    state = toggleSoundMute(state);
    expect(state.soundMuted).toBe(true);
    state = toggleSoundMute(state);
    expect(state.soundMuted).toBe(false);
  });
});

describe('gameEngine V2.0 - RTK11 Explore / Recruit / Loyalty / Prison', () => {
  it('discovers hidden free talent in owned district and adjacent district, or grants specialty bounty', () => {
    let state = createInitialGameState();
    // Give player taipei where liao_tianding is hidden as a free officer
    state.districts.taipei.faction = 'player';
    const goldBefore = state.resources.gold;

    const foundLocal = exploreDistrict(state, 'taipei', 'chen_yonghua', () => 0.1);
    expect(foundLocal.foundHeroId).toBe('liao_tianding');
    expect(foundLocal.state.officers.liao_tianding.discovered).toBe(true);
    expect(foundLocal.state.officers.liao_tianding.districtId).toBe('taipei');
    expect(foundLocal.state.resources.gold).toBe(goldBefore - EXPLORE_COST_GOLD);

    // Exploring tainan (no local free officer, but chiayi_county adjacent has swinhoe_pheasant)
    const foundAdj = exploreDistrict(foundLocal.state, 'tainan', 'chen_yonghua', () => 0.1);
    expect(foundAdj.foundHeroId).toBe('swinhoe_pheasant');
    expect(foundAdj.state.officers.swinhoe_pheasant.discovered).toBe(true);
    expect(foundAdj.state.officers.swinhoe_pheasant.districtId).toBe('tainan');

    // Exploring tainan again when no local/adjacent hidden free officers remain yields gold/food bounty
    const bounty = exploreDistrict(foundAdj.state, 'tainan', 'chen_yonghua', () => 0.2);
    expect(bounty.foundHeroId).toBeUndefined();
    expect(bounty.bonusGold).toBeGreaterThanOrEqual(120);
    expect(bounty.state.resources.gold).toBeGreaterThan(
      foundAdj.state.resources.gold - EXPLORE_COST_GOLD
    );
  });

  it('recruits discovered free talent and prisoner officers, and drops loyalty on refusal', () => {
    let state = createInitialGameState();
    // Discover liao_tianding
    state.officers.liao_tianding.discovered = true;
    const chance = getRecruitChance(state, 'liao_tianding', 'chen_yonghua');
    expect(chance).toBeGreaterThanOrEqual(0.65);
    expect(chance).toBeLessThanOrEqual(0.95);

    // Refusal test (rng = 0.99)
    const refused = recruitOfficer(state, 'liao_tianding', 'chen_yonghua', () => 0.99);
    expect(refused.success).toBe(false);
    expect(refused.state.resources.gold).toBe(state.resources.gold - RECRUIT_COST_GOLD);
    expect(refused.state.officers.liao_tianding.loyalty).toBe(
      state.officers.liao_tianding.loyalty - 6
    );
    expect(refused.state.officers.liao_tianding.faction).toBe('free');

    // Success test (rng = 0.1)
    const recruited = recruitOfficer(refused.state, 'liao_tianding', 'chen_yonghua', () => 0.1);
    expect(recruited.success).toBe(true);
    expect(recruited.state.officers.liao_tianding.faction).toBe('player');
    expect(recruited.state.officers.liao_tianding.loyalty).toBe(88);
    expect(recruited.state.officers.liao_tianding.districtId).toBe('tainan');
    expect(recruited.state.districts.tainan.garrisonHeroIds).toContain('liao_tianding');
    expect(recruited.state.reputation).toBe(state.reputation + 10);

    // Enemy officer with loyalty >= 82 cannot be poached
    expect(getRecruitChance(recruited.state, 'shi_lang', 'chen_yonghua')).toBe(0);
    // Once prisoner, can be recruited and loyalty drops on refusal
    const prisonState: typeof recruited.state = {
      ...recruited.state,
      officers: {
        ...recruited.state.officers,
        shi_lang: {
          ...recruited.state.officers.shi_lang,
          prisonerOf: 'player',
          loyalty: 72,
        },
      },
    };
    const prisonChance = getRecruitChance(prisonState, 'shi_lang', 'koxinga');
    expect(prisonChance).toBeGreaterThanOrEqual(0.55);

    const prisonFail = recruitOfficer(prisonState, 'shi_lang', 'koxinga', () => 0.99);
    expect(prisonFail.success).toBe(false);
    expect(prisonFail.state.officers.shi_lang.loyalty).toBe(66);

    const prisonOk = recruitOfficer(prisonFail.state, 'shi_lang', 'koxinga', () => 0.05);
    expect(prisonOk.success).toBe(true);
    expect(prisonOk.state.officers.shi_lang.faction).toBe('player');
    expect(prisonOk.state.officers.shi_lang.prisonerOf).toBeNull();
  });

  it('rewards player officers to boost loyalty up to 100', () => {
    const state = createInitialGameState();
    const loyaltyBefore = state.officers.chen_yonghua.loyalty; // 84
    const goldBefore = state.resources.gold;

    const res = rewardOfficer(state, 'chen_yonghua');
    expect(res.error).toBeUndefined();
    expect(res.state.officers.chen_yonghua.loyalty).toBe(Math.min(100, loyaltyBefore + 15));
    expect(res.state.resources.gold).toBe(goldBefore - REWARD_COST_GOLD);

    // Second reward caps at 100
    const res2 = rewardOfficer(res.state, 'chen_yonghua');
    expect(res2.state.officers.chen_yonghua.loyalty).toBe(100);

    // Third reward returns error since already 100
    const res3 = rewardOfficer(res2.state, 'chen_yonghua');
    expect(res3.error).toBeDefined();
  });
});

describe('gameEngine V2.0 - Sango Heroes Pending Battle, Manual Outcome & Prisoners', () => {
  it('triggers pendingBattle in manual mode on march arrival, pauses world tick, and applies ManualBattleOutcome + prisoner capture', () => {
    let state = createInitialGameState();
    // Dispatch from tainan -> chiayi_county (guarded by alishan_warden)
    const dispatch = dispatchMarch(state, 'tainan', 'chiayi_county', 500, [
      'koxinga',
      'chen_yonghua',
    ]);
    expect(dispatch.error).toBeUndefined();
    state = dispatch.state;
    expect(state.marches).toHaveLength(1);
    expect(state.marches[0].arriveAt - state.marches[0].startedAt).toBe(MARCH_LAND_DURATION);
    expect(state.officers.koxinga.inMarchId).toBe(state.marches[0].id);

    // Tick past arrival in manual mode (autoMode.enabled = false)
    state = tickGame(state, MARCH_LAND_DURATION + 1, () => 0.3);
    expect(state.marches).toHaveLength(0);
    expect(state.pendingBattle).not.toBeNull();
    expect(state.pendingBattle?.march.toId).toBe('chiayi_county');
    expect(state.pendingBattle?.defenderHeroIds).toContain('alishan_warden');

    // While pendingBattle is active, tickGame pauses world time
    const pausedTime = state.gameTime;
    const stillPaused = tickGame(state, 10, () => 0.5);
    expect(stillPaused.gameTime).toBe(pausedTime);

    // Complete pendingBattle with ManualBattleOutcome and rng=0.2 (< 0.70 capture chance)
    const afterManual = completePendingBattle(
      state,
      {
        attackerTroopsEnd: 410,
        defenderTroopsEnd: 0,
        winner: 'attacker',
        highlights: ['【親自督戰】鄭成功發動「鹿耳潮湧・開台破陣」大破敵軍！'],
      },
      () => 0.2
    );

    expect(afterManual.pendingBattle).toBeNull();
    expect(afterManual.districts.chiayi_county.faction).toBe('player');
    expect(afterManual.districts.chiayi_county.troops).toBe(410);
    expect(afterManual.districts.chiayi_county.plots.filter((p) => p.unlocked).length).toBeGreaterThanOrEqual(2);
    expect(afterManual.reputation).toBe(120); // +20 first conquest
    expect(afterManual.officers.koxinga.inMarchId).toBeNull();
    expect(afterManual.officers.koxinga.districtId).toBe('chiayi_county');

    // alishan_warden was captured!
    expect(afterManual.officers.alishan_warden.prisonerOf).toBe('player');
    expect(afterManual.pendingPrisoners?.heroIds).toContain('alishan_warden');
    expect(afterManual.battleReports[0].capturedHeroIds).toContain('alishan_warden');

    // Test all 3 prisoner actions on alishan_warden
    const persuaded = handlePrisonerAction(afterManual, 'alishan_warden', 'persuade', () => 0.05);
    expect(persuaded.recruited).toBe(true);
    expect(persuaded.state.officers.alishan_warden.faction).toBe('player');
    expect(persuaded.state.officers.alishan_warden.prisonerOf).toBeNull();
    expect(persuaded.state.pendingPrisoners).toBeNull();

    const released = handlePrisonerAction(afterManual, 'alishan_warden', 'release');
    expect(released.recruited).toBe(false);
    expect(released.state.officers.alishan_warden.prisonerOf).toBeNull();
    expect(released.state.reputation).toBe(afterManual.reputation + 25);
    expect(released.state.pendingPrisoners).toBeNull();

    const imprisoned = handlePrisonerAction(afterManual, 'alishan_warden', 'imprison');
    expect(imprisoned.state.officers.alishan_warden.prisonerOf).toBe('player');
    expect(imprisoned.state.officers.alishan_warden.loyalty).toBe(
      afterManual.officers.alishan_warden.loyalty - 5
    );
    expect(imprisoned.state.pendingPrisoners).toBeNull();

    // Test dismissPendingPrisoners keeps officer in prison
    const dismissed = dismissPendingPrisoners(afterManual);
    expect(dismissed.pendingPrisoners).toBeNull();
    expect(dismissed.officers.alishan_warden.prisonerOf).toBe('player');
  });

  it('auto-resolves battles without blocking on pendingBattle when autoMode.enabled is true', () => {
    let state = createInitialGameState();
    state = updateAutoMode(state, { enabled: true, autoFarm: false, autoRecruit: false, autoAttack: false });

    const dispatch = dispatchMarch(state, 'tainan', 'chiayi_county', 550, ['koxinga']);
    expect(dispatch.error).toBeUndefined();
    state = dispatch.state;

    state = tickGame(state, MARCH_LAND_DURATION + 1, () => 0.5);
    expect(state.pendingBattle).toBeNull();
    expect(state.districts.chiayi_county.faction).toBe('player');
    expect(state.battleReports).toHaveLength(1);
    expect(state.battleReports[0].conquered).toBe(true);
  });

  it('dispatches cross-strait attacks onto Mainland coastal districts via sea routes', () => {
    let state = createInitialGameState();
    state = updateAutoMode(state, { enabled: true, autoFarm: false, autoRecruit: false, autoAttack: false });
    state.districts.kinmen.faction = 'player';
    state.districts.kinmen.troops = 1800;
    state.districts.xiamen.troops = 300;
    state.resources.food = 2000;

    const res = dispatchMarch(state, 'kinmen', 'xiamen', 1200, ['koxinga']);
    expect(res.error).toBeUndefined();
    expect(res.state.marches[0].arriveAt - res.state.marches[0].startedAt).toBe(
      MARCH_SEA_DURATION
    );

    const after = tickGame(res.state, MARCH_SEA_DURATION + 1, () => 0.5);
    expect(after.districts.xiamen.faction).toBe('player');
    expect(after.battleReports[0].conquered).toBe(true);
  });

  it('triggers victory when player conquers all 29 districts and defeat when losing last district', () => {
    let state = createInitialGameState();
    for (const cfg of DISTRICT_LIST) {
      if (cfg.id !== 'fuzhou') {
        state.districts[cfg.id].faction = 'player';
        state.districts[cfg.id].troops = 800;
      } else {
        state.districts[cfg.id].faction = 'mainland_command';
        state.districts[cfg.id].troops = 50;
      }
    }

    const dispatch = dispatchMarch(state, 'lienchiang', 'fuzhou', 500, []);
    expect(dispatch.error).toBeUndefined();
    const { state: afterWin, report } = resolveBattle(
      dispatch.state,
      dispatch.state.marches[0],
      () => 0.5
    );
    expect(report.conquered).toBe(true);
    expect(afterWin.victory).toBe(true);
    expect(afterWin.defeat).toBe(false);

    // Defeat test
    const loseState = createInitialGameState();
    loseState.districts.tainan.troops = 20;
    const enemyMarch = {
      id: 'enemy_final',
      faction: 'south_pirates' as const,
      fromId: 'kaohsiung' as const,
      toId: 'tainan' as const,
      troops: 900,
      heroIds: [],
      startedAt: 0,
      arriveAt: 10,
      type: 'attack' as const,
    };
    loseState.marches = [enemyMarch];
    const { state: afterLose } = resolveBattle(loseState, enemyMarch, () => 0.5);
    expect(afterLose.districts.tainan.faction).toBe('south_pirates');
    expect(afterLose.defeat).toBe(true);
  });

  it('spawns a telegraphed AI counter-attack at 45s mark', () => {
    const state = createInitialGameState();
    const next = tickGame(state, 46, () => 0.1);
    const aiMarches = next.marches.filter((m) => m.faction !== 'player');
    expect(aiMarches.length).toBeGreaterThanOrEqual(1);
    expect(aiMarches[0].toId).toBe('tainan');
    expect(aiMarches[0].arriveAt).toBeGreaterThan(next.gameTime);
  });
});

describe('gameEngine - 1949 calendar & historical events', () => {
  it('computes 1949+ calendar progression accurately via getGameCalendar', () => {
    expect(getGameCalendar(0)).toEqual({
      year: 1949,
      month: 1,
      rocYear: 38,
      label: '1949年 1月 (民國38年)',
    });
    expect(getGameCalendar(SECONDS_PER_MONTH * 12)).toEqual({
      year: 1950,
      month: 1,
      rocYear: 39,
      label: '1950年 1月 (民國39年)',
    });
  });

  it('automatically triggers historical events in story mode and applies reputationDelta on Guningtou', () => {
    let state = createInitialGameState();
    state = tickGame(state, SECONDS_PER_MONTH * 9, () => 0.99);
    expect(state.activeEventIds).toContain('ev_1949_guningtou');

    const tainanTroopsBefore = state.districts.tainan.troops;
    const repBefore = state.reputation;

    state = resolveHistoricalEvent(state, 'ev_1949_guningtou', 'hold_guningtou');
    expect(state.activeEventIds).not.toContain('ev_1949_guningtou');
    expect(state.reputation).toBe(repBefore + 25);
    expect(state.districts.tainan.troops).toBe(tainanTroopsBefore + 400);

    const invasionMarch = state.marches.find(
      (m) => m.fromId === 'xiamen' && m.toId === 'kinmen' && m.type === 'attack'
    );
    expect(invasionMarch).toBeDefined();
    expect((invasionMarch?.arriveAt ?? 0) - (invasionMarch?.startedAt ?? 0)).toBe(
      AI_MARCH_SEA_DURATION
    );
  });

  it('does NOT trigger historical events in endless mode and uses brisker AI cadence', () => {
    let endless = createInitialGameState('endless', 'tainan');
    endless = tickGame(endless, SECONDS_PER_MONTH * 9, () => 0.99);
    expect(endless.activeEventIds).toEqual([]);

    const freshEndless = createInitialGameState('endless', 'tainan');
    const afterAiTick = tickGame(
      freshEndless,
      AI_CHECK_INTERVAL_ENDLESS_SEC + 1,
      () => 0.1
    );
    expect(afterAiTick.marches.filter((m) => m.faction !== 'player').length).toBeGreaterThanOrEqual(
      1
    );
  });
});

describe('gameEngine - save/load serialization & V1 graceful rejection', () => {
  it('exports and imports valid V2 GameState JSON and gracefully rejects old V1 saves without officers', () => {
    const state = createInitialGameState();
    const json = exportSaveJson(state);
    const loaded = importSaveJson(json);

    expect(loaded).not.toBeNull();
    expect(loaded?.selectedDistrictId).toBe('tainan');
    expect(loaded?.resources).toEqual(state.resources);
    expect(Object.keys(loaded?.officers ?? {})).toHaveLength(39);

    // Old V1 save without `officers` gracefully returns null
    const v1Save = JSON.parse(json) as Record<string, unknown>;
    delete v1Save.officers;
    v1Save.ownedHeroes = {};
    expect(importSaveJson(JSON.stringify(v1Save))).toBeNull();

    expect(importSaveJson('not-json')).toBeNull();
  });

  it('saves to and loads from independent localStorage slots for story vs endless modes', () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });

    const storyState = createInitialGameState('story', 'tainan');
    storyState.resources.gold = 1234;
    saveGameToStorage(storyState);
    expect(store.has(SAVE_KEY_STORY)).toBe(true);
    expect(store.has(SAVE_KEY_ENDLESS)).toBe(false);

    const endlessState = createInitialGameState('endless', 'taipei');
    endlessState.resources.gold = 5678;
    endlessState.gameTime = 90;
    saveGameToStorage(endlessState);
    expect(store.has(SAVE_KEY_ENDLESS)).toBe(true);

    expect(loadGameFromStorage('story')?.resources.gold).toBe(1234);
    expect(loadGameFromStorage('endless')?.startingDistrictId).toBe('taipei');

    expect(getSavedModeSummary('endless')).toEqual({
      exists: true,
      ownedCount: 1,
      totalCount: 29,
      gameTime: 90,
      startingDistrictId: 'taipei',
    });

    store.clear();
    store.set(SAVE_KEY, exportSaveJson(storyState));
    expect(loadGameFromStorage('story')?.resources.gold).toBe(1234);
    expect(loadGameFromStorage('endless')).toBeNull();
  });
});

describe('gameEngine - adjustable AI difficulty & smart auto mode', () => {
  it('scales initial enemy troops and combat power between easy and hell difficulties', () => {
    const easyState = createInitialGameState('story', 'tainan', 'easy');
    const hellState = createInitialGameState('story', 'tainan', 'hell');

    expect(easyState.districts.taipei.troops).toBe(
      Math.round(DISTRICTS.taipei.initialTroops * DIFFICULTY_CONFIGS.easy.enemyInitialMult)
    );
    expect(hellState.districts.taipei.troops).toBe(
      Math.round(DISTRICTS.taipei.initialTroops * DIFFICULTY_CONFIGS.hell.enemyInitialMult)
    );

    const setupBattle = (difficulty: 'easy' | 'hell') => {
      const s = createInitialGameState('story', 'tainan', difficulty);
      s.districts.chiayi_county.troops = 300;
      const march = {
        id: `test_march_${difficulty}`,
        faction: 'player' as const,
        fromId: 'tainan' as const,
        toId: 'chiayi_county' as const,
        troops: 600,
        heroIds: ['koxinga'],
        startedAt: 0,
        arriveAt: 8,
        type: 'attack' as const,
      };
      s.marches = [march];
      return resolveBattle(s, march, () => 0.5).report;
    };

    const easyReport = setupBattle('easy');
    const hellReport = setupBattle('hell');
    expect(easyReport.winner).toBe('attacker');
    expect(easyReport.attackerTroopsEnd).toBeGreaterThan(hellReport.attackerTroopsEnd);
  });

  it('auto mode harvests mature crops, replants empty plots, recruits troops, and launches advantage attacks', () => {
    let state = createInitialGameState('story', 'tainan', 'normal');
    state.districts.tainan.plots[0] = {
      ...state.districts.tainan.plots[0],
      cropId: 'rice',
      plantedAt: 0,
      matureAt: 1,
      unlocked: true,
    };
    state.districts.tainan.plots[1].cropId = null;
    state.districts.tainan.plots[2].cropId = null;
    state.districts.tainan.troops = 520;
    state.districts.chiayi_county.troops = 180;
    state.resources = { food: 1200, gold: 900 };

    state = setDifficulty(state, 'normal');
    expect(state.autoMode).toEqual(DEFAULT_AUTO_MODE);

    state = updateAutoMode(state, {
      enabled: true,
      autoFarm: true,
      autoRecruit: true,
      autoAttack: false,
    });

    const troopsBefore = state.districts.tainan.troops;
    const afterEcoTick = tickGame(state, 2.5, () => 0.99);

    expect(afterEcoTick.districts.tainan.plots[0].cropId).not.toBeNull();
    expect(afterEcoTick.districts.tainan.plots[1].cropId).toBe(
      DISTRICTS.tainan.specialtyCrop
    );
    expect(afterEcoTick.districts.tainan.troops).toBeGreaterThanOrEqual(troopsBefore + 80);

    const readyToAttack = updateAutoMode(afterEcoTick, { autoAttack: true });
    const afterAttackTick = tickGame(readyToAttack, 2.5, () => 0.99);

    const playerAttackMarches = afterAttackTick.marches.filter(
      (m) => m.faction === 'player' && m.type === 'attack'
    );
    expect(playerAttackMarches).toHaveLength(1);
    expect(playerAttackMarches[0].toId).toBe('chiayi_county');
    expect(playerAttackMarches[0].heroIds.length).toBeGreaterThan(0);
    expect(afterAttackTick.districts.tainan.troops).toBeGreaterThanOrEqual(180);
  });
});
