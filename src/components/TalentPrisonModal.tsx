import React, { useMemo, useState } from 'react';
import {
  X,
  Search,
  Handshake,
  Lock,
  Gem,
  MapPin,
  Coins,
  Crown,
  Sparkles,
  UserCheck,
  Heart,
  Shield,
  Feather,
} from 'lucide-react';
import type { DistrictId, GameState, OfficerState } from '../types/game';
import { DISTRICT_LIST, DISTRICTS, FACTIONS, HEROES } from '../data';
import {
  EXPLORE_COST_GOLD,
  RECRUIT_COST_GOLD,
  REWARD_COST_GOLD,
  getRecruitChance,
} from '../engine/gameEngine';
import { playRecruitSuccess } from '../engine/battleAudio';
import { HeroAvatar, RarityBadge } from './GameIcons';

export interface TalentPrisonModalProps {
  open: boolean;
  state: GameState;
  onExplore: (
    districtId: DistrictId,
    explorerHeroId?: string
  ) => {
    message: string;
    foundHeroId?: string;
    bonusGold?: number;
    bonusFood?: number;
  };
  onRecruit: (
    targetHeroId: string,
    recruiterHeroId?: string
  ) => { success: boolean; chance: number; message: string };
  onReward: (heroId: string) => { error?: string };
  onReleasePrisoner: (heroId: string) => { message: string; recruited?: boolean };
  onClose: () => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

type ModalTab = 'free' | 'prison' | 'reward';

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-indigoInk-900/90 border border-parchment-400/15 px-1.5 py-0.5 font-mono text-[10px]">
      <span className="text-parchment-300/75">{label}</span>
      <span className={`font-bold ${accent ?? 'text-parchment-100'}`}>{value}</span>
    </span>
  );
}

function LoyaltyBar({ loyalty }: { loyalty: number }) {
  const colorClass =
    loyalty >= 85
      ? 'bg-jade-400'
      : loyalty >= 65
      ? 'bg-[#f5c969]'
      : 'bg-vermilion-400';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-indigoInk-900 border border-parchment-400/20">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, loyalty))}%` }}
        />
      </div>
      <span className="font-mono text-[11px] font-bold text-parchment-100 w-10 text-right">
        忠 {loyalty}
      </span>
    </div>
  );
}

export const TalentPrisonModal: React.FC<TalentPrisonModalProps> = ({
  open,
  state,
  onExplore,
  onRecruit,
  onReward,
  onReleasePrisoner,
  onClose,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('free');
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('');
  const [exploreDistrictId, setExploreDistrictId] = useState<DistrictId | ''>('');

  const playerDistricts = useMemo(
    () => DISTRICT_LIST.filter((d) => state.districts[d.id]?.faction === 'player'),
    [state.districts]
  );

  const playerOfficers = useMemo(() => {
    return Object.values(state.officers)
      .filter((o) => o.faction === 'player' && o.prisonerOf === null)
      .sort((a, b) => {
        const cfgA = HEROES[a.heroId];
        const cfgB = HEROES[b.heroId];
        return (cfgB?.charm ?? 0) - (cfgA?.charm ?? 0);
      });
  }, [state.officers]);

  const playerOfficersByLoyalty = useMemo(() => {
    return [...playerOfficers].sort((a, b) => a.loyalty - b.loyalty);
  }, [playerOfficers]);

  const discoveredFreeOfficers = useMemo(() => {
    return Object.values(state.officers)
      .filter((o) => o.discovered && o.faction === 'free')
      .sort((a, b) => {
        const cfgA = HEROES[a.heroId];
        const cfgB = HEROES[b.heroId];
        const scoreA = cfgA ? cfgA.might + cfgA.command + cfgA.intel + cfgA.politics + cfgA.charm : 0;
        const scoreB = cfgB ? cfgB.might + cfgB.command + cfgB.intel + cfgB.politics + cfgB.charm : 0;
        return scoreB - scoreA;
      });
  }, [state.officers]);

  const undiscoveredCount = useMemo(() => {
    return Object.values(state.officers).filter(
      (o) => o.faction === 'free' && !o.discovered
    ).length;
  }, [state.officers]);

  const prisoners = useMemo(() => {
    return Object.values(state.officers)
      .filter((o) => o.prisonerOf === 'player')
      .sort((a, b) => a.loyalty - b.loyalty);
  }, [state.officers]);

  if (!open) return null;

  const effectiveRecruiterId =
    selectedRecruiterId &&
    playerOfficers.some((o) => o.heroId === selectedRecruiterId)
      ? selectedRecruiterId
      : playerOfficers[0]?.heroId;

  const effectiveExploreCityId: DistrictId | undefined =
    exploreDistrictId &&
    state.districts[exploreDistrictId]?.faction === 'player'
      ? exploreDistrictId
      : state.districts[state.selectedDistrictId]?.faction === 'player'
      ? state.selectedDistrictId
      : playerDistricts[0]?.id;

  const handleExploreClick = () => {
    if (!effectiveExploreCityId) {
      onNotify('目前無我方城池可供探索。', 'error');
      return;
    }
    const res = onExplore(effectiveExploreCityId, effectiveRecruiterId);
    if (res.foundHeroId) {
      playRecruitSuccess(state.soundMuted);
      onNotify(res.message, 'success');
    } else if (res.bonusGold || res.bonusFood) {
      onNotify(res.message, 'success');
    } else {
      onNotify(res.message, 'info');
    }
  };

  const handleRecruitClick = (officer: OfficerState) => {
    const res = onRecruit(officer.heroId, effectiveRecruiterId);
    if (res.success) {
      playRecruitSuccess(state.soundMuted);
      onNotify(res.message, 'success');
    } else {
      onNotify(res.message, 'error');
    }
  };

  const handleReleaseClick = (officer: OfficerState) => {
    const res = onReleasePrisoner(officer.heroId);
    onNotify(res.message, 'success');
  };

  const handleRewardClick = (officer: OfficerState) => {
    const cfg = HEROES[officer.heroId];
    const res = onReward(officer.heroId);
    if (res.error) {
      onNotify(res.error, 'error');
      return;
    }
    onNotify(`💎 已賞賜 ${cfg?.name ?? officer.heroId}，忠誠度 +15！`, 'success');
  };

  const recruiterCfg = effectiveRecruiterId ? HEROES[effectiveRecruiterId] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="parchment-panel jiannian-frame flex h-[88vh] max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#f5c969]/50 shadow-[0_24px_70px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-400/25 bg-gradient-to-r from-[#1a1510] via-[#261b12] to-[#131922] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f5c969]/70 bg-gradient-to-br from-[#b87a1b] to-[#6e420e] shadow-[0_0_16px_rgba(245,201,105,0.35)]">
              <Handshake className="h-5 w-5 text-[#fef3c7]" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-black text-[#fef3c7]">
                🤝 人才登庸與大牢管理
              </h2>
              <p className="text-[11px] text-parchment-300/85">
                三國志式探索在野賢才、禮賢登庸、俘虜勸降與麾下褒賞
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-parchment-400/30 bg-indigoInk-950/85 px-3 py-1 text-xs">
              <Coins className="h-3.5 w-3.5 text-[#f5c969]" />
              <span className="font-mono font-bold text-[#fde68a]">
                {Math.floor(state.resources.gold).toLocaleString()} 銀
              </span>
              <span className="text-parchment-400/40">|</span>
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span className="font-mono font-bold text-parchment-100">
                聲望 {state.reputation}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉人才與大牢視窗"
              className="rounded-lg border border-parchment-400/30 bg-indigoInk-900/80 p-1.5 text-parchment-200 hover:bg-indigoInk-800 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1.5 border-b border-parchment-400/20 bg-indigoInk-950/75 p-2 shrink-0">
          {[
            {
              id: 'free' as const,
              label: '🔍 在野賢才',
              count: discoveredFreeOfficers.length,
              badgeClass: 'bg-jade-500 text-white',
            },
            {
              id: 'prison' as const,
              label: '⛓️ 俘虜大牢',
              count: prisoners.length,
              badgeClass: 'bg-vermilion-500 text-white',
            },
            {
              id: 'reward' as const,
              label: '💎 麾下賞賜',
              count: playerOfficers.length,
              badgeClass: 'bg-amber-500 text-indigoInk-950',
            },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs sm:text-sm font-extrabold transition ${
                  active
                    ? 'bg-gradient-to-r from-[#d99b26] to-[#b87a1b] text-[#fff8e1] shadow-md'
                    : 'bg-indigoInk-900/70 text-parchment-300 hover:bg-indigoInk-800 hover:text-parchment-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 font-mono text-[10px] font-black ${
                    active ? 'bg-black/30 text-white' : tab.badgeClass
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shared Recruiter Bar for Free & Prison Tabs */}
        {(activeTab === 'free' || activeTab === 'prison') && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-400/20 bg-indigoInk-950/55 px-4 py-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#fde68a] flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                執行登庸／勸降使節：
              </span>
              {playerOfficers.length > 0 ? (
                <select
                  value={effectiveRecruiterId ?? ''}
                  onChange={(e) => setSelectedRecruiterId(e.target.value)}
                  className="rounded-lg border border-parchment-400/40 bg-indigoInk-900 px-2.5 py-1 text-xs font-bold text-parchment-100 focus:border-[#f5c969] focus:outline-none"
                >
                  {playerOfficers.map((o) => {
                    const cfg = HEROES[o.heroId];
                    if (!cfg) return null;
                    return (
                      <option key={o.heroId} value={o.heroId}>
                        {cfg.name}（魅 {cfg.charm} / 智 {cfg.intel} · {cfg.bondGroup}）
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span className="text-parchment-300/70">由少帥親自主持</span>
              )}
            </div>
            <div className="text-[11px] text-parchment-300/80">
              高魅力使節、高聲望、同羈絆／同鄉可大幅提升成功率！
            </div>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* TAB 1: FREE TALENTS & EXPLORE */}
          {activeTab === 'free' && (
            <>
              {/* Quick Explore Banner */}
              <div className="rounded-xl border border-[#f5c969]/45 bg-gradient-to-r from-[#261a0e]/85 via-indigoInk-950/90 to-[#14221d]/85 p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-black text-[#fef3c7]">
                      <Search className="h-4 w-4 text-[#f5c969]" />
                      <span>探索我方城池・訪尋在野名士</span>
                      <span className="rounded-full bg-indigoInk-900 border border-parchment-400/30 px-2 py-0.5 font-mono text-[11px] text-jade-300">
                        全圖尚有 {undiscoveredCount} 位未發掘賢才
                      </span>
                    </div>
                    <p className="text-[11px] text-parchment-300/85">
                      派遣使節走訪民間，有機會發掘隱藏於該城或鄰近地區的在野名士，或尋獲軍餉糧草！
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {playerDistricts.length > 0 && (
                      <select
                        value={effectiveExploreCityId ?? ''}
                        onChange={(e) =>
                          setExploreDistrictId(e.target.value as DistrictId)
                        }
                        className="rounded-lg border border-parchment-400/40 bg-indigoInk-900 px-2.5 py-2 text-xs font-bold text-parchment-100 focus:border-[#f5c969] focus:outline-none"
                      >
                        {playerDistricts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      disabled={
                        !effectiveExploreCityId ||
                        state.resources.gold < EXPLORE_COST_GOLD
                      }
                      onClick={handleExploreClick}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition ${
                        !effectiveExploreCityId ||
                        state.resources.gold < EXPLORE_COST_GOLD
                          ? 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed border border-parchment-400/15'
                          : 'bg-gradient-to-r from-jade-600 to-emerald-500 text-white shadow-[0_0_14px_rgba(73,168,136,0.35)] hover:brightness-110 active:scale-95'
                      }`}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>🔍 探索目前城池 ({EXPLORE_COST_GOLD}銀)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Discovered Free Officers List */}
              {discoveredFreeOfficers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-parchment-400/30 bg-indigoInk-950/60 p-8 text-center space-y-2">
                  <Sparkles className="h-7 w-7 text-[#f5c969]/70 mx-auto" />
                  <div className="font-serif text-base font-bold text-parchment-100">
                    目前尚無已發掘的在野賢才
                  </div>
                  <p className="text-xs text-parchment-300/75 max-w-md mx-auto">
                    全台各地尚有 <strong className="text-[#fde68a]">{undiscoveredCount}</strong>{' '}
                    位隱居名士等待伯樂！請點擊上方「探索目前城池」或於郡縣視窗進行探索。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {discoveredFreeOfficers.map((officer) => {
                    const cfg = HEROES[officer.heroId];
                    if (!cfg) return null;
                    const chance = getRecruitChance(
                      state,
                      officer.heroId,
                      effectiveRecruiterId
                    );
                    const chancePct = Math.round(chance * 100);
                    const locName = officer.districtId
                      ? DISTRICTS[officer.districtId]?.shortName ?? officer.districtId
                      : '雲遊四海';
                    const hasSynergy =
                      recruiterCfg &&
                      (recruiterCfg.bondGroup === cfg.bondGroup ||
                        recruiterCfg.originDistrict === cfg.originDistrict);
                    const canAfford = state.resources.gold >= RECRUIT_COST_GOLD;

                    return (
                      <div
                        key={officer.heroId}
                        className="rounded-xl border border-parchment-400/30 bg-indigoInk-950/80 p-3.5 flex flex-col justify-between gap-3 hover:border-[#f5c969]/65 transition"
                      >
                        <div className="flex items-start gap-3">
                          <HeroAvatar hero={cfg} className="w-14 h-14 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <RarityBadge rarity={cfg.rarity} />
                              <span className="font-serif text-base font-black text-parchment-50 truncate">
                                {cfg.name}
                              </span>
                              <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-indigoInk-900 px-1.5 py-0.5 text-[10px] text-parchment-200 border border-parchment-400/20">
                                <MapPin className="h-3 w-3 text-[#f5c969]" />
                                {locName}
                              </span>
                            </div>
                            <div className="text-[11px] text-parchment-300/80 mt-0.5 truncate">
                              {cfg.title} · 羈絆：{cfg.bondGroup}
                            </div>

                            {/* RTK11 5 Stats */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              <StatPill label="武" value={cfg.might} accent="text-red-300" />
                              <StatPill label="統" value={cfg.command} accent="text-[#fde68a]" />
                              <StatPill label="智" value={cfg.intel} accent="text-sky-300" />
                              <StatPill label="政" value={cfg.politics} accent="text-jade-300" />
                              <StatPill label="魅" value={cfg.charm} accent="text-pink-300" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-parchment-400/15 pt-2.5">
                          <div className="text-xs">
                            <span className="text-parchment-300/80">登庸成功率：</span>
                            <strong
                              className={`font-mono text-sm ${
                                chancePct >= 75
                                  ? 'text-jade-400'
                                  : chancePct >= 50
                                  ? 'text-[#fde68a]'
                                  : 'text-orange-300'
                              }`}
                            >
                              {chancePct}%
                            </strong>
                            {hasSynergy && (
                              <span className="ml-1.5 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-[#fde68a]">
                                羈絆/同鄉 +15%
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleRecruitClick(officer)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                              canAfford
                                ? 'bg-gradient-to-r from-[#d99b26] to-[#b87a1b] text-white shadow hover:brightness-110 active:scale-95'
                                : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed border border-parchment-400/15'
                            }`}
                          >
                            <span>🤝 禮賢登庸 ({RECRUIT_COST_GOLD}銀)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: PRISONERS */}
          {activeTab === 'prison' && (
            <>
              {prisoners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-parchment-400/30 bg-indigoInk-950/60 p-8 text-center space-y-2">
                  <Lock className="h-7 w-7 text-parchment-400/60 mx-auto" />
                  <div className="font-serif text-base font-bold text-parchment-100">
                    目前大牢空空如也
                  </div>
                  <p className="text-xs text-parchment-300/75 max-w-md mx-auto">
                    在攻克敵軍城池或擊潰敵將時，有機會俘虜敵方名將並押入大牢，可於此勸降招攬或釋放博取聲望！
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prisoners.map((officer) => {
                    const cfg = HEROES[officer.heroId];
                    if (!cfg) return null;
                    const chance = getRecruitChance(
                      state,
                      officer.heroId,
                      effectiveRecruiterId
                    );
                    const chancePct = Math.round(chance * 100);
                    const origFaction =
                      officer.faction !== 'free'
                        ? FACTIONS[officer.faction]
                        : null;
                    const canAfford = state.resources.gold >= RECRUIT_COST_GOLD;

                    return (
                      <div
                        key={officer.heroId}
                        className="rounded-xl border border-vermilion-400/40 bg-indigoInk-950/85 p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <HeroAvatar hero={cfg} className="w-14 h-14 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <RarityBadge rarity={cfg.rarity} />
                              <span className="font-serif text-base font-black text-parchment-50 truncate">
                                {cfg.name}
                              </span>
                              {origFaction && (
                                <span
                                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                  style={{ backgroundColor: origFaction.color }}
                                >
                                  原屬：{origFaction.name}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-parchment-300/80 mt-0.5">
                              {cfg.title}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                              <StatPill label="武" value={cfg.might} accent="text-red-300" />
                              <StatPill label="統" value={cfg.command} accent="text-[#fde68a]" />
                              <StatPill label="智" value={cfg.intel} accent="text-sky-300" />
                              <StatPill label="政" value={cfg.politics} accent="text-jade-300" />
                              <StatPill label="魅" value={cfg.charm} accent="text-pink-300" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-parchment-400/15 pt-2.5">
                          <LoyaltyBar loyalty={officer.loyalty} />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-parchment-300/80">
                              勸降成功率：
                              <strong className="font-mono text-sm text-[#fde68a] ml-1">
                                {chancePct}%
                              </strong>
                            </span>
                            <span className="text-[10px] text-parchment-300/65">
                              忠誠越低越容易歸降
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => handleRecruitClick(officer)}
                              className={`rounded-lg py-1.5 px-2 text-xs font-extrabold transition ${
                                canAfford
                                  ? 'bg-gradient-to-r from-[#d99b26] to-[#b87a1b] text-white hover:brightness-110 active:scale-95'
                                  : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed border border-parchment-400/15'
                              }`}
                            >
                              🤝 勸降登庸 ({RECRUIT_COST_GOLD}銀)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReleaseClick(officer)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-jade-400/50 bg-jade-900/55 py-1.5 px-2 text-xs font-bold text-jade-100 hover:bg-jade-700/70 active:scale-95 transition"
                            >
                              <Feather className="h-3.5 w-3.5" />
                              <span>🕊️ 釋放示好 (+25聲望)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 3: REWARD PLAYER OFFICERS */}
          {activeTab === 'reward' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/70 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-parchment-200">
                  <Heart className="h-4 w-4 text-vermilion-400" />
                  <span>
                    賞賜麾下武將可立即提升 <strong className="text-[#fde68a]">+15 忠誠度</strong>，防止敵軍策反並凝聚軍心。
                  </span>
                </div>
                <span className="font-mono text-parchment-300">
                  麾下共 <strong className="text-parchment-50">{playerOfficers.length}</strong> 位武將
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playerOfficersByLoyalty.map((officer) => {
                  const cfg = HEROES[officer.heroId];
                  if (!cfg) return null;
                  const isMaxLoyalty = officer.loyalty >= 100;
                  const canAfford = state.resources.gold >= REWARD_COST_GOLD;
                  const locText = officer.inMarchId
                    ? '行軍出征中'
                    : officer.districtId
                    ? `駐守 ${DISTRICTS[officer.districtId]?.shortName ?? officer.districtId}`
                    : '待命中';

                  return (
                    <div
                      key={officer.heroId}
                      className="rounded-xl border border-parchment-400/25 bg-indigoInk-950/80 p-3.5 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <HeroAvatar hero={cfg} className="w-13 h-13 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <RarityBadge rarity={cfg.rarity} />
                            <span className="font-serif text-base font-black text-parchment-50 truncate">
                              {cfg.name}
                            </span>
                            <span className="ml-auto inline-flex items-center gap-1 rounded bg-indigoInk-900 px-1.5 py-0.5 text-[10px] text-parchment-200 border border-parchment-400/20">
                              <Shield className="h-3 w-3 text-jade-400" />
                              {locText}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <StatPill label="武" value={cfg.might} accent="text-red-300" />
                            <StatPill label="統" value={cfg.command} accent="text-[#fde68a]" />
                            <StatPill label="智" value={cfg.intel} accent="text-sky-300" />
                            <StatPill label="政" value={cfg.politics} accent="text-jade-300" />
                            <StatPill label="魅" value={cfg.charm} accent="text-pink-300" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-parchment-400/15 pt-2.5">
                        <LoyaltyBar loyalty={officer.loyalty} />
                        <button
                          type="button"
                          disabled={isMaxLoyalty || !canAfford}
                          onClick={() => handleRewardClick(officer)}
                          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-extrabold transition ${
                            isMaxLoyalty
                              ? 'bg-indigoInk-900/70 text-jade-300/75 cursor-default border border-jade-400/20'
                              : canAfford
                              ? 'bg-gradient-to-r from-[#d99b26] to-[#b87a1b] text-white shadow hover:brightness-110 active:scale-95'
                              : 'bg-indigoInk-900 text-parchment-300/40 cursor-not-allowed border border-parchment-400/15'
                          }`}
                        >
                          <Gem className="h-3.5 w-3.5" />
                          <span>
                            {isMaxLoyalty
                              ? '忠誠已滿 (100)'
                              : `💎 賞賜 (+15忠誠 · ${REWARD_COST_GOLD}銀)`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
