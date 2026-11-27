import React from 'react';

export interface MobileBottomNavProps {
  matureCropCount: number;
  activeMarchCount: number;
  talentBadgeCount: number;
  intelBadgeCount: number;
  autoEnabled: boolean;
  onOpenDomestic: () => void;
  onOpenStrategy: () => void;
  onOpenTalent: () => void;
  onOpenIntel: () => void;
  onOpenAutoModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  matureCropCount,
  activeMarchCount,
  talentBadgeCount,
  intelBadgeCount,
  autoEnabled,
  onOpenDomestic,
  onOpenStrategy,
  onOpenTalent,
  onOpenIntel,
  onOpenAutoModal,
}) => {
  return (
    <nav
      aria-label="行動版快捷指令列"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 safe-bottom border-t-2 border-[#d4aa5a]/65 bg-gradient-to-t from-[#140d0a]/98 via-[#211510]/98 to-[#2a1a13]/96 shadow-[0_-10px_28px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(247,205,109,0.28)] backdrop-blur-md"
    >
      <div className="grid grid-cols-5 gap-1 px-1.5 py-1">
        {/* 1. 內政 */}
        <button
          type="button"
          onClick={onOpenDomestic}
          className="relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-1 py-1 text-parchment-100 active:scale-95 active:bg-white/10 transition"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            🏛️
          </span>
          <span className="text-[11px] font-extrabold tracking-wide text-parchment-100">
            內政
          </span>
          {matureCropCount > 0 && (
            <span className="absolute right-1.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-indigoInk-950 shadow-[0_0_8px_rgba(52,211,153,0.7)]">
              {matureCropCount}
            </span>
          )}
        </button>

        {/* 2. 戰略 */}
        <button
          type="button"
          onClick={onOpenStrategy}
          className="relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-1 py-1 text-parchment-100 active:scale-95 active:bg-white/10 transition"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ⚔️
          </span>
          <span className="text-[11px] font-extrabold tracking-wide text-parchment-100">
            戰略
          </span>
          {activeMarchCount > 0 && (
            <span className="absolute right-1.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-vermilion-500 px-1 text-[10px] font-black text-white border border-red-200/70 shadow-[0_0_8px_rgba(229,91,69,0.75)]">
              {activeMarchCount}
            </span>
          )}
        </button>

        {/* 3. 人才 */}
        <button
          type="button"
          onClick={onOpenTalent}
          className="relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-1 py-1 text-parchment-100 active:scale-95 active:bg-white/10 transition"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            🤝
          </span>
          <span className="text-[11px] font-extrabold tracking-wide text-[#fde68a]">
            人才
          </span>
          {talentBadgeCount > 0 && (
            <span className="absolute right-1.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-indigoInk-950 shadow-[0_0_8px_rgba(251,191,36,0.75)]">
              {talentBadgeCount}
            </span>
          )}
        </button>

        {/* 4. 情報 */}
        <button
          type="button"
          onClick={onOpenIntel}
          className="relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent px-1 py-1 text-parchment-100 active:scale-95 active:bg-white/10 transition"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            📜
          </span>
          <span className="text-[11px] font-extrabold tracking-wide text-parchment-100">
            情報
          </span>
          {intelBadgeCount > 0 && (
            <span className="absolute right-1.5 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-vermilion-500 to-amber-400 px-1 text-[10px] font-black text-white shadow-[0_0_8px_rgba(245,158,11,0.75)] animate-pulse">
              {intelBadgeCount}
            </span>
          )}
        </button>

        {/* 5. 自動 */}
        <button
          type="button"
          onClick={onOpenAutoModal}
          className={`relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 active:scale-95 transition ${
            autoEnabled
              ? 'border-emerald-400/85 bg-gradient-to-b from-emerald-700/85 to-jade-900/90 text-white shadow-[0_0_14px_rgba(52,211,153,0.45)]'
              : 'border-[#d4aa5a]/25 bg-black/25 text-parchment-200 active:bg-white/10'
          }`}
        >
          <span
            className={`text-lg leading-none ${autoEnabled ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          >
            🤖
          </span>
          <span
            className={`text-[11px] font-extrabold tracking-wide ${
              autoEnabled ? 'text-emerald-100' : 'text-parchment-200'
            }`}
          >
            {autoEnabled ? '自動中' : '自動'}
          </span>
          {autoEnabled && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.95)]" />
          )}
        </button>
      </div>
    </nav>
  );
};
