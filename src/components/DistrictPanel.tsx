import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Castle,
  Swords,
  Shield,
  Lock,
  Plus,
  Coins,
  Wheat,
  Sparkles,
  UserPlus,
  UserMinus,
  Anchor,
  Compass,
  Heart,
  Search,
  X,
} from 'lucide-react';
import type {
  BuildingType,
  CropId,
  DistrictId,
  GameState,
  TerrainType,
} from '../types/game';
import {
  BUILDING_LIST,
  CROP_LIST,
  CROPS,
  DISTRICTS,
  FACTIONS,
  HEROES,
} from '../data';
import {
  EXPLORE_COST_GOLD,
  getBuildingCost,
  getDistrictStats,
  getPlotUnlockCost,
} from '../engine/gameEngine';
import {
  BuildingIcon,
  CropIcon,
  HeroAvatar,
  RarityBadge,
} from './GameIcons';

export interface DistrictPanelProps {
  state: GameState;
  initialTab?: 'farm' | 'buildings' | 'military';
  onPlantCrop: (districtId: DistrictId, plotIndex: number, cropId: CropId) => void;
  onHarvestPlot: (districtId: DistrictId, plotIndex: number) => void;
  onHarvestDistrict: (districtId: DistrictId) => void;
  onUnlockPlot: (districtId: DistrictId, plotIndex: number) => void;
  onUpgradeBuilding: (districtId: DistrictId, type: BuildingType) => void;
  onRecruitTroops: (districtId: DistrictId, amount: number) => void;
  onAssignHero: (heroId: string, districtId: DistrictId | null) => void;
  onExploreDistrict: (districtId: DistrictId) => void;
  onOpenMarch: (fromId: DistrictId, toId: DistrictId) => void;
  onSelectDistrict: (districtId: DistrictId) => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'error') => void;
  onClose?: () => void;
}

const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: '平原',
  mountain: '山地',
  port: '港灣',
  basin: '盆地',
  island: '離島',
};

type PanelTab = 'farm' | 'buildings' | 'military';

export const DistrictPanel: React.FC<DistrictPanelProps> = ({
  state,
  initialTab = 'farm',
  onPlantCrop,
  onHarvestPlot,
  onHarvestDistrict,
  onUnlockPlot,
  onUpgradeBuilding,
  onRecruitTroops,
  onAssignHero,
  onExploreDistrict,
  onOpenMarch,
  onSelectDistrict,
  onNotify,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);
  const [plantingPlotIndex, setPlantingPlotIndex] = useState<number | null>(null);
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);

  const districtId = state.selectedDistrictId;

  useEffect(() => {
    setPlantingPlotIndex(null);
    setAssignPickerOpen(false);
  }, [districtId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, districtId]);
  const config = DISTRICTS[districtId];
  const district = state.districts[districtId];
  const faction = FACTIONS[district.faction];
  const stats = getDistrictStats(state, districtId);
  const isPlayerOwned = district.faction === 'player';

  const currentTroops = Math.floor(district.troops);
  const troopSpace = Math.max(0, stats.maxTroops - currentTroops);

  const matureInDistrict = district.plots.filter(
    (p) => p.unlocked && p.cropId && p.matureAt !== null && state.gameTime >= p.matureAt
  ).length;

  // Eligible adjacent player districts that can attack this enemy/neutral district
  const adjacentPlayerLaunchers = config.neighbors.filter(
    (nid) => state.districts[nid]?.faction === 'player'
  );

  // Available player officers to assign to this player district
  const assignableHeroes = Object.values(state.officers).filter(
    (o) =>
      o.faction === 'player' &&
      o.prisonerOf === null &&
      o.inMarchId === null &&
      o.districtId !== districtId
  );

  // Enemy garrison officers in this district (for intelligence preview)
  const enemyGarrisonOfficers = district.garrisonHeroIds
    .map((id) => ({ officer: state.officers[id], hero: HEROES[id] }))
    .filter((entry) => Boolean(entry.officer && entry.hero));

  const handleRecruit = (amount: number) => {
    const actual = Math.min(amount, troopSpace);
    if (actual <= 0) {
      onNotify('本區駐軍已達上限，請升級義民兵營！', 'info');
      return;
    }
    const foodCost = Math.ceil(actual * 1);
    const goldCost = Math.ceil(actual * 0.5);
    if (state.resources.food < foodCost || state.resources.gold < goldCost) {
      onNotify(`資源不足！徵召 ${actual} 兵需 ${foodCost} 糧草與 ${goldCost} 銀兩`, 'error');
      return;
    }
    onRecruitTroops(districtId, actual);
    onNotify(`已在 ${config.shortName} 徵召 ${actual} 名義軍！`, 'success');
  };

  return (
    <aside className="parchment-panel flex h-full w-full flex-col rounded-xl overflow-hidden">
      {/* District Header */}
      <div className="border-b border-parchment-400/25 bg-indigoInk-950/65 p-3.5 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl font-black text-parchment-50">
                {config.name}
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
                style={{ backgroundColor: faction.color }}
              >
                {faction.name}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-parchment-300/90">
              <span>
                地形：<strong className="text-parchment-100">{TERRAIN_LABELS[config.terrain]}</strong>
              </span>
              <span>
                城防：<strong className="text-sky-300">+{stats.defenseBonus}%</strong>
              </span>
              <span>
                特產：<strong className="text-[#fde68a]">{config.specialtyName}</strong>
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Heart className="h-3 w-3 text-vermilion-400" />
                士氣 <strong className="text-parchment-100">{district.morale}</strong>
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉郡縣視窗"
              className="shrink-0 rounded-lg border border-parchment-400/30 bg-indigoInk-900/80 p-1.5 text-parchment-200 hover:border-parchment-400/70 hover:bg-indigoInk-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Garrison Troops Bar */}
        <div className="mt-3 rounded-lg border border-parchment-400/20 bg-indigoInk-900/75 p-2.5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-parchment-200 flex items-center gap-1">
              <Swords className="h-3.5 w-3.5 text-parchment-400" />
              駐守兵力
            </span>
            <span className="font-mono font-bold text-parchment-50">
              {currentTroops.toLocaleString()} / {stats.maxTroops.toLocaleString()}
              {isPlayerOwned && stats.passiveTroopsPerSec > 0 && (
                <span className="ml-1.5 text-[10px] text-jade-400">
                  (+{stats.passiveTroopsPerSec}/s)
                </span>
              )}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-indigoInk-950">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((currentTroops / Math.max(1, stats.maxTroops)) * 100))}%`,
                backgroundColor: faction.color,
              }}
            />
          </div>

          {/* Quick Recruit Buttons for Player District */}
          {isPlayerOwned && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[11px] text-parchment-300/80 shrink-0">徵兵：</span>
              {[
                { label: '+50', amt: 50 },
                { label: '+200', amt: 200 },
                { label: '補滿', amt: troopSpace },
              ].map((btn) => {
                const actual = Math.min(btn.amt, troopSpace);
                const fCost = Math.ceil(actual * 1);
                const gCost = Math.ceil(actual * 0.5);
                const disabled =
                  actual <= 0 ||
                  state.resources.food < fCost ||
                  state.resources.gold < gCost;

                return (
                  <button
                    key={btn.label}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleRecruit(btn.amt)}
                    title={
                      actual > 0
                        ? `徵召 ${actual} 兵：消耗 ${fCost} 糧草、${gCost} 銀兩`
                        : '兵力已滿'
                    }
                    className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                      disabled
                        ? 'border-parchment-400/15 bg-indigoInk-950/40 text-parchment-300/40 cursor-not-allowed'
                        : 'border-jade-400/50 bg-jade-900/55 text-jade-100 hover:bg-jade-600/70 active:scale-95'
                    }`}
                  >
                    <div>{btn.label}</div>
                    {actual > 0 && (
                      <div className="text-[9px] font-mono text-parchment-300/80">
                        {fCost}糧/{gCost}銀
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Non-Player District Intelligence View */}
      {!isPlayerOwned ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/65 p-3.5">
            <div className="text-xs font-bold text-parchment-400 mb-1">郡縣情報</div>
            <p className="text-xs leading-relaxed text-parchment-200/90">
              {config.description}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-indigoInk-900/80 p-2 border border-parchment-400/15">
                <div className="text-[10px] text-parchment-300/70">勢力首領</div>
                <div className="font-bold text-parchment-100 mt-0.5">
                  {faction.leaderName}
                </div>
              </div>
              <div className="rounded-lg bg-indigoInk-900/80 p-2 border border-parchment-400/15">
                <div className="text-[10px] text-parchment-300/70">紅磚城防等級</div>
                <div className="font-bold text-parchment-100 mt-0.5">
                  Lv.{district.buildings.wall}（總防 +{stats.defenseBonus}%）
                </div>
              </div>
            </div>
          </div>

          {/* Enemy Garrison Officers Intelligence */}
          <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-sm font-bold text-parchment-100 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#f5c969]" />
                守城將領情報（{enemyGarrisonOfficers.length}）
              </h3>
              <span className="text-[10px] text-parchment-300/75">
                攻克城池有機會生擒招降
              </span>
            </div>
            {enemyGarrisonOfficers.length === 0 ? (
              <p className="text-xs text-parchment-300/70">
                本城目前無名將駐守，由地方守軍把關。
              </p>
            ) : (
              <div className="space-y-2">
                {enemyGarrisonOfficers.map(({ officer, hero }) => (
                  <div
                    key={hero.id}
                    className="flex items-center gap-2.5 rounded-lg border border-parchment-400/20 bg-indigoInk-900/85 p-2"
                  >
                    <HeroAvatar hero={hero} className="w-10 h-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <RarityBadge rarity={hero.rarity} />
                        <span className="truncate font-serif text-xs font-bold text-parchment-50">
                          {hero.name}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-parchment-300/80">
                          忠 {officer.loyalty}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-parchment-300">
                        <span className="text-red-300">武{hero.might}</span>
                        <span className="text-[#fde68a]">統{hero.command}</span>
                        <span className="text-sky-300">智{hero.intel}</span>
                        <span className="truncate text-amber-200/85">
                          戰技：{hero.skillName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Launch Attack from Adjacent Player Districts */}
          <div className="rounded-xl border border-vermilion-400/35 bg-vermilion-800/15 p-3.5">
            <h3 className="font-serif text-sm font-bold text-parchment-100 flex items-center gap-1.5 mb-2">
              <Swords className="h-4 w-4 text-vermilion-400" />
              發動攻城討伐
            </h3>
            {adjacentPlayerLaunchers.length === 0 ? (
              <p className="text-xs text-parchment-300/80 leading-relaxed">
                此郡縣尚未與我方領地接壤（需先攻克相鄰縣市或海路跳板，方可派兵攻打）。
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-parchment-300/85">
                  選擇出發的我方相鄰縣市，立即點兵進攻 {config.shortName}：
                </p>
                {adjacentPlayerLaunchers.map((fromId) => {
                  const fromCfg = DISTRICTS[fromId];
                  const fromState = state.districts[fromId];
                  const isSea = Boolean(
                    config.seaRoutes?.includes(fromId) ||
                      fromCfg.seaRoutes?.includes(districtId)
                  );
                  return (
                    <div
                      key={fromId}
                      className="flex items-center justify-between rounded-lg border border-parchment-400/25 bg-indigoInk-950/80 px-3 py-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-parchment-100 flex items-center gap-1.5">
                          <span>自 {fromCfg.name} 出兵</span>
                          {isSea && (
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                              ⛵ 海路
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-parchment-300/80">
                          可用駐軍：{Math.floor(fromState.troops)} 人
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenMarch(fromId, districtId)}
                        className="rounded-lg bg-vermilion-500 px-3 py-1.5 text-xs font-extrabold text-white shadow hover:bg-vermilion-400 active:scale-95 transition"
                      >
                        派兵攻打
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Player District Tabs */}
          <div className="grid grid-cols-3 border-b border-parchment-400/25 bg-indigoInk-950/80 p-1 gap-1">
            {[
              {
                id: 'farm' as const,
                label: '農田種植',
                icon: Sprout,
                badge: matureInDistrict > 0 ? matureInDistrict : undefined,
              },
              { id: 'buildings' as const, label: '城池建設', icon: Castle },
              { id: 'military' as const, label: '駐防與出征', icon: Swords },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPlantingPlotIndex(null);
                  }}
                  className={`relative flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-parchment-500/90 text-indigoInk-950 shadow'
                      : 'text-parchment-300 hover:bg-indigoInk-800 hover:text-parchment-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-jade-500 px-1 text-[10px] font-black text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {/* TAB 1: FARMING */}
            {activeTab === 'farm' && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-parchment-300">
                    本區特產：
                    <strong className="text-[#fde68a]">
                      {CROPS[config.specialtyCrop]?.name} (+25% 產量)
                    </strong>
                  </div>
                  {matureInDistrict > 0 && (
                    <button
                      type="button"
                      onClick={() => onHarvestDistrict(districtId)}
                      className="inline-flex items-center gap-1 rounded-md bg-jade-500 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-jade-400 active:scale-95 transition"
                    >
                      <Sprout className="h-3.5 w-3.5" />
                      本區收成 ({matureInDistrict})
                    </button>
                  )}
                </div>

                {/* 6-Plot Farm Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {district.plots.map((plot) => {
                    if (!plot.unlocked) {
                      const cost = getPlotUnlockCost(plot.plotIndex);
                      const canUnlock =
                        state.resources.gold >= cost.gold &&
                        state.resources.food >= cost.food;
                      return (
                        <div
                          key={plot.plotIndex}
                          className="flex flex-col items-center justify-between rounded-xl border border-dashed border-parchment-400/25 bg-indigoInk-950/50 p-3 text-center"
                        >
                          <Lock className="h-5 w-5 text-parchment-400/45 mb-1" />
                          <div className="text-xs font-bold text-parchment-300/75">
                            荒地 #{plot.plotIndex + 1}
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-parchment-300/65">
                            {cost.gold}銀 / {cost.food}糧
                          </div>
                          <button
                            type="button"
                            disabled={!canUnlock}
                            onClick={() => {
                              onUnlockPlot(districtId, plot.plotIndex);
                              onNotify(`已開墾 ${config.shortName} 農田 #${plot.plotIndex + 1}！`, 'success');
                            }}
                            className={`mt-2 w-full rounded-md py-1 text-[11px] font-bold transition ${
                              canUnlock
                                ? 'bg-parchment-500/85 text-indigoInk-950 hover:brightness-110'
                                : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed'
                            }`}
                          >
                            開墾農地
                          </button>
                        </div>
                      );
                    }

                    // Empty unlocked plot
                    if (!plot.cropId) {
                      const isPicking = plantingPlotIndex === plot.plotIndex;
                      return (
                        <button
                          key={plot.plotIndex}
                          type="button"
                          onClick={() =>
                            setPlantingPlotIndex(isPicking ? null : plot.plotIndex)
                          }
                          className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition min-h-[108px] ${
                            isPicking
                              ? 'border-[#f5c969] bg-parchment-900/35 ring-1 ring-[#f5c969]/70'
                              : 'border-parchment-400/30 bg-indigoInk-950/70 hover:border-jade-400/70 hover:bg-jade-900/25'
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-jade-400/50 bg-jade-900/40 text-jade-400 mb-1.5">
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold text-parchment-100">
                            空閒農田 #{plot.plotIndex + 1}
                          </span>
                          <span className="text-[10px] text-parchment-300/75 mt-0.5">
                            點擊選擇作物播種
                          </span>
                        </button>
                      );
                    }

                    // Growing or Mature plot
                    const crop = CROPS[plot.cropId];
                    const plantedAt = plot.plantedAt ?? 0;
                    const matureAt = plot.matureAt ?? state.gameTime;
                    const totalDur = Math.max(1, matureAt - plantedAt);
                    const elapsed = Math.max(0, state.gameTime - plantedAt);
                    const pct = Math.min(100, Math.round((elapsed / totalDur) * 100));
                    const remainSec = Math.max(0, Math.ceil(matureAt - state.gameTime));
                    const isMature = state.gameTime >= matureAt;
                    const isSpecialty = plot.cropId === config.specialtyCrop;

                    return (
                      <div
                        key={plot.plotIndex}
                        onClick={() => {
                          if (isMature) onHarvestPlot(districtId, plot.plotIndex);
                        }}
                        className={`relative flex flex-col justify-between rounded-xl border p-3 transition min-h-[108px] ${
                          isMature
                            ? 'cursor-pointer border-jade-400 bg-gradient-to-br from-jade-800/65 to-indigoInk-950 shadow-[0_0_16px_rgba(73,168,136,0.35)] hover:brightness-110'
                            : 'border-parchment-400/25 bg-indigoInk-950/75'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CropIcon cropId={plot.cropId} className="w-8 h-8 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="truncate text-xs font-bold text-parchment-50">
                                {crop.name}
                              </span>
                              {isSpecialty && (
                                <span className="rounded bg-amber-400/25 px-1 text-[9px] font-bold text-[#fde68a]">
                                  特產
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-parchment-300/80">
                              {isMature ? (
                                <span className="font-bold text-jade-400">
                                  已成熟！點擊收成
                                </span>
                              ) : (
                                <span className="font-mono">剩餘 {remainSec} 秒</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigoInk-900">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${
                                isMature ? 'bg-jade-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inline Crop Selector when an empty plot is clicked */}
                {plantingPlotIndex !== null && (
                  <div className="rounded-xl border border-[#f5c969]/55 bg-indigoInk-950/95 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#fde68a]">
                        選擇播種作物（農田 #{plantingPlotIndex + 1}）
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlantingPlotIndex(null)}
                        className="rounded p-0.5 text-parchment-300 hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {CROP_LIST.map((crop) => {
                        const isSpecialty = crop.id === config.specialtyCrop;
                        const canAfford = state.resources.gold >= crop.seedCostGold;
                        const mult = isSpecialty ? 1.25 : 1;
                        const estFood = Math.round(
                          crop.foodYield * stats.foodMultiplier * mult
                        );
                        const estGold = Math.round(
                          crop.goldYield * stats.goldMultiplier * mult
                        );

                        return (
                          <button
                            key={crop.id}
                            type="button"
                            disabled={!canAfford}
                            onClick={() => {
                              onPlantCrop(districtId, plantingPlotIndex, crop.id);
                              setPlantingPlotIndex(null);
                            }}
                            className={`flex items-start gap-2 rounded-lg border p-2 text-left transition ${
                              !canAfford
                                ? 'border-parchment-400/15 bg-indigoInk-900/40 opacity-45 cursor-not-allowed'
                                : isSpecialty
                                ? 'border-[#f5c969]/75 bg-parchment-900/35 hover:brightness-115'
                                : 'border-parchment-400/20 bg-indigoInk-900/75 hover:border-jade-400/70'
                            }`}
                          >
                            <CropIcon cropId={crop.id} className="w-7 h-7 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="truncate text-xs font-bold text-parchment-50">
                                  {crop.name}
                                </span>
                                {isSpecialty && (
                                  <span className="shrink-0 rounded bg-[#f5c969] px-1 text-[9px] font-black text-indigoInk-950">
                                    +25%
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-parchment-300">
                                <span>{crop.seedCostGold}銀</span>
                                <span>{crop.growTimeSec}秒</span>
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] text-jade-400">
                                +{estFood}糧 +{estGold}銀
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: BUILDINGS */}
            {activeTab === 'buildings' && (
              <div className="space-y-2.5">
                {BUILDING_LIST.map((b) => {
                  const level = district.buildings[b.type];
                  const isMax = level >= b.maxLevel;
                  const cost = getBuildingCost(b.type, level);
                  const canAfford =
                    !isMax &&
                    state.resources.gold >= cost.gold &&
                    state.resources.food >= cost.food;

                  return (
                    <div
                      key={b.type}
                      className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/75 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-parchment-400/35 bg-indigoInk-900">
                          <BuildingIcon type={b.type} className="w-8 h-8" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-sm font-bold text-parchment-50">
                              {b.name}
                            </h4>
                            <span className="rounded bg-indigoInk-800 px-2 py-0.5 font-mono text-[11px] font-bold text-[#fde68a]">
                              Lv.{level} / {b.maxLevel}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-jade-400 font-medium">
                            {b.effectPerLevel}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-parchment-300/75">
                            {b.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-parchment-400/15 pt-2">
                        {isMax ? (
                          <span className="text-xs font-bold text-[#fde68a]">
                            已達最高等級
                          </span>
                        ) : (
                          <div className="flex items-center gap-3 font-mono text-xs">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                state.resources.gold >= cost.gold
                                  ? 'text-[#fde68a]'
                                  : 'text-vermilion-400'
                              }`}
                            >
                              <Coins className="h-3.5 w-3.5" />
                              {cost.gold}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 ${
                                state.resources.food >= cost.food
                                  ? 'text-amber-200'
                                  : 'text-vermilion-400'
                              }`}
                            >
                              <Wheat className="h-3.5 w-3.5" />
                              {cost.food}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isMax || !canAfford}
                          onClick={() => {
                            onUpgradeBuilding(districtId, b.type);
                            onNotify(
                              `${config.shortName} 的 ${b.name} 升至 Lv.${level + 1}！`,
                              'success'
                            );
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            isMax
                              ? 'bg-indigoInk-900 text-parchment-300/40 cursor-default'
                              : canAfford
                              ? 'bg-gradient-to-r from-parchment-500 to-parchment-400 text-indigoInk-950 hover:brightness-110 active:scale-95'
                              : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? '已滿級' : '升級建築'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: GARRISON & MILITARY */}
            {activeTab === 'military' && (
              <div className="space-y-4">
                {/* Explore Local Talent Action */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#f5c969]/40 bg-gradient-to-r from-[#241a0f]/80 to-indigoInk-950/90 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#fde68a] flex items-center gap-1">
                      <Search className="h-3.5 w-3.5" />
                      走訪民間・發掘本地在野賢才
                    </div>
                    <div className="text-[10px] text-parchment-300/80 mt-0.5">
                      發掘隱居名士或尋獲軍餉物資
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={state.resources.gold < EXPLORE_COST_GOLD}
                    onClick={() => onExploreDistrict(districtId)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                      state.resources.gold >= EXPLORE_COST_GOLD
                        ? 'bg-gradient-to-r from-jade-600 to-emerald-500 text-white shadow hover:brightness-110 active:scale-95'
                        : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed border border-parchment-400/15'
                    }`}
                  >
                    🔍 探索本地人才 ({EXPLORE_COST_GOLD}銀)
                  </button>
                </div>

                {/* Assigned Garrison Heroes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-parchment-200 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-jade-400" />
                      本區駐防武將（{stats.assignedHeroes.length}）
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAssignPickerOpen((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-md border border-jade-400/50 bg-jade-900/45 px-2 py-1 text-[11px] font-bold text-jade-100 hover:bg-jade-600/60 transition"
                    >
                      <UserPlus className="h-3 w-3" />
                      {assignPickerOpen ? '收合名單' : '調派武將'}
                    </button>
                  </div>

                  {stats.activeBonds.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {stats.activeBonds.map((bond) => (
                        <span
                          key={bond}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-[#f5c969]/60 px-2 py-0.5 text-[10px] font-bold text-[#fde68a]"
                        >
                          <Sparkles className="h-3 w-3" />
                          羈絆生效：{bond} (+10%)
                        </span>
                      ))}
                    </div>
                  )}

                  {stats.assignedHeroes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-parchment-400/25 bg-indigoInk-950/50 p-3 text-center text-xs text-parchment-300/70">
                      目前無駐防武將。派駐武將可提升守城防禦與農田收成！
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.assignedHeroes.map((officer) => {
                        const hero = HEROES[officer.heroId];
                        if (!hero) return null;
                        return (
                          <div
                            key={officer.heroId}
                            className="flex items-center gap-2.5 rounded-xl border border-parchment-400/25 bg-indigoInk-950/75 p-2"
                          >
                            <HeroAvatar hero={hero} className="w-11 h-11" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <RarityBadge rarity={hero.rarity} />
                                <span className="truncate font-serif text-xs font-bold text-parchment-50">
                                  {hero.name}
                                </span>
                                <span className="font-mono text-[10px] text-[#fde68a]">
                                  Lv.{officer.level}
                                </span>
                                <span className="font-mono text-[10px] text-jade-300">
                                  忠{officer.loyalty}
                                </span>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-parchment-300">
                                <span className="text-red-300">武{hero.might}</span>
                                <span className="text-[#fde68a]">統{hero.command}</span>
                                <span className="text-sky-300">智{hero.intel}</span>
                                <span className="text-jade-400">
                                  農政+{Math.round(hero.farmBonus * 100)}%
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onAssignHero(officer.heroId, null)}
                              title="解除駐防"
                              className="rounded-lg border border-parchment-400/25 p-1.5 text-parchment-300 hover:bg-vermilion-500/20 hover:text-vermilion-400 transition"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Assignable Hero Picker */}
                  {assignPickerOpen && (
                    <div className="mt-2 rounded-xl border border-jade-400/45 bg-indigoInk-950/90 p-2.5 space-y-1.5">
                      <div className="text-[11px] font-bold text-jade-100">
                        選擇要調派至 {config.shortName} 的武將：
                      </div>
                      {assignableHeroes.length === 0 ? (
                        <p className="text-[11px] text-parchment-300/70 py-1">
                          暫無其他可調派武將（可於「人才與大牢」探索登庸更多名將）。
                        </p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                          {assignableHeroes.map((officer) => {
                            const hero = HEROES[officer.heroId];
                            if (!hero) return null;
                            return (
                              <div
                                key={officer.heroId}
                                className="flex items-center justify-between rounded-lg bg-indigoInk-900/90 px-2 py-1.5 border border-parchment-400/15"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <HeroAvatar hero={hero} className="w-8 h-8" />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-bold text-parchment-100">
                                      {hero.name}
                                    </div>
                                    <div className="text-[10px] text-parchment-300/75">
                                      {officer.districtId
                                        ? `現駐：${DISTRICTS[officer.districtId]?.shortName}`
                                        : '待命中'}{' '}
                                      · 農+{Math.round(hero.farmBonus * 100)}%
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onAssignHero(officer.heroId, districtId);
                                    setAssignPickerOpen(false);
                                  }}
                                  className="shrink-0 rounded bg-jade-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-jade-400"
                                >
                                  派駐
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Adjacent Territories Quick Dispatch List */}
                <div className="border-t border-parchment-400/20 pt-3">
                  <h3 className="text-xs font-bold text-parchment-200 flex items-center gap-1.5 mb-2">
                    <Compass className="h-3.5 w-3.5 text-parchment-400" />
                    相鄰郡縣・出征與增援（{config.neighbors.length}）
                  </h3>
                  <div className="space-y-2">
                    {config.neighbors.map((neighborId) => {
                      const nCfg = DISTRICTS[neighborId];
                      const nState = state.districts[neighborId];
                      const nFaction = FACTIONS[nState.faction];
                      const isAlly = nState.faction === 'player';
                      const isSea = Boolean(
                        config.seaRoutes?.includes(neighborId) ||
                          nCfg.seaRoutes?.includes(districtId)
                      );

                      return (
                        <div
                          key={neighborId}
                          className="flex items-center justify-between gap-2 rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 px-3 py-2 hover:border-parchment-400/45 transition"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectDistrict(neighborId)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: nFaction.color }}
                              />
                              <span className="truncate font-serif text-xs font-bold text-parchment-50">
                                {nCfg.name}
                              </span>
                              {isSea && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300">
                                  <Anchor className="h-2.5 w-2.5" />
                                  ⛵ 海路
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[11px] text-parchment-300/80 font-mono">
                              {nFaction.name} · ⚔ {Math.floor(nState.troops)} 人
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenMarch(districtId, neighborId)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white shadow transition active:scale-95 ${
                              isAlly
                                ? 'bg-jade-600 hover:bg-jade-500'
                                : 'bg-vermilion-500 hover:bg-vermilion-400'
                            }`}
                          >
                            {isAlly ? '增援' : '攻打'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
