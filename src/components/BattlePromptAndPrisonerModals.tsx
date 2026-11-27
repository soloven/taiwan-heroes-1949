import React from 'react';
import {
  Swords,
  Zap,
  Shield,
  MapPin,
  Lock,
  Handshake,
  Feather,
  CheckCircle2,
} from 'lucide-react';
import type {
  CapturedPrisonerPrompt,
  GameState,
  PendingBattle,
  TerrainType,
} from '../types/game';
import { DISTRICTS, FACTIONS, HEROES } from '../data';
import { getRecruitChance } from '../engine/gameEngine';
import { playRecruitSuccess } from '../engine/battleAudio';
import { HeroAvatar, RarityBadge } from './GameIcons';

const TERRAIN_LABELS: Record<TerrainType, string> = {
  plain: '平原戰場',
  mountain: '山地關隘',
  port: '港灣水戰',
  basin: '盆地城郭',
  island: '離島搶灘',
};

/* ============================================================================
 * 1. BattleEntryPromptModal（《三國群英傳》戰前督戰抉擇）
 * ========================================================================== */

export interface BattleEntryPromptModalProps {
  battle: PendingBattle | null;
  onEnterManualBattle: () => void;
  onAutoResolve: () => void;
}

export const BattleEntryPromptModal: React.FC<BattleEntryPromptModalProps> = ({
  battle,
  onEnterManualBattle,
  onAutoResolve,
}) => {
  if (!battle) return null;

  const atkFaction = FACTIONS[battle.march.faction];
  const defFaction = FACTIONS[battle.defenderFaction];
  const fromCfg = DISTRICTS[battle.march.fromId];
  const toCfg = DISTRICTS[battle.march.toId];

  const attackerHeroes = battle.march.heroIds
    .map((id) => HEROES[id])
    .filter(Boolean);
  const defenderHeroes = battle.defenderHeroIds
    .map((id) => HEROES[id])
    .filter(Boolean);

  const isPlayerAttacker = battle.march.faction === 'player';

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
      <div className="parchment-panel jiannian-frame w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-[#f5c969]/85 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
        {/* Dramatic Top Banner */}
        <div className="border-b border-[#f5c969]/35 bg-gradient-to-r from-[#2c120e] via-[#421a12] to-[#1a1524] px-5 py-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f5c969]/60 bg-black/40 px-3 py-0.5 text-[11px] font-bold text-[#fde68a]">
            <MapPin className="h-3.5 w-3.5 text-vermilion-400" />
            <span>
              {fromCfg?.shortName ?? battle.march.fromId} ➔{' '}
              {toCfg?.name ?? battle.march.toId} · {TERRAIN_LABELS[battle.terrain]}
            </span>
          </div>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-black tracking-wider text-[#fef3c7] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            ⚔️ 兩軍交鋒・{isPlayerAttacker ? '攻城會戰' : '守土迎敵'}
          </h2>
          <p className="mt-1 text-xs text-parchment-200/90">
            軍報急傳！大軍已於 {toCfg?.name} 城下列陣，請少帥決定是否親自上陣督戰！
          </p>
        </div>

        {/* VS Arena Preview */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
            {/* Attacker Card */}
            <div className="rounded-xl border border-jade-400/40 bg-indigoInk-950/85 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-black text-white shadow-sm"
                    style={{ backgroundColor: atkFaction.color }}
                  >
                    攻方 · {atkFaction.name}
                  </span>
                  {isPlayerAttacker && (
                    <span className="text-[10px] font-extrabold text-jade-300">
                      ★ 我軍
                    </span>
                  )}
                </div>
                <div className="mt-2 font-mono text-xl font-black text-parchment-50">
                  {Math.floor(battle.march.troops).toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-parchment-300">
                    兵力
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t border-parchment-400/15 pt-2.5">
                <div className="text-[10px] font-bold text-parchment-300/75 mb-1.5">
                  出戰主將（{attackerHeroes.length}）
                </div>
                {attackerHeroes.length === 0 ? (
                  <div className="text-[11px] text-parchment-300/60">無主將（偏師部曲）</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attackerHeroes.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-1.5 rounded-lg border border-parchment-400/25 bg-indigoInk-900/90 pr-2 p-1"
                      >
                        <HeroAvatar hero={h} className="w-8 h-8" />
                        <div className="leading-tight">
                          <div className="font-serif text-xs font-bold text-parchment-50">
                            {h.name}
                          </div>
                          <div className="font-mono text-[9px] text-[#fde68a]">
                            武{h.might} 統{h.command}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center VS Emblem */}
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f5c969] bg-gradient-to-br from-vermilion-600 to-amber-700 font-serif text-lg font-black text-[#fef3c7] shadow-[0_0_24px_rgba(245,201,105,0.5)]">
                VS
              </div>
            </div>

            {/* Defender Card */}
            <div className="rounded-xl border border-vermilion-400/40 bg-indigoInk-950/85 p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-black text-white shadow-sm"
                    style={{ backgroundColor: defFaction.color }}
                  >
                    守方 · {defFaction.name}
                  </span>
                  {!isPlayerAttacker && (
                    <span className="text-[10px] font-extrabold text-jade-300">
                      ★ 我軍
                    </span>
                  )}
                </div>
                <div className="mt-2 font-mono text-xl font-black text-parchment-50">
                  {Math.floor(battle.defenderTroops).toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-parchment-300">
                    守軍
                  </span>
                </div>
              </div>

              <div className="mt-3 border-t border-parchment-400/15 pt-2.5">
                <div className="text-[10px] font-bold text-parchment-300/75 mb-1.5">
                  守城主將（{defenderHeroes.length}）
                </div>
                {defenderHeroes.length === 0 ? (
                  <div className="text-[11px] text-parchment-300/60">無守城主將</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {defenderHeroes.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-1.5 rounded-lg border border-parchment-400/25 bg-indigoInk-900/90 pr-2 p-1"
                      >
                        <HeroAvatar hero={h} className="w-8 h-8" />
                        <div className="leading-tight">
                          <div className="font-serif text-xs font-bold text-parchment-50">
                            {h.name}
                          </div>
                          <div className="font-mono text-[9px] text-[#fde68a]">
                            武{h.might} 統{h.command}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onEnterManualBattle}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#f5c969] bg-gradient-to-r from-vermilion-600 via-[#c94a29] to-[#b87a1b] py-3.5 px-4 text-sm sm:text-base font-black text-[#fff8e1] shadow-[0_0_24px_rgba(245,201,105,0.4)] hover:brightness-110 active:scale-[0.98] transition"
            >
              <Swords className="h-5 w-5" />
              <span>⚔️ 親自督戰（進入橫向戰場）</span>
            </button>
            <button
              type="button"
              onClick={onAutoResolve}
              className="flex items-center justify-center gap-2 rounded-xl border border-parchment-400/45 bg-indigoInk-900/90 py-3.5 px-4 text-sm sm:text-base font-extrabold text-parchment-100 hover:border-[#f5c969]/75 hover:bg-indigoInk-800 active:scale-[0.98] transition"
            >
              <Zap className="h-5 w-5 text-[#f5c969]" />
              <span>⚡ 委任自動結算</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. CapturedPrisonerModal（戰後俘虜處置）
 * ========================================================================== */

export interface CapturedPrisonerModalProps {
  prompt: CapturedPrisonerPrompt | null;
  state: GameState;
  onHandlePrisoner: (
    heroId: string,
    action: 'persuade' | 'release' | 'imprison'
  ) => { message: string; recruited?: boolean };
  onDismiss: () => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export const CapturedPrisonerModal: React.FC<CapturedPrisonerModalProps> = ({
  prompt,
  state,
  onHandlePrisoner,
  onDismiss,
  onNotify,
}) => {
  if (!prompt || prompt.heroIds.length === 0) return null;

  const districtName = DISTRICTS[prompt.districtId]?.name ?? prompt.districtId;

  const handleAction = (
    heroId: string,
    action: 'persuade' | 'release' | 'imprison'
  ) => {
    const res = onHandlePrisoner(heroId, action);
    if (res.recruited) {
      playRecruitSuccess(state.soundMuted);
      onNotify(res.message, 'success');
    } else if (action === 'release') {
      onNotify(res.message, 'success');
    } else {
      onNotify(res.message, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md">
      <div className="parchment-panel jiannian-frame flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-[#f5c969]/80 shadow-[0_24px_75px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="border-b border-[#f5c969]/30 bg-gradient-to-r from-[#231910] via-[#342214] to-[#1a1822] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f5c969]/70 bg-amber-900/60">
              <Shield className="h-5 w-5 text-[#fde68a]" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-black text-[#fef3c7]">
                ⛓️ 戰場生擒敵將・處置裁決
              </h2>
              <p className="text-xs text-parchment-200/85">
                我軍於 <strong>{districtName}</strong> 之戰生擒 {prompt.heroIds.length} 名敵將，請少帥定奪！
              </p>
            </div>
          </div>
        </div>

        {/* Captured Officer Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {prompt.heroIds.map((hid) => {
            const cfg = HEROES[hid];
            const officer = state.officers[hid];
            if (!cfg || !officer) return null;
            const chancePct = Math.round(getRecruitChance(state, hid) * 100);

            return (
              <div
                key={hid}
                className="rounded-xl border border-parchment-400/30 bg-indigoInk-950/85 p-3.5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <HeroAvatar hero={cfg} className="w-14 h-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <RarityBadge rarity={cfg.rarity} />
                      <span className="font-serif text-base font-black text-parchment-50">
                        {cfg.name}
                      </span>
                      <span className="text-xs text-parchment-300/85">
                        · {cfg.title}
                      </span>
                      <span className="ml-auto font-mono text-xs font-bold text-[#fde68a]">
                        忠誠 {officer.loyalty}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px]">
                      <span className="rounded bg-indigoInk-900 px-1.5 py-0.5 text-red-300 border border-parchment-400/15">
                        武 {cfg.might}
                      </span>
                      <span className="rounded bg-indigoInk-900 px-1.5 py-0.5 text-[#fde68a] border border-parchment-400/15">
                        統 {cfg.command}
                      </span>
                      <span className="rounded bg-indigoInk-900 px-1.5 py-0.5 text-sky-300 border border-parchment-400/15">
                        智 {cfg.intel}
                      </span>
                      <span className="rounded bg-indigoInk-900 px-1.5 py-0.5 text-jade-300 border border-parchment-400/15">
                        政 {cfg.politics}
                      </span>
                      <span className="rounded bg-indigoInk-900 px-1.5 py-0.5 text-pink-300 border border-parchment-400/15">
                        魅 {cfg.charm}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-parchment-400/15 pt-2.5">
                  <button
                    type="button"
                    onClick={() => handleAction(hid, 'persuade')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-[#d99b26] to-[#b87a1b] py-2 px-2.5 text-xs font-extrabold text-white shadow hover:brightness-110 active:scale-95 transition"
                  >
                    <Handshake className="h-3.5 w-3.5" />
                    <span>🤝 當場勸降 ({chancePct}%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(hid, 'release')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-jade-400/50 bg-jade-900/55 py-2 px-2.5 text-xs font-bold text-jade-100 hover:bg-jade-700/70 active:scale-95 transition"
                  >
                    <Feather className="h-3.5 w-3.5" />
                    <span>🕊️ 釋放示好 (+25聲望)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(hid, 'imprison')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-vermilion-400/45 bg-vermilion-900/45 py-2 px-2.5 text-xs font-bold text-red-100 hover:bg-vermilion-800/70 active:scale-95 transition"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>⛓️ 收押大牢</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-parchment-400/25 bg-indigoInk-950/85 px-5 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 rounded-xl border border-parchment-400/40 bg-indigoInk-800 px-5 py-2 text-xs font-extrabold text-parchment-100 hover:border-[#f5c969]/75 hover:bg-indigoInk-700 active:scale-95 transition"
          >
            <CheckCircle2 className="h-4 w-4 text-[#f5c969]" />
            <span>全部收押並繼續</span>
          </button>
        </div>
      </div>
    </div>
  );
};
