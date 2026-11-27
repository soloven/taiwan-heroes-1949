import React, { useMemo, useState } from 'react';
import {
  Swords,
  Shield,
  ChevronUp,
  ChevronDown,
  Users,
  Compass,
  Flag,
} from 'lucide-react';
import type { DistrictId, FactionId, GameState } from '../types/game';
import { DISTRICT_LIST, DISTRICTS, FACTIONS, HEROES } from '../data';

export interface LegionWidgetProps {
  state: GameState;
  onSelectDistrictMilitary: (districtId: DistrictId) => void;
}

export const LegionWidget: React.FC<LegionWidgetProps> = ({
  state,
  onSelectDistrictMilitary,
}) => {
  // Default collapsed so the map stays clean until the player wants to inspect
  const [expanded, setExpanded] = useState(false);
  // Prioritize showing Different Factions Intelligence first
  const [activeTab, setActiveTab] = useState<'factions' | 'legions'>('factions');
  const [expandedFactionId, setExpandedFactionId] = useState<FactionId | null>(null);

  const factionStats = useMemo(() => {
    const map = new Map<
      FactionId,
      {
        id: FactionId;
        districts: Array<{ id: DistrictId; shortName: string; troops: number }>;
        totalTroops: number;
        marchCount: number;
      }
    >();

    (Object.keys(FACTIONS) as FactionId[]).forEach((fid) => {
      map.set(fid, { id: fid, districts: [], totalTroops: 0, marchCount: 0 });
    });

    for (const d of DISTRICT_LIST) {
      const ds = state.districts[d.id];
      if (!ds) continue;
      const entry = map.get(ds.faction);
      if (entry) {
        const t = Math.floor(ds.troops);
        entry.districts.push({ id: d.id, shortName: d.shortName, troops: t });
        entry.totalTroops += t;
      }
    }

    for (const m of state.marches) {
      const entry = map.get(m.faction);
      if (entry) {
        entry.totalTroops += Math.floor(m.troops);
        entry.marchCount += 1;
      }
    }

    return Array.from(map.values())
      .filter((f) => f.districts.length > 0 || f.marchCount > 0)
      .sort((a, b) => {
        if (a.id === 'player') return -1;
        if (b.id === 'player') return 1;
        return b.districts.length - a.districts.length || b.totalTroops - a.totalTroops;
      });
  }, [state.districts, state.marches]);

  const maxTroops = useMemo(
    () => Math.max(1, ...factionStats.map((f) => f.totalTroops)),
    [factionStats]
  );

  const playerGarrisons = useMemo(() => {
    return DISTRICT_LIST.filter((d) => state.districts[d.id]?.faction === 'player')
      .map((d) => {
        const ds = state.districts[d.id];
        const heroNames = ds.garrisonHeroIds
          .map((hid) => HEROES[hid]?.name)
          .filter(Boolean) as string[];
        return {
          id: d.id,
          name: d.shortName,
          troops: Math.floor(ds.troops),
          heroNames,
        };
      })
      .sort((a, b) => b.troops - a.troops);
  }, [state.districts]);

  const activeMarchCount = state.marches.length;

  return (
    <div className="pointer-events-auto absolute bottom-16 md:bottom-3 left-3 z-20 w-[280px] sm:w-[310px] max-w-[calc(100vw-24px)]">
      <div className="parchment-panel rounded-xl shadow-2xl border border-parchment-400/45 overflow-hidden">
        {/* Header Toggle Bar */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-gradient-to-r from-[#24160d]/95 via-[#182230]/95 to-[#121a26]/95 px-3 py-2 text-left hover:brightness-110 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#f5c969]/55 bg-vermilion-700/80">
              <Flag className="h-3.5 w-3.5 text-[#fde68a]" />
              {activeMarchCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-[#182230] animate-ping" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xs font-black text-[#fef3c7]">
                  勢力與軍團情報
                </span>
                <span className="rounded bg-indigoInk-950/90 border border-parchment-400/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#fde68a]">
                  {factionStats.length} 勢力
                </span>
              </div>
              <div className="text-[10px] text-parchment-300/80 truncate">
                行軍 {activeMarchCount} 支 · 我軍 {playerGarrisons.length} 區
              </div>
            </div>
          </div>

          <span className="flex items-center gap-0.5 rounded-md border border-parchment-400/25 bg-indigoInk-950/75 px-1.5 py-1 text-[10px] font-bold text-parchment-200 shrink-0">
            {expanded ? (
              <>
                <span>收起</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>展開</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            )}
          </span>
        </button>

        {/* Expandable Body */}
        {expanded && (
          <div className="bg-indigoInk-950/75">
            {/* Priority Tabs: Factions Intel First, Legions Second */}
            <div className="grid grid-cols-2 border-b border-parchment-400/20 bg-indigoInk-950/90 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('factions')}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-extrabold transition ${
                  activeTab === 'factions'
                    ? 'bg-gradient-to-r from-[#8f6218]/90 to-[#b88428]/90 text-white shadow'
                    : 'text-parchment-300/80 hover:bg-white/5 hover:text-parchment-100'
                }`}
              >
                <Flag className="h-3 w-3" />
                <span>各勢力情報</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('legions')}
                className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-extrabold transition ${
                  activeTab === 'legions'
                    ? 'bg-gradient-to-r from-vermilion-600/90 to-vermilion-500/90 text-white shadow'
                    : 'text-parchment-300/80 hover:bg-white/5 hover:text-parchment-100'
                }`}
              >
                <Swords className="h-3 w-3" />
                <span>軍團 ({activeMarchCount})</span>
              </button>
            </div>

            <div className="max-h-[42vh] overflow-y-auto p-2.5 space-y-2">
              {activeTab === 'factions' ? (
                /* Tab 1: Different Factions Intelligence (Priority) */
                factionStats.map((fs) => {
                  const cfg = FACTIONS[fs.id];
                  const pct = Math.max(6, Math.round((fs.totalTroops / maxTroops) * 100));
                  const isOpen = expandedFactionId === fs.id;
                  return (
                    <div
                      key={fs.id}
                      className="rounded-lg border border-parchment-400/20 bg-indigoInk-950/85 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFactionId((cur) => (cur === fs.id ? null : fs.id))
                        }
                        className="w-full px-2.5 py-2 text-left hover:bg-white/5 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/25"
                              style={{ backgroundColor: cfg.color }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-parchment-50 truncate">
                                  {cfg.name}
                                </span>
                                {fs.id === 'player' && (
                                  <span className="rounded bg-jade-600/40 border border-jade-400/50 px-1 text-[9px] font-bold text-jade-200">
                                    我軍
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-parchment-300/75 truncate">
                                領袖：{cfg.leaderName} · {fs.districts.length} 區
                                {fs.marchCount > 0 ? ` · 行軍 ${fs.marchCount}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono text-xs font-extrabold text-[#fde68a]">
                              ⚔ {fs.totalTroops.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-parchment-400">
                              {isOpen ? '收起轄區 ▲' : '看轄區 ▼'}
                            </div>
                          </div>
                        </div>
                        {/* Power Bar */}
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cfg.lightColor,
                            }}
                          />
                        </div>
                      </button>

                      {/* Expandable list of this faction's districts */}
                      {isOpen && (
                        <div className="border-t border-parchment-400/15 bg-black/30 px-2 py-1.5 flex flex-wrap gap-1">
                          {fs.districts
                            .slice()
                            .sort((a, b) => b.troops - a.troops)
                            .map((dist) => (
                              <button
                                key={dist.id}
                                type="button"
                                onClick={() => onSelectDistrictMilitary(dist.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-parchment-400/25 bg-indigoInk-900/90 px-2 py-0.5 text-[10px] font-bold text-parchment-100 hover:border-[#f5c969] hover:text-[#fde68a] transition"
                                title={`點擊檢視 ${dist.shortName}`}
                              >
                                <span>{dist.shortName}</span>
                                <span className="font-mono text-[9px] text-parchment-300">
                                  {dist.troops}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Tab 2: Active Marches + Player Garrison Legions */
                <>
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#fde68a] mb-1 px-0.5">
                      <span className="flex items-center gap-1">
                        <Compass className="h-3 w-3 text-vermilion-400" />
                        行軍中軍團（{activeMarchCount}）
                      </span>
                    </div>
                    {activeMarchCount === 0 ? (
                      <div className="rounded-lg border border-parchment-400/15 bg-indigoInk-950/60 px-2.5 py-1.5 text-[11px] text-parchment-300/65">
                        目前無出征中的部隊
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {state.marches.map((m) => {
                          const remain = Math.max(0, Math.ceil(m.arriveAt - state.gameTime));
                          const isAtk = m.type === 'attack';
                          const f = FACTIONS[m.faction];
                          const leadHero = m.heroIds[0] ? HEROES[m.heroIds[0]]?.name : null;
                          return (
                            <div
                              key={m.id}
                              className="rounded-lg border border-parchment-400/20 bg-indigoInk-950/90 px-2 py-1.5 text-[11px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isAtk ? (
                                    <Swords className="h-3 w-3 text-vermilion-400 shrink-0" />
                                  ) : (
                                    <Shield className="h-3 w-3 text-jade-400 shrink-0" />
                                  )}
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: f.color }}
                                  />
                                  <span className="truncate font-bold text-parchment-100">
                                    {DISTRICTS[m.fromId]?.shortName} ➔ {DISTRICTS[m.toId]?.shortName}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-amber-200 shrink-0">
                                  {Math.floor(m.troops)}兵 · {remain}s
                                </span>
                              </div>
                              {leadHero && (
                                <div className="mt-0.5 text-[10px] text-parchment-300/80 pl-5 truncate">
                                  主將：{leadHero}
                                  {m.heroIds.length > 1 ? ` 等 ${m.heroIds.length} 將` : ''}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-jade-300 mb-1 px-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-jade-400" />
                        我軍駐防軍團（{playerGarrisons.length} 區）
                      </span>
                      <span className="text-[10px] font-normal text-parchment-300/65">
                        點擊調兵
                      </span>
                    </div>
                    <div className="space-y-1">
                      {playerGarrisons.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => onSelectDistrictMilitary(g.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-jade-500/20 bg-indigoInk-950/85 px-2.5 py-1.5 text-left hover:border-jade-400/60 hover:bg-indigoInk-900 transition"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-jade-400 shrink-0" />
                              <span className="text-xs font-bold text-parchment-100 truncate">
                                {g.name}駐軍
                              </span>
                            </div>
                            {g.heroNames.length > 0 && (
                              <div className="text-[10px] text-parchment-300/75 truncate pl-3.5">
                                駐將：{g.heroNames.join('、')}
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-xs font-extrabold text-[#fde68a] shrink-0">
                            ⚔ {g.troops.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
