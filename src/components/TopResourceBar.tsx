import React, { useState, useRef, useEffect } from 'react';
import {
  Wheat,
  Coins,
  ScrollText,
  Pause,
  Play,
  Handshake,
  Users,
  Swords,
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Crown,
  X,
  Calendar,
  Landmark,
  Home,
  Bot,
  ChevronDown,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { AutoModeConfig, DifficultyLevel, GameState } from '../types/game';
import { DISTRICT_LIST, HERO_LIST, getGameCalendar } from '../data';
import { DIFFICULTY_CONFIGS, getDistrictStats } from '../engine/gameEngine';

const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'normal', 'hard', 'hell'];

const DIFFICULTY_BADGE_STYLES: Record<DifficultyLevel, string> = {
  easy: 'border-emerald-400/60 bg-emerald-950/85 text-emerald-200',
  normal: 'border-[#f5c969]/60 bg-[#2a1b0e]/90 text-[#fde68a]',
  hard: 'border-orange-400/70 bg-orange-950/85 text-orange-200',
  hell: 'border-red-400/85 bg-[#4a0b0e]/95 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
};

const DIFFICULTY_SWITCHER_ACTIVE: Record<DifficultyLevel, string> = {
  easy: 'border-emerald-400 bg-emerald-600/90 text-white shadow-[0_0_8px_rgba(52,211,153,0.4)]',
  normal: 'border-[#f5c969] bg-[#b87a1b] text-[#fff8e1] shadow-[0_0_8px_rgba(245,201,105,0.4)]',
  hard: 'border-orange-400 bg-orange-600 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)]',
  hell: 'border-red-400 bg-red-700 text-white shadow-[0_0_10px_rgba(239,68,68,0.55)]',
};

export interface TopResourceBarProps {
  state: GameState;
  matureCropCount: number;
  unreadReportCount: number;
  autoMenuOpen?: boolean;
  onSetAutoMenuOpen?: (open: boolean) => void;
  onOpenDomestic: () => void;
  onOpenStrategy: () => void;
  onOpenIntel: () => void;
  onOpenTalent: () => void;
  onOpenRoster: () => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onSetSpeed: (speed: 1 | 2 | 4) => void;
  onSetDifficulty: (difficulty: DifficultyLevel) => void;
  onUpdateAutoMode: (patch: Partial<AutoModeConfig>) => void;
  onSaveNow: () => void;
  onExportSave: () => string;
  onImportSave: (json: string) => boolean;
  onResetGame: () => void;
  onReturnToMenu: () => void;
  onNotify: (message: string, tone?: 'info' | 'success' | 'error') => void;
}

export const TopResourceBar: React.FC<TopResourceBarProps> = ({
  state,
  matureCropCount,
  unreadReportCount,
  autoMenuOpen: controlledAutoMenuOpen,
  onSetAutoMenuOpen,
  onOpenDomestic,
  onOpenStrategy,
  onOpenIntel,
  onOpenTalent,
  onOpenRoster,
  onTogglePause,
  onToggleMute,
  onSetSpeed,
  onSetDifficulty,
  onUpdateAutoMode,
  onSaveNow,
  onExportSave,
  onImportSave,
  onResetGame,
  onReturnToMenu,
  onNotify,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [internalAutoMenuOpen, setInternalAutoMenuOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const autoMenuOpen = controlledAutoMenuOpen ?? internalAutoMenuOpen;
  const setAutoMenuOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(autoMenuOpen) : next;
    if (onSetAutoMenuOpen) {
      onSetAutoMenuOpen(resolved);
    } else {
      setInternalAutoMenuOpen(resolved);
    }
  };

  const playerDistricts = DISTRICT_LIST.filter(
    (d) => state.districts[d.id]?.faction === 'player'
  );
  const ownedDistrictCount = playerDistricts.length;
  const totalDistrictCount = DISTRICT_LIST.length;
  const progressPct = Math.round((ownedDistrictCount / totalDistrictCount) * 100);

  const passiveGoldRate = playerDistricts.reduce(
    (sum, d) => sum + getDistrictStats(state, d.id).passiveGoldPerSec,
    0
  );

  const ownedHeroCount = Object.values(state.officers).filter(
    (o) => o.faction === 'player' && !o.prisonerOf
  ).length;
  const totalHeroCount = HERO_LIST.length;
  const talentBadgeCount = Object.values(state.officers).filter(
    (o) => (o.discovered && o.faction === 'free') || o.prisonerOf === 'player'
  ).length;

  const calendar = getGameCalendar(state.gameTime);
  const intelBadgeCount = state.activeEventIds.length + unreadReportCount;

  const handleExport = () => {
    const json = onExportSave();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `台灣群雄錄_存檔_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('已匯出存檔 JSON 檔案！', 'success');
    setSettingsOpen(false);
  };

  const handleImportConfirm = () => {
    const trimmed = importText.trim();
    if (!trimmed) {
      onNotify('請先貼上存檔 JSON 內容', 'error');
      return;
    }
    const ok = onImportSave(trimmed);
    if (ok) {
      onNotify('存檔匯入成功！歡迎回到戰場。', 'success');
      setImportModalOpen(false);
      setImportText('');
    } else {
      onNotify('存檔格式錯誤，無法讀取。', 'error');
    }
  };

  return (
    <>
      <header className="relative z-30 w-full border-b border-parchment-400/35 bg-gradient-to-r from-[#0c141f] via-[#171d26] to-[#0e1622] px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-[0_6px_22px_rgba(0,0,0,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Title Emblem + 1949 Calendar + Territory Progress */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-parchment-400/70 bg-gradient-to-br from-vermilion-500 to-vermilion-800 shadow-[0_0_12px_rgba(200,62,43,0.45)]">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-parchment-100" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h1 className="font-serif text-sm sm:text-base md:text-lg font-black tracking-wider text-parchment-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                  台灣群雄錄
                  <span className="hidden xl:inline text-parchment-400 font-bold text-sm ml-1">
                    ：百區爭霸
                  </span>
                </h1>
                <span
                  className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${
                    state.mode === 'endless'
                      ? 'border-vermilion-400/65 bg-vermilion-950/85 text-red-200'
                      : 'border-[#f5c969]/55 bg-[#2a1b0e]/90 text-[#fde68a]'
                  }`}
                >
                  {state.mode === 'endless'
                    ? '⚔️ 無盡模式 · 目標統一'
                    : '📖 劇情模式'}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${
                    DIFFICULTY_BADGE_STYLES[state.difficulty]
                  }`}
                  title={DIFFICULTY_CONFIGS[state.difficulty].desc}
                >
                  <span>難度：{DIFFICULTY_CONFIGS[state.difficulty].label}</span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-[#f5c969]/45 bg-indigoInk-950/90 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-bold text-[#fde68a]"
                  title="1949 歷史紀元時鐘"
                >
                  <Calendar className="h-3 w-3 text-[#f5c969] shrink-0" />
                  <span>
                    {calendar.year}年 {calendar.month}月 · 民國{calendar.rocYear}年
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-medium text-jade-100/90">
                  領地{' '}
                  <strong className="text-parchment-200 font-bold">
                    {ownedDistrictCount}
                  </strong>{' '}
                  / {totalDistrictCount}
                </span>
                <div className="h-1.5 w-20 sm:w-24 overflow-hidden rounded-full bg-indigoInk-950 border border-parchment-400/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-jade-500 to-parchment-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Resource Pills + Time Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Food */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-jade-400/35 bg-indigoInk-950/85 px-2.5 py-1 shadow-inner"
              title="糧草：用於徵兵、出征行軍與建設"
            >
              <Wheat className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="text-xs text-parchment-300/80 hidden 2xl:inline">糧草</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-parchment-50 tabular-nums">
                {Math.floor(state.resources.food).toLocaleString()}
              </span>
            </div>

            {/* Gold */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-parchment-400/40 bg-indigoInk-950/85 px-2.5 py-1 shadow-inner"
              title={`銀兩：用於買種、建設、徵兵與點將（市集自動稅收 +${passiveGoldRate.toFixed(1)}/秒）`}
            >
              <Coins className="h-3.5 w-3.5 text-[#f5c969] shrink-0" />
              <span className="text-xs text-parchment-300/80 hidden 2xl:inline">銀兩</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#fde68a] tabular-nums">
                {Math.floor(state.resources.gold).toLocaleString()}
              </span>
              {passiveGoldRate > 0 && (
                <span className="hidden 2xl:inline text-[10px] font-mono text-jade-400">
                  +{passiveGoldRate.toFixed(1)}/s
                </span>
              )}
            </div>

            {/* Reputation */}
            <div
              className="flex items-center gap-1.5 rounded-full border border-[#f5c969]/45 bg-indigoInk-950/85 px-2.5 py-1 shadow-inner"
              title="聲望：高聲望可大幅提升在野名士登庸與俘虜勸降成功率"
            >
              <Crown className="h-3.5 w-3.5 text-[#f5c969] shrink-0" />
              <span className="text-xs text-parchment-300/80 hidden 2xl:inline">聲望</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#fde68a] tabular-nums">
                {state.reputation}
              </span>
            </div>

            {/* Time Controls + Sound Mute */}
            <div className="flex items-center rounded-lg border border-parchment-400/30 bg-indigoInk-950/90 p-0.5">
              <button
                type="button"
                onClick={onTogglePause}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  state.paused
                    ? 'bg-vermilion-500/85 text-white'
                    : 'text-parchment-200 hover:bg-indigoInk-800'
                }`}
                title={state.paused ? '繼續遊戲' : '暫停遊戲'}
              >
                {state.paused ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span className="hidden sm:inline">暫停</span>
                  </>
                ) : (
                  <Pause className="h-3.5 w-3.5" />
                )}
              </button>
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onSetSpeed(spd)}
                  className={`rounded-md px-1.5 sm:px-2 py-1 font-mono text-xs font-bold transition ${
                    state.speed === spd && !state.paused
                      ? 'bg-parchment-500/85 text-indigoInk-950 shadow-sm'
                      : 'text-parchment-300/80 hover:bg-indigoInk-800 hover:text-parchment-100'
                  }`}
                >
                  {spd}x
                </button>
              ))}
              <button
                type="button"
                onClick={onToggleMute}
                className={`ml-0.5 rounded-md px-1.5 py-1 transition ${
                  state.soundMuted
                    ? 'text-vermilion-400 hover:bg-indigoInk-800'
                    : 'text-[#fde68a] hover:bg-indigoInk-800'
                }`}
                title={state.soundMuted ? '已靜音（點擊開啟音效）' : '音效開啟中（點擊靜音）'}
                aria-label={state.soundMuted ? '開啟音效' : '靜音'}
              >
                {state.soundMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Right: Top Command Buttons + Auto Mode + Gacha + Roster + Settings */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 🤖 Auto Mode Split-Button (Desktop; mobile uses MobileBottomNav) */}
            <div className="hidden md:flex relative">
              <div
                className={`flex items-center rounded-lg border transition ${
                  state.autoMode.enabled
                    ? 'border-emerald-400/90 bg-gradient-to-r from-emerald-600/90 via-jade-600/90 to-[#b87a1b]/90 text-white shadow-[0_0_16px_rgba(52,211,153,0.45)]'
                    : 'border-slate-500/45 bg-slate-900/85 text-slate-300 hover:border-slate-400/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const nextEnabled = !state.autoMode.enabled;
                    onUpdateAutoMode({ enabled: nextEnabled });
                    onNotify(
                      nextEnabled
                        ? '🤖 已開啟自動託管模式！AI 參謀將自動處理內政與軍務。'
                        : '🤖 已關閉自動託管模式，交由少帥親自指揮。',
                      nextEnabled ? 'success' : 'info'
                    );
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold tracking-wide active:scale-95 transition"
                  title="一鍵開關自動託管（自動種田、徵兵建設、派兵攻打）"
                >
                  <Bot
                    className={`h-3.5 w-3.5 shrink-0 ${
                      state.autoMode.enabled ? 'text-amber-200 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                  <span>{state.autoMode.enabled ? '🤖 自動中' : '🤖 自動：關'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoMenuOpen((v) => !v)}
                  className={`flex items-center justify-center border-l px-1.5 py-1.5 transition ${
                    state.autoMode.enabled
                      ? 'border-white/25 hover:bg-white/15'
                      : 'border-slate-600/50 hover:bg-slate-800'
                  }`}
                  title="展開自動模式細項設定"
                  aria-label="展開自動模式細項設定"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      autoMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 🏛️ 內政 (Desktop; mobile uses MobileBottomNav) */}
            <button
              type="button"
              onClick={onOpenDomestic}
              className={`hidden md:flex relative items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-extrabold transition active:scale-95 ${
                matureCropCount > 0
                  ? 'border-jade-400 bg-gradient-to-b from-jade-600/90 to-jade-800/90 text-white shadow-[0_0_12px_rgba(73,168,136,0.4)] hover:brightness-110'
                  : 'border-jade-400/45 bg-indigoInk-800/90 text-parchment-100 hover:border-jade-400/80 hover:bg-indigoInk-700'
              }`}
              title="內政總覽：一鍵全區收成與領地治理"
            >
              <Landmark className="h-3.5 w-3.5 text-jade-300" />
              <span>內政</span>
              {matureCropCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-300 px-1 text-[10px] font-black text-indigoInk-950">
                  {matureCropCount}
                </span>
              )}
            </button>

            {/* ⚔️ 戰略 (Desktop; mobile uses MobileBottomNav) */}
            <button
              type="button"
              onClick={onOpenStrategy}
              className={`hidden md:flex relative items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-extrabold transition active:scale-95 ${
                state.marches.length > 0
                  ? 'border-vermilion-400 bg-gradient-to-b from-vermilion-600/85 to-vermilion-800/90 text-white shadow-[0_0_12px_rgba(200,62,43,0.45)] hover:brightness-110'
                  : 'border-vermilion-400/45 bg-indigoInk-800/90 text-parchment-100 hover:border-vermilion-400/80 hover:bg-indigoInk-700'
              }`}
              title="戰略總覽：台海攻略進度與前線兵力調度"
            >
              <Swords className="h-3.5 w-3.5 text-vermilion-300" />
              <span>戰略</span>
              {state.marches.length > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-vermilion-500 px-1 text-[10px] font-black text-white border border-red-200/70">
                  {state.marches.length}
                </span>
              )}
            </button>

            {/* 📜 情報 (Desktop; mobile uses MobileBottomNav) */}
            <button
              type="button"
              onClick={onOpenIntel}
              className={`hidden md:flex relative items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-extrabold transition active:scale-95 ${
                intelBadgeCount > 0
                  ? 'border-[#f5c969] bg-gradient-to-b from-amber-700/85 to-vermilion-900/90 text-[#fef3c7] shadow-[0_0_14px_rgba(245,201,105,0.45)] hover:brightness-110'
                  : 'border-parchment-400/40 bg-indigoInk-800/90 text-parchment-100 hover:border-parchment-400/80 hover:bg-indigoInk-700'
              }`}
              title="情報總覽：1949 歷史大事記、勢力動態與戰報"
            >
              <ScrollText className="h-3.5 w-3.5 text-[#fde68a]" />
              <span>情報</span>
              {intelBadgeCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-indigoInk-950 animate-pulse">
                  {intelBadgeCount}
                </span>
              )}
            </button>

            <div className="hidden md:block h-5 w-px bg-parchment-400/20 mx-0.5" />

            {/* Talent & Prison (Desktop; mobile uses MobileBottomNav) */}
            <button
              type="button"
              onClick={onOpenTalent}
              className="hidden md:flex relative items-center gap-1.5 rounded-lg border border-[#f5c969] bg-gradient-to-b from-[#d99b26] via-[#b87a1b] to-[#8c5412] px-2.5 py-1.5 text-xs font-extrabold text-parchment-50 shadow-[0_0_14px_rgba(245,201,105,0.4)] hover:brightness-110 active:scale-95 transition"
              title="探索在野賢才、禮賢登庸、俘虜勸降與麾下賞賜"
            >
              <Handshake className="h-3.5 w-3.5 text-amber-200" />
              <span>人才與大牢</span>
              {talentBadgeCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-vermilion-500 px-1 text-[10px] font-black text-white border border-amber-200/70">
                  {talentBadgeCount}
                </span>
              )}
            </button>

            {/* Hero Roster */}
            <button
              type="button"
              onClick={onOpenRoster}
              className="flex items-center gap-1.5 rounded-lg border border-parchment-400/35 bg-indigoInk-800/85 px-2.5 py-1.5 text-xs font-bold text-parchment-100 hover:border-parchment-400/70 hover:bg-indigoInk-700 transition"
            >
              <Users className="h-3.5 w-3.5 text-parchment-300" />
              <span className="hidden sm:inline">英雄名冊</span>
              <span className="rounded bg-indigoInk-950/90 px-1.5 py-0.5 font-mono text-[10px] text-parchment-300">
                {ownedHeroCount}/{totalHeroCount}
              </span>
            </button>

            {/* Settings / Save Button (Opens Centered Modal) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen((v) => !v);
                  setConfirmReset(false);
                }}
                className="flex items-center gap-1 rounded-lg border border-parchment-400/35 bg-indigoInk-800/85 px-2 py-1.5 text-xs font-bold text-parchment-200 hover:border-parchment-400/70 hover:bg-indigoInk-700 transition"
                title="存檔與系統設定"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden lg:inline">存檔/設定</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings & Save Modal (Centered & Mobile-Friendly, Never Clipped) */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => {
            setSettingsOpen(false);
            setConfirmReset(false);
          }}
        >
          <div
            className="parchment-panel jiannian-frame w-full max-w-sm max-h-[86vh] overflow-y-auto rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-parchment-400/25 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#f5c969]" />
                <h3 className="font-serif text-base font-black text-[#fef3c7]">
                  存檔與系統設定
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setConfirmReset(false);
                }}
                className="rounded-lg p-1 text-parchment-300/80 hover:bg-white/10 hover:text-white transition"
                aria-label="關閉"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-1 py-1 text-xs font-semibold text-parchment-400 mb-1.5 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[#f5c969]" />
              <span>電腦 AI 難度即時調整</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-1.5">
              {DIFFICULTY_ORDER.map((d) => {
                const active = state.difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      onSetDifficulty(d);
                      onNotify(
                        `已將電腦 AI 難度調整為【${DIFFICULTY_CONFIGS[d].label}】（${DIFFICULTY_CONFIGS[d].desc}）`,
                        'info'
                      );
                    }}
                    className={`rounded-lg border py-2 text-xs font-extrabold transition active:scale-95 ${
                      active
                        ? DIFFICULTY_SWITCHER_ACTIVE[d]
                        : 'border-parchment-400/25 bg-indigoInk-950/80 text-parchment-200 hover:border-parchment-300/60 hover:bg-indigoInk-800'
                    }`}
                  >
                    {DIFFICULTY_CONFIGS[d].label}
                  </button>
                );
              })}
            </div>
            <div className="px-1 pb-3 mb-3 text-[11px] text-parchment-300/80 border-b border-parchment-400/20">
              {DIFFICULTY_CONFIGS[state.difficulty].desc}
            </div>

            <div className="px-1 py-1 text-xs font-semibold text-parchment-400 mb-1.5">
              軍情存檔管理
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setConfirmReset(false);
                  onReturnToMenu();
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-[#f5c969]/45 bg-gradient-to-r from-[#2c1b0e]/90 to-[#1f1612]/90 px-3 py-2.5 text-left text-xs font-extrabold text-[#fde68a] hover:border-[#f5c969]/80 hover:brightness-110 transition"
              >
                <Home className="h-4 w-4 text-[#f5c969] shrink-0" />
                切換模式 / 返回主選單
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveNow();
                  onNotify('已手動保存進度至本機瀏覽器！', 'success');
                  setSettingsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-parchment-400/15 bg-indigoInk-950/75 px-3 py-2.5 text-left text-xs font-medium text-parchment-100 hover:bg-parchment-400/15 transition"
              >
                <Save className="h-4 w-4 text-jade-400" />
                手動存檔
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex w-full items-center gap-2 rounded-xl border border-parchment-400/15 bg-indigoInk-950/75 px-3 py-2.5 text-left text-xs font-medium text-parchment-100 hover:bg-parchment-400/15 transition"
              >
                <Download className="h-4 w-4 text-parchment-300" />
                匯出存檔 JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setImportModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-parchment-400/15 bg-indigoInk-950/75 px-3 py-2.5 text-left text-xs font-medium text-parchment-100 hover:bg-parchment-400/15 transition"
              >
                <Upload className="h-4 w-4 text-sky-300" />
                匯入存檔 JSON
              </button>
            </div>

            <div className="my-3 border-t border-parchment-400/20" />
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-vermilion-500/35 bg-vermilion-950/40 px-3 py-2.5 text-xs font-bold text-vermilion-400 hover:bg-vermilion-500/20 transition"
              >
                <RotateCcw className="h-4 w-4" />
                重新開始新局
              </button>
            ) : (
              <div className="rounded-xl bg-vermilion-800/40 border border-vermilion-400/50 p-3">
                <p className="text-xs text-parchment-100 mb-2.5">
                  確定清空目前模式進度、重新開局？
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetGame();
                      onNotify('已重啟新局！', 'info');
                      setSettingsOpen(false);
                      setConfirmReset(false);
                    }}
                    className="flex-1 rounded-lg bg-vermilion-500 py-2 text-xs font-bold text-white hover:bg-vermilion-400"
                  >
                    確定重來
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 rounded-lg bg-indigoInk-800 py-2 text-xs text-parchment-200 hover:bg-indigoInk-700"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Mode Settings Modal (Centered & Mobile-Friendly, Never Clipped) */}
      {autoMenuOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setAutoMenuOpen(false)}
        >
          <div
            className="parchment-panel jiannian-frame w-full max-w-sm rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-parchment-400/25 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-emerald-400" />
                <h3 className="font-serif text-base font-black text-[#fef3c7]">
                  自動參謀託管設定
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAutoMenuOpen(false)}
                className="rounded-lg p-1 text-parchment-300/80 hover:bg-white/10 hover:text-white transition"
                aria-label="關閉"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Master Switch */}
            <button
              type="button"
              onClick={() => {
                const nextEnabled = !state.autoMode.enabled;
                onUpdateAutoMode({ enabled: nextEnabled });
                onNotify(
                  nextEnabled
                    ? '🤖 已開啟自動託管模式！AI 參謀將自動處理內政與軍務。'
                    : '🤖 已關閉自動託管模式，交由少帥親自指揮。',
                  nextEnabled ? 'success' : 'info'
                );
              }}
              className={`mb-3.5 flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-extrabold transition ${
                state.autoMode.enabled
                  ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-700/80 to-jade-700/80 text-white shadow-[0_0_16px_rgba(52,211,153,0.3)]'
                  : 'border-parchment-400/30 bg-indigoInk-950/85 text-parchment-200 hover:border-parchment-300/60'
              }`}
            >
              <span>總開關：{state.autoMode.enabled ? '運行中' : '已關閉'}</span>
              <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-xs">
                {state.autoMode.enabled ? '點擊關閉' : '點擊開啟'}
              </span>
            </button>

            <div className="space-y-2">
              {(
                [
                  {
                    key: 'autoFarm' as const,
                    label: '🌾 自動種田與收成',
                    desc: '自動播種特產作物並收成成熟農田',
                  },
                  {
                    key: 'autoRecruit' as const,
                    label: '🛡️ 自動徵兵與建設',
                    desc: '資源充足時自動替前線徵兵與升級城防穀倉',
                  },
                  {
                    key: 'autoAttack' as const,
                    label: '⚔️ 自動派兵攻打',
                    desc: '兵力具明顯優勢時自動指派武將出征鄰近敵區',
                  },
                ] as const
              ).map((item) => {
                const checked = state.autoMode[item.key];
                return (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-parchment-400/20 bg-indigoInk-950/80 px-3 py-2.5 hover:border-parchment-400/50 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-parchment-100">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-parchment-300/75 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onUpdateAutoMode({ [item.key]: !checked })
                      }
                      className="h-4 w-4 shrink-0 rounded accent-emerald-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setAutoMenuOpen(false)}
              className="mt-4 w-full rounded-xl border border-[#f5c969]/60 bg-gradient-to-r from-[#8f6218] to-[#b88428] py-2 text-xs font-extrabold text-white hover:brightness-110 transition"
            >
              完成設定
            </button>
          </div>
        </div>
      )}

      {/* Import Save JSON Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="parchment-panel w-full max-w-lg rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-parchment-400/25 pb-3 mb-3">
              <h3 className="font-serif text-lg font-bold text-parchment-100">
                匯入存檔 JSON
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="rounded-lg p-1 text-parchment-300 hover:bg-parchment-400/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-parchment-300/85 mb-2">
              請貼上先前匯出的存檔 JSON 文字，匯入後將立即覆蓋目前進度。
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder='{"gameTime": ...}'
              className="w-full rounded-xl border border-parchment-400/35 bg-indigoInk-950/90 p-3 font-mono text-xs text-parchment-100 focus:border-parchment-400 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="rounded-lg border border-parchment-400/30 px-4 py-2 text-xs font-bold text-parchment-200 hover:bg-indigoInk-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImportConfirm}
                className="rounded-lg bg-jade-500 px-4 py-2 text-xs font-bold text-white hover:bg-jade-400"
              >
                確認匯入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
