import React, { useMemo, useState } from 'react';
import {
  X,
  Sprout,
  Coins,
  Landmark,
  Users,
  Swords,
  Shield,
  Anchor,
  Compass,
  ScrollText,
  Calendar,
  MapPin,
  Flag,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import type { DistrictId, GameState, HistoricalEventConfig } from '../types/game';
import {
  DISTRICT_LIST,
  DISTRICTS,
  FACTIONS,
  HISTORICAL_EVENTS,
  getGameCalendar,
} from '../data';
import { getDistrictStats } from '../engine/gameEngine';
import { DISTRICT_LANDMARK_NAMES } from './TaiwanLandmarks';

/* ============================================================================
 * 1. DomesticOverviewModal（內政總覽）
 * ========================================================================== */

export interface DomesticOverviewModalProps {
  open: boolean;
  state: GameState;
  matureCropCount: number;
  onHarvestAll: () => void;
  onEnterDistrict: (districtId: DistrictId) => void;
  onClose: () => void;
}

export const DomesticOverviewModal: React.FC<DomesticOverviewModalProps> = ({
  open,
  state,
  matureCropCount,
  onHarvestAll,
  onEnterDistrict,
  onClose,
}) => {
  const ownedDistricts = useMemo(
    () => DISTRICT_LIST.filter((d) => state.districts[d.id]?.faction === 'player'),
    [state.districts]
  );

  const totalPassiveGold = useMemo(
    () =>
      ownedDistricts.reduce(
        (sum, d) => sum + getDistrictStats(state, d.id).passiveGoldPerSec,
        0
      ),
    [ownedDistricts, state]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-parchment-400/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment-400/25 bg-indigoInk-950/80 px-4 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-jade-400/50 bg-jade-900/60 text-jade-300">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-50">
                🏛️ 內政總覽
              </h2>
              <p className="text-[11px] text-parchment-300/80">
                統籌全台農耕屯田、城池建設與稅收賦役
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉內政總覽"
            className="rounded-lg border border-parchment-400/30 bg-indigoInk-900/80 p-1.5 text-parchment-200 hover:bg-indigoInk-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary KPIs + One-Click Harvest */}
        <div className="border-b border-parchment-400/20 bg-indigoInk-950/50 p-3.5 shrink-0">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-900/80 p-2.5">
              <div className="text-[11px] text-parchment-300/75">我方領地</div>
              <div className="mt-0.5 font-mono text-lg font-black text-parchment-50">
                {ownedDistricts.length}
                <span className="ml-1 text-xs font-normal text-parchment-300/70">
                  / {DISTRICT_LIST.length}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-900/80 p-2.5">
              <div className="text-[11px] text-parchment-300/75 flex items-center gap-1">
                <Coins className="h-3 w-3 text-[#f5c969]" />
                市集稅收
              </div>
              <div className="mt-0.5 font-mono text-lg font-black text-[#fde68a]">
                +{totalPassiveGold.toFixed(1)}
                <span className="ml-0.5 text-xs font-normal text-parchment-300/70">
                  /秒
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-jade-400/30 bg-indigoInk-900/80 p-2.5">
              <div className="text-[11px] text-parchment-300/75 flex items-center gap-1">
                <Sprout className="h-3 w-3 text-jade-400" />
                成熟農田
              </div>
              <div className="mt-0.5 font-mono text-lg font-black text-jade-400">
                {matureCropCount}
                <span className="ml-1 text-xs font-normal text-parchment-300/70">
                  塊
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={matureCropCount === 0}
            onClick={onHarvestAll}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-black transition ${
              matureCropCount > 0
                ? 'border-jade-400 bg-gradient-to-r from-jade-600 via-jade-500 to-emerald-500 text-white shadow-[0_0_18px_rgba(73,168,136,0.45)] hover:brightness-110 active:scale-[0.99]'
                : 'border-parchment-400/20 bg-indigoInk-900/50 text-parchment-300/45 cursor-not-allowed'
            }`}
          >
            <Sprout className="h-4 w-4" />
            <span>
              🌾 一鍵全區收成
              {matureCropCount > 0 ? `（${matureCropCount} 塊農田可收）` : '（目前無成熟作物）'}
            </span>
          </button>
        </div>

        {/* Scrollable District List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {ownedDistricts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-parchment-400/25 p-6 text-center text-xs text-parchment-300/70">
              目前尚未擁有任何領地。
            </div>
          ) : (
            ownedDistricts.map((cfg) => {
              const dist = state.districts[cfg.id];
              const stats = getDistrictStats(state, cfg.id);
              const unlockedPlots = dist.plots.filter((p) => p.unlocked);
              const plantedCount = unlockedPlots.filter((p) => p.cropId !== null).length;
              const matureHere = unlockedPlots.filter(
                (p) => p.cropId !== null && p.matureAt !== null && state.gameTime >= p.matureAt
              ).length;
              const landmarkName = DISTRICT_LANDMARK_NAMES[cfg.id];

              return (
                <div
                  key={cfg.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-parchment-400/25 bg-indigoInk-950/75 p-3 hover:border-parchment-400/55 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif text-sm font-black text-parchment-50">
                        {cfg.name}
                      </span>
                      {landmarkName && (
                        <span className="rounded-md border border-parchment-400/25 bg-indigoInk-900/80 px-1.5 py-0.5 text-[10px] text-[#fde68a]">
                          {landmarkName}
                        </span>
                      )}
                      {matureHere > 0 && (
                        <span className="rounded-full bg-jade-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                          🌾 {matureHere} 成熟
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-parchment-300/85">
                      <span>
                        農田：
                        <strong className="font-mono text-parchment-100">
                          已種 {plantedCount} / 已解鎖 {unlockedPlots.length}
                        </strong>
                      </span>
                      <span className="font-mono text-[11px] text-parchment-200">
                        穀<strong className="text-[#fde68a]">{dist.buildings.granary}</strong> · 兵
                        <strong className="text-[#fde68a]">{dist.buildings.barracks}</strong> · 城
                        <strong className="text-[#fde68a]">{dist.buildings.wall}</strong> · 市
                        <strong className="text-[#fde68a]">{dist.buildings.market}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 text-jade-300">
                        <Users className="h-3 w-3" />
                        駐將 {stats.assignedHeroes.length}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterDistrict(cfg.id)}
                    className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-parchment-500 to-parchment-400 px-3 py-1.5 text-xs font-extrabold text-indigoInk-950 shadow hover:brightness-110 active:scale-95 transition"
                  >
                    <span>進入治理</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. StrategyOverviewModal（戰略總覽）
 * ========================================================================== */

export interface StrategyOverviewModalProps {
  open: boolean;
  state: GameState;
  onManageMilitary: (districtId: DistrictId) => void;
  onClose: () => void;
}

export const StrategyOverviewModal: React.FC<StrategyOverviewModalProps> = ({
  open,
  state,
  onManageMilitary,
  onClose,
}) => {
  const {
    taiwanTotal,
    taiwanOwned,
    mainlandTotal,
    mainlandOwned,
    playerDistricts,
    totalPlayerTroops,
  } = useMemo(() => {
    let twTotal = 0;
    let twOwned = 0;
    let mlTotal = 0;
    let mlOwned = 0;
    let troops = 0;
    const owned: typeof DISTRICT_LIST = [];

    for (const d of DISTRICT_LIST) {
      const st = state.districts[d.id];
      const isPlayer = st?.faction === 'player';
      if (d.zone === 'mainland') {
        mlTotal += 1;
        if (isPlayer) mlOwned += 1;
      } else {
        twTotal += 1;
        if (isPlayer) twOwned += 1;
      }
      if (isPlayer && st) {
        owned.push(d);
        troops += Math.floor(st.troops);
      }
    }

    for (const m of state.marches) {
      if (m.faction === 'player') {
        troops += Math.floor(m.troops);
      }
    }

    // Sort frontline districts (with adjacent enemies) first, then by troops desc
    owned.sort((a, b) => {
      const aEnemies = a.neighbors.filter(
        (nid) => state.districts[nid]?.faction !== 'player'
      ).length;
      const bEnemies = b.neighbors.filter(
        (nid) => state.districts[nid]?.faction !== 'player'
      ).length;
      if ((aEnemies > 0) !== (bEnemies > 0)) return aEnemies > 0 ? -1 : 1;
      return (state.districts[b.id]?.troops ?? 0) - (state.districts[a.id]?.troops ?? 0);
    });

    return {
      taiwanTotal: twTotal,
      taiwanOwned: twOwned,
      mainlandTotal: mlTotal,
      mainlandOwned: mlOwned,
      playerDistricts: owned,
      totalPlayerTroops: troops,
    };
  }, [state.districts, state.marches]);

  if (!open) return null;

  const twPct = Math.round((taiwanOwned / Math.max(1, taiwanTotal)) * 100);
  const mlPct = Math.round((mainlandOwned / Math.max(1, mainlandTotal)) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-vermilion-400/45 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment-400/25 bg-indigoInk-950/80 px-4 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-vermilion-400/55 bg-vermilion-800/60 text-vermilion-300">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-50">
                ⚔️ 戰略總覽
              </h2>
              <p className="text-[11px] text-parchment-300/80">
                掌握台海攻略進度、行軍軍團與前線駐防調度
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉戰略總覽"
            className="rounded-lg border border-parchment-400/30 bg-indigoInk-900/80 p-1.5 text-parchment-200 hover:bg-indigoInk-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Conquest Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-jade-400/35 bg-indigoInk-950/75 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-jade-200">台灣本島與離島</span>
                <span className="font-mono font-black text-parchment-50">
                  {taiwanOwned} / {taiwanTotal} ({twPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigoInk-900 border border-parchment-400/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-jade-600 to-jade-400 transition-all duration-500"
                  style={{ width: `${twPct}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-vermilion-400/35 bg-indigoInk-950/75 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-200">大陸東南沿海</span>
                <span className="font-mono font-black text-parchment-50">
                  {mainlandOwned} / {mainlandTotal} ({mlPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-indigoInk-900 border border-parchment-400/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-vermilion-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${mlPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Total Troops & Active Marches */}
          <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#fde68a]">
                <Compass className="h-4 w-4 text-vermilion-400" />
                進行中軍團（{state.marches.length}）
              </div>
              <div className="rounded-full border border-parchment-400/30 bg-indigoInk-900 px-2.5 py-0.5 text-xs">
                我方總兵力：
                <strong className="font-mono text-jade-300 ml-1">
                  {totalPlayerTroops.toLocaleString()} 人
                </strong>
              </div>
            </div>

            {state.marches.length === 0 ? (
              <div className="rounded-lg border border-dashed border-parchment-400/20 py-3 text-center text-xs text-parchment-300/65">
                目前台海各路暫無行軍部隊。
              </div>
            ) : (
              <div className="space-y-1.5">
                {state.marches.map((m) => {
                  const remain = Math.max(0, Math.ceil(m.arriveAt - state.gameTime));
                  const fromCfg = DISTRICTS[m.fromId];
                  const toCfg = DISTRICTS[m.toId];
                  const faction = FACTIONS[m.faction];
                  const isSea = Boolean(
                    fromCfg?.seaRoutes?.includes(m.toId) ||
                      toCfg?.seaRoutes?.includes(m.fromId)
                  );
                  return (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-parchment-400/20 bg-indigoInk-900/85 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.type === 'attack' ? (
                          <Swords className="h-3.5 w-3.5 text-vermilion-400 shrink-0" />
                        ) : (
                          <Shield className="h-3.5 w-3.5 text-jade-400 shrink-0" />
                        )}
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: faction.color }}
                        />
                        <span className="font-bold text-parchment-50 truncate">
                          {fromCfg?.shortName} ➔ {toCfg?.shortName}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isSea
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-parchment-400/15 text-parchment-200'
                          }`}
                        >
                          {isSea ? '⛵ 海路' : '🥾 陸路'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-parchment-200 shrink-0">
                        {Math.floor(m.troops).toLocaleString()} 兵 · 剩餘{' '}
                        <strong className="text-[#fde68a]">{remain}s</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Frontline & Garrison List */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-parchment-200">
              <Shield className="h-3.5 w-3.5 text-jade-400" />
              我方前線與駐防據點（{playerDistricts.length}）
            </h3>
            <div className="space-y-2">
              {playerDistricts.map((cfg) => {
                const dist = state.districts[cfg.id];
                const stats = getDistrictStats(state, cfg.id);
                const adjacentEnemies = cfg.neighbors.filter(
                  (nid) => state.districts[nid]?.faction !== 'player'
                );
                const hasSeaEnemy = adjacentEnemies.some(
                  (nid) =>
                    cfg.seaRoutes?.includes(nid) ||
                    DISTRICTS[nid]?.seaRoutes?.includes(cfg.id)
                );

                return (
                  <div
                    key={cfg.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 transition ${
                      adjacentEnemies.length > 0
                        ? 'border-vermilion-400/40 bg-vermilion-900/15'
                        : 'border-parchment-400/20 bg-indigoInk-950/70'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-sm font-black text-parchment-50">
                          {cfg.name}
                        </span>
                        {adjacentEnemies.length > 0 ? (
                          <span className="rounded-full bg-vermilion-500/85 px-2 py-0.5 text-[10px] font-bold text-white">
                            前線 · 鄰敵 {adjacentEnemies.length}
                          </span>
                        ) : (
                          <span className="rounded-full bg-jade-900/70 border border-jade-400/35 px-2 py-0.5 text-[10px] font-bold text-jade-300">
                            後方安全
                          </span>
                        )}
                        {hasSeaEnemy && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                            <Anchor className="h-2.5 w-2.5" />
                            海路接敵
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-parchment-300">
                        <span>
                          駐軍：
                          <strong className="text-parchment-50">
                            {Math.floor(dist.troops).toLocaleString()}
                          </strong>{' '}
                          / {stats.maxTroops.toLocaleString()}
                        </span>
                        <span>城防 +{stats.defenseBonus}%</span>
                        <span>駐將 {stats.assignedHeroes.length}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onManageMilitary(cfg.id)}
                      className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white shadow active:scale-95 transition ${
                        adjacentEnemies.length > 0
                          ? 'bg-vermilion-500 hover:bg-vermilion-400'
                          : 'bg-jade-600 hover:bg-jade-500'
                      }`}
                    >
                      <Swords className="h-3.5 w-3.5" />
                      <span>出征 / 調度</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. IntelOverviewModal（情報總覽）
 * ========================================================================== */

export interface IntelOverviewModalProps {
  open: boolean;
  state: GameState;
  onSelectEvent: (eventId: string) => void;
  onOpenFullReports: () => void;
  onClose: () => void;
}

type IntelTab = 'events' | 'factions' | 'reports';

export const IntelOverviewModal: React.FC<IntelOverviewModalProps> = ({
  open,
  state,
  onSelectEvent,
  onOpenFullReports,
  onClose,
}) => {
  const [tab, setTab] = useState<IntelTab>('events');

  const factionStats = useMemo(() => {
    const map = new Map<
      string,
      { factionId: string; districts: number; troops: number }
    >();
    for (const f of Object.values(FACTIONS)) {
      map.set(f.id, { factionId: f.id, districts: 0, troops: 0 });
    }
    for (const d of DISTRICT_LIST) {
      const st = state.districts[d.id];
      if (!st) continue;
      const entry = map.get(st.faction);
      if (entry) {
        entry.districts += 1;
        entry.troops += Math.floor(st.troops);
      }
    }
    for (const m of state.marches) {
      const entry = map.get(m.faction);
      if (entry) {
        entry.troops += Math.floor(m.troops);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.districts - a.districts || b.troops - a.troops
    );
  }, [state.districts, state.marches]);

  if (!open) return null;

  const calendar = getGameCalendar(state.gameTime);
  const pendingEvents = state.activeEventIds
    .map((id) => HISTORICAL_EVENTS[id])
    .filter((ev): ev is HistoricalEventConfig => Boolean(ev));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#f5c969]/45 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment-400/25 bg-indigoInk-950/80 px-4 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f5c969]/55 bg-amber-900/50 text-[#fde68a]">
              <ScrollText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-50">
                📜 情報總覽
              </h2>
              <p className="text-[11px] text-parchment-300/80">
                目前時局：{calendar.label} · 台海動態與歷史大事記
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉情報總覽"
            className="rounded-lg border border-parchment-400/30 bg-indigoInk-900/80 p-1.5 text-parchment-200 hover:bg-indigoInk-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1 border-b border-parchment-400/20 bg-indigoInk-950/65 p-1.5 shrink-0">
          {[
            {
              id: 'events' as const,
              label: '1949 大事記',
              badge: pendingEvents.length > 0 ? pendingEvents.length : undefined,
            },
            {
              id: 'factions' as const,
              label: '台海勢力',
            },
            {
              id: 'reports' as const,
              label: '最近戰報',
              badge:
                state.battleReports.length > 0
                  ? state.battleReports.length
                  : undefined,
            },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-parchment-500/90 text-indigoInk-950 shadow'
                    : 'text-parchment-300 hover:bg-indigoInk-800 hover:text-parchment-100'
                }`}
              >
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      t.id === 'events'
                        ? 'bg-vermilion-500 text-white'
                        : active
                        ? 'bg-indigoInk-950/80 text-parchment-100'
                        : 'bg-indigoInk-800 text-parchment-200'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* TAB 1: 1949 Historical Events */}
          {tab === 'events' && (
            <>
              {/* Pending Events */}
              {pendingEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#fde68a]">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    待處理重大事件（{pendingEvents.length}）
                  </div>
                  {pendingEvents.map((ev) => {
                    const loc = DISTRICTS[ev.locationId];
                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border-2 border-[#f5c969]/75 bg-gradient-to-br from-amber-900/35 via-indigoInk-950/90 to-vermilion-900/25 p-3.5 shadow-[0_0_20px_rgba(245,201,105,0.2)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-amber-400/25 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#fde68a]">
                              {ev.year}年 {ev.month}月
                            </span>
                            <span className="font-serif text-base font-black text-parchment-50">
                              【{ev.title}】
                            </span>
                            {loc && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-parchment-300">
                                <MapPin className="h-3 w-3 text-vermilion-400" />
                                {loc.name}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectEvent(ev.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#d99b26] to-[#b87a1b] px-3 py-1.5 text-xs font-black text-white shadow hover:brightness-110 active:scale-95 transition"
                          >
                            <span>📜 立即決策</span>
                          </button>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-parchment-200/90">
                          {ev.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resolved Chronicle */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-parchment-200">
                  <BookOpen className="h-4 w-4 text-parchment-400" />
                  歷史編年史（已決策 {state.resolvedEvents.length} 件）
                </div>
                {state.resolvedEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-parchment-400/25 bg-indigoInk-950/50 p-5 text-center text-xs text-parchment-300/70">
                    尚無已記載之歷史大事。隨著 1949 年起時局推進，重大歷史事件將陸續觸發！
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...state.resolvedEvents].reverse().map((res, idx) => {
                      const ev = HISTORICAL_EVENTS[res.eventId];
                      return (
                        <div
                          key={`${res.eventId}-${idx}`}
                          className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-indigoInk-800 px-1.5 py-0.5 font-mono text-[10px] text-parchment-300">
                                {res.year}年 {res.month}月
                              </span>
                              <span className="font-serif text-sm font-bold text-parchment-50">
                                {ev?.title ?? res.eventId}
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-jade-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {res.choiceLabel}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-parchment-300/85">
                            {res.outcomeText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: Factions */}
          {tab === 'factions' && (
            <div className="space-y-2">
              {factionStats.map((item, idx) => {
                const f = FACTIONS[item.factionId as keyof typeof FACTIONS];
                if (!f) return null;
                const pct = Math.round((item.districts / DISTRICT_LIST.length) * 100);
                return (
                  <div
                    key={f.id}
                    className={`rounded-xl border p-3 ${
                      f.id === 'player'
                        ? 'border-jade-400/50 bg-jade-900/20'
                        : 'border-parchment-400/20 bg-indigoInk-950/75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-black text-parchment-400 w-5">
                          #{idx + 1}
                        </span>
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: f.color }}
                        />
                        <span className="font-serif text-sm font-black text-parchment-50 truncate">
                          {f.name}
                        </span>
                        <span className="text-[11px] text-parchment-300/75 hidden sm:inline">
                          · {f.leaderName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                        <span className="text-parchment-100">
                          <Flag className="inline h-3 w-3 mr-0.5 text-parchment-400" />
                          <strong>{item.districts}</strong> 區
                        </span>
                        <span className="text-[#fde68a]">
                          ⚔ {item.troops.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigoInk-900">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: f.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Recent Battle Reports */}
          {tab === 'reports' && (
            <div className="space-y-2.5">
              {state.battleReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-parchment-400/25 bg-indigoInk-950/50 p-6 text-center text-xs text-parchment-300/70">
                  目前尚無任何交戰紀錄。
                </div>
              ) : (
                <>
                  {state.battleReports.slice(0, 6).map((r) => {
                    const fromName = DISTRICTS[r.fromId]?.shortName ?? r.fromId;
                    const toName = DISTRICTS[r.toId]?.shortName ?? r.toId;
                    const atkFaction = FACTIONS[r.attackerFaction];
                    const defFaction = FACTIONS[r.defenderFaction];
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-parchment-50">
                            <span style={{ color: atkFaction.lightColor }}>
                              {atkFaction.name}
                            </span>
                            <span className="text-parchment-400">({fromName})</span>
                            <span>➔</span>
                            <span style={{ color: defFaction.lightColor }}>
                              {defFaction.name}
                            </span>
                            <span className="text-parchment-400">({toName})</span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              r.conquered
                                ? 'bg-vermilion-500 text-white'
                                : r.winner === 'attacker'
                                ? 'bg-amber-500/80 text-indigoInk-950'
                                : 'bg-jade-700 text-jade-100'
                            }`}
                          >
                            {r.conquered
                              ? '攻克城池'
                              : r.winner === 'attacker'
                              ? '攻方佔優'
                              : '守軍擊退'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-parchment-300/85">
                          <span>
                            攻方：{r.attackerTroopsStart} ➔ {r.attackerTroopsEnd}
                          </span>
                          <span>
                            守方：{r.defenderTroopsStart} ➔ {r.defenderTroopsEnd}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={onOpenFullReports}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-parchment-400/40 bg-indigoInk-900/90 py-2.5 text-xs font-bold text-parchment-100 hover:bg-indigoInk-800 transition"
                  >
                    <Swords className="h-3.5 w-3.5 text-vermilion-400" />
                    <span>檢視完整戰報紀錄（共 {state.battleReports.length} 戰）</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. HistoricalEventModal（1949 歷史重大事件決策視窗）
 * ========================================================================== */

export interface HistoricalEventModalProps {
  event: HistoricalEventConfig | null;
  onResolve: (eventId: string, choiceId: string) => void;
  onClose: () => void;
}

const CATEGORY_META: Record<
  HistoricalEventConfig['category'],
  { label: string; badgeClass: string }
> = {
  battle: {
    label: '⚔️ 重大戰役',
    badgeClass: 'border-vermilion-400/70 bg-vermilion-800/70 text-red-100',
  },
  policy: {
    label: '📜 施政改革',
    badgeClass: 'border-[#f5c969]/70 bg-amber-900/65 text-[#fef3c7]',
  },
  construction: {
    label: '🏗️ 重大建設',
    badgeClass: 'border-jade-400/70 bg-jade-900/70 text-jade-100',
  },
};

export const HistoricalEventModal: React.FC<HistoricalEventModalProps> = ({
  event,
  onResolve,
  onClose,
}) => {
  if (!event) return null;

  const location = DISTRICTS[event.locationId];
  const cat = CATEGORY_META[event.category];
  const rocYear = event.year - 1911;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-panel relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border-2 border-[#f5c969]/80 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Ornamental Banner */}
        <div className="border-b border-[#f5c969]/35 bg-gradient-to-r from-[#22170e] via-[#342213] to-[#22170e] px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f5c969]/60 bg-indigoInk-950/80 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#fde68a]">
                <Calendar className="h-3 w-3" />
                {event.year}年 {event.month}月 · 民國{rocYear}年
              </span>
              {location && (
                <span className="inline-flex items-center gap-1 rounded-full border border-parchment-400/35 bg-indigoInk-950/75 px-2.5 py-0.5 text-[11px] font-bold text-parchment-100">
                  <MapPin className="h-3 w-3 text-vermilion-400" />
                  {location.name}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cat.badgeClass}`}
              >
                {cat.label}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="暫時關閉事件視窗"
              className="shrink-0 rounded-lg border border-parchment-400/30 bg-indigoInk-950/70 p-1 text-parchment-200 hover:bg-indigoInk-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mt-3 font-serif text-2xl font-black tracking-wide text-[#fef3c7] drop-shadow">
            {event.title}
          </h2>
        </div>

        {/* Narrative & Choices */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/75 p-4 text-sm leading-relaxed text-parchment-100">
            {event.summary}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#fde68a]">
              <Sparkles className="h-3.5 w-3.5" />
              請少帥下達歷史決策：
            </div>

            {event.choices.map((choice, idx) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onResolve(event.id, choice.id)}
                className={`group w-full rounded-xl border p-3.5 text-left transition active:scale-[0.99] ${
                  idx === 0
                    ? 'border-[#f5c969]/65 bg-gradient-to-br from-amber-900/35 to-indigoInk-950/90 hover:border-[#f5c969] hover:brightness-110'
                    : 'border-jade-400/50 bg-gradient-to-br from-jade-900/30 to-indigoInk-950/90 hover:border-jade-400 hover:brightness-110'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-base font-black text-parchment-50 group-hover:text-[#fef3c7]">
                    {idx === 0 ? '壹、' : '貳、'}
                    {choice.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-parchment-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-1.5 text-xs font-medium text-jade-300">
                  效果：{choice.effectDesc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
