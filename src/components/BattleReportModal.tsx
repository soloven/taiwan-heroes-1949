import React from 'react';
import { X, Swords, Trophy, ShieldAlert, Coins, Wheat, Flag } from 'lucide-react';
import type { BattleReport } from '../types/game';
import { DISTRICTS, FACTIONS, HEROES } from '../data';
import { HeroAvatar } from './GameIcons';

export interface BattleReportModalProps {
  open: boolean;
  reports: BattleReport[];
  onClose: () => void;
}

function formatGameSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}分${String(rem).padStart(2, '0')}秒`;
}

export const BattleReportModal: React.FC<BattleReportModalProps> = ({
  open,
  reports,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="parchment-panel flex max-h-[86vh] w-full max-w-3xl flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment-400/30 bg-indigoInk-950/60 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-vermilion-400/60 bg-vermilion-800/50">
              <Swords className="h-5 w-5 text-parchment-100" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-100">
                軍情戰報紀錄
              </h2>
              <p className="text-xs text-parchment-300/75">
                共記載 {reports.length} 場戰役（最新戰報置頂）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-parchment-300 hover:bg-parchment-400/15 hover:text-parchment-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Report List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Swords className="h-12 w-12 text-parchment-400/35 mb-3" />
              <p className="font-serif text-base font-bold text-parchment-200">
                尚無戰報紀錄
              </p>
              <p className="text-xs text-parchment-300/70 mt-1">
                點擊地圖上的我方縣市，向相鄰敵軍發動攻勢後即可在此查閱詳盡戰報。
              </p>
            </div>
          ) : (
            reports.map((report) => {
              const fromDist = DISTRICTS[report.fromId];
              const toDist = DISTRICTS[report.toId];
              const atkFaction = FACTIONS[report.attackerFaction];
              const defFaction = FACTIONS[report.defenderFaction];

              const playerIsAttacker = report.attackerFaction === 'player';
              const playerIsDefender = report.defenderFaction === 'player';
              const playerWon =
                (playerIsAttacker && report.winner === 'attacker') ||
                (playerIsDefender && report.winner === 'defender');

              const atkLoss = Math.max(
                0,
                report.attackerTroopsStart - report.attackerTroopsEnd
              );
              const defLoss = Math.max(
                0,
                report.defenderTroopsStart - report.defenderTroopsEnd
              );

              return (
                <div
                  key={report.id}
                  className={`rounded-xl border p-4 transition ${
                    report.conquered && playerIsAttacker
                      ? 'border-[#f5c969]/65 bg-gradient-to-br from-[#2d2314]/90 to-[#141c26]/95'
                      : playerWon
                      ? 'border-jade-400/45 bg-indigoInk-900/80'
                      : 'border-vermilion-400/45 bg-[#1f1417]/85'
                  }`}
                >
                  {/* Top Row: Badges & Route */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-400/15 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {report.conquered && playerIsAttacker ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-[#f5c969] px-2.5 py-0.5 text-xs font-extrabold text-[#fde68a]">
                          <Flag className="h-3.5 w-3.5" />
                          攻城略地！
                        </span>
                      ) : playerWon ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-jade-500/25 border border-jade-400/70 px-2.5 py-0.5 text-xs font-bold text-jade-100">
                          <Trophy className="h-3.5 w-3.5" />
                          我軍大勝
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-vermilion-500/25 border border-vermilion-400/70 px-2.5 py-0.5 text-xs font-bold text-red-200">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {report.conquered ? '失守敗退' : '戰況不利'}
                        </span>
                      )}

                      <span className="font-serif text-sm font-bold text-parchment-100">
                        {fromDist?.name ?? report.fromId} ➔ {toDist?.name ?? report.toId}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-parchment-300/65">
                      開戰第 {formatGameSeconds(report.timestamp)}
                    </span>
                  </div>

                  {/* Casualties & Heroes Comparison */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Attacker */}
                    <div className="rounded-lg border border-parchment-400/15 bg-indigoInk-950/70 p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: atkFaction.color }}
                          />
                          <span className="text-parchment-100">
                            攻方・{atkFaction.name}
                          </span>
                        </span>
                        <span className="font-mono text-parchment-200">
                          {report.attackerTroopsStart} ➔{' '}
                          <strong className="text-parchment-50">
                            {report.attackerTroopsEnd}
                          </strong>{' '}
                          <span className="text-vermilion-400">(-{atkLoss})</span>
                        </span>
                      </div>
                      {report.attackerHeroIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {report.attackerHeroIds.map((hid) => {
                            const h = HEROES[hid];
                            if (!h) return null;
                            return (
                              <div
                                key={hid}
                                className="flex items-center gap-1 rounded bg-indigoInk-900/90 border border-parchment-400/20 pr-1.5"
                              >
                                <HeroAvatar hero={h} className="w-6 h-6 rounded-md" />
                                <span className="text-[11px] text-parchment-200">
                                  {h.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Defender */}
                    <div className="rounded-lg border border-parchment-400/15 bg-indigoInk-950/70 p-2.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold flex items-center gap-1.5">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: defFaction.color }}
                          />
                          <span className="text-parchment-100">
                            守方・{defFaction.name}
                          </span>
                        </span>
                        <span className="font-mono text-parchment-200">
                          {report.defenderTroopsStart} ➔{' '}
                          <strong className="text-parchment-50">
                            {report.defenderTroopsEnd}
                          </strong>{' '}
                          <span className="text-vermilion-400">(-{defLoss})</span>
                        </span>
                      </div>
                      {report.defenderHeroIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {report.defenderHeroIds.map((hid) => {
                            const h = HEROES[hid];
                            if (!h) return null;
                            return (
                              <div
                                key={hid}
                                className="flex items-center gap-1 rounded bg-indigoInk-900/90 border border-parchment-400/20 pr-1.5"
                              >
                                <HeroAvatar hero={h} className="w-6 h-6 rounded-md" />
                                <span className="text-[11px] text-parchment-200">
                                  {h.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loot */}
                  {(report.lootGold > 0 || report.lootFood > 0) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-parchment-200">
                      <span className="text-parchment-400 font-semibold">戰利品：</span>
                      {report.lootGold > 0 && (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-[#fde68a]">
                          <Coins className="h-3.5 w-3.5" />+{report.lootGold} 銀兩
                        </span>
                      )}
                      {report.lootFood > 0 && (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-200">
                          <Wheat className="h-3.5 w-3.5" />+{report.lootFood} 糧草
                        </span>
                      )}
                    </div>
                  )}

                  {/* Highlights */}
                  {report.highlights.length > 0 && (
                    <ul className="mt-2.5 space-y-1 border-t border-parchment-400/15 pt-2 text-xs text-parchment-200/90">
                      {report.highlights.map((line, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-parchment-400 mt-0.5">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
