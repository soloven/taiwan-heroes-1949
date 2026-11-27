import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AutoModeConfig,
  BuildingType,
  CropId,
  DifficultyLevel,
  DistrictId,
  GameMode,
  GameState,
  ManualBattleOutcome,
} from '../types/game';
import {
  assignHeroToDistrict,
  completePendingBattle as completePendingBattleEngine,
  createInitialGameState,
  dismissPendingPrisoners as dismissPendingPrisonersEngine,
  dispatchMarch as dispatchMarchEngine,
  exploreDistrict as exploreDistrictEngine,
  exportSaveJson,
  handlePrisonerAction as handlePrisonerActionEngine,
  harvestAllMature,
  harvestPlot as harvestPlotEngine,
  importSaveJson,
  loadGameFromStorage,
  plantCrop as plantCropEngine,
  recruitOfficer as recruitOfficerEngine,
  recruitTroops as recruitTroopsEngine,
  resolveHistoricalEvent,
  rewardOfficer as rewardOfficerEngine,
  saveGameToStorage,
  setDifficulty as setDifficultyEngine,
  tickGame,
  toggleSoundMute as toggleSoundMuteEngine,
  unlockPlot as unlockPlotEngine,
  updateAutoMode as updateAutoModeEngine,
  upgradeBuilding as upgradeBuildingEngine,
} from './gameEngine';

const TICK_INTERVAL_MS = 250;
const AUTO_SAVE_INTERVAL_MS = 15000;

export interface GameEngineApi {
  state: GameState;
  plantCrop: (districtId: DistrictId, plotIndex: number, cropId: CropId) => void;
  harvestPlot: (districtId: DistrictId, plotIndex: number) => void;
  harvestAll: (districtId?: DistrictId) => void;
  unlockPlot: (districtId: DistrictId, plotIndex: number) => void;
  upgradeBuilding: (districtId: DistrictId, type: BuildingType) => void;
  recruitTroops: (districtId: DistrictId, amount: number) => void;
  assignHero: (heroId: string, districtId: DistrictId | null) => void;
  exploreDistrict: (
    districtId: DistrictId,
    explorerHeroId?: string
  ) => {
    message: string;
    foundHeroId?: string;
    bonusGold?: number;
    bonusFood?: number;
  };
  recruitOfficer: (
    targetHeroId: string,
    recruiterHeroId?: string
  ) => { success: boolean; chance: number; message: string };
  rewardOfficer: (heroId: string) => { error?: string };
  handlePrisoner: (
    heroId: string,
    action: 'persuade' | 'release' | 'imprison'
  ) => { message: string; recruited?: boolean };
  dismissPendingPrisoners: () => void;
  completePendingBattle: (manualOutcome?: ManualBattleOutcome) => void;
  toggleSoundMute: () => void;
  dispatchMarch: (
    fromId: DistrictId,
    toId: DistrictId,
    troops: number,
    heroIds: string[]
  ) => { error?: string };
  resolveEvent: (eventId: string, choiceId: string) => void;
  selectDistrict: (districtId: DistrictId) => void;
  togglePause: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  updateAutoMode: (patch: Partial<AutoModeConfig>) => void;
  startMode: (
    mode: GameMode,
    startingDistrictId?: DistrictId,
    fresh?: boolean,
    difficulty?: DifficultyLevel
  ) => void;
  resetGame: () => void;
  saveNow: () => void;
  exportSave: () => string;
  importSave: (json: string) => boolean;
}

export function useGameEngine(): GameEngineApi {
  const [state, setState] = useState<GameState>(
    () => loadGameFromStorage() ?? createInitialGameState()
  );

  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const commitState = useCallback((updater: (prev: GameState) => GameState) => {
    setState((prev) => {
      const next = updater(prev);
      stateRef.current = next;
      return next;
    });
  }, []);

  // Main real-time tick loop (250ms)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((prev) => {
        const next = tickGame(prev, TICK_INTERVAL_MS / 1000);
        stateRef.current = next;
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  // Auto-save every 15 seconds & on unmount
  useEffect(() => {
    const saveTimer = window.setInterval(() => {
      saveGameToStorage(stateRef.current);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(saveTimer);
      saveGameToStorage(stateRef.current);
    };
  }, []);

  const plantCrop = useCallback(
    (districtId: DistrictId, plotIndex: number, cropId: CropId) => {
      commitState((prev) => plantCropEngine(prev, districtId, plotIndex, cropId));
    },
    [commitState]
  );

  const harvestPlot = useCallback(
    (districtId: DistrictId, plotIndex: number) => {
      commitState((prev) => harvestPlotEngine(prev, districtId, plotIndex));
    },
    [commitState]
  );

  const harvestAll = useCallback(
    (districtId?: DistrictId) => {
      commitState((prev) => harvestAllMature(prev, districtId));
    },
    [commitState]
  );

  const unlockPlot = useCallback(
    (districtId: DistrictId, plotIndex: number) => {
      commitState((prev) => unlockPlotEngine(prev, districtId, plotIndex));
    },
    [commitState]
  );

  const upgradeBuilding = useCallback(
    (districtId: DistrictId, type: BuildingType) => {
      commitState((prev) => upgradeBuildingEngine(prev, districtId, type));
    },
    [commitState]
  );

  const recruitTroops = useCallback(
    (districtId: DistrictId, amount: number) => {
      commitState((prev) => recruitTroopsEngine(prev, districtId, amount));
    },
    [commitState]
  );

  const assignHero = useCallback(
    (heroId: string, districtId: DistrictId | null) => {
      commitState((prev) => assignHeroToDistrict(prev, heroId, districtId));
    },
    [commitState]
  );

  const exploreDistrict = useCallback(
    (districtId: DistrictId, explorerHeroId?: string) => {
      const outcome = exploreDistrictEngine(
        stateRef.current,
        districtId,
        explorerHeroId
      );
      if (outcome.state !== stateRef.current) {
        stateRef.current = outcome.state;
        setState(outcome.state);
      }
      return {
        message: outcome.message,
        foundHeroId: outcome.foundHeroId,
        bonusGold: outcome.bonusGold,
        bonusFood: outcome.bonusFood,
      };
    },
    []
  );

  const recruitOfficer = useCallback(
    (targetHeroId: string, recruiterHeroId?: string) => {
      const outcome = recruitOfficerEngine(
        stateRef.current,
        targetHeroId,
        recruiterHeroId
      );
      if (outcome.state !== stateRef.current) {
        stateRef.current = outcome.state;
        setState(outcome.state);
        saveGameToStorage(outcome.state);
      }
      return {
        success: outcome.success,
        chance: outcome.chance,
        message: outcome.message,
      };
    },
    []
  );

  const rewardOfficer = useCallback((heroId: string): { error?: string } => {
    const outcome = rewardOfficerEngine(stateRef.current, heroId);
    if (!outcome.error) {
      stateRef.current = outcome.state;
      setState(outcome.state);
    }
    return { error: outcome.error };
  }, []);

  const handlePrisoner = useCallback(
    (heroId: string, action: 'persuade' | 'release' | 'imprison') => {
      const outcome = handlePrisonerActionEngine(stateRef.current, heroId, action);
      if (outcome.state !== stateRef.current) {
        stateRef.current = outcome.state;
        setState(outcome.state);
        saveGameToStorage(outcome.state);
      }
      return {
        message: outcome.message,
        recruited: outcome.recruited,
      };
    },
    []
  );

  const dismissPendingPrisoners = useCallback(() => {
    commitState((prev) => dismissPendingPrisonersEngine(prev));
  }, [commitState]);

  const completePendingBattle = useCallback(
    (manualOutcome?: ManualBattleOutcome) => {
      commitState((prev) => {
        const next = completePendingBattleEngine(prev, manualOutcome);
        saveGameToStorage(next);
        return next;
      });
    },
    [commitState]
  );

  const toggleSoundMute = useCallback(() => {
    commitState((prev) => toggleSoundMuteEngine(prev));
  }, [commitState]);

  const dispatchMarch = useCallback(
    (
      fromId: DistrictId,
      toId: DistrictId,
      troops: number,
      heroIds: string[]
    ): { error?: string } => {
      const outcome = dispatchMarchEngine(
        stateRef.current,
        fromId,
        toId,
        troops,
        heroIds
      );
      if (!outcome.error) {
        stateRef.current = outcome.state;
        setState(outcome.state);
      }
      return { error: outcome.error };
    },
    []
  );

  const selectDistrict = useCallback(
    (districtId: DistrictId) => {
      commitState((prev) =>
        prev.selectedDistrictId === districtId
          ? prev
          : { ...prev, selectedDistrictId: districtId }
      );
    },
    [commitState]
  );

  const resolveEvent = useCallback(
    (eventId: string, choiceId: string) => {
      commitState((prev) => resolveHistoricalEvent(prev, eventId, choiceId));
    },
    [commitState]
  );

  const togglePause = useCallback(() => {
    commitState((prev) => ({ ...prev, paused: !prev.paused }));
  }, [commitState]);

  const setSpeed = useCallback(
    (speed: 1 | 2 | 4) => {
      commitState((prev) => (prev.speed === speed ? prev : { ...prev, speed }));
    },
    [commitState]
  );

  const setDifficulty = useCallback(
    (difficulty: DifficultyLevel) => {
      commitState((prev) => setDifficultyEngine(prev, difficulty));
    },
    [commitState]
  );

  const updateAutoMode = useCallback(
    (patch: Partial<AutoModeConfig>) => {
      commitState((prev) => updateAutoModeEngine(prev, patch));
    },
    [commitState]
  );

  const startMode = useCallback(
    (
      mode: GameMode,
      startingDistrictId: DistrictId = 'tainan',
      fresh = false,
      difficulty: DifficultyLevel = 'normal'
    ) => {
      const target = !fresh
        ? loadGameFromStorage(mode) ??
          createInitialGameState(mode, startingDistrictId, difficulty)
        : createInitialGameState(mode, startingDistrictId, difficulty);
      stateRef.current = target;
      setState(target);
      saveGameToStorage(target);
    },
    []
  );

  const resetGame = useCallback(() => {
    const current = stateRef.current;
    const fresh = createInitialGameState(
      current.mode,
      current.startingDistrictId,
      current.difficulty
    );
    stateRef.current = fresh;
    setState(fresh);
    saveGameToStorage(fresh);
  }, []);

  const saveNow = useCallback(() => {
    saveGameToStorage(stateRef.current);
  }, []);

  const exportSave = useCallback(() => {
    return exportSaveJson(stateRef.current);
  }, []);

  const importSave = useCallback((json: string): boolean => {
    const loaded = importSaveJson(json);
    if (!loaded) return false;
    stateRef.current = loaded;
    setState(loaded);
    saveGameToStorage(loaded);
    return true;
  }, []);

  return {
    state,
    plantCrop,
    harvestPlot,
    harvestAll,
    unlockPlot,
    upgradeBuilding,
    recruitTroops,
    assignHero,
    exploreDistrict,
    recruitOfficer,
    rewardOfficer,
    handlePrisoner,
    dismissPendingPrisoners,
    completePendingBattle,
    toggleSoundMute,
    dispatchMarch,
    resolveEvent,
    selectDistrict,
    togglePause,
    setSpeed,
    setDifficulty,
    updateAutoMode,
    startMode,
    resetGame,
    saveNow,
    exportSave,
    importSave,
  };
}
