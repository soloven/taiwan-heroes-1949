import React, { useMemo, useState } from 'react';
import {
  X,
  MapPin,
  Sword,
  Crown,
  Brain,
  Landmark,
  Heart,
  Lock,
  Sparkles,
  Users,
  Sprout,
} from 'lucide-react';
import type {
  DistrictId,
  GameState,
  HeroConfig,
  OfficerState,
  Rarity,
  UnitType,
} from '../types/game';
import { DISTRICTS, FACTIONS, HERO_LIST } from '../data';
import { HeroAvatar, RarityBadge, UnitTypeIcon } from './GameIcons';

export interface HeroRosterModalProps {
  open: boolean;
  state: GameState;
  onAssignHero: (heroId: string, districtId: DistrictId | null) => void;
  onClose: () => void;
}

const UNIT_LABELS: Record<UnitType, string> = {
  infantry: '步兵',
  cavalry: '騎兵',
  archer: '弓兵',
  naval: '水師',
};

const RARITY_ORDER: Record<Rarity, number> = {
  SSR: 0,
  SR: 1,
  R: 2,
};

type OfficerStatusKind =
  | 'player'
  | 'prisoner'
  | 'free_discovered'
  | 'enemy'
  | 'undiscovered';

function getOfficerStatus(officer?: OfficerState): {
  kind: OfficerStatusKind;
  label: string;
  badgeClass: string;
  sortRank: number;
} {
  if (!officer) {
    return {
      kind: 'undiscovered',
      label: '尚未發掘',
      badgeClass: 'bg-slate-800/90 text-parchment-300/60 border border-parchment-400/20',
      sortRank: 4,
    };
  }
  if (officer.faction === 'player' && officer.prisonerOf === null) {
    return {
      kind: 'player',
      label: '我軍麾下',
      badgeClass: 'bg-jade-600/85 text-white border border-jade-300/60',
      sortRank: 0,
    };
  }
  if (officer.prisonerOf === 'player') {
    return {
      kind: 'prisoner',
      label: '大牢俘虜',
      badgeClass: 'bg-vermilion-600/85 text-red-50 border border-vermilion-300/60',
      sortRank: 1,
    };
  }
  if (officer.faction === 'free' && officer.discovered) {
    return {
      kind: 'free_discovered',
      label: '在野賢才',
      badgeClass: 'bg-amber-600/85 text-[#fff8e1] border border-[#f5c969]/70',
      sortRank: 2,
    };
  }
  if (officer.faction === 'free' && !officer.discovered) {
    return {
      kind: 'undiscovered',
      label: '尚未發掘',
      badgeClass: 'bg-slate-800/90 text-parchment-300/65 border border-parchment-400/20',
      sortRank: 4,
    };
  }
  return {
    kind: 'enemy',
    label: '敵陣駐將',
    badgeClass: 'bg-indigo-900/90 text-sky-200 border border-sky-400/40',
    sortRank: 3,
  };
}

export const HeroRosterModal: React.FC<HeroRosterModalProps> = ({
  open,
  state,
  onAssignHero,
  onClose,
}) => {
  const [filterRarity, setFilterRarity] = useState<'ALL' | Rarity>('ALL');
  const [selectedHeroId, setSelectedHeroId] = useState<string>(HERO_LIST[0].id);

  const sortedHeroes = useMemo(() => {
    return [...HERO_LIST]
      .filter((h) => filterRarity === 'ALL' || h.rarity === filterRarity)
      .sort((a, b) => {
        const rankA = getOfficerStatus(state.officers[a.id]).sortRank;
        const rankB = getOfficerStatus(state.officers[b.id]).sortRank;
        if (rankA !== rankB) return rankA - rankB;
        if (RARITY_ORDER[a.rarity] !== RARITY_ORDER[b.rarity]) {
          return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        }
        const sumA = a.might + a.command + a.intel + a.politics + a.charm;
        const sumB = b.might + b.command + b.intel + b.politics + b.charm;
        return sumB - sumA;
      });
  }, [filterRarity, state.officers]);

  if (!open) return null;

  const selectedHero: HeroConfig =
    HERO_LIST.find((h) => h.id === selectedHeroId) ?? HERO_LIST[0];
  const selectedOfficer = state.officers[selectedHero.id];
  const selectedStatus = getOfficerStatus(selectedOfficer);
  const isPlayerOfficer = selectedStatus.kind === 'player';

  const currentDistrict = state.districts[state.selectedDistrictId];
  const currentDistrictCfg = DISTRICTS[state.selectedDistrictId];
  const canAssignToSelectedDistrict = currentDistrict?.faction === 'player';

  const ownedCount = Object.values(state.officers).filter(
    (o) => o.faction === 'player' && o.prisonerOf === null
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="parchment-panel flex h-[88vh] w-full max-w-5xl flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-400/30 bg-indigoInk-950/65 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-parchment-400/60 bg-parchment-900/70">
              <Users className="h-5 w-5 text-parchment-200" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-parchment-100">
                台灣群雄名冊・三十九名將圖鑑
              </h2>
              <p className="text-xs text-parchment-300/80">
                我軍麾下{' '}
                <strong className="text-[#fde68a] font-bold">{ownedCount}</strong> /{' '}
                {HERO_LIST.length} 位英傑（同羈絆 2 位以上同駐可觸發 +10% 經濟與戰力加成）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rarity Filter */}
            <div className="flex items-center rounded-lg border border-parchment-400/30 bg-indigoInk-950/90 p-0.5 text-xs">
              {(['ALL', 'SSR', 'SR', 'R'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRarity(r)}
                  className={`rounded-md px-2.5 py-1 font-bold transition ${
                    filterRarity === r
                      ? 'bg-parchment-500 text-indigoInk-950'
                      : 'text-parchment-300/80 hover:text-parchment-100'
                  }`}
                >
                  {r === 'ALL' ? '全部' : r}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-parchment-300 hover:bg-parchment-400/15 hover:text-parchment-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body: Left Grid + Right Inspector */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Hero Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
            {sortedHeroes.map((hero) => {
              const officer = state.officers[hero.id];
              const status = getOfficerStatus(officer);
              const isSelected = hero.id === selectedHero.id;
              const isUndiscovered = status.kind === 'undiscovered';

              const cardGlow =
                status.kind !== 'player'
                  ? 'border border-parchment-400/20 bg-indigoInk-950/70'
                  : hero.rarity === 'SSR'
                  ? 'ssr-card-glow'
                  : hero.rarity === 'SR'
                  ? 'sr-card-glow'
                  : 'r-card-glow';

              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => setSelectedHeroId(hero.id)}
                  className={`relative flex flex-col items-start rounded-xl p-2.5 text-left transition ${cardGlow} ${
                    isUndiscovered ? 'opacity-65 hover:opacity-90' : 'hover:brightness-110'
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#f5c969] ring-offset-1 ring-offset-indigoInk-950'
                      : ''
                  }`}
                >
                  <div className="flex w-full items-center gap-2.5">
                    <div className="relative">
                      <HeroAvatar
                        hero={hero}
                        className={`w-12 h-12 ${isUndiscovered ? 'grayscale brightness-50' : ''}`}
                      />
                      {isUndiscovered && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
                          <Lock className="h-4 w-4 text-parchment-300/80" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <RarityBadge rarity={hero.rarity} />
                        <span className="truncate font-serif text-sm font-bold text-parchment-50">
                          {hero.name}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-parchment-300/80 mt-0.5">
                        {hero.title}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info Bar */}
                  <div className="mt-2 flex w-full items-center justify-between text-[10px] border-t border-parchment-400/15 pt-1.5">
                    <span className="font-mono text-parchment-300/85">
                      武{hero.might} 統{hero.command} 智{hero.intel}
                    </span>
                    {officer && status.kind === 'player' ? (
                      officer.inMarchId ? (
                        <span className="rounded bg-vermilion-500/30 px-1.5 py-0.5 font-bold text-red-200">
                          行軍中
                        </span>
                      ) : officer.districtId ? (
                        <span className="rounded bg-jade-500/25 px-1.5 py-0.5 font-bold text-jade-100">
                          駐 {DISTRICTS[officer.districtId]?.shortName}
                        </span>
                      ) : (
                        <span className="text-parchment-300/55">待命中</span>
                      )
                    ) : officer && status.kind !== 'undiscovered' && officer.districtId ? (
                      <span className="text-parchment-300/75">
                        {DISTRICTS[officer.districtId]?.shortName}
                      </span>
                    ) : (
                      <span className="text-parchment-300/50">行蹤未明</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Panel */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 border-t md:border-t-0 md:border-l border-parchment-400/25 bg-indigoInk-950/75 p-4 overflow-y-auto">
            <div className="flex items-start gap-3">
              <HeroAvatar
                hero={selectedHero}
                className={`w-20 h-20 ${
                  selectedStatus.kind === 'undiscovered' ? 'grayscale brightness-75' : ''
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <RarityBadge rarity={selectedHero.rarity} />
                  <span className="inline-flex items-center gap-1 rounded bg-indigoInk-800 px-1.5 py-0.5 text-[11px] text-parchment-200">
                    <UnitTypeIcon unitType={selectedHero.unitType} className="w-3.5 h-3.5" />
                    {UNIT_LABELS[selectedHero.unitType]}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${selectedStatus.badgeClass}`}
                  >
                    {selectedStatus.label}
                  </span>
                </div>
                <h3 className="mt-1 font-serif text-xl font-black text-parchment-50">
                  {selectedHero.name}
                </h3>
                <p className="text-xs text-parchment-300">{selectedHero.title}</p>

                {selectedOfficer && (
                  <div className="mt-1.5 text-[11px] text-parchment-300/85">
                    {selectedStatus.kind === 'player' ? (
                      <span className="font-mono text-jade-300 font-bold">
                        Lv.{selectedOfficer.level} ·{' '}
                        {selectedOfficer.districtId
                          ? `駐守 ${DISTRICTS[selectedOfficer.districtId]?.name}`
                          : '待命中'}
                      </span>
                    ) : selectedStatus.kind === 'enemy' &&
                      selectedOfficer.faction !== 'free' ? (
                      <span className="text-sky-200">
                        效力：{FACTIONS[selectedOfficer.faction]?.name}
                        {selectedOfficer.districtId
                          ? `（${DISTRICTS[selectedOfficer.districtId]?.shortName}）`
                          : ''}
                      </span>
                    ) : selectedStatus.kind === 'free_discovered' ? (
                      <span className="text-[#fde68a]">
                        在野現身於{' '}
                        {selectedOfficer.districtId
                          ? DISTRICTS[selectedOfficer.districtId]?.name
                          : '各地'}
                        （可於人才與大牢登庸）
                      </span>
                    ) : selectedStatus.kind === 'prisoner' ? (
                      <span className="text-red-300">
                        收押於我軍大牢（可前往勸降或釋放）
                      </span>
                    ) : (
                      <span className="text-parchment-300/60">
                        尚未發掘（請探索 {DISTRICTS[selectedHero.originDistrict]?.shortName} 一帶）
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Loyalty Bar */}
            {selectedOfficer && selectedStatus.kind !== 'undiscovered' && (
              <div className="mt-3 rounded-lg border border-parchment-400/20 bg-indigoInk-900/75 p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-parchment-300 font-bold">忠誠度</span>
                  <span className="font-mono font-bold text-[#fde68a]">
                    {selectedOfficer.loyalty} / 100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigoInk-950">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedOfficer.loyalty >= 85
                        ? 'bg-jade-400'
                        : selectedOfficer.loyalty >= 65
                        ? 'bg-[#f5c969]'
                        : 'bg-vermilion-400'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, selectedOfficer.loyalty))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* RTK11 Five Stats Grid */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {[
                { label: '武力', val: selectedHero.might, icon: Sword, color: 'text-red-300' },
                { label: '統率', val: selectedHero.command, icon: Crown, color: 'text-[#fde68a]' },
                { label: '智力', val: selectedHero.intel, icon: Brain, color: 'text-sky-300' },
                { label: '政治', val: selectedHero.politics, icon: Landmark, color: 'text-jade-300' },
                { label: '魅力', val: selectedHero.charm, icon: Heart, color: 'text-pink-300' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="rounded-lg border border-parchment-400/20 bg-indigoInk-900/80 p-2 text-center"
                  >
                    <Icon className={`h-3.5 w-3.5 mx-auto ${s.color}`} />
                    <div className="mt-0.5 text-[10px] text-parchment-300/80">
                      {s.label}
                    </div>
                    <div className={`font-mono text-sm font-black ${s.color}`}>
                      {s.val}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Origin, Farm Bonus & Bond */}
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-parchment-400/25 bg-indigoInk-900 px-2.5 py-1 text-parchment-200">
                <MapPin className="h-3.5 w-3.5 text-parchment-400" />
                出身：{DISTRICTS[selectedHero.originDistrict]?.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-jade-400/35 bg-jade-900/45 px-2.5 py-1 text-jade-100">
                <Sparkles className="h-3.5 w-3.5 text-jade-400" />
                羈絆：{selectedHero.bondGroup}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-emerald-200 font-mono">
                <Sprout className="h-3.5 w-3.5 text-emerald-400" />
                農政 +{Math.round(selectedHero.farmBonus * 100)}%
              </span>
            </div>

            {/* Skill */}
            <div className="mt-3 rounded-xl border border-parchment-400/30 bg-parchment-900/25 p-3">
              <div className="text-xs font-bold text-[#fde68a]">
                專屬戰技・{selectedHero.skillName}（消耗 {selectedHero.skillCost} 技力）
              </div>
              <p className="mt-1 text-xs leading-relaxed text-parchment-200/90">
                {selectedHero.skillDesc}
              </p>
            </div>

            {/* Lore */}
            <div className="mt-3 rounded-xl border border-parchment-400/15 bg-indigoInk-900/50 p-3">
              <div className="text-[11px] font-bold text-parchment-400 mb-1">
                人物列傳
              </div>
              <p className="text-xs leading-relaxed text-parchment-300/90">
                {selectedHero.lore}
              </p>
            </div>

            {/* Assignment Action for Player Officers */}
            {isPlayerOfficer && selectedOfficer && (
              <div className="mt-4 pt-3 border-t border-parchment-400/20 space-y-2">
                {selectedOfficer.inMarchId ? (
                  <div className="rounded-lg border border-vermilion-400/40 bg-vermilion-800/30 p-2.5 text-center text-xs text-red-200">
                    該武將正在行軍途中，歸隊後即可調遣。
                  </div>
                ) : (
                  <>
                    {canAssignToSelectedDistrict &&
                      selectedOfficer.districtId !== state.selectedDistrictId && (
                        <button
                          type="button"
                          onClick={() =>
                            onAssignHero(selectedHero.id, state.selectedDistrictId)
                          }
                          className="w-full rounded-lg bg-gradient-to-r from-jade-600 to-jade-500 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition"
                        >
                          派駐至目前選取縣市（{currentDistrictCfg?.name}）
                        </button>
                      )}
                    {selectedOfficer.districtId !== null && (
                      <button
                        type="button"
                        onClick={() => onAssignHero(selectedHero.id, null)}
                        className="w-full rounded-lg border border-parchment-400/35 bg-indigoInk-800 py-2 text-xs font-bold text-parchment-200 hover:bg-indigoInk-700 transition"
                      >
                        解除駐防（目前駐守：
                        {DISTRICTS[selectedOfficer.districtId]?.name}）
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
