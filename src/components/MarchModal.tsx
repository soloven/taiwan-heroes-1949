import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Swords,
  Shield,
  Wheat,
  Clock,
  Anchor,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { DistrictId, GameState, UnitType } from '../types/game';
import { DISTRICTS, FACTIONS, HEROES } from '../data';
import {
  getDistrictStats,
  MARCH_LAND_DURATION,
  MARCH_SEA_DURATION,
} from '../engine/gameEngine';
import { HeroAvatar, RarityBadge, UnitTypeIcon } from './GameIcons';

export interface MarchModalProps {
  open: boolean;
  state: GameState;
  fromId: DistrictId | null;
  toId: DistrictId | null;
  onConfirm: (
    fromId: DistrictId,
    toId: DistrictId,
    troops: number,
    heroIds: string[]
  ) => { error?: string };
  onClose: () => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

const UNIT_LABELS: Record<UnitType, string> = {
  infantry: '步兵',
  cavalry: '騎兵',
  archer: '弓兵',
  naval: '水師',
};

export const MarchModal: React.FC<MarchModalProps> = ({
  open,
  state,
  fromId,
  toId,
  onConfirm,
  onClose,
  onNotify,
}) => {
  const fromDist = fromId ? state.districts[fromId] : null;
  const toDist = toId ? state.districts[toId] : null;
  const fromCfg = fromId ? DISTRICTS[fromId] : null;
  const toCfg = toId ? DISTRICTS[toId] : null;

  const availableTroops = fromDist ? Math.floor(fromDist.troops) : 0;
  const maxSendable =
    availableTroops > 10 ? availableTroops - 10 : availableTroops;

  const [troops, setTroops] = useState<number>(Math.max(10, Math.floor(maxSendable * 0.6)));
  const [selectedHeroIds, setSelectedHeroIds] = useState<string[]>([]);

  useEffect(() => {
    if (open && fromId && toId) {
      const dist = state.districts[fromId];
      const avail = dist ? Math.floor(dist.troops) : 0;
      const maxS = avail > 10 ? avail - 10 : avail;
      setTroops(Math.max(10, Math.min(maxS, Math.floor(maxS * 0.65))));
      setSelectedHeroIds([]);
    }
  }, [open, fromId, toId]);

  const availableHeroes = useMemo(() => {
    return Object.values(state.officers)
      .filter(
        (o) =>
          o.faction === 'player' &&
          o.prisonerOf === null &&
          o.inMarchId === null
      )
      .sort((a, b) => {
        const cfgA = HEROES[a.heroId];
        const cfgB = HEROES[b.heroId];
        return (
          (cfgB ? cfgB.might + cfgB.command : 0) -
          (cfgA ? cfgA.might + cfgA.command : 0)
        );
      });
  }, [state.officers]);

  if (!open || !fromId || !toId || !fromDist || !toDist || !fromCfg || !toCfg) {
    return null;
  }

  const isReinforce = toDist.faction === 'player';
  const isSeaRoute = Boolean(
    fromCfg.seaRoutes?.includes(toId) || toCfg.seaRoutes?.includes(fromId)
  );
  const marchSec = isSeaRoute ? MARCH_SEA_DURATION : MARCH_LAND_DURATION;

  const clampedTroops = Math.min(maxSendable, Math.max(10, Math.floor(troops)));
  const foodCost = Math.ceil(clampedTroops * 0.4);
  const canAffordFood = state.resources.food >= foodCost;
  const hasEnoughTroops = maxSendable >= 10;

  // Rough combat power preview for attacks
  const targetStats = getDistrictStats(state, toId);
  const heroAtkBonus = selectedHeroIds.reduce((sum, hid) => {
    const officer = state.officers[hid];
    const cfg = HEROES[hid];
    if (!officer || !cfg) return sum;
    const levelScale = 1 + (officer.level - 1) * 0.08;
    return sum + ((cfg.might + cfg.command * 0.5) * levelScale) / 220;
  }, 0);
  const myPower = Math.round(clampedTroops * (1 + heroAtkBonus));
  const enemyPower = Math.round(
    toDist.troops * (1 + targetStats.defenseBonus / 100)
  );
  const winRatio = enemyPower > 0 ? myPower / enemyPower : 2;

  const toggleHero = (heroId: string) => {
    setSelectedHeroIds((prev) => {
      if (prev.includes(heroId)) {
        return prev.filter((id) => id !== heroId);
      }
      if (prev.length >= 3) {
        onNotify('每次出征最多可任命 3 位主將', 'info');
        return prev;
      }
      return [...prev, heroId];
    });
  };

  const handleDispatch = () => {
    const res = onConfirm(fromId, toId, clampedTroops, selectedHeroIds);
    if (res.error) {
      onNotify(res.error, 'error');
      return;
    }
    onNotify(
      isReinforce
        ? `已派遣 ${clampedTroops} 援軍自 ${fromCfg.shortName} 前往 ${toCfg.shortName}！`
        : `大軍開拔！${clampedTroops} 精兵自 ${fromCfg.shortName} 進攻 ${toCfg.shortName}！`,
      'success'
    );
    onClose();
  };

  const targetFaction = FACTIONS[toDist.faction];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="parchment-panel flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-5 py-3.5 ${
            isReinforce
              ? 'border-jade-400/35 bg-gradient-to-r from-jade-900/75 to-indigoInk-950'
              : 'border-vermilion-400/40 bg-gradient-to-r from-vermilion-800/65 to-indigoInk-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                isReinforce
                  ? 'border-jade-400 bg-jade-600/70'
                  : 'border-vermilion-400 bg-vermilion-600/80'
              }`}
            >
              {isReinforce ? (
                <Shield className="h-5 w-5 text-white" />
              ) : (
                <Swords className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-50">
                {isReinforce ? '軍事調度・派兵增援' : '點兵出征・攻城討伐'}
              </h2>
              <p className="text-xs text-parchment-200/85">
                {fromCfg.name} ➔ {toCfg.name}（{targetFaction.name}）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-parchment-200 hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Route Info & Power Comparison */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-parchment-300/80">
                {isSeaRoute ? (
                  <Anchor className="h-3.5 w-3.5 text-sky-300" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-parchment-300" />
                )}
                行軍耗時
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-parchment-50">
                {marchSec}秒 {isSeaRoute ? '⛵海路' : '陸路'}
              </div>
            </div>

            <div className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-parchment-300/80">
                <Wheat className="h-3.5 w-3.5 text-amber-300" />
                行軍糧草
              </div>
              <div
                className={`mt-1 font-mono text-sm font-bold ${
                  canAffordFood ? 'text-amber-200' : 'text-vermilion-400'
                }`}
              >
                {foodCost} 糧
              </div>
            </div>

            <div className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/75 p-2.5 text-center">
              <div className="text-[11px] text-parchment-300/80">
                {isReinforce ? '目標現有兵力' : '敵城守備'}
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-parchment-50">
                {Math.floor(toDist.troops)} 人
                {!isReinforce && (
                  <span className="text-[10px] text-parchment-300 ml-1">
                    (防+{targetStats.defenseBonus}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attack Combat Power Meter */}
          {!isReinforce && (
            <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/80 p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-jade-400">
                  我軍預估戰力：{myPower.toLocaleString()}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    winRatio >= 1.25
                      ? 'bg-jade-500/25 text-jade-100'
                      : winRatio >= 0.92
                      ? 'bg-amber-400/20 text-[#fde68a]'
                      : 'bg-vermilion-500/25 text-red-200'
                  }`}
                >
                  {winRatio >= 1.25
                    ? '勝券在握'
                    : winRatio >= 0.92
                    ? '勢均力敵'
                    : '敵強我弱（慎戰）'}
                </span>
                <span className="font-bold text-vermilion-400">
                  敵方估計戰力：{enemyPower.toLocaleString()}
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-indigoInk-900">
                <div
                  className="bg-gradient-to-r from-jade-600 to-jade-400 transition-all duration-200"
                  style={{
                    width: `${Math.min(
                      92,
                      Math.max(8, (myPower / Math.max(1, myPower + enemyPower)) * 100)
                    )}%`,
                  }}
                />
                <div className="flex-1 bg-gradient-to-r from-vermilion-600 to-vermilion-400" />
              </div>
            </div>
          )}

          {/* Troop Slider & Quick Presets */}
          <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-parchment-200">
                派遣兵力（最多可派 {maxSendable} 人，保留至少 10 名守軍）
              </span>
              <span className="font-mono text-lg font-black text-[#fde68a]">
                {hasEnoughTroops ? clampedTroops.toLocaleString() : 0} 人
              </span>
            </div>

            {hasEnoughTroops ? (
              <>
                <input
                  type="range"
                  min={10}
                  max={maxSendable}
                  value={clampedTroops}
                  onChange={(e) => setTroops(Number(e.target.value))}
                  className="w-full accent-[#f5c969] cursor-pointer"
                />
                <div className="mt-2.5 grid grid-cols-4 gap-2">
                  {[
                    { label: '25%', ratio: 0.25 },
                    { label: '50%', ratio: 0.5 },
                    { label: '75%', ratio: 0.75 },
                    { label: '最大兵力', ratio: 1 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setTroops(Math.max(10, Math.floor(maxSendable * preset.ratio)))
                      }
                      className="rounded-lg border border-parchment-400/30 bg-indigoInk-800/85 py-1 text-xs font-bold text-parchment-200 hover:border-[#f5c969] hover:text-white transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-vermilion-800/35 border border-vermilion-400/45 p-2.5 text-xs text-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                此郡縣可派遣兵力不足 10 人，請先徵兵再行出征。
              </div>
            )}
          </div>

          {/* Hero Selection (up to 3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-parchment-200">
                任命隨軍主將（已選 {selectedHeroIds.length} / 3）
              </h3>
              <span className="text-[11px] text-parchment-300/70">
                水師武將海路作戰更有優勢
              </span>
            </div>

            {availableHeroes.length === 0 ? (
              <div className="rounded-xl border border-parchment-400/20 bg-indigoInk-950/60 p-4 text-center text-xs text-parchment-300/75">
                目前沒有待命中的武將（武將皆正在行軍中，仍可派遣無將領部隊出征）。
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {availableHeroes.map((officer) => {
                  const cfg = HEROES[officer.heroId];
                  if (!cfg) return null;
                  const isPicked = selectedHeroIds.includes(officer.heroId);

                  return (
                    <button
                      key={officer.heroId}
                      type="button"
                      onClick={() => toggleHero(officer.heroId)}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                        isPicked
                          ? 'border-[#f5c969] bg-parchment-900/40 ring-1 ring-[#f5c969]/70'
                          : 'border-parchment-400/20 bg-indigoInk-950/75 hover:border-parchment-400/50'
                      }`}
                    >
                      <div className="relative">
                        <HeroAvatar hero={cfg} className="w-11 h-11" />
                        {isPicked && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5c969] text-indigoInk-950">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <RarityBadge rarity={cfg.rarity} />
                          <span className="truncate font-serif text-xs font-bold text-parchment-50">
                            {cfg.name}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-parchment-300">
                            <UnitTypeIcon unitType={cfg.unitType} className="w-3 h-3" />
                            {UNIT_LABELS[cfg.unitType]}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-parchment-300">
                          <span className="text-red-300">武 {cfg.might}</span>
                          <span className="text-[#fde68a]">統 {cfg.command}</span>
                          <span className="text-sky-300">智 {cfg.intel}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-[#fde68a]/85">
                          戰技：{cfg.skillName}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-parchment-400/25 bg-indigoInk-950/85 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-parchment-400/30 px-4 py-2 text-xs font-bold text-parchment-200 hover:bg-indigoInk-800 transition"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={!hasEnoughTroops || !canAffordFood}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-extrabold text-white shadow transition ${
              !hasEnoughTroops || !canAffordFood
                ? 'bg-indigoInk-800 text-parchment-300/45 cursor-not-allowed'
                : isReinforce
                ? 'bg-gradient-to-r from-jade-600 to-jade-500 hover:brightness-110 active:scale-95'
                : 'bg-gradient-to-r from-vermilion-600 to-vermilion-500 hover:brightness-110 active:scale-95'
            }`}
          >
            {isReinforce ? (
              <>
                <Shield className="h-4 w-4" />
                派兵增援
              </>
            ) : (
              <>
                <Swords className="h-4 w-4" />
                出兵討伐
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
