import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Swords,
  Shield,
  Trophy,
  RotateCcw,
  Skull,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ScrollText,
  Home,
} from 'lucide-react';
import type { DifficultyLevel, DistrictId, GameMode, HistoricalEventConfig } from './types/game';
import {
  DISTRICT_LIST,
  DISTRICTS,
  FACTIONS,
  HERO_LIST,
  HEROES,
  HISTORICAL_EVENTS,
} from './data';
import { useGameEngine } from './engine/useGameEngine';
import { playRecruitSuccess } from './engine/battleAudio';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { TopResourceBar } from './components/TopResourceBar';
import { TaiwanMap, type ActiveBattleEffect } from './components/TaiwanMap';
import { HeroAvatar, RarityBadge } from './components/GameIcons';
import { DistrictPanel } from './components/DistrictPanel';
import { TalentPrisonModal } from './components/TalentPrisonModal';
import {
  BattleEntryPromptModal,
  CapturedPrisonerModal,
} from './components/BattlePromptAndPrisonerModals';
import { SideBattleModal } from './components/SideBattleModal';
import { MarchModal } from './components/MarchModal';
import { HeroRosterModal } from './components/HeroRosterModal';
import { BattleReportModal } from './components/BattleReportModal';
import { LegionWidget } from './components/LegionWidget';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  DomesticOverviewModal,
  StrategyOverviewModal,
  IntelOverviewModal,
  HistoricalEventModal,
} from './components/CommandModals';

interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'error';
}

export function App() {
  const engine = useGameEngine();
  const { state } = engine;

  // Title / Mode selection menu
  const [inMenu, setInMenu] = useState(true);
  const shouldUnpauseRef = useRef(false);
  const suppressNextReportNotifyRef = useRef(false);

  // Modals
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [districtModalTab, setDistrictModalTab] = useState<
    'farm' | 'buildings' | 'military'
  >('farm');
  const [domesticOpen, setDomesticOpen] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [activeEventModalId, setActiveEventModalId] = useState<string | null>(null);
  const [talentOpen, setTalentOpen] = useState(false);
  const [inSideBattle, setInSideBattle] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [marchModal, setMarchModal] = useState<{
    open: boolean;
    fromId: DistrictId | null;
    toId: DistrictId | null;
  }>({ open: false, fromId: null, toId: null });

  const [showGuide, setShowGuide] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(1);
  const [activeBattles, setActiveBattles] = useState<ActiveBattleEffect[]>([]);
  const [battleCutin, setBattleCutin] = useState<{
    id: string;
    heroId: string;
    targetName: string;
    conquered: boolean;
    winner: 'attacker' | 'defender';
    isPlayerAttacker: boolean;
  } | null>(null);

  const handleClearBattleEffect = useCallback((id: string) => {
    setActiveBattles((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const [lastSeenReportId, setLastSeenReportId] = useState<string | null>(
    () => state.battleReports[0]?.id ?? null
  );
  const prevTopReportIdRef = useRef<string | null>(
    state.battleReports[0]?.id ?? null
  );

  const notify = useCallback(
    (message: string, tone: 'info' | 'success' | 'error' = 'info') => {
      const id = toastIdRef.current++;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  // Reset side-battle view if pendingBattle clears
  useEffect(() => {
    if (!state.pendingBattle && inSideBattle) {
      setInSideBattle(false);
    }
  }, [state.pendingBattle, inSideBattle]);

  // Keep engine paused while in main menu, and unpause cleanly upon entering a mode
  useEffect(() => {
    if (inMenu) {
      if (!state.paused) {
        engine.togglePause();
      }
    } else if (shouldUnpauseRef.current) {
      shouldUnpauseRef.current = false;
      if (state.paused) {
        engine.togglePause();
      }
    }
  }, [inMenu, state.paused, engine]);

  // Notify player when a new battle report arrives
  useEffect(() => {
    const newest = state.battleReports[0];
    if (suppressNextReportNotifyRef.current) {
      suppressNextReportNotifyRef.current = false;
      prevTopReportIdRef.current = newest?.id ?? null;
      setLastSeenReportId(newest?.id ?? null);
      return;
    }
    if (inMenu || !newest || newest.id === prevTopReportIdRef.current) return;
    prevTopReportIdRef.current = newest.id;

    const toName = DISTRICTS[newest.toId]?.name ?? newest.toId;

    // Trigger live on-map siege battle VFX
    const effect: ActiveBattleEffect = {
      id: newest.id,
      targetId: newest.toId,
      fromId: newest.fromId,
      attackerFaction: newest.attackerFaction,
      winner: newest.winner,
      conquered: newest.conquered,
      attackerLoss: Math.max(0, newest.attackerTroopsStart - newest.attackerTroopsEnd),
      defenderLoss: Math.max(0, newest.defenderTroopsStart - newest.defenderTroopsEnd),
      startedAtMs: Date.now(),
    };
    setActiveBattles((prev) => [...prev.slice(-4), effect]);
    window.setTimeout(() => {
      setActiveBattles((prev) => prev.filter((b) => b.id !== newest.id));
    }, 2900);

    // Trigger Hero Skill Cut-in banner if a hero participated
    const leadHeroId =
      newest.attackerHeroIds[0] ?? newest.defenderHeroIds[0] ?? null;
    if (leadHeroId && HEROES[leadHeroId]) {
      setBattleCutin({
        id: newest.id,
        heroId: leadHeroId,
        targetName: toName,
        conquered: newest.conquered,
        winner: newest.winner,
        isPlayerAttacker: newest.attackerFaction === 'player',
      });
      window.setTimeout(() => {
        setBattleCutin((cur) => (cur?.id === newest.id ? null : cur));
      }, 2700);
    }

    if (newest.attackerFaction === 'player') {
      if (newest.conquered) {
        notify(`🚩 大捷！我軍成功攻克 ${toName}！`, 'success');
      } else if (newest.winner === 'attacker') {
        notify(`⚔️ 我軍於 ${toName} 擊潰敵軍前鋒！`, 'info');
      } else {
        notify(`⚠️ 攻打 ${toName} 受挫，部隊已撤回整補。`, 'error');
      }
    } else if (newest.defenderFaction === 'player') {
      if (newest.conquered) {
        notify(`🚨 緊急！${toName} 已被敵軍攻陷！`, 'error');
      } else {
        notify(`🛡️ 我軍成功擊退來犯 ${toName} 的敵軍！`, 'success');
      }
    }
  }, [state.battleReports, inMenu, notify]);

  const unreadReportCount = useMemo(() => {
    if (reportsOpen || intelOpen || state.battleReports.length === 0) return 0;
    if (!lastSeenReportId) return state.battleReports.length;
    const idx = state.battleReports.findIndex((r) => r.id === lastSeenReportId);
    return idx === -1 ? state.battleReports.length : idx;
  }, [state.battleReports, lastSeenReportId, reportsOpen, intelOpen]);

  // Count mature crops across all player districts
  const matureCropCount = useMemo(() => {
    let count = 0;
    for (const d of DISTRICT_LIST) {
      const dist = state.districts[d.id];
      if (!dist || dist.faction !== 'player') continue;
      for (const p of dist.plots) {
        if (
          p.unlocked &&
          p.cropId !== null &&
          p.matureAt !== null &&
          state.gameTime >= p.matureAt
        ) {
          count += 1;
        }
      }
    }
    return count;
  }, [state.districts, state.gameTime]);

  // Active 1949 historical events mapped from IDs
  const activeEvents = useMemo(
    () =>
      state.activeEventIds
        .map((id) => HISTORICAL_EVENTS[id])
        .filter((ev): ev is HistoricalEventConfig => Boolean(ev)),
    [state.activeEventIds]
  );

  const selectedEventForModal = useMemo(
    () => (activeEventModalId ? HISTORICAL_EVENTS[activeEventModalId] ?? null : null),
    [activeEventModalId]
  );

  // Highlight neighbors & attack targets on map for selected player district
  const { highlightNeighborIds, attackTargetIds } = useMemo(() => {
    const selectedDist = state.districts[state.selectedDistrictId];
    const selectedCfg = DISTRICTS[state.selectedDistrictId];
    if (!selectedDist || !selectedCfg || selectedDist.faction !== 'player') {
      return { highlightNeighborIds: [] as DistrictId[], attackTargetIds: [] as DistrictId[] };
    }
    const neighbors = selectedCfg.neighbors;
    const targets = neighbors.filter(
      (nid) => state.districts[nid]?.faction !== 'player'
    );
    return { highlightNeighborIds: neighbors, attackTargetIds: targets };
  }, [state.districts, state.selectedDistrictId]);

  const handleMapSelectDistrict = useCallback(
    (id: DistrictId) => {
      engine.selectDistrict(id);
      setDistrictModalTab('farm');
      setDistrictModalOpen(true);
    },
    [engine]
  );

  const handleHarvestAll = useCallback(() => {
    if (matureCropCount === 0) return;
    engine.harvestAll();
    notify(`🌾 一鍵收成 ${matureCropCount} 塊農田，糧草與銀兩已入庫！`, 'success');
  }, [matureCropCount, engine, notify]);

  const handleHarvestDistrict = useCallback(
    (districtId: DistrictId) => {
      engine.harvestAll(districtId);
      notify(`🌾 已收成 ${DISTRICTS[districtId]?.shortName} 所有成熟作物！`, 'success');
    },
    [engine, notify]
  );

  const handleHarvestPlot = useCallback(
    (districtId: DistrictId, plotIndex: number) => {
      engine.harvestPlot(districtId, plotIndex);
      notify(`🌱 農田 #${plotIndex + 1} 收成完畢！`, 'success');
    },
    [engine, notify]
  );

  const handleOpenMarch = useCallback((fromId: DistrictId, toId: DistrictId) => {
    setMarchModal({ open: true, fromId, toId });
  }, []);

  const handleExploreDistrict = useCallback(
    (districtId: DistrictId) => {
      const res = engine.exploreDistrict(districtId);
      if (res.foundHeroId) {
        playRecruitSuccess(state.soundMuted);
        notify(res.message, 'success');
      } else if (res.bonusGold || res.bonusFood) {
        notify(res.message, 'success');
      } else {
        notify(res.message, 'info');
      }
    },
    [engine, notify, state.soundMuted]
  );

  const handleOpenReports = useCallback(() => {
    setReportsOpen(true);
    if (state.battleReports[0]) {
      setLastSeenReportId(state.battleReports[0].id);
    }
  }, [state.battleReports]);

  const handleOpenIntel = useCallback(() => {
    setIntelOpen(true);
    if (state.battleReports[0]) {
      setLastSeenReportId(state.battleReports[0].id);
    }
  }, [state.battleReports]);

  const handleResolveEvent = useCallback(
    (eventId: string, choiceId: string) => {
      const ev = HISTORICAL_EVENTS[eventId];
      const choice = ev?.choices.find((c) => c.id === choiceId);
      engine.resolveEvent(eventId, choiceId);
      setActiveEventModalId(null);
      notify(
        `📜 已決策【${ev?.title ?? '歷史事件'}】：${choice?.label ?? '完成'}`,
        'success'
      );
    },
    [engine, notify]
  );

  const handleSelectMode = useCallback(
    (
      mode: GameMode,
      startingDistrictId: DistrictId,
      fresh: boolean,
      difficulty: DifficultyLevel
    ) => {
      suppressNextReportNotifyRef.current = true;
      engine.startMode(mode, startingDistrictId, fresh, difficulty);
      setDistrictModalOpen(false);
      setActiveEventModalId(null);
      setDomesticOpen(false);
      setStrategyOpen(false);
      setIntelOpen(false);
      setAutoModalOpen(false);
      setTalentOpen(false);
      setInSideBattle(false);
      setRosterOpen(false);
      setReportsOpen(false);
      setMarchModal({ open: false, fromId: null, toId: null });
      setActiveBattles([]);
      setBattleCutin(null);
      shouldUnpauseRef.current = true;
      setInMenu(false);
    },
    [engine]
  );

  const handleReturnToMenu = useCallback(() => {
    engine.saveNow();
    setDistrictModalOpen(false);
    setActiveEventModalId(null);
    setDomesticOpen(false);
    setStrategyOpen(false);
    setIntelOpen(false);
    setTalentOpen(false);
    setInSideBattle(false);
    setRosterOpen(false);
    setReportsOpen(false);
    setMarchModal({ open: false, fromId: null, toId: null });
    setInMenu(true);
  }, [engine]);

  const primaryPendingEvent = activeEvents[0] ?? null;

  const talentBadgeCount = useMemo(
    () =>
      Object.values(state.officers).filter(
        (o) => (o.discovered && o.faction === 'free') || o.prisonerOf === 'player'
      ).length,
    [state.officers]
  );

  const intelBadgeCount = state.activeEventIds.length + unreadReportCount;

  if (inMenu) {
    return <ModeSelectScreen onSelectMode={handleSelectMode} />;
  }

  return (
    <div className="ink-ocean-bg flex h-[100dvh] w-full flex-col overflow-hidden text-parchment-50">
      {/* Top Resource & Command Bar */}
      <TopResourceBar
        state={state}
        matureCropCount={matureCropCount}
        unreadReportCount={unreadReportCount}
        autoMenuOpen={autoModalOpen}
        onSetAutoMenuOpen={setAutoModalOpen}
        onOpenDomestic={() => setDomesticOpen(true)}
        onOpenStrategy={() => setStrategyOpen(true)}
        onOpenIntel={handleOpenIntel}
        onOpenTalent={() => setTalentOpen(true)}
        onOpenRoster={() => setRosterOpen(true)}
        onTogglePause={engine.togglePause}
        onToggleMute={engine.toggleSoundMute}
        onSetSpeed={engine.setSpeed}
        onSetDifficulty={engine.setDifficulty}
        onUpdateAutoMode={engine.updateAutoMode}
        onSaveNow={engine.saveNow}
        onExportSave={engine.exportSave}
        onImportSave={engine.importSave}
        onResetGame={engine.resetGame}
        onReturnToMenu={handleReturnToMenu}
        onNotify={notify}
      />

      {/* Full-Screen Interactive Taiwan Strait Map Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <TaiwanMap
          districts={state.districts}
          marches={state.marches}
          selectedDistrictId={state.selectedDistrictId}
          gameTime={state.gameTime}
          onSelectDistrict={handleMapSelectDistrict}
          attackTargetIds={attackTargetIds}
          highlightNeighborIds={highlightNeighborIds}
          activeBattles={activeBattles}
          onClearBattleEffect={handleClearBattleEffect}
          activeEvents={activeEvents}
          onSelectEvent={(id) => setActiveEventModalId(id)}
        />

        {/* Floating Pending 1949 Historical Event Banner (Top-Center of Map) */}
        {primaryPendingEvent && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex justify-center">
            <button
              type="button"
              onClick={() => setActiveEventModalId(primaryPendingEvent.id)}
              className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#f5c969] bg-gradient-to-r from-[#2c1a0e]/95 via-[#432612]/95 to-[#2c1a0e]/95 px-4 py-2 text-xs sm:text-sm font-black text-[#fef3c7] shadow-[0_0_24px_rgba(245,201,105,0.55)] backdrop-blur hover:brightness-115 active:scale-95 transition"
            >
              <ScrollText className="h-4 w-4 text-[#f5c969] animate-bounce shrink-0" />
              <span className="truncate">
                📜 歷史事件待處理：【{primaryPendingEvent.title}】— 點擊決策
              </span>
              {activeEvents.length > 1 && (
                <span className="rounded-full bg-vermilion-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  +{activeEvents.length - 1}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Dramatic Hero Skill Cut-in Banner on Siege Battle */}
        {battleCutin && HEROES[battleCutin.heroId] && (
          <div
            key={battleCutin.id}
            className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 flex justify-center"
          >
            <div className="animate-cutin-slide parchment-panel jiannian-frame lantern-glow flex items-center gap-3.5 rounded-2xl border-2 border-[#f5c969]/90 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.8)] max-w-md w-full">
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 border-[#f5c969] shadow-[0_0_20px_rgba(245,201,105,0.5)]">
                <HeroAvatar hero={HEROES[battleCutin.heroId]} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <RarityBadge rarity={HEROES[battleCutin.heroId].rarity} />
                  <span className="font-serif text-base font-black text-[#fef3c7] truncate">
                    {HEROES[battleCutin.heroId].name}
                  </span>
                </div>
                <div className="mt-0.5 text-xs font-bold text-[#f5c969]">
                  ⚡ 絕技發動：【{HEROES[battleCutin.heroId].skillName}】
                </div>
                <div className="mt-0.5 text-[11px] text-parchment-200 truncate">
                  {battleCutin.conquered
                    ? `🏆 激戰 ${battleCutin.targetName}，一舉攻克城池！`
                    : battleCutin.winner === 'attacker'
                    ? `⚔️ 猛攻 ${battleCutin.targetName}，重創守軍！`
                    : `🛡️ ${battleCutin.targetName} 攻防激戰結束！`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom-Left Collapsible Legion Overview Widget */}
        <LegionWidget
          state={state}
          onSelectDistrictMilitary={(id) => {
            engine.selectDistrict(id);
            setDistrictModalTab('military');
            setDistrictModalOpen(true);
          }}
        />

        {/* Compact Quick-Guide Banner (Bottom-Left of Map when no clutter) */}
        {showGuide && !primaryPendingEvent && (
          <div className="pointer-events-auto absolute top-3 right-14 z-20 hidden md:flex items-center gap-2 rounded-xl border border-parchment-400/40 bg-indigoInk-950/90 px-3 py-1.5 text-xs text-parchment-200 shadow-lg backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#f5c969] shrink-0" />
            <span>
              點擊地圖任意郡縣即可彈出治理視窗！先在
              <strong>{DISTRICTS[state.startingDistrictId]?.shortName ?? '台南'}</strong>
              種田、探索登庸名將，再經略台海二十九區！
            </span>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="ml-1 rounded p-0.5 text-parchment-300/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>

      {/* Centered District Popup Modal (Click any territory on the map) */}
      {districtModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setDistrictModalOpen(false)}
        >
          <div
            className="flex h-[86vh] max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <DistrictPanel
              state={state}
              initialTab={districtModalTab}
              onPlantCrop={engine.plantCrop}
              onHarvestPlot={handleHarvestPlot}
              onHarvestDistrict={handleHarvestDistrict}
              onUnlockPlot={engine.unlockPlot}
              onUpgradeBuilding={engine.upgradeBuilding}
              onRecruitTroops={engine.recruitTroops}
              onAssignHero={engine.assignHero}
              onExploreDistrict={handleExploreDistrict}
              onOpenMarch={handleOpenMarch}
              onSelectDistrict={engine.selectDistrict}
              onNotify={notify}
              onClose={() => setDistrictModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Top Command Modals */}
      <DomesticOverviewModal
        open={domesticOpen}
        state={state}
        matureCropCount={matureCropCount}
        onHarvestAll={handleHarvestAll}
        onEnterDistrict={(id) => {
          setDomesticOpen(false);
          engine.selectDistrict(id);
          setDistrictModalTab('farm');
          setDistrictModalOpen(true);
        }}
        onClose={() => setDomesticOpen(false)}
      />

      <StrategyOverviewModal
        open={strategyOpen}
        state={state}
        onManageMilitary={(id) => {
          setStrategyOpen(false);
          engine.selectDistrict(id);
          setDistrictModalTab('military');
          setDistrictModalOpen(true);
        }}
        onClose={() => setStrategyOpen(false)}
      />

      <IntelOverviewModal
        open={intelOpen}
        state={state}
        onSelectEvent={(id) => {
          setIntelOpen(false);
          setActiveEventModalId(id);
        }}
        onOpenFullReports={() => {
          setIntelOpen(false);
          handleOpenReports();
        }}
        onClose={() => setIntelOpen(false)}
      />

      <HistoricalEventModal
        event={selectedEventForModal}
        onResolve={handleResolveEvent}
        onClose={() => setActiveEventModalId(null)}
      />

      {/* V2.0 Talent, Prison & Side-Scrolling Battle Modals */}
      <TalentPrisonModal
        open={talentOpen}
        state={state}
        onExplore={engine.exploreDistrict}
        onRecruit={engine.recruitOfficer}
        onReward={engine.rewardOfficer}
        onReleasePrisoner={(heroId) => engine.handlePrisoner(heroId, 'release')}
        onClose={() => setTalentOpen(false)}
        onNotify={notify}
      />

      {state.pendingBattle && !inSideBattle && (
        <BattleEntryPromptModal
          battle={state.pendingBattle}
          onEnterManualBattle={() => setInSideBattle(true)}
          onAutoResolve={() => {
            setInSideBattle(false);
            engine.completePendingBattle();
          }}
        />
      )}

      {state.pendingBattle && inSideBattle && (
        <SideBattleModal
          battle={state.pendingBattle}
          attackerHeroes={state.pendingBattle.march.heroIds
            .map((id) => HEROES[id])
            .filter(Boolean)}
          defenderHeroes={state.pendingBattle.defenderHeroIds
            .map((id) => HEROES[id])
            .filter(Boolean)}
          soundMuted={state.soundMuted}
          onToggleMute={engine.toggleSoundMute}
          onComplete={(outcome) => {
            setInSideBattle(false);
            engine.completePendingBattle(outcome);
          }}
          onAutoResolve={() => {
            setInSideBattle(false);
            engine.completePendingBattle();
          }}
        />
      )}

      {!state.pendingBattle && state.pendingPrisoners && (
        <CapturedPrisonerModal
          prompt={state.pendingPrisoners}
          state={state}
          onHandlePrisoner={engine.handlePrisoner}
          onDismiss={engine.dismissPendingPrisoners}
          onNotify={notify}
        />
      )}

      <MarchModal
        open={marchModal.open}
        state={state}
        fromId={marchModal.fromId}
        toId={marchModal.toId}
        onConfirm={engine.dispatchMarch}
        onClose={() => setMarchModal({ open: false, fromId: null, toId: null })}
        onNotify={notify}
      />

      <HeroRosterModal
        open={rosterOpen}
        state={state}
        onAssignHero={engine.assignHero}
        onClose={() => setRosterOpen(false)}
      />

      <BattleReportModal
        open={reportsOpen}
        reports={state.battleReports}
        onClose={() => setReportsOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar (Visible on < md screens) */}
      <MobileBottomNav
        matureCropCount={matureCropCount}
        activeMarchCount={state.marches.length}
        talentBadgeCount={talentBadgeCount}
        intelBadgeCount={intelBadgeCount}
        autoEnabled={state.autoMode.enabled}
        onOpenDomestic={() => setDomesticOpen(true)}
        onOpenStrategy={() => setStrategyOpen(true)}
        onOpenTalent={() => setTalentOpen(true)}
        onOpenIntel={handleOpenIntel}
        onOpenAutoModal={() => setAutoModalOpen(true)}
      />

      {/* Toast Notifications */}
      <div className="pointer-events-none fixed bottom-20 md:bottom-4 right-4 z-[60] flex flex-col items-end gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md transition ${
              t.tone === 'success'
                ? 'border-jade-400/70 bg-jade-900/90 text-jade-50'
                : t.tone === 'error'
                ? 'border-vermilion-400/75 bg-vermilion-800/95 text-red-100'
                : 'border-parchment-400/55 bg-indigoInk-900/95 text-parchment-100'
            }`}
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-jade-400 shrink-0" />
            ) : t.tone === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-300 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-[#f5c969] shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Victory Overlay */}
      {state.victory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="parchment-panel ssr-card-glow max-w-md w-full rounded-2xl p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f5c969] bg-gradient-to-br from-amber-500 to-vermilion-600 shadow-[0_0_30px_rgba(245,201,105,0.6)]">
              <Trophy className="h-9 w-9 text-white" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-black text-[#fef3c7]">
              {state.mode === 'endless'
                ? '🎉 無盡模式完全統一！29 區制霸'
                : '🎉 1949 劇情模式通關！台海歸一'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment-200">
              {state.mode === 'endless'
                ? `恭喜少帥自${DISTRICTS[state.startingDistrictId]?.shortName ?? '台南'}起兵，成功統一台灣 22 縣市與大陸東南沿海 7 區，完成全圖 29 區制霸偉業！`
                : '恭喜少帥歷經 1949 歷史風雲抉擇，率領群雄平定台灣本島、離島與東南沿海共二十九區，開創台海盛世！'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-indigoInk-950/75 p-2.5 border border-parchment-400/25">
                <div className="text-parchment-300/75">麾下名將</div>
                <div className="font-mono text-base font-bold text-[#fde68a]">
                  {
                    Object.values(state.officers).filter(
                      (o) => o.faction === 'player' && !o.prisonerOf
                    ).length
                  }{' '}
                  / {HERO_LIST.length}
                </div>
              </div>
              <div className="rounded-lg bg-indigoInk-950/75 p-2.5 border border-parchment-400/25">
                <div className="text-parchment-300/75">征戰場次</div>
                <div className="font-mono text-base font-bold text-jade-400">
                  {state.battleReports.length} 戰
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={engine.resetGame}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d99b26] to-[#b87a1b] py-3 text-sm font-black text-white shadow-lg hover:brightness-110 transition"
              >
                <RotateCcw className="h-4 w-4" />
                再戰一局
              </button>
              <button
                type="button"
                onClick={handleReturnToMenu}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-parchment-400/45 bg-indigoInk-900/90 py-3 text-sm font-bold text-parchment-100 hover:border-[#f5c969]/75 hover:bg-indigoInk-800 transition"
              >
                <Home className="h-4 w-4 text-[#f5c969]" />
                返回模式選單
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defeat Overlay */}
      {state.defeat && !state.victory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="parchment-panel max-w-md w-full rounded-2xl border-vermilion-400/60 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-vermilion-400 bg-vermilion-800/80">
              <Skull className="h-9 w-9 text-red-200" />
            </div>
            <h2 className="mt-4 font-serif text-2xl font-black text-red-200">
              全軍覆沒・捲土重來
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment-200">
              我方據點已盡數失守，但開台義軍薪火未滅。重整旗鼓，自府城再度起兵吧！
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={engine.resetGame}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-vermilion-500 py-3 text-sm font-black text-white shadow-lg hover:bg-vermilion-400 transition"
              >
                <RotateCcw className="h-4 w-4" />
                重整旗鼓・再起新局
              </button>
              <button
                type="button"
                onClick={handleReturnToMenu}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-parchment-400/45 bg-indigoInk-900/90 py-3 text-sm font-bold text-parchment-100 hover:border-[#f5c969]/75 hover:bg-indigoInk-800 transition"
              >
                <Home className="h-4 w-4 text-[#f5c969]" />
                返回模式選單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
