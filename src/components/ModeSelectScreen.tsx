import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Swords,
  Crown,
  Play,
  RotateCcw,
  MapPin,
  Sparkles,
  Flag,
  Clock,
  ShieldAlert,
  ChevronRight,
  Flame,
} from 'lucide-react';
import type { DifficultyLevel, DistrictId, GameMode } from '../types/game';
import { DISTRICTS, getGameCalendar } from '../data';
import { DIFFICULTY_CONFIGS, getSavedModeSummary } from '../engine/gameEngine';

export interface ModeSelectScreenProps {
  onSelectMode: (
    mode: GameMode,
    startingDistrictId: DistrictId,
    fresh: boolean,
    difficulty: DifficultyLevel
  ) => void;
}

const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'normal', 'hard', 'hell'];

const DIFFICULTY_PILL_STYLES: Record<
  DifficultyLevel,
  { active: string; inactive: string; dot: string; text: string }
> = {
  easy: {
    active:
      'border-emerald-400 bg-gradient-to-r from-emerald-600/95 to-jade-700/95 text-white shadow-[0_0_16px_rgba(52,211,153,0.4)]',
    inactive:
      'border-emerald-400/30 bg-indigoInk-950/75 text-emerald-200/85 hover:border-emerald-400/65 hover:bg-emerald-950/50',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  normal: {
    active:
      'border-[#f5c969] bg-gradient-to-r from-[#d99b26] to-[#9c5f14] text-[#fff8e1] shadow-[0_0_16px_rgba(245,201,105,0.42)]',
    inactive:
      'border-[#f5c969]/30 bg-indigoInk-950/75 text-[#fde68a]/85 hover:border-[#f5c969]/65 hover:bg-[#2a1b0e]/70',
    dot: 'bg-[#f5c969]',
    text: 'text-[#fde68a]',
  },
  hard: {
    active:
      'border-orange-400 bg-gradient-to-r from-orange-600 to-red-700 text-white shadow-[0_0_16px_rgba(249,115,22,0.45)]',
    inactive:
      'border-orange-400/35 bg-indigoInk-950/75 text-orange-200/85 hover:border-orange-400/70 hover:bg-orange-950/50',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
  },
  hell: {
    active:
      'border-red-400 bg-gradient-to-r from-[#b91c1c] via-[#991b1b] to-[#6b0f12] text-red-50 shadow-[0_0_22px_rgba(239,68,68,0.68)] ring-1 ring-red-400/60',
    inactive:
      'border-vermilion-500/40 bg-indigoInk-950/75 text-red-200/85 hover:border-red-400/75 hover:bg-vermilion-950/60',
    dot: 'bg-red-500 animate-pulse',
    text: 'text-red-300',
  },
};

interface StartOption {
  id: DistrictId;
  label: string;
  tag: string;
  difficulty: string;
}

const ENDLESS_START_OPTIONS: StartOption[] = [
  { id: 'tainan', label: '台南・開台古都', tag: '均衡開局', difficulty: '標準' },
  { id: 'taipei', label: '台北・北部重鎮', tag: '商貿繁華', difficulty: '標準' },
  { id: 'taichung', label: '台中・中台樞紐', tag: '四戰之地', difficulty: '進階' },
  { id: 'kaohsiung', label: '高雄・南台大港', tag: '海運強軍', difficulty: '標準' },
  { id: 'kinmen', label: '金門・前線硬核', tag: '孤島血戰', difficulty: '硬核' },
];

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  onSelectMode,
}) => {
  const storySummary = useMemo(() => getSavedModeSummary('story'), []);
  const endlessSummary = useMemo(() => getSavedModeSummary('endless'), []);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [selectedStart, setSelectedStart] = useState<DistrictId>(() => {
    if (
      endlessSummary?.startingDistrictId &&
      ENDLESS_START_OPTIONS.some((o) => o.id === endlessSummary.startingDistrictId)
    ) {
      return endlessSummary.startingDistrictId;
    }
    return 'tainan';
  });

  const activeDifficultyCfg = DIFFICULTY_CONFIGS[difficulty];
  const activeDifficultyStyle = DIFFICULTY_PILL_STYLES[difficulty];

  const storyCalendarLabel = storySummary
    ? getGameCalendar(storySummary.gameTime).label
    : '';
  const endlessStartName = endlessSummary
    ? DISTRICTS[endlessSummary.startingDistrictId]?.shortName ?? '台南'
    : '';

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-[#090d14] text-parchment-50">
      {/* Background: Edition 5 Vintage Parchment Map dimmed behind warm dark vignette */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="./assets/map-editions/map_golden.jpg"
          alt="台海古地圖背景"
          className="h-full w-full object-cover object-center scale-105 opacity-35 sepia-[0.28] contrast-[1.08] brightness-[0.72]"
        />
        {/* Warm Dark Ink & Temple Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 38%, rgba(28, 19, 13, 0.42) 0%, rgba(12, 16, 24, 0.84) 68%, rgba(7, 10, 16, 0.96) 100%)',
          }}
        />
        {/* Subtle top imperial gold & bottom vermilion ambient glow */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(245, 201, 105, 0.16), transparent 52%), radial-gradient(circle at 50% 100%, rgba(200, 62, 43, 0.12), transparent 48%)',
          }}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:py-10">
        {/* Title Banner */}
        <header className="mb-7 sm:mb-9 text-center max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#f5c969]/45 bg-[#1a130e]/85 px-4 py-1 text-xs font-bold tracking-[0.2em] text-[#fde68a] shadow-[0_0_20px_rgba(245,201,105,0.2)] backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5 text-[#f5c969]" />
            <span>台灣本土原創大戰略</span>
            <Sparkles className="h-3.5 w-3.5 text-[#f5c969]" />
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fff8e1] via-[#f7cd6d] to-[#c98b2c] drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] leading-tight">
            《台灣群雄錄：百區爭霸》
          </h1>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#f5c969]/70" />
            <p className="font-serif text-sm sm:text-base md:text-lg font-semibold tracking-[0.14em] text-parchment-200/95">
              台海二十九區・種田・點將・攻城大戰略
            </p>
            <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#f5c969]/70" />
          </div>
        </header>

        {/* AI Difficulty Selector Bar */}
        <div className="mb-6 w-full max-w-2xl rounded-2xl border border-parchment-400/35 bg-[#121722]/85 px-4 py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-parchment-200">
              <Flame className="h-3.5 w-3.5 text-[#f5c969]" />
              <span>電腦 AI 難度</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {DIFFICULTY_ORDER.map((lvl) => {
                const cfg = DIFFICULTY_CONFIGS[lvl];
                const style = DIFFICULTY_PILL_STYLES[lvl];
                const isSelected = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs sm:text-sm font-black tracking-wide transition active:scale-95 ${
                      isSelected ? style.active : style.inactive
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-xs">
              <span className={`font-bold ${activeDifficultyStyle.text}`}>
                {activeDifficultyCfg.desc}
              </span>
              <span className="text-parchment-400/50 hidden sm:inline">｜</span>
              <span className="font-mono text-[11px] text-parchment-300/85">
                敵軍兵力 ×{activeDifficultyCfg.enemyInitialMult.toFixed(2)} · 戰力 ×
                {activeDifficultyCfg.enemyCombatMult.toFixed(2)} · 進攻節奏{' '}
                {activeDifficultyCfg.aiAttackIntervalSec}s
              </span>
            </div>
          </div>
        </div>

        {/* Two Mode Selection Cards */}
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7">
          {/* Card 1: Story Mode (1949 Historical Campaign) */}
          <section className="parchment-panel jiannian-frame group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#f5c969]/45 p-5 sm:p-6 shadow-[0_18px_48px_rgba(0,0,0,0.72)] transition-all duration-300 hover:border-[#f5c969]/80 hover:shadow-[0_22px_56px_rgba(245,201,105,0.18)]">
            {/* Subtle warm parchment accent */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#f5c969]/10 blur-2xl transition-opacity group-hover:opacity-100" />

            <div>
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#f5c969]/60 bg-gradient-to-br from-[#8c5412] via-[#5e340e] to-[#2e1808] shadow-[0_0_16px_rgba(245,201,105,0.28)]">
                    <BookOpen className="h-6 w-6 text-[#fde68a]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#fef3c7]">
                      📖 劇情模式
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-[#f5c969]">
                      1949 歷史戰役篇
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#f5c969]/50 bg-[#2a1b0e]/90 px-3 py-1 text-[11px] font-bold text-[#fde68a]">
                  <Clock className="h-3 w-3 text-[#f5c969]" />
                  歷史事件 · 1949年開局
                </span>
              </div>

              {/* Highlights */}
              <p className="mt-4 text-sm leading-relaxed text-parchment-100/90">
                從 <strong className="text-[#fde68a]">1949 年 1 月台南</strong>
                開局，隨歷史時間軸於地圖觸發{' '}
                <strong className="text-parchment-50">
                  三七五減租、古寧頭戰役、耕者有其田、八二三海峽炮戰、東西橫貫公路
                </strong>{' '}
                等重大歷史抉擇事件！
              </p>

              {/* Feature Pills */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-lg border border-parchment-400/20 bg-indigoInk-950/65 px-3 py-2 text-parchment-200">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#f5c969]" />
                  <span>動態 1949 歷史事件鏈與多重決策</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-parchment-400/20 bg-indigoInk-950/65 px-3 py-2 text-parchment-200">
                  <Flag className="h-3.5 w-3.5 shrink-0 text-jade-400" />
                  <span>台南起兵・屯田建設・步步收復台海</span>
                </div>
              </div>

              {/* Saved Progress Banner (Story) */}
              {storySummary && (
                <div className="mt-4 rounded-xl border border-jade-400/45 bg-jade-950/45 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-jade-300">
                      📌 偵測到劇情模式存檔
                    </span>
                    <span className="font-mono text-[11px] font-bold text-parchment-200">
                      已佔領 {storySummary.ownedCount}/{storySummary.totalCount} 區 ·{' '}
                      {storyCalendarLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons (Story) */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {storySummary ? (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectMode('story', 'tainan', false, difficulty)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#f5c969] bg-gradient-to-r from-[#d99b26] via-[#b87a1b] to-[#9c5f14] px-4 py-3 text-sm font-black text-white shadow-[0_8px_24px_rgba(217,155,38,0.35)] transition hover:brightness-110 active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    繼續劇情進度
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode('story', 'tainan', true, difficulty)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-parchment-400/40 bg-indigoInk-900/85 px-4 py-3 text-xs sm:text-sm font-bold text-parchment-200 transition hover:border-parchment-300/75 hover:bg-indigoInk-800 hover:text-white active:scale-[0.98]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重開新劇情
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectMode('story', 'tainan', true, difficulty)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5c969] bg-gradient-to-r from-[#d99b26] via-[#b87a1b] to-[#9c5f14] px-5 py-3.5 text-sm sm:text-base font-black text-white shadow-[0_8px_24px_rgba(217,155,38,0.35)] transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  進入 1949 劇情模式
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>

          {/* Card 2: Endless Mode (Sandbox Conquest) */}
          <section className="parchment-panel jiannian-frame group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-vermilion-400/50 p-5 sm:p-6 shadow-[0_18px_48px_rgba(0,0,0,0.72)] transition-all duration-300 hover:border-vermilion-400/85 hover:shadow-[0_22px_56px_rgba(200,62,43,0.22)]">
            {/* Subtle vermilion accent */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-vermilion-500/15 blur-2xl transition-opacity group-hover:opacity-100" />

            <div>
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-vermilion-400/70 bg-gradient-to-br from-vermilion-600 via-vermilion-800 to-[#3a0d0b] shadow-[0_0_16px_rgba(200,62,43,0.35)]">
                    <Swords className="h-6 w-6 text-parchment-100" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#fef3c7]">
                      ⚔️ 無盡模式
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-vermilion-300">
                      自由爭霸・目標統一
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-vermilion-400/55 bg-vermilion-950/80 px-3 py-1 text-[11px] font-bold text-red-200">
                  <ShieldAlert className="h-3 w-3 text-vermilion-400" />
                  沙盒爭霸 · 目標統一 29 區
                </span>
              </div>

              {/* Highlights */}
              <p className="mt-4 text-sm leading-relaxed text-parchment-100/90">
                高自由度大戰略！不受固定劇情事件打斷、敵軍反撲更積極，
                <strong className="text-[#fde68a]">
                  終極目標：統一台灣 22 縣市 ＋ 大陸東南沿海 7 區（全圖 29 區）
                </strong>
                ！
              </p>

              {/* Starting District Selector */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-parchment-200">
                    <MapPin className="h-3.5 w-3.5 text-vermilion-400" />
                    選擇開局起兵據點
                  </span>
                  <span className="text-[11px] text-parchment-300/75">
                    開新局時生效
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ENDLESS_START_OPTIONS.map((opt) => {
                    const active = selectedStart === opt.id;
                    const isHardcore = opt.id === 'kinmen';
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStart(opt.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                          active
                            ? isHardcore
                              ? 'border-vermilion-300 bg-gradient-to-r from-vermilion-600 to-vermilion-800 text-white shadow-[0_0_14px_rgba(229,91,69,0.45)]'
                              : 'border-[#f5c969] bg-gradient-to-r from-[#b87a1b] to-[#7c4d12] text-[#fff8e1] shadow-[0_0_14px_rgba(245,201,105,0.38)]'
                            : 'border-parchment-400/30 bg-indigoInk-950/75 text-parchment-200 hover:border-parchment-300/65 hover:bg-indigoInk-900'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isHardcore && (
                          <span className="rounded bg-black/35 px-1 py-0.5 text-[10px] font-black text-red-200">
                            {opt.difficulty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saved Progress Banner (Endless) */}
              {endlessSummary && (
                <div className="mt-4 rounded-xl border border-vermilion-400/45 bg-vermilion-950/45 px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-red-200">
                      📌 偵測到無盡模式存檔
                    </span>
                    <span className="font-mono text-[11px] font-bold text-parchment-200">
                      已佔領 {endlessSummary.ownedCount}/{endlessSummary.totalCount} 區
                      · 開局：{endlessStartName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons (Endless) */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {endlessSummary ? (
                <>
                  <button
                    type="button"
                    onClick={() => onSelectMode('endless', selectedStart, false, difficulty)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-vermilion-300/80 bg-gradient-to-r from-vermilion-500 via-vermilion-600 to-vermilion-800 px-4 py-3 text-sm font-black text-white shadow-[0_8px_24px_rgba(200,62,43,0.4)] transition hover:brightness-110 active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    繼續統一征途
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode('endless', selectedStart, true, difficulty)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-parchment-400/40 bg-indigoInk-900/85 px-4 py-3 text-xs sm:text-sm font-bold text-parchment-200 transition hover:border-parchment-300/75 hover:bg-indigoInk-800 hover:text-white active:scale-[0.98]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    以所選據點開新局
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectMode('endless', selectedStart, true, difficulty)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-vermilion-300/80 bg-gradient-to-r from-vermilion-500 via-vermilion-600 to-vermilion-800 px-5 py-3.5 text-sm sm:text-base font-black text-white shadow-[0_8px_24px_rgba(200,62,43,0.4)] transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Swords className="h-4 w-4" />
                  開始無盡統一模式
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Subtle Footer Note */}
        <footer className="mt-7 text-center text-xs text-parchment-300/70">
          劇情模式與無盡模式各自獨立存檔，隨時可於上方「存檔/設定」切換模式或匯出備份。
        </footer>
      </div>
    </div>
  );
};
